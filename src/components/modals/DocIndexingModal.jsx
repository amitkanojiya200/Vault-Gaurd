// src/components/modals/DocIndexingModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Helper function to sort the drive arrays by drive name (A-Z) and then by count (high-low)
const sortRows = (arr) => {
  return [...arr].sort((a, b) => {
    // 1. Sort by drive string (A-Z)
    if (a.drive < b.drive) return -1;
    if (a.drive > b.drive) return 1;
    // 2. If drives are the same, sort by count (Descending)
    return (b.count || 0) - (a.count || 0);
  });
};

export default function DocIndexingModal({
  open,
  onClose,
  rows = [], // either [{ drive, type, count }] OR [{ drive, count }]
  totalsByType = {}, // optional: { type: count }
}) {
  if (!open) return null;

  // Normalize rows so we can render both shapes:
  // - if row has a 'type' field, treat as detail rows per drive+type
  // - else treat as aggregated per-drive rows
  const hasTypeField = rows.some((r) => r && (r.type !== undefined));
  const detailRows = hasTypeField
    ? rows.map((r) => ({
      drive: r.drive ?? 'unknown',
      type: r.type ?? 'Other',
      count: Number(r.count || 0),
    }))
    : [];

  const perDriveRows = !hasTypeField
    ? rows.map((r) => ({
      drive: r.drive ?? 'unknown',
      count: Number(r.count || 0),
    }))
    : // if we have detail rows, aggregate to per-drive for the per-drive table
    detailRows.reduce((acc, r) => {
      acc[r.drive] = (acc[r.drive] || 0) + (Number(r.count) || 0);
      return acc;
    }, {});

  // build per-drive array (consistent shape) for rendering
  const perDriveArray = hasTypeField
    ? Object.entries(perDriveRows || {}).map(([drive, count]) => ({ drive, count }))
    : perDriveRows;

  // ✅ MODIFICATION: Sort the detail rows and the perDriveArray for better structure
  const sortedDetailRows = hasTypeField ? sortRows(detailRows) : [];

  // If detail rows exist, the perDriveArray was built from an object, so sort it.
  // If no detail rows exist, perDriveArray is the original 'rows' which we should also sort for consistency.
  const sortedPerDriveArray = sortRows(perDriveArray || []);

  const totalIndexedFromRows = hasTypeField
    ? detailRows.reduce((s, r) => s + (r.count || 0), 0)
    : (perDriveArray || []).reduce((s, r) => s + (r.count || 0), 0);

  // combine totalsByType if not supplied but we have detailRows
  // Sort the final totalsByType object for structural display (e.g., by count)
  const computedTotalsByType = Object.keys(totalsByType || {}).length
    ? totalsByType
    : (hasTypeField
      ? detailRows.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + (Number(r.count || 0));
        return acc;
      }, {})
      : {});

  const sortedTotalsByTypeEntries = Object.entries(computedTotalsByType || {}).sort(([, a], [, b]) => b - a);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: 10, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-[min(900px,95%)] max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--border-dark-soft,#1f2937)] bg-slate-900/95 p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-(--orange400)">
            All Doc Indexing · By The Type Of Files
          </h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto text-sm text-slate-200 space-y-4">
        
        {/* ✅ MODIFICATION START: CENTERED AND PROMINENT TYPE TOTALS */}
        <div className="flex flex-col items-center justify-center text-center py-4 bg-slate-800/60 rounded-lg shadow-inner">
          <div className="text-sm text-slate-400 mb-3">
            Total Indexed Files Type: <span className="font-semibold text-slate-100">{sortedTotalsByTypeEntries.length.toLocaleString()}</span>
          </div>
          
          {sortedTotalsByTypeEntries.length > 0 && (
            <div className="flex items-start justify-center gap-6 flex-wrap">
              {sortedTotalsByTypeEntries.map(([type, count]) => (
                <div
                  key={type}
                  className="p-3" // Increased padding for visual separation
                >
                  <div className="text-xl font-bold text-(--orange500)">
                    {Number(count).toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-slate-400 mt-1">
                    {type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ✅ MODIFICATION END */}

          {/* If we have detailed rows (drive+type) show that table */}
          {/* ✅ MODIFICATION: Use sorted detail rows */}
          {hasTypeField && sortedDetailRows.length > 0 && (
            <table className="w-full text-xs border-collapse">
              <thead className="border-b border-slate-800/70 text-slate-400">
                <tr>
                  <th className="py-2 text-left">Drive</th>
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-right">Indexed Count</th>
                </tr>
              </thead>
              <tbody>
                {sortedDetailRows.map((r, idx) => (
                  <tr
                    key={`${r.drive}-${r.type}-${idx}`}
                    className="border-b border-slate-800/40 text-slate-200"
                  >
                    <td className="py-1">{r.drive}</td>
                    <td className="py-1 text-slate-300">{r.type}</td>
                    <td className="py-1 text-right text-slate-200">
                      {Number(r.count).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* If we do not have detail rows, show per-drive aggregated table */}
          {/* ✅ MODIFICATION: Use sorted per drive array */}
          {!hasTypeField && sortedPerDriveArray.length > 0 && (
            <>
              <div className="text-slate-400 text-xs mb-1">Indexed files per drive</div>
              <table className="w-full text-xs border-collapse">
                <thead className="border-b border-slate-800/70 text-slate-400">
                  <tr>
                    <th className="py-2 text-left">Drive</th>
                    <th className="py-2 text-right">Indexed Count</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPerDriveArray.map((r, idx) => (
                    <tr key={`${r.drive}-${idx}`} className="border-b border-slate-800/40 text-slate-200">
                      <td className="py-1">{r.drive}</td>
                      <td className="py-1 text-right text-slate-200">{Number(r.count).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <p className="mt-3 text-md text-slate-400">
            This modal displays a breakdown of all indexed files from your System.
            <span className="font-mono text-(--orange400) block mt-1">
               The counts are aggregated by the **drive** where the file resides and the file's **document type**.
            </span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}