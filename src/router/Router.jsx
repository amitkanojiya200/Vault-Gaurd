// src/router/Router.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import ModalPdfViewer from '../components/ModalPdfViewer';

// Page components
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import SearchResults from '../pages/SearchResults';
import FileExplorer from '../pages/FileExplorer';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
// NOTE: removed getCurrentUser mock import (we now use real session)
// import { getCurrentUser } from '../lib/authMock';

// Sub-Page Components
import TrainingNationalLevel from '@/pages/training/TrainingNationalLevel';
import TrainingInternationalLevel from '@/pages/training/TrainingInternationalLevel';
import OprcModulePage from '@/pages/training/OprcModulePage';
import OprcModulePage2 from '@/pages/training/OprcModulePage2';
import OprcStakeholderLevel1 from '@/pages/stakeholders/OprcStakeholderLevel1';
import OprcStakeholderLevel2 from '@/pages/stakeholders/OprcStakeholderLevel2';
import OprcStakeholderLevel3 from '@/pages/stakeholders/OprcStakeholderLevel3';
import CollabSacep from '@/pages/services/CollabSacep';
import CollabColombo from '@/pages/services/CollabColombo';
import Operations from '@/pages/operations/Operations';
import NationalCollaboration from '@/pages/collab/NationalCollaboration';

// NEW: real session helpers
import sessionClient from '@/lib/sessionClient';
import * as userClient from '@/lib/userClient';

// -------- Route keys (so NavBar / others can reuse) --------
export const ROUTES = {
  HOME: 'home',
  DASHBOARD: 'dashboard',
  SEARCH: 'search',
  EXPLORER: 'explorer',
  LOGIN: 'login',
  REGISTER: 'register',
  PROFILE: 'profile',

  // Services
  SERVICES_OPERATIONS: 'services-operations',
  SERVICES_TRAINING_NATIONAL: 'services-training-national',
  SERVICES_TRAINING_INTERNATIONAL: 'services-training-international',
  SERVICES_COLLAB_NATIONAL: 'services-collab-national',
  SERVICES_COLLAB_INT_SACEP: 'services-collab-int-sacep',
  SERVICES_COLLAB_INT_COLOMBO: 'services-collab-int-colombo',
  SERVICES_COLLAB_INT_ORA: 'services-collab-int-ora',
  SERVICES_COLLAB_INT_MOUS: 'services-collab-int-mous',

  // Documents
  DOC_OPRC_1: 'documents-oprc-1',
  DOC_OPRC_2: 'documents-oprc-2',
  DOC_OPRC_3: 'documents-oprc-3',
  DOC_OPRC_PR: 'documents-oprc-pr',
  DOC_OPRC_11: 'documents-oprc-11',
  DOC_OPRC_22: 'documents-oprc-22',
  DOC_OPRC_33: 'documents-oprc-33',
  DOC_OPRC_PRR: 'documents-oprc-prr',
  DOC_NOSDCP: 'documents-nosdcp',
  DOC_CNA: 'documents-cna',
  DOC_HNS: 'documents-hns',
  DOC_WERCOS: 'documents-wercos',
  DOC_OSD_POLICY: 'documents-osd-policy',
  DOC_INCIDENT_REPORTS: 'documents-incident-reports',

  // Stakeholders (main list)
  STAKEHOLDERS: 'stakeholders',
  STAKE_OPRC_LEVEL1: 'stakeholder-oprc-level1',
  STAKE_OPRC_LEVEL2: 'stakeholder-oprc-level2',
  STAKE_OPRC_LEVEL3: 'stakeholder-oprc-level3',
};

