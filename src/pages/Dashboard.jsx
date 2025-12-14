// src/pages/Dashboard.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

import bgImage2 from '../assets/dbg2.png';
import icgEmblem from '../assets/icg-logo.png';

import StorageInfoModal from '@/components/modals/StorageInfoModal';
import PortalActivityModal from '@/components/modals/PortalActivityModal';
import AdminFileOpsModal from '@/components/modals/AdminFileOpsModal';
import WatchlistBlockedModal from '@/components/modals/WatchlistBlockedModal';
import DocIndexingModal from '@/components/modals/DocIndexingModal';
import UsersRosterModal from '@/components/modals/UsersRosterModal';

import sessionClient from '@/lib/sessionClient';
import * as fsClient from '@/lib/fsClient';
import * as userClient from '@/lib/userClient';
import * as authClient from '@/lib/authClient';
import * as adminClient from '@/lib/adminClient';
import { indexAllDrives } from "@/lib/indexing";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// ------------------------------------------------------------------
// Palette + mock fallback (used only if backend returns nothing)
// ------------------------------------------------------------------
const palette = {
  coastal: '#2563eb',
  ocean: '#0ea5e9',
  sky: '#38bdf8',
  emerald: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
};

const MOCK = {
  drives: [
    { drive: 'C:', totalGB: 700, usedGB: 500, lastScan: 'Today · 18:05' },
    { drive: 'D:', totalGB: 1000, usedGB: 540, lastScan: 'Today · 17:40' },
  ],
  users: {
    admins: [],
    users: [],
  },
  portalActivity: [],
  adminOps: [],
  indexingByDriveAndType: [],
  watchlistEvents: [],
  filesPerDrive: [],
  roleCounts: { admins: 0, users: 0 },
};
// --------------------- HELPER -----------------
function handleCallError(name, err) {
  console.error(`[Dashboard] ${name} failed:`, err);
  return null;
}

// helper for time window filtering
function withinRange(epochSeconds, rangeKey) {
  if (!epochSeconds) return false;
  const now = Date.now() / 1000;
  let delta = 24 * 3600; // default 24h
  if (rangeKey === '48h') delta = 48 * 3600;
  if (rangeKey === '1w') delta = 7 * 24 * 3600;
  if (rangeKey === '1m') delta = 30 * 24 * 3600;
  if (rangeKey === '1y') delta = 365 * 24 * 3600;
  return epochSeconds >= now - delta;
}

