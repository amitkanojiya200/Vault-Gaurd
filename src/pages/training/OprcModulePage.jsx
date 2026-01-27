// src/pages/training/OprcModulePage.jsx
import React, { useMemo, useState } from 'react';
import { FileText, ChevronLeft, X } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import ModalPdfViewer from '@/components/ModalPdfViewer';
import { openBundledPpt } from '@/lib/defaultOpener';

/* =========================================================
   DOCUMENT REGISTRY
========================================================= */
const FILE_SECTIONS = {
  prt: {
    title: 'PRT Equp Invt',
    subtitle: 'PRT Equipment Inventory',
    files: [
      {
        id: 'prt-1',
        label: 'Inventory Equipment-PRT_W',
        fileName: 'Inventory Equipment-PRT_W.pdf',
        path: '/technical/prtEqpInventory/Inventory Equipment-PRT_W.pdf',
      },
    ],
  },

  dhq: {
    title: 'DHQ',
    subtitle: 'DHQ Inventory',
    files: [
      {
        id: 'dhq-1',
        label: 'PR Equipment  DHQ-3',
        fileName: 'PR Equipment  DHQ-3.pdf',
        path: '/technical/dhqInventory/PR Equipment  DHQ-3.pdf',
      },
      {
        id: 'dhq-2',
        label: 'PR Equipment  DHQ-4',
        fileName: 'PR Equipment  DHQ-4.pdf',
        path: '/technical/dhqInventory/PR Equipment  DHQ-4.pdf',
      },
      {
        id: 'dhq-3',
        label: 'PR Equipment  DHQ-11',
        fileName: 'PR Equipment  DHQ-11.pdf',
        path: '/technical/dhqInventory/PR Equipment  DHQ-11.pdf',
      },
    ],
  },

  stkinv: {
    title: 'Stakeholder Inventory',
    subtitle: 'Stakeholder Inventory',
    files: [
      {
        id: 'stk-1',
        label: 'PR Equipment BPCL_Mumbai',
        fileName: 'PR Equipment BPCL_Mumbai.pdf',
        path: '/technical/stakeholderInventory/PR Equipment BPCL_Mumbai.pdf',
      },
      {
        id: 'stk-2',
        label: 'PR Equipment GOA Port',
        fileName: 'PR Equipment GOA Port.pdf',
        path: '/technical/stakeholderInventory/PR Equipment GOA Port.pdf',
      },
      {
        id: 'stk-3',
        label: 'PR Equipment_BPCL MB',
        fileName: 'PR Equipment_BPCL MB.pdf',
        path: '/technical/stakeholderInventory/PR Equipment_BPCL MB.pdf',
      },
      {
        id: 'stk-4',
        label: 'PR Equipmetn Mangalore Port',
        fileName: 'PR Equipmetn Mangalore Port.pdf',
        path: '/technical/stakeholderInventory/PR Equipmetn Mangalore Port.pdf',
      },
      {
        id: 'stk-5',
        label: 'STAKE HOLDER - COCHIN PORT',
        fileName: 'STAKE HOLDER - COCHIN PORT.pdf',
        path: '/technical/stakeholderInventory/STAKE HOLDER - COCHIN PORT.pdf',
      },
    ],
  },

  mnschedule: {
    title: 'Maintenance Schedule',
    subtitle: 'Maintenance Schedule',
    files: [
      {
        id: 'mn-1',
        label: 'Maintenance Scedule _PRT_W',
        fileName: 'Maintenance Scedule _PRT_W.pdf',
        path: '/technical/maintenanceSchedule/Maintenance Scedule _PRT_W.pdf',
      },
    ],
  },
};

/* =========================================================
   FILE LIST CARD
========================================================= */
function FileListCard({ title, description, items, onOpen }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900/85">
      <div className="mb-2">
        <p className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </p>
        <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpen(item)}
            className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-400"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-900 dark:text-slate-50">
                {item.label}
              </div>
              <div className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                {item.fileName}
              </div>
            </div>
            <FileText className="h-4 w-4 text-slate-400 group-hover:text-sky-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */
export default function OprcModulePage({ variant, routes, onNavigate }) {
  const section = useMemo(
    () => FILE_SECTIONS[variant] || FILE_SECTIONS.prt,
    [variant]
  );

  const [activePdf, setActivePdf] = useState(null);

  function handleOpenFile(item) {
    const ext = item.fileName.split('.').pop().toLowerCase();

    // PDF → internal viewer
    if (ext === 'pdf') {
      setActivePdf({
        title: item.label,
        url: item.path,
      });
      return;
    }

    // Other → OS default app
    openBundledPpt(item.path).catch((err) =>
      console.error('Failed to open file:', err)
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img
        src={bgImage2}
        alt="background"
        className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75"
      />

      <div className="relative z-10 px-4 py-4 md:px-10 md:py-6">
        {/* Back Button */}
        <button
          onClick={() => onNavigate(routes.HOME)}
          className="mb-4 inline-flex items-center gap-1 rounded-full border bg-white/90 px-3 py-1 text-[0.7rem] dark:bg-slate-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Home
        </button>

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold dark:text-slate-50">
            {section.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {section.subtitle}
          </p>
        </div>

        {/* PDF Viewer */}
        {activePdf && (
          <ModalPdfViewer
            title={activePdf.title}
            src={activePdf.url}
            onClose={() => setActivePdf(null)}
          />
        )}

        {/* File List */}
        <FileListCard
          title={section.title}
          description={section.subtitle}
          items={section.files}
          onOpen={handleOpenFile}
        />
      </div>
    </div>
  );
}