// -------- Content config for generic sections --------
const SECTION_CONFIG = {
  // SERVICES
  [ROUTES.SERVICES_OPERATIONS]: {
    title: 'Operations',
    subtitle:
      'Maritime security, law enforcement and SAR along the Indian coastline.',
    body: [
      'Overview of Coast Guard operational roles including EEZ surveillance, anti-smuggling operations and support to marine policing.',
      'Highlights, deployments and major missions can be described here.',
    ],
  },
  [ROUTES.SERVICES_TRAINING_NATIONAL]: {
    title: 'Training · National Level',
    subtitle: 'Capacity building within national maritime and coastal ecosystems.',
    body: [
      'Describes national training programmes, exercises and joint drills with other national agencies.',
    ],
  },
  [ROUTES.SERVICES_TRAINING_INTERNATIONAL]: {
    title: 'Training · International Level',
    subtitle: 'Bilateral and multilateral capacity building with partner nations.',
    body: [
      'Covers international training exchanges, officer courses and observer programmes.',
    ],
  },
  [ROUTES.SERVICES_COLLAB_NATIONAL]: {
    title: 'Collaboration · National',
    subtitle: 'Inter-agency coordination within Indias maritime domain.',
    body: [
      'Describe coordination with Navy, Marine Police, Customs, Ports and other ministries.',
    ],
  },
  [ROUTES.SERVICES_COLLAB_INT_SACEP]: {
    title: 'Collaboration · SACEP',
    subtitle: 'South Asia Co-operative Environment Programme.',
    body: [
      'Outline regional cooperation on marine environment protection and pollution response.',
    ],
  },
  [ROUTES.SERVICES_COLLAB_INT_COLOMBO]: {
    title: 'Collaboration · Colombo Security Conclave',
    subtitle: 'Regional maritime security cooperation.',
    body: [
      'Information on participation, exercises and MoUs under the Colombo Security Conclave.',
    ],
  },
  [ROUTES.SERVICES_COLLAB_INT_ORA]: {
    title: 'Collaboration · ORA',
    subtitle: 'Operational readiness arrangements with partner nations.',
    body: [
      'Placeholder description - you can replace with official ORA text later.',
    ],
  },
  [ROUTES.SERVICES_COLLAB_INT_MOUS]: {
    title: 'Collaboration · MoUs',
    subtitle:
      'Memoranda of Understanding with national and international partners.',
    body: [
      'List and summarise important MoUs related to search and rescue, pollution response, and maritime security.',
    ],
  },

  // DOCUMENTS
  [ROUTES.DOC_OPRC_1]: {
    title: 'OPRC Level-1',
    subtitle: 'Oil Pollution Preparedness and Response · Level 1.',
    body: ['Link to or summarise OPRC Level-1 documents here.'],
  },
  [ROUTES.DOC_OPRC_2]: {
    title: 'OPRC Level-2',
    subtitle: 'Oil Pollution Preparedness and Response · Level 2.',
    body: ['Link to / summarise OPRC Level-2 framework and SOPs.'],
  },
  [ROUTES.DOC_OPRC_3]: {
    title: 'OPRC Level-3',
    subtitle: 'Oil Pollution Preparedness and Response · Level 3.',
    body: ['Information about national / international Level-3 arrangements.'],
  },
  [ROUTES.DOC_OPRC_PR]: {
    title: 'OPRC PR Capsule',
    subtitle: 'Public relations and awareness capsule for OPRC.',
    body: ['Short description + links / attachments later.'],
  },
  [ROUTES.DOC_NOSDCP]: {
    title: 'NOSDCP',
    subtitle: 'National Oil Spill Disaster Contingency Plan.',
    body: ['Overview and key sections of NOSDCP can be placed here.'],
    pdfFiles: [
      { name: 'NOS DCP CGBR 771', path: '/NOCDCP-HNS-HNS/NOS DCP CGBR 771.pdf' },
    ],
  },
  [ROUTES.DOC_CNA]: {
    title: 'CNA',
    subtitle: 'Contingency and Needs Assessment.',
    body: ['Placeholder description for CNA – replace with official text.'],
    pdfFiles: [
      // PDFs from /docs folder
      { name: 'CNA Circular 02 2025 (Docs)', path: '/docs/CNA_Circular_02_25.pdf' },
      { name: 'CNA Circular 03 2025 (Docs)', path: '/docs/CNA_Circular_03_25.pdf' },
      { name: 'CNA NOSDCP 07 2025', path: '/docs/CNA_NOSDCP_07_2025.pdf' },
      // PDFs from /CNA folder
      { name: 'CNA Circular 01 2010', path: '/CNA/circular_01_2010.pdf' },
      { name: 'CNA Circular 01 2016', path: '/CNA/circular_01_2016.pdf' },
      { name: 'CNA Circular 01 2017', path: '/CNA/circular_01_2017.pdf' },
      { name: 'CNA Circular 01 2023', path: '/CNA/circular_01_2023.pdf' },
      { name: 'CNA Circular 01 2025', path: '/CNA/circular_01_2025.pdf' },
      { name: 'CNA Circular 02 2019', path: '/CNA/circular_02_2019.pdf' },
      { name: 'CNA Circular 02 2024', path: '/CNA/circular _02_2024.pdf' },
      { name: 'CNA Circular 02 2025', path: '/CNA/circular_02_2025.pdf' },
      { name: 'CNA Circular 03 2015', path: '/CNA/circular_03_2015.pdf' },
      { name: 'CNA Circular 04 2015', path: '/CNA/circular_04_2015.pdf' },
      { name: 'CNA Circular 04 2017', path: '/CNA/circular_4_2017.pdf' },
      { name: 'CNA Circular 04 2024', path: '/CNA/circular_04_2024.pdf' },
      { name: 'CNA Circular 05 2024', path: '/CNA/circular_05_2024.pdf' },
      { name: 'CNA Circular 05 2025', path: '/CNA/circular_05_2025.pdf' },
      { name: 'CNA Circular 06 2017', path: '/CNA/circular_06_2017.pdf' },
      { name: 'CNA Circular 06 2024', path: '/CNA/circular_06_2024.pdf' },
      { name: 'CNA Circular 07 2024', path: '/CNA/circular_07_2024.pdf' },
    ],
  },
  [ROUTES.DOC_HNS]: {
    title: 'HNS',
    subtitle: 'Hazardous and Noxious Substances.',
    body: ['Guidelines related to HNS incidents and response.'],
    pdfFiles: [
      { name: 'HNS Response', path: '/NOCDCP-HNS-HNS/HNS response.pdf' },
    ],
  },
  [ROUTES.DOC_WERCOS]: {
    title: 'WERCOS',
    subtitle: 'WERCOS Framework.',
    body: ['Region-specific plan details and references.'],
    pdfFiles: [
      { name: 'WERCOS-19 VOL-I (OPS & ADM)', path: '/NOCDCP-HNS-HNS/WERCOS-19, VOL-I (OPS & ADM).pdf' },
    ],
  },
  [ROUTES.DOC_OSD_POLICY]: {
    title: 'OSD Policy',
    subtitle: 'Offshore Security / Spill Defence policy notes.',
    body: ['Summarise the OSD Policy and attach references.'],
    pdfFiles: [
      { name: 'CGO_04_2025', path: '/Incident-Reports/CGO_04_2025 (2).pdf' },
    ],
  },
  [ROUTES.DOC_INCIDENT_REPORTS]: {
    title: 'Incident Reports',
    subtitle: 'Maritime incident reports and documentation.',
    body: ['Documentation and reports related to maritime incidents and response operations.'],
    pdfFiles: [
      { name: 'Adobe Scan 01-Dec-2025', path: '/Incident-Reports/Adobe Scan 01-Dec-2025.pdf' },
      { name: 'Appendix A - PR equipment earmarked for Mauritius', path: '/Incident-Reports/Appendix  A- PR equippment earmarked for Mauritius.pdf' },
      { name: 'Appendix B - Details of personnel deputed to Mauritius', path: '/Incident-Reports/Appendix  B- Details of peronnel deputed to Mauritius.pdf' },
      { name: 'Appendix C - Govt. E-mail and letter for deputation to Mauritius', path: '/Incident-Reports/Appendix  C- Govt. E-mail and letter for deputation to Mauritius.pdf' },
      { name: 'Appendix D - Handing Taking over documents to NCG, Mauritius', path: '/Incident-Reports/Appendix  D- Handing Taking over documents to NCG,Mauritius.pdf' },
      { name: 'Appendix E - Details of NCG personnel trained on PR equipment', path: '/Incident-Reports/Appendix  E - Details of NCG personnel trained on PR equipment.pdf' },
      { name: 'Appendix F - Appreciation by CGHQ (126 CG dated 27 Aug 20)', path: '/Incident-Reports/Appendix  F - Appreciation by CGHQ ( 126 CG dated 27 Aug 20).pdf' },
      { name: 'Appendix G - PR equipment held by NCG Mauritius', path: '/Incident-Reports/Appendix  G- PR equipment held by NCG Mauritius.pdf' },
      { name: 'Appendix H - PR equipment extended by Reunion Island of France', path: '/Incident-Reports/Appendix  H- PR equipment extended by Reunion Island of France.pdf' },
      { name: 'Appendix J - PR equipment extended by Nagashiki Shipping Co. Ltd, Japan', path: '/Incident-Reports/Appendix  J- PR equipment extended by Nagashiki Shipping Co. Ltd, Japan.pdf' },
      { name: 'Appendix K - PR equipment extended by JAPEX & Mitsui O.S.K. Lines Ltd.', path: '/Incident-Reports/Appendix  K- PR equipment extended by JAPEX & Mitsui O.S.K. Lines Ltd..pdf' },
      { name: 'Appendix L - PR equipment extended by Japan International Cooperation Agency', path: '/Incident-Reports/Appendix  L- PR equipment extended by Japan Intenational corporation Agency.pdf' },
      { name: 'Appendix M - PR equipment extended by Polyecogroup, Greece', path: '/Incident-Reports/Appendix  M- PR equipment extended by Polyecogroup, Greese.pdf' },
      { name: 'Appendix N - Length of boom deployed at Mauritius', path: '/Incident-Reports/Appendix  N- Length of boom deployed at Mauritius.pdf' },
      { name: 'Appendix Q - Experts from different countries', path: '/Incident-Reports/Appendix  Q - Experts from different countries.pdf' },
      { name: 'Appendix S - Fact data sheet of Grade C oil', path: '/Incident-Reports/Appendix  S- Fact data sheet of Grade C oil.pdf' },
    ],
  },

  // STAKEHOLDERS main view
  [ROUTES.STAKEHOLDERS]: {
    title: 'Stakeholders',
    subtitle: 'Key national and international partners of the Indian Coast Guard.',
    body: [
      'This section can present a full list of stakeholders with brief descriptions and contact points.',
    ],
  },
};

