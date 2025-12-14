// StorageInfoModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

function fmtEpoch(e) {
  if (!e && e !== 0) return '—';
  // if it's a string (not epoch), just return it
  if (typeof e === 'string') return e || '—';
  // if it's a number < 1e12 assume epoch seconds, else epoch ms
  if (typeof e === 'number') {
    try {
      let ms = e;
      if (e < 1e12) ms = e * 1000; // seconds -> ms
      const d = new Date(ms);
      return isNaN(d) ? String(e) : d.toLocaleString();
    } catch {
      return String(e);
    }
  }
  return String(e);
}


export default function StorageInfoModal({ open, onClose, drives = [] }) {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.18 }} className="relative z-10 w-[min(900px,95%)] max-h-[85vh] overflow-auto rounded-2xl bg-slate-900/95 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-(--orange400)">Storage & Drives</h3>
          <button className="px-2 py-1 text-sm text-slate-300" onClick={onClose}>Close</button>
        </div>

        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-800/60">
            <tr>
              <th className="py-2 text-left">Drive</th>
              <th className="py-2 text-left">Capacity (GB)</th>
              <th className="py-2 text-left">Used (GB)</th>
              <th className="py-2 text-left">Usage</th>
              <th className="py-2 text-right">Last Scan</th>
            </tr>
          </thead>
          <tbody className='text-slate-400'>
            {drives.map((d) => {
              const cap = d.totalGB ?? 0;
              const used = d.usedGB ?? 0;
              const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : null;
              return (
                <tr key={d.drive} className="border-b border-slate-800/40">
                  <td className="py-2">{d.drive}</td>
                  <td className="py-2">{cap != null ? cap.toFixed(2) : '—'}</td>
                  <td className="py-2">{used != null ? used.toFixed(2) : '—'}</td>
                  <td className="py-2 w-48">
                    <div className="w-full rounded-full h-3 bg-slate-700">
                      <div className="h-3 rounded-full bg-(--orange500)" style={{ width: pct != null ? `${pct}%` : '10%' }} />
                    </div>
                    <div className="text-xs mt-1 text-slate-400">{pct != null ? `${pct}%` : '—'}</div>
                  </td>
                  <td className="py-2 text-right text-slate-400">{fmtEpoch(d.lastScan)}</td>
                </tr>
              );
            })}
            {drives.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">No drive info available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