// ------------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------------
export default function Dashboard() {
  const [drives, setDrives] = useState(MOCK.drives);
  const [storageDrives, setStorageDrives] = useState([]);
  const [users, setUsers] = useState(MOCK.users);

  // persistent ref to indicate we've loaded real drives already
  const initialDrivesLoadedRef = useRef(false);
  const [indexingProgress, setIndexingProgress] = useState(null);
  async function handleIndexAllDrivesClick() {
    try {
      setIndexingProgress({ state: 'starting' });
      const token = await sessionClient.getSessionToken();
      const res = await fsClient.indexAllDrives(token, (s) => {
        setIndexingProgress(s);
      });
      // update UI store with res.filesPerDrive / res.indexingByDrive
      if (res.filesPerDrive) setFilesPerDrive(res.filesPerDrive);
      if (res.indexingByDrive) setIndexingByDriveAndType(res.indexingByDrive);
    } catch (err) {
      console.error(err);
      setIndexingProgress({ state: 'failed', message: String(err) });
    }
  }
  // raw events with timestamps
  const [portalActivity, setPortalActivity] = useState(MOCK.portalActivity);
  const [adminOps, setAdminOps] = useState(MOCK.adminOps);
  const [watchlistEvents, setWatchlistEvents] = useState(MOCK.watchlistEvents);

  const [indexingByDriveAndType, setIndexingByDriveAndType] = useState(
    MOCK.indexingByDriveAndType
  );
  const [filesPerDrive, setFilesPerDrive] = useState(MOCK.filesPerDrive);
  const [roleCounts, setRoleCounts] = useState(MOCK.roleCounts);

  const [modal, setModal] = useState({ type: null, payload: null });
  const [currentUser, setCurrentUserState] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [loading, setLoading] = useState({
    drives: false,
    users: false,
    audit: false,
  });

  const [timeRange, setTimeRange] = useState('24h');

  const timeRangeLabel = useMemo(() => {
    switch (timeRange) {
      case '48h':
        return 'Last 48 hours';
      case '1w':
        return 'Last 7 days';
      case '1m':
        return 'Last 30 days';
      case '1y':
        return 'Last 12 months';
      case '24h':
      default:
        return 'Last 24 hours';
    }
  }, [timeRange]);

  // ---------------------------------------- test ----------------------------------
  // (async () => {
  //   const token = await sessionClient.getSessionToken(); // must be admin token
  //   const root = 'C:\\Users\\Admin\\Documents'; // pick a small test folder
  //   const jobId = await fsClient.indexPathStart(token, root);
  //   console.log('started jobId', jobId);

  //   // poll status until finished
  //   let status;
  //   do {
  //     await new Promise(r => setTimeout(r, 1000));
  //     status = await fsClient.getIndexStatus(jobId);
  //     console.log('status', status);
  //   } while (status && status.Running);
  // })();
  // ---------------------------------------- test ----------------------------------
  // open a path in OS explorer using the FS client command that validates session
  async function openPathInExplorer(path) {
    if (!path) return;
    try {
      if (!currentToken) {
        console.warn('[Dashboard] cannot open path — no session token available.');
        return;
      }
      // fsClient.openPathBySession exists in your client wrapper
      await fsClient.openPathBySession(currentToken, path);
    } catch (err) {
      console.error('[Dashboard] openPathInExplorer failed:', err);
    }
  }

  // -------------------- Fetch orchestration --------------------
  useEffect(() => {
    let mounted = true;

    async function boot() {
      // 1) read secure session token
      let token = null;
      try {
        token = await sessionClient.getSessionToken();
        if (token) setCurrentToken(token);
      } catch (e) {
        handleCallError('sessionClient.getSessionToken', e);
      }

      // 2) validate session & set current user
      let userFromSession = null;
      if (token) {
        try {
          const u = userClient.validateSession
            ? await userClient.validateSession(token)
            : await authClient.validateSession?.(token);

          if (mounted && u) {
            setCurrentUserState(u);
          }
          userFromSession = u;
        } catch (err) {
          handleCallError('validateSession', err);
          try {
            await sessionClient.clearSessionToken();
          } catch {
            /* ignore */
          }
          if (mounted) setCurrentUserState(null);
          token = null;
        }
      } else {
        if (mounted) setCurrentUserState(null);
      }

      // 3) drives from fs backend (robust normalization + avoid being clobbered by later fallbacks)
      setLoading((s) => ({ ...s, drives: true }));

      // use ref so the flag persists across multiple boot() calls
      // (prevents later fallback runs from clobbering valid data)
      // initialDrivesLoadedRef.current === true means "we have valid drives"

      try {
        const d = await fsClient.listDrives(token);
        console.log('raw listDrives response:', d);

        if (mounted && Array.isArray(d) && d.length > 0) {
          // helper: accept number OR numeric-string -> returns Number or null
          const asNumber = (v) => {
            if (typeof v === 'number' && Number.isFinite(v)) return v;
            if (typeof v === 'string') {
              const n = Number(v);
              return Number.isFinite(n) ? n : null;
            }
            return null;
          };

          const bytesToGB = (b) => {
            const n = asNumber(b);
            if (n == null || n <= 0) return null;
            return Math.round((n / 1024 / 1024 / 1024) * 100) / 100;
          };

          const normalized = d.map((it) => {
            // prefer already-provided GB fields if present (some backends return these)
            const total_gb_field =
              asNumber(it.total_gb) ?? asNumber(it.totalGB) ?? null;
            const used_gb_field =
              asNumber(it.used_gb) ?? asNumber(it.usedGB) ?? null;
            const avail_gb_field =
              asNumber(it.available_gb) ?? asNumber(it.availableGB) ?? null;

            // fall back to raw bytes if GB fields missing
            const totalGB = total_gb_field != null
              ? Math.round(total_gb_field * 100) / 100
              : bytesToGB(it.total_bytes ?? it.totalBytes ?? null);

            const freeGB = avail_gb_field != null
              ? Math.round(avail_gb_field * 100) / 100
              : bytesToGB(it.available_bytes ?? it.availableBytes ?? null);

            // compute used if possible (prefer used_gb_field if provided)
            const usedGB = used_gb_field != null
              ? Math.round(used_gb_field * 100) / 100
              : (totalGB != null && freeGB != null ? Math.max(0, Math.round((totalGB - freeGB) * 100) / 100) : null);

            // choose a readable label (trim & ignore empty strings)
            const pickLabel = (...candidates) => {
              for (const x of candidates) {
                if (typeof x === 'string' && x.trim()) return x.trim();
                if (typeof x === 'number' && !Number.isNaN(x)) return String(x);
              }
              return null;
            };

            const driveLabel =
              pickLabel(it.id, it.label, it.drive, it.mount_point, it.mountPoint) || 'Unknown';

            // last_scan epoch if present (seconds)
            const lastScanEpoch = asNumber(it.last_scan_epoch ?? it.lastScanEpoch ?? it.last_scan ?? null);

            return {
              drive: driveLabel,
              totalGB,
              usedGB,
              freeGB,
              lastScan: lastScanEpoch,
              raw: it,
            };
          });

          // set state from normalized array
          setDrives(normalized);
          setStorageDrives(normalized);
          if (normalized.length > 0) {
            initialDrivesLoadedRef.current = true;
          }

          console.log('mapped drives ->', normalized);
        } else {
          console.info('[Dashboard] listDrives returned empty or non-array.');
        }
      } catch (err) {
        handleCallError('fsClient.listDrives', err);
      } finally {
        if (mounted) setLoading((s) => ({ ...s, drives: false }));
      }

      // 4) users & roles (admin only)
      if (token && userFromSession && userFromSession.role?.toLowerCase() === 'admin') {
        setLoading((s) => ({ ...s, users: true }));
        try {
          const list = await userClient.adminListUsers(token);
          if (mounted && Array.isArray(list)) {
            // Normalize last_login -> human readable string (supports epoch seconds or ISO)
            const formatLastLogin = (v) => {
              if (v == null) return '—';
              if (typeof v === 'number') {
                try {
                  return new Date(v * 1000).toLocaleString();
                } catch { return String(v); }
              }
              // string: ISO or other
              const parsed = Date.parse(v);
              if (!Number.isNaN(parsed)) return new Date(parsed).toLocaleString();
              return String(v);
            };

            const admins = list
              .filter((u) => (u.role || '').toLowerCase() === 'admin')
              .map((u) => ({
                id: u.id,
                name: u.name ?? u.username,
                username: u.username ?? u.name,
                role: u.role ?? 'user',
                lastLogin: formatLastLogin(u.last_login ?? u.lastLogin ?? u.last_login_epoch ?? null),
              }));
            const normalUsers = list
              .filter((u) => (u.role || '').toLowerCase() !== 'admin')
              .map((u) => ({
                id: u.id,
                name: u.name ?? u.username,
                username: u.username ?? u.name,
                role: u.role ?? 'user',
                lastLogin: formatLastLogin(u.last_login ?? u.lastLogin ?? u.last_login_epoch ?? null),
              }));
            setUsers({ admins, users: normalUsers });
            setRoleCounts({ admins: admins.length, users: normalUsers.length });
          }
        } catch (err) {
          handleCallError('userClient.adminListUsers', err);
        } finally {
          if (mounted) setLoading((s) => ({ ...s, users: false }));
        }
      } else {
        // if not admin, clear any previous admin list to avoid stale data
        if (mounted) {
          setUsers(MOCK.users);
          setRoleCounts(MOCK.roleCounts);
        }
      }

      // 5) audit logs -> portalActivity, adminOps, watchlist
      if (token) {
        setLoading((s) => ({ ...s, audit: true }));
        try {
          // Fetch portal activity (user-level actions: login/register/logout + user CRUD)
          const portalRows = await adminClient.getPortalAuditLogs(token, { window: timeRange, limit: 500 });
          console.debug('portalRows raw', portalRows);
          // portalRows: [{ id, time, user, event, page, client, details }]
          const mappedPortal = Array.isArray(portalRows) ? portalRows.map(r => ({
            id: r.id,
            epoch: Number(r.time) || (r.ts || 0), // support both names
            time: (Number(r.time) ? new Date(Number(r.time) * 1000).toLocaleString() : (r.time ? String(r.time) : '')),
            user: r.user || r.actor_username || 'system',
            event: r.event || r.action || '',
            page: r.page || r.target_type || (r.details ? (typeof r.details === 'string' ? r.details : JSON.stringify(r.details)) : ''),
            client: (r.client || (r.details && (() => {
              try { const d = typeof r.details === 'string' ? JSON.parse(r.details) : r.details; return d?.client || d?.ip || ''; } catch (e) { return ''; }
            })())) || '',
            details: r.details || null,
          })) : [];

          setPortalActivity(mappedPortal);

          // Fetch watchlist / blocked attempts (file ops)
          const watchRows = await adminClient.getWatchlistBlockedAttempts(token, { window: timeRange, limit: 500 });
          const mappedWatch = Array.isArray(watchRows) ? watchRows.map(r => ({
            id: r.id,
            epoch: Number(r.time) || (r.ts || 0),
            time: (Number(r.time) ? new Date(Number(r.time) * 1000).toLocaleString() : (r.time ? String(r.time) : '')),
            user: r.user || r.actor_username || 'system',
            op: r.op || r.action || '',
            path: r.path || r.target_id || (r.details ? (typeof r.details === 'string' ? r.details : JSON.stringify(r.details)) : ''),
            reason: r.reason || (r.details && (() => {
              try { const d = typeof r.details === 'string' ? JSON.parse(r.details) : r.details; return d?.reason || d?.msg || ''; } catch (e) { return ''; }
            })()) || '',
            details: r.details || null,
          })) : [];

          setWatchlistEvents(mappedWatch);

          // Optionally fetch admin-only file ops (if you log them to audit_logs with target_type='user' or 'file')
          // You can re-use the portalRows array and filter to operations that look like admin CRUD:
          const adminOpsRows = mappedPortal.filter(p => {
            // treat actions containing create/update/delete or admin_ prefix as admin ops
            const a = (p.event || '').toLowerCase();
            return a.includes('create') || a.includes('delete') || a.includes('update') || a.includes('admin') || a.includes('modify');
          }).map(p => ({
            id: p.id,
            time: p.time,
            epoch: p.epoch,
            admin: p.user,
            op: p.event.toUpperCase(),
            srcPath: p.page || '',
            destPath: null,
          }));
          setAdminOps(adminOpsRows);
        } catch (err) {
          console.error('[Dashboard] fetching audit/watchlist failed:', err);
          // clear to avoid stale UI
          setPortalActivity([]);
          setWatchlistEvents([]);
          setAdminOps([]);
        } finally {
          setLoading((s) => ({ ...s, audit: false }));
        }
      } else {
        // not admin or no token => reset related data
        setPortalActivity(MOCK.portalActivity);
        setWatchlistEvents(MOCK.watchlistEvents);
        setAdminOps(MOCK.adminOps);
      }
      // 6) indexing & files-per-drive (optional endpoints)
      try {
        const idxRaw = (await userClient.get_indexing_by_drive_and_type?.()) || null;

        try {
          if (mounted && idxRaw) {
            let idx = [];

            if (Array.isArray(idxRaw) && Array.isArray(idxRaw[0])) {
              idx = idxRaw.map((r) => ({
                drive: r[0],
                type: r[1],
                count: r[2] || 0,
                raw: r,
              }));
            } else if (Array.isArray(idxRaw)) {
              idx = idxRaw.map((o) => ({
                drive: o.drive || o.id,
                type: o.type || o.kind,
                count: o.count || 0,
                raw: o,
              }));
            } else if (idxRaw.rows && Array.isArray(idxRaw.rows)) {
              idx = idxRaw.rows.map((o) => ({
                drive: o.drive,
                type: o.type,
                count: o.count,
              }));
            }

            setIndexingByDriveAndType(idx);
          }
        } catch (inner) {
          console.error("[Dashboard] normalization for indexing failed:", inner);
        }
      } catch (err) {
        handleCallError("get_indexing_by_drive_and_type", err);
      }
      // somewhere in your Dashboard boot() or loadDriveInfo() function:
      async function loadStorageInfo() {
        try {
          const raw = await fsClient.getStorageInfoWithScan();
          // raw is array of objects { drive, total_gb, used_gb, last_scan_epoch, ... }
          const drives = (raw || []).map((d) => ({
            drive: d.drive || d.name || 'unknown',
            totalGB: typeof d.total_gb === 'number' ? d.total_gb : (d.totalGB ?? null),
            usedGB: typeof d.used_gb === 'number' ? d.used_gb : (d.usedGB ?? null),
            lastScan: d.last_scan_epoch ?? d.lastScan ?? null,
            raw: d,
          }));
          setStorageDrives(drives); // whatever state your Dashboard passes to StorageInfoModal
        } catch (err) {
          console.error('[Dashboard] getStorageInfo failed:', err);
          setStorageDrives([]); // keep modal showing "No drive info available."
        }
      }

      // ======= Paste this replacement inside boot() where you previously fetched fpd/indexing =======
      // only run the heavy fallback/alternate lookups if we did NOT already obtain drives above
      if (!initialDrivesLoadedRef.current) {
        try {
          // 1) Prefer rich storage info (drive sizes + last scan) if backend exposes it
          const drivesRaw = await userClient.get_storage_info_with_scan?.('24h');

          if (mounted && Array.isArray(drivesRaw) && drivesRaw.length > 0) {
            const normalizedDrives = drivesRaw.map((d) => ({
              drive: d.drive ?? d.name ?? d.id ?? 'unknown',
              totalGB: typeof d.totalGB === 'string' ? Number(d.totalGB) : d.totalGB,
              usedGB: typeof d.usedGB === 'string' ? Number(d.usedGB) : d.usedGB,
              lastScan: d.lastScan ?? d.last_scan ?? d.scanned_at ?? null,
              raw: d.raw ?? d,
            }));
            setDrives(normalizedDrives);
          } else {
            // 2) fallback -> try files-per-drive (counts) and create a minimal drives list
            const fpdRaw = (await userClient.get_files_per_drive?.()) || null;

            if (mounted && Array.isArray(fpdRaw) && fpdRaw.length > 0) {
              // accept array-of-arrays [[drive, count], ...] or array-of-objects [{drive, count}, ...]
              const fpdList = fpdRaw.map((r) => {
                if (Array.isArray(r)) return { drive: r[0], filesCount: r[1] ?? 0, raw: r };
                // else object
                return { drive: r.drive ?? r.id ?? r.name ?? 'unknown', filesCount: r.count ?? r.c ?? 0, raw: r };
              });

              // Map to "drives" shape (no real GB numbers available)
              const fallbackDrives = fpdList.map((d) => ({
                drive: d.drive,
                totalGB: null,
                usedGB: d.filesCount,
                lastScan: null,
                raw: d.raw,
              }));
              setDrives(fallbackDrives);
            } else {
              // 3) final fallback -> indexing info (files per drive by type) if present
              const idxRaw = (await userClient.get_indexing_by_drive_and_type?.()) || null;
              if (mounted && Array.isArray(idxRaw) && idxRaw.length > 0) {
                const aggregated = {};
                for (const r of idxRaw) {
                  // support array-of-arrays [drive, type, count] or array-of-objects
                  const drive = Array.isArray(r) ? r[0] : r.drive ?? r.name ?? 'unknown';
                  const count = Array.isArray(r) ? (r[2] ?? 0) : r.count ?? r.c ?? 0;
                  aggregated[drive] = (aggregated[drive] || 0) + (Number(count) || 0);
                }
                const idxDrives = Object.entries(aggregated).map(([drive, filesCount]) => ({
                  drive,
                  totalGB: null,
                  usedGB: filesCount,
                  lastScan: null,
                  raw: null,
                }));
                setDrives(idxDrives);
              } else {
                // nothing available; only clear drives if we never loaded real drives
                if (!initialDrivesLoadedRef.current) {
                  console.warn('[Dashboard] fallback - no drives available, clearing drives state');
                  console.warn('About to clear drives from fallback', { initialDrivesLoaded: initialDrivesLoadedRef.current });
                  console.trace();
                  setDrives([]);
                } else {
                  console.info('[Dashboard] fallback found no drives but initialDrivesLoadedRef is true — keeping existing drives.');
                }
              }
            }
          }
        } catch (err) {
          console.error('[Dashboard] get_storage_info_with_scan or fallbacks failed:', err);
        }
      }

      try {
        const fpdRaw = (await userClient.get_files_per_drive?.()) || null;

        try {
          if (mounted && fpdRaw) {
            // support either [{ drive, count }, [drive, count], { rows: [...] }]
            let fpd = [];

            if (Array.isArray(fpdRaw) && fpdRaw.length > 0 && Array.isArray(fpdRaw[0])) {
              // array-of-arrays case
              fpd = fpdRaw.map((r) => ({
                drive: r[0],
                count: r[1] || 0,
                raw: r,
              }));
            } else if (Array.isArray(fpdRaw)) {
              // array-of-objects case
              fpd = fpdRaw.map((o) => ({
                drive: o.drive || o.id || o.name,
                count: o.count || o.c || 0,
                raw: o,
              }));
            } else if (fpdRaw.rows && Array.isArray(fpdRaw.rows)) {
              fpd = fpdRaw.rows.map((o) => ({
                drive: o.drive,
                count: o.count,
              }));
            }

            setFilesPerDrive(fpd);
          }
        } catch (inner) {
          console.error("[Dashboard] normalization for filesPerDrive failed:", inner);
        }
      } catch (err) {
        handleCallError("get_files_per_drive", err);
      }
    }

    // run once on mount
    boot();

    // re-run when session changes (login / logout)
    const onSessionUpdated = () => {
      if (!mounted) return;
      boot();
    };

    window.addEventListener('session-updated', onSessionUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('session-updated', onSessionUpdated);
    };
  }, []);

  // ---------------- Derived, time-filtered data ----------------
  const portalActivityFiltered = useMemo(
    () => portalActivity.filter((e) => withinRange(e.epoch, timeRange)),
    [portalActivity, timeRange]
  );

  const adminOpsFiltered = useMemo(
    () => adminOps.filter((e) => withinRange(e.epoch, timeRange)),
    [adminOps, timeRange]
  );

  const watchlistEventsFiltered = useMemo(
    () => watchlistEvents.filter((e) => withinRange(e.epoch, timeRange)),
    [watchlistEvents, timeRange]
  );

  // storage totals
  const totalStorage = useMemo(() => {
    // sum only numeric (non-null) values
    const totalGB = drives.reduce((sum, d) => sum + (Number.isFinite(d?.totalGB) ? Number(d.totalGB) : 0), 0);
    const usedGB = drives.reduce((sum, d) => sum + (Number.isFinite(d?.usedGB) ? Number(d.usedGB) : 0), 0);
    const freeGB = Math.max(0, totalGB - usedGB);

    // TB conversion: 1 TB = 1024 GB (use 1000 if you prefer decimal TB)
    const totalGBTwo = Number(totalGB.toFixed(2));
    const usedGBTwo = Number(usedGB.toFixed(2));
    const freeGBTwo = Number(freeGB.toFixed(2));

    // TB conversion: 1 TB = 1024 GB (use 1000 if you prefer decimal TB)
    const totalTB = totalGB / 1024;
    const usedTB = usedGB / 1024;
    const freeTB = freeGB / 1024;

    // formatted strings for the card (one decimal place) — allow zero
    const fmtTB = (v) => (Number.isFinite(v) ? `${v.toFixed(1)} TB` : '—');
    const fmtGB = (v) => (Number.isFinite(v) ? `${Math.round(v).toLocaleString()} GB` : '—');

    return {
      // numeric fields for charts and other logic (always numbers)
      totalGB,
      usedGB,
      freeGB,
      totalGBTwo,
      usedGBTwo,
      freeGBTwo,
      totalTB,
      usedTB,
      freeTB,
      // user-facing labels
      labelTB: `${usedGBTwo} GB / ${totalGBTwo} GB`, // "X.X TB / Y.Y TB"
      tooltipFreeGB: fmtGB(freeGB), // "N,NNN GB"
    };
  }, [drives]);

  const storageDonutData = useMemo(() => {
    // use numeric GB values (fall back to 0)
    const used = Number.isFinite(totalStorage.usedGB) ? totalStorage.usedGB : 0;
    const free = Number.isFinite(totalStorage.freeGB) ? totalStorage.freeGB : 0;

    return {
      labels: ['Used (GB)', 'Free (GB)'],
      datasets: [
        {
          data: [used, free],
          // keep your backgroundColor array as before
          backgroundColor: [palette.sky, 'rgba(148,163,184,0.4)'],
          borderWidth: 0,
        },
      ],
    };
  }, [totalStorage]);

  const storageDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#020617',
        borderColor: '#22d3ee33',
        borderWidth: 1,
      },
    },
  };

  const drivePercentData = useMemo(() => {
    const labels = drives.map((d) => d.drive || d.id || d.label || 'drive');
    const data = drives.map((d) => {
      const used = Number.isFinite(d?.usedGB) ? Number(d.usedGB) : 0;
      const total = Number.isFinite(d?.totalGB) ? Number(d.totalGB) : 0;
      // if total is 0 -> percent 0 (avoids divide-by-zero / NaN)
      return total > 0 ? Math.round((used / total) * 100) : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: '% Used',
          data,
          backgroundColor: data.map((v) => (v > 80 ? palette.red : v > 60 ? palette.amber : palette.emerald)),
          borderRadius: 6,
        },
      ],
    };
  }, [drives]);


  useEffect(() => {
    console.log('drives state changed:', drives);
    console.log('computed totalStorage:', totalStorage);
  }, [drives, totalStorage]);

  const drivePercentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: '#7186B0', font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#7186B0', font: { size: 12 } },
        grid: { color: 'rgba(148,163,184,0.18)' },
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#020617',
        borderColor: '#22d3ee33',
        borderWidth: 1,
      },
    },
  };


  const [indexingSummary, setIndexingSummary] = useState({
    perDriveRows: [],
    totalsByType: {},
    totalIndexed: 0,
  });

  // ----- Files per drive chart -----
  const filesPerDriveData = useMemo(() => {
    const sourceRows = (Array.isArray(filesPerDrive) && filesPerDrive.length > 0)
      ? filesPerDrive.map(r => ({ drive: r.drive, count: Number(r.count || r.filesCount || 0) }))
      : indexingSummary.perDriveRows;

    const labels = sourceRows.map((d) => d.drive);
    const data = sourceRows.map((d) => Math.round((d.count || 0) / 1000)); // thousands for compact chart

    return {
      labels,
      datasets: [
        {
          label: 'Indexed Files (thousands)',
          data,
          backgroundColor: labels.map((_, i) => [palette.coastal, palette.ocean, palette.sky, palette.amber][i % 4]),
          borderRadius: 6,
        },
      ],
    };
  }, [filesPerDrive, indexingSummary]);

  const filesPerDriveOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: '#7186B0', font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#7186B0', font: { size: 12 } },
        grid: { color: 'rgba(148,163,184,0.15)' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#020617',
        borderColor: '#22d3ee33',
        borderWidth: 1,
      },
    },
  };

  // helper: preferred stable order for labels
  const CATEGORY_ORDER = [
    'Images',
    'PDF',
    'Docs',
    'PPT',
    'Sheets',
    'Videos',
    'Text',
    'Binary/Archive',
    'Dir',
    'Other',
  ];

  // color map (add or tweak hex values as you like)
  const CATEGORY_COLORS = {
    Images: '#a855f7',
    PDF: '#06b6d4',
    Docs: '#f97316',
    PPT: '#ef4444',
    Sheets: '#10b981',
    Videos: '#fb7185',
    Text: '#eab308',
    'Binary/Archive': '#64748b',
    Dir: '#94a3b8',
    Other: '#475569',
  };

  // call once (or whenever you refresh)
  useEffect(() => {
    let mounted = true;
    async function loadSummary() {
      try {
        // Prefer server aggregated call if you added it:
        if (fsClient.getIndexingSummaryGlobal) {
          const rows = await fsClient.getIndexingSummaryGlobal(); // returns [[cat, count], ...]
          if (!mounted) return;
          const totals = {};
          let totalIndexed = 0;
          for (const [cat, cnt] of rows) {
            totals[cat] = Number(cnt);
            totalIndexed += Number(cnt);
          }
          // ensure 'Other' exists
          if (!totals.Other) totals.Other = 0;
          setIndexingSummary({ perDriveRows: [], totalsByType: totals, totalIndexed });
          return;
        }

        // fallback: aggregate indexingByDriveAndType (if that's what you have)
        if (indexingByDriveAndType && indexingByDriveAndType.length) {
          // indexingByDriveAndType expected as rows like [[drive, file_type, count], ...]
          const totals = {};
          let totalIndexed = 0;
          for (const row of indexingByDriveAndType) {
            // row could be an object or array
            const [drive, rawType, cnt] = Array.isArray(row) ? row : [row.drive, row.type, row.count];
            // map rawType -> UI category (mirror server CASE as needed)
            const tLower = (rawType || '').toString().toLowerCase();
            let cat = 'Other';
            if (tLower === 'dir') cat = 'Dir';
            else if (tLower === 'pdf') cat = 'PDF';
            else if (['doc', 'docx', 'odt'].includes(tLower)) cat = 'Docs';
            else if (['ppt', 'pptx'].includes(tLower)) cat = 'PPT';
            else if (['xls', 'xlsx', 'csv'].includes(tLower)) cat = 'Sheets';
            else if (['mp4', 'mkv', 'mov', 'avi', 'm4v', 'wmv'].includes(tLower)) cat = 'Videos';
            else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'svg', 'image'].includes(tLower)) cat = 'Images';
            else if (['txt', 'log', 'md', 'json', 'xml', 'yml', 'yaml'].includes(tLower)) cat = 'Text';
            else if (['zip', 'rar', '7z', 'tar', 'gz', 'exe', 'dll', 'bin', 'binary', 'archive', 'glb'].includes(tLower)) cat = 'Binary/Archive';
            // accumulate
            const n = Number(cnt || 0);
            totals[cat] = (totals[cat] || 0) + n;
            totalIndexed += n;
          }
          if (!totals.Other) totals.Other = 0;
          setIndexingSummary({ perDriveRows: [], totalsByType: totals, totalIndexed });
        }
      } catch (err) {
        console.error('Failed to load indexing summary', err);
      }
    }
    loadSummary();
    return () => { mounted = false; };
  }, [indexingByDriveAndType]); // refresh when indexingByDriveAndType updates

  // Build doughnut source with stable order, readable numbers and tooltip with raw counts
  const docIndexingDoughnutData = useMemo(() => {
    const totalsByType = indexingSummary.totalsByType || {};
    // labels in desired order, only include those we want to show
    const labels = CATEGORY_ORDER.filter((lbl) => (lbl === 'Other' || (totalsByType[lbl] && totalsByType[lbl] > 0)));

    // Raw numeric values (no scaling) but chart can display scaled values if you prefer
    const rawValues = labels.map((lbl) => totalsByType[lbl] || 0);

    // Visual values: optionally scale down by 1000 for large numbers for aesthetics,
    // but keep raw values in dataset.meta for tooltip. Here we scale only for display.
    const displayValues = rawValues.map((n) => {
      // if very large, display in thousands; else keep raw to avoid zeroes
      return n >= 10000 ? Math.round(n / 1000) : n;
    });

    const backgroundColor = labels.map((lbl) => CATEGORY_COLORS[lbl] || '#94a3b8');

    return {
      labels,
      datasets: [
        {
          data: displayValues,
          // attach raw values for tooltip usage
          _raw: rawValues,
          backgroundColor,
          borderWidth: 1,
          borderColor: '#020617',
          hoverOffset: 8,
        },
      ],
    };
  }, [indexingSummary]);

  // Chart options — tooltips show raw counts
  const docIndexingDoughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#7186B0',
          boxWidth: 15,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        borderColor: '#22d3ee33',
        borderWidth: 0,
        callbacks: {
          label: function (context) {
            // context.dataset._raw holds real counts (we set it above)
            const dataIndex = context.dataIndex;
            const label = context.label || '';
            const raw = context.dataset?._raw ? context.dataset._raw[dataIndex] : context.parsed;
            // format with commas
            return `${label}: ${raw.toLocaleString()}`;
          }
        }
      },
    },
  }), [indexingSummary]);


  console.log('filesPerDrive raw ->', filesPerDrive);
  console.log('indexingByDriveAndType raw ->', indexingByDriveAndType);
  console.log('indexingSummary ->', indexingSummary);
  const rolesDoughnutData = useMemo(() => {
    const admins =
      roleCounts.admins || (users?.admins && users.admins.length) || 0;
    const normalUsers =
      roleCounts.users || (users?.users && users.users.length) || 0;
    return {
      labels: ['Admins', 'Users'],
      datasets: [
        {
          data: [admins, normalUsers],
          backgroundColor: [palette.coastal, palette.sky],
          borderWidth: 0,
        },
      ],
    };
  }, [roleCounts, users]);

  const rolesDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#7186B0',
          boxWidth: 10,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#020617',
        borderColor: '#22d3ee33',
        borderWidth: 1,
      },
    },
  };

  // prefer pre-computed summary from indexingSummary (falls back automatically)
  const totalIndexedFiles = useMemo(() => indexingSummary.totalIndexed || 0, [indexingSummary]);

  const watchlistUsersCount = useMemo(
    () => new Set((watchlistEventsFiltered || []).map((e) => e.user)).size,
    [watchlistEventsFiltered]
  );
  const watchlistAttemptsCount = (watchlistEventsFiltered || []).length;

  const totalAdmins = users?.admins ? users.admins.length : 0;
  const totalUsers = users?.users ? users.users.length : 0;

  // ------------------------------------------------------------------
  // Render (your layout, now powered by real data & time filters)
  // ------------------------------------------------------------------
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <img
        src={bgImage2}
        alt="PRABAL background"
        className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75 saturate-150"
      />
      <div
        className="fixed inset-0 -z-10 backdrop-blur-xl opacity-90 dark:opacity-60"
        style={{
          background:
            'radial-gradient(circle at top, rgba(148,163,253,0.22), transparent 80%), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),_transparent_70%)] dark:block" />

      <div className="relative z-10 px-4 py-4 text-slate-900 md:px-10 md:py-6 dark:text-[var(--soft-white,_#e5e7eb)]">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              <img
                src={icgEmblem}
                alt="ICG emblem"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-50">
                PRABAL · Admin Dashboard
              </p>
              <div className="flex flex-wrap gap-2 text-[0.7rem]">
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800 ring-1 ring-sky-200 dark:bg-slate-900/70 dark:text-sky-300 dark:ring-sky-500/40">
                  Overview
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700">
                  Storage
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700">
                  Users & Roles
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700">
                  Activity & Watchlist
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 md:justify-end">
            <div className="text-right text-xs md:text-sm">
              <p className="font-medium text-sky-600 dark:text-sky-300">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-50">
                {currentUser ? currentUser.name : 'none'}
              </p>
              <p className="text-[0.7rem] text-slate-500 dark:text-slate-300">
                {currentUser ? currentUser.role : 'none'}
              </p>
            </div>
          </div>
        </motion.header>

        {/* Top summary row */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-3 md:text-sm"
        >
          <button
            onClick={() => setModal({ type: 'storage', payload: null })}
            className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 text-left shadow-md shadow-slate-300/40 transition hover:border-sky-400/70 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40"
          >
            <span className="text-[0.68rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Storage
            </span>
            <span className="text-lg font-semibold text-(--orange500) dark:text-(--orange500)">
              {/* formatted TB label (Used / Total) */}
              {totalStorage.labelTB}
            </span>
            <span className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
              {/* small free GB label */}
              {totalStorage.tooltipFreeGB !== '—' ? `${totalStorage.tooltipFreeGB} free` : 'Click for per-drive breakdown'}
            </span>

            <span className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
              Click for per-drive breakdown
            </span>
          </button>

          <button
            onClick={() => setModal({ type: 'users', payload: null })}
            className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 text-left shadow-md shadow-slate-300/40 transition hover:border-sky-400/70 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40"
          >
            <span className="text-[0.68rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Registered Admin / Users
            </span>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {totalAdmins} Admin · {totalUsers} User
            </span>
            <span className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
              View full roster & last login
            </span>
          </button>

          <button
            onClick={() => setModal({ type: 'indexing', payload: null })}
            className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 text-left shadow-md shadow-slate-300/40 transition hover:border-sky-400/70 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40"
          >
            <span className="text-[0.68rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Indexed Files
            </span>
            <span className="text-lg font-semibold text-(--orange500) dark:text-sky-300">
              {totalIndexedFiles.toLocaleString()}
            </span>
            <span className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
              files indexed · per-drive & per-type view
            </span>
          </button>
          <button
            className="px-3 py-1 rounded bg-(--orange500) text-white"
            onClick={handleIndexAllDrivesClick}
          >
            Index All Drives
          </button>
          {indexingProgress && indexingProgress.state === 'running' && (
            <div className="text-sm">
              Indexing: {indexingProgress.processed ?? 0} files — last: {indexingProgress.lastPath ?? '...'}
            </div>
          )}

        </motion.section>

        {/* Main layout */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)]">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Time range selector */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                Activity window:&nbsp;
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {timeRangeLabel}
                </span>
              </p>

              <div className="flex flex-wrap gap-1.5 text-[0.7rem]">
                {[
                  { key: '24h', label: '24h' },
                  { key: '48h', label: '48h' },
                  { key: '1w', label: '1 week' },
                  { key: '1m', label: '1 month' },
                  { key: '1y', label: '1 year' },
                ].map((item) => {
                  const active = timeRange === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTimeRange(item.key)}
                      className={[
                        'rounded-full border px-2.5 py-1 transition',
                        'hover:border-sky-500/70 hover:text-sky-700 dark:hover:border-sky-400/80 dark:hover:text-sky-200',
                        active
                          ? 'border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-100'
                          : 'border-slate-300 bg-white/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300',
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Portal Activity + Admin Ops */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Portal Activity */}
              <div className="rounded-2xl col-span-2 border border-slate-200 bg-white/85 p-3 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <p className="font-semibold text-sky-700 dark:text-sky-300">
                    Portal Activity
                  </p>
                  <button
                    onClick={() =>
                      setModal({ type: 'portal', payload: null })
                    }
                    className="text-[0.7rem] text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-300"
                  >
                    View full timeline
                  </button>
                </div>
                <div className="space-y-1 text-[0.75rem]">
                  {portalActivityFiltered.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between rounded-xl bg-slate-50 px-2 py-1.5 dark:bg-slate-950/60"
                    >
                      <div>
                        <p className="text-[0.75rem] text-slate-800 dark:text-slate-100">
                          {log.user}{' '}
                          <span className="text-sky-700 dark:text-sky-300">
                            · {log.event}
                          </span>
                        </p>
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {log.page}
                        </p>
                      </div>
                      <div className="ml-2 text-right">
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {log.time}
                        </p>
                        <p className="text-[0.65rem] text-slate-400 dark:text-slate-500">
                          {log.client}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Add/Delete/Modify */}
              {/* <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <p className="font-semibold text-sky-700 dark:text-sky-300">
                    Addition/Deletion/Modification by Admin
                  </p>
                  <button
                    onClick={() =>
                      setModal({ type: 'adminOps', payload: null })
                    }
                    className="text-[0.7rem] text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-300"
                  >
                    View detailed log
                  </button>
                </div>
                <div className="space-y-1 text-[0.75rem]">
                  {adminOpsFiltered.slice(0, 4).map((op) => (
                    <div
                      key={op.id}
                      className="rounded-xl bg-slate-50 px-2 py-1.5 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {op.time} ·{' '}
                          <span className="text-sky-700 dark:text-sky-300">
                            {op.admin}
                          </span>
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.6rem] ${op.op === 'DELETE'
                            ? 'bg-red-500/10 text-red-500'
                            : op.op === 'COPY' || op.op === 'MOVE'
                              ? 'bg-amber-500/10 text-amber-500'
                              : op.op === 'RENAME'
                                ? 'bg-sky-500/10 text-sky-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                        >
                          {op.op}
                        </span>
                      </div>
                      <p className="mt-0.5 max-w-full truncate text-[0.7rem] text-slate-800 dark:text-slate-100">
                        {op.srcPath}
                      </p>
                      {op.destPath && (
                        <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                          → {op.destPath}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div> */}

            </div>

            {/* Watchlist Users */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl col-span-2 border border-slate-200 bg-white/85 p-3 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <p className="font-semibold text-sky-700 dark:text-sky-300">
                    Watchlist Users · Blocked Attempts
                  </p>
                  <button
                    onClick={() =>
                      setModal({ type: 'watchlist', payload: null })
                    }
                    className="text-[0.7rem] text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-300"
                  >
                    View all ({timeRangeLabel})
                  </button>
                </div>
                <p className="mb-2 text-[0.7rem] text-slate-500 dark:text-slate-400">
                  Users highlighted when they attempt restricted actions (delete,
                  move, rename, copy to USB).
                </p>
                <div className="space-y-1 text-[0.75rem]">
                  {watchlistEventsFiltered.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      className="rounded-xl bg-slate-50 px-2 py-1.5 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {e.time} ·{' '}
                          <span className="text-sky-700 dark:text-sky-300">
                            {e.user}
                          </span>
                        </p>
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[0.6rem] text-red-400">
                          {e.op}
                        </span>
                      </div>
                      <p className="mt-0.5 max-w-full truncate text-[0.7rem] text-slate-800 dark:text-slate-100">
                        {e.path}
                      </p>
                      <p className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                        {e.reason}
                      </p>
                    </div>
                  ))}
                  {watchlistEventsFiltered.length === 0 && (
                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                      No blocked attempts in this window.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-4">
            {/* Drive % used */}
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              <p className="mb-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
                Drive Utilisation (% Used)
              </p>
              <div className="h-32">
                <Bar data={drivePercentData} options={drivePercentOptions} />
              </div>
            </div>

            {/* Files per drive */}
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              <p className="mb-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
                Files in Drives (Indexed Count)
              </p>
              <div className="h-32">
                <Bar data={filesPerDriveData} options={filesPerDriveOptions} />
              </div>
              <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                Each bar shows total indexed files per drive (in thousands).
              </p>
            </div>

            {/* Doc Indexing by type */}
            <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
              <div className="mb-2 flex items-center justify-between text-xs">
                <p className="font-semibold text-sky-700 dark:text-sky-300">
                  All Doc Indexing · By Document Type
                </p>
              </div>
              <div className="h-42">
                <Doughnut
                  data={docIndexingDoughnutData}
                  options={docIndexingDoughnutOptions}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals (all wired to real data) */}
      <StorageInfoModal
        open={modal.type === 'storage'}
        drives={storageDrives}
        onClose={() => setModal({ type: null, payload: null })}
      />
      <UsersRosterModal
        open={modal.type === 'users'}
        admins={users.admins}
        users={users.users}
        onClose={() => setModal({ type: null, payload: null })}
      />
      <PortalActivityModal
        open={modal.type === 'portal'}
        logs={portalActivityFiltered}
        timeLabel={timeRangeLabel}
        onClose={() => setModal({ type: null, payload: null })}
      />
      <AdminFileOpsModal
        open={modal.type === 'adminOps'}
        ops={adminOpsFiltered}
        timeLabel={timeRangeLabel}
        onOpenPath={openPathInExplorer}
        onClose={() => setModal({ type: null, payload: null })}
      />
      <DocIndexingModal
        open={modal.type === 'indexing'}
        rows={indexingSummary.perDriveRows} // aggregated per-drive counts
        totalsByType={indexingSummary.totalsByType} // optional extra prop for modal to render type totals
        onClose={() => setModal({ type: null, payload: null })}
      />
      <WatchlistBlockedModal
        open={modal.type === 'watchlist'}
        events={watchlistEventsFiltered}
        timeLabel={timeRangeLabel}
        onClose={() => setModal({ type: null, payload: null })}
      />
    </div>
  );
}