// Optional: dynamic stakeholders like "stakeholder-1", "stakeholder-2", etc.
function getStakeholderConfig(route) {
  if (!route.startsWith('stakeholder-')) return null;
  const id = route.replace('stakeholder-', '');
  return {
    title: `Stakeholder ${id}`,
    subtitle: 'Stakeholder profile placeholder.',
    body: [
      'Later you can map each route to a real description, logo and contact information.',
    ],
  };
}

// -------- Generic section pages --------
function SectionPage({ title, subtitle, body = [], pdfFiles = [] }) {
  const [activePdf, setActivePdf] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl px-4 md:px-10"
    >
      <div className="mb-4 mt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          INDIAN COAST GUARD
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        )}
      </div>

      {/* PDF Viewer - Conditionally Rendered */}
      {activePdf && (
        <ModalPdfViewer
          title={activePdf.name}
          src={activePdf.path}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* Body Content */}
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm leading-relaxed shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:text-slate-200 dark:shadow-black/40">
        {body.map((para, idx) => (
          <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
            {para}
          </p>
        ))}
        {body.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">
            Content for this section will be added later.
          </p>
        )}
      </div>

      {/* PDF Files Section */}
      {pdfFiles && pdfFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
        >
          <p className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Available Documents
          </p>
          <div className="flex flex-col gap-2">
            {pdfFiles.map((pdf, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePdf(pdf)}
                className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-left text-[0.75rem] transition hover:border-sky-400 hover:bg-sky-50/90 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-sky-400/70 dark:hover:bg-slate-800/80"
              >
                <span className="truncate font-medium text-slate-900 dark:text-slate-50">
                  {pdf.name}
                </span>
                <Download className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:text-sky-500 dark:text-slate-500" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function NotFoundPage({ route }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl px-4 md:px-10"
    >
      <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm shadow-amber-200 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-100">
        <p className="font-semibold">Section not configured</p>
        <p className="mt-1 text-xs opacity-80">
          No page is mapped yet for route key: <code>{route}</code>
        </p>
      </div>
    </motion.div>
  );
}

// -------- Router context (ultra-minimal) --------
const RouteContext = createContext(null);

export function RouteProvider({ children }) {
  const [route, setRoute] = useState(ROUTES.HOME);

  // NEW: currentUser comes from real session (null if not logged in)
  const [currentUser, setCurrentUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // reload session (token from secure store -> validate_session RPC)
  const reloadSession = useCallback(async () => {
    setBooting(true);
    try {
      const token = await sessionClient.getSessionToken();
      if (!token) {
        setCurrentUser(null);
        return;
      }
      if (userClient.validateSession) {
        try {
          const u = await userClient.validateSession(token);
          // backend may return user object or null
          setCurrentUser(u ?? null);
        } catch (err) {
          console.warn('[Router] validateSession failed:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('[Router] reloadSession failed:', err);
      setCurrentUser(null);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await reloadSession();
    })();

    const onSessionUpdated = async () => {
      await reloadSession();
    };
    window.addEventListener('session-updated', onSessionUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('session-updated', onSessionUpdated);
    };
  }, [reloadSession]);

  const navigate = useCallback(
    (key) => {
      if (!key) return;

      // use the loaded currentUser state (async-backed)
      const user = currentUser;
      const isLoggedIn = !!user;
      const isAdmin = user?.role === 'admin';

      // Routes visible to anyone (even not logged in)
      const publicRoutes = [
        ROUTES.HOME,
        ROUTES.LOGIN,
        ROUTES.REGISTER,
      ];

      // Routes a normal "user" can visit when logged in
      const userAllowedRoutes = [
        ROUTES.HOME,
        ROUTES.SEARCH,
        ROUTES.EXPLORER,
        ROUTES.SERVICES_OPERATIONS,
        ROUTES.SERVICES_TRAINING_NATIONAL,
        ROUTES.SERVICES_TRAINING_INTERNATIONAL,
        ROUTES.DOC_OPRC_1,
        ROUTES.DOC_OPRC_2,
        ROUTES.DOC_OPRC_3,
        ROUTES.DOC_OPRC_PR,
        ROUTES.DOC_OPRC_11,
        ROUTES.DOC_OPRC_22,
        ROUTES.DOC_OPRC_33,
        ROUTES.DOC_OPRC_PRR,
        ROUTES.DOC_CNA,
        ROUTES.DOC_HNS,
        ROUTES.DOC_WERCOS,
        ROUTES.DOC_OSD_POLICY,
        ROUTES.DOC_NOSDCP,
        ROUTES.DOC_INCIDENT_REPORTS,
        ROUTES.SERVICES_COLLAB_NATIONAL,
        ROUTES.SERVICES_COLLAB_INT_SACEP,
        ROUTES.SERVICES_COLLAB_INT_COLOMBO,
        ROUTES.STAKEHOLDERS,
        ROUTES.STAKE_OPRC_LEVEL1,
        ROUTES.STAKE_OPRC_LEVEL2,
        ROUTES.STAKE_OPRC_LEVEL3,
      ];

      // --- Not logged in: only publicRoutes allowed ---
      if (!isLoggedIn) {
        if (!publicRoutes.includes(key)) {
          setRoute(ROUTES.LOGIN);
          return;
        }
      } else if (!isAdmin) {
        // --- Logged-in USER (non-admin) ---
        if (!userAllowedRoutes.includes(key)) {
          setRoute(ROUTES.HOME);
          return;
        }
      }
      // Admin, or allowed route -> proceed
      setRoute(key);
    },
    [currentUser]
  );

  // keyboard shortcuts (optional) – go through navigate so guards apply
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate(ROUTES.SEARCH);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '1') navigate(ROUTES.HOME);
      if ((e.ctrlKey || e.metaKey) && e.key === '2') navigate(ROUTES.DASHBOARD);
      if ((e.ctrlKey || e.metaKey) && e.key === '3') navigate(ROUTES.SEARCH);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // PROVIDE route, navigate, and (new) currentUser + booting
  return (
    <RouteContext.Provider value={{ route, navigate, currentUser, booting }}>
      {children}
    </RouteContext.Provider>
  );
}

// Hook to use anywhere (NavBar, buttons, etc.)
export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) {
    throw new Error('useRoute must be used inside <RouteProvider>');
  }
  return ctx;
}

// Main view renderer (drop this in App.jsx)
export function RouterView() {
  const { route, navigate } = useRoute();

  if (route === ROUTES.HOME) {
    return <Home onNavigate={navigate} />;
  }
  if (route === ROUTES.DASHBOARD) {
    return <Dashboard onNavigate={navigate} />;
  }
  if (route === ROUTES.SEARCH) {
    return <SearchResults onNavigate={navigate} />;
  }
  if (route === ROUTES.EXPLORER) {
    return <FileExplorer onNavigate={navigate} />;
  }
  if (route === ROUTES.LOGIN) {
    return <Login onNavigate={navigate} />;
  }
  if (route === ROUTES.REGISTER) {
    return <Register onNavigate={navigate} />;
  }
  if (route === ROUTES.PROFILE) {
    return <Profile onNavigate={navigate} />;
  }
  // Collaborations
  if (route === ROUTES.SERVICES_COLLAB_NATIONAL) {
    return (
      <NationalCollaboration
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.STAKE_OPRC_LEVEL1) {
    return <OprcStakeholderLevel1 />;
  }
  if (route === ROUTES.STAKE_OPRC_LEVEL2) {
    return <OprcStakeholderLevel2 />;
  }
  if (route === ROUTES.STAKE_OPRC_LEVEL3) {
    return <OprcStakeholderLevel3 />;
  }
  // Operations
  if (route === ROUTES.SERVICES_OPERATIONS) {
    return (
      <Operations
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  // Training - National Level
  if (route === ROUTES.SERVICES_TRAINING_NATIONAL) {
    return (
      <TrainingNationalLevel
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  // Training - International Level  ⬅️ NEW
  if (route === ROUTES.SERVICES_TRAINING_INTERNATIONAL) {
    return (
      <TrainingInternationalLevel
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  // OPRC detail pages
  if (route === ROUTES.DOC_OPRC_1) {
    return (
      <OprcModulePage
        variant="level1"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.DOC_OPRC_2) {
    return (
      <OprcModulePage
        variant="level2"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.DOC_OPRC_3) {
    return (
      <OprcModulePage
        variant="level3"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.DOC_OPRC_PR) {
    return (
      <OprcModulePage
        variant="pr"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  // OPRC detail pages
  if (route === ROUTES.DOC_OPRC_11) {
    return (
      <OprcModulePage2
        variant="level1"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.DOC_OPRC_22) {
    return (
      <OprcModulePage2
        variant="level2"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.DOC_OPRC_33) {
    return (
      <OprcModulePage2
        variant="level3"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  if (route === ROUTES.DOC_OPRC_PRR) {
    return (
      <OprcModulePage2
        variant="pr"
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  // Collaboration – International – SACEP
  if (route === ROUTES.SERVICES_COLLAB_INT_SACEP) {
    return (
      <CollabSacep
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }
  // Collaboration – International – Colombo Security Conclave
  if (route === ROUTES.SERVICES_COLLAB_INT_COLOMBO) {
    return (
      <CollabColombo
        routes={ROUTES}
        onNavigate={navigate}
      />
    );
  }

  // Document routes
  if (route === ROUTES.DOC_NOSDCP || route === ROUTES.DOC_CNA || 
      route === ROUTES.DOC_HNS || route === ROUTES.DOC_WERCOS || route === ROUTES.DOC_INCIDENT_REPORTS) {
    const config = SECTION_CONFIG[route];
    if (config) {
      return (
        <SectionPage
          title={config.title}
          subtitle={config.subtitle}
          body={config.body}
          pdfFiles={config.pdfFiles}
        />
      );
    }
  }

  const config = SECTION_CONFIG[route] || getStakeholderConfig(route);
  if (config) {
    return (
      <SectionPage
        title={config.title}
        subtitle={config.subtitle}
        body={config.body}
        pdfFiles={config.pdfFiles}
      />
    );
  }

  return <NotFoundPage route={route} />;
}
