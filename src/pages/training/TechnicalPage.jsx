// src/pages/training/OprcModulePage.jsx
import React, { useMemo, useState } from 'react';
import { FileText, ChevronLeft, X } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import ModalPdfViewer from '@/components/ModalPdfViewer';
import { openBundledPpt } from '@/lib/defaultOpener';
import DocumentFolder from '@/components/DocumentFolder';
import TitleBlock from '@/components/cms/TitleBlock';
import ParagraphBlock from '@/components/cms/ParagraphBlock';

/* =========================================================
   DOCUMENT REGISTRY
========================================================= */
const FILE_SECTIONS = {
  prt: {
    title: 'prt_equipment_inventory_heading',
    title2: 'PRT Equp Invt Documents',
    fileKey: 'PRT_EQUIPMENT_INVENTORY',
    subtitle: 'prt_equipment_inventory_description',
  },

  dhq: {
    title: 'dhq_heading',
    title2: 'DHQ Documents',
    fileKey: 'DHQ_DOCUMENTS',
    subtitle: 'dhq_inventory_description',
  },

  stkinv: {
    title: 'stakeholder_inventory_heading',
    title2: 'Stakeholder Inventory Documents',
    fileKey: 'STAKEHOLDER_INVENTORY_DOCUMENTS',
    subtitle: 'stakeholder_inventory_description',
  },

  mnschedule: {
    title: 'maintenance_schedule_heading',
    title2: 'Maintenance Schedule Documents',
    fileKey: 'MAINTENANCE_SCHEDULE_DOCUMENTS',
    subtitle: 'maintenance_schedule_description',
  },

  eqtvideo: {
    title: 'equipment_video_heading',
    title2: 'Equipment Video Files',
    fileKey: 'EQUIPMENT_VIDEO_FILES',
    subtitle: 'equipment_video_description',
  },
};

/* =========================================================
   MAIN PAGE
========================================================= */
export default function OprcModulePage({ variant, routes, onNavigate }) {
  const section = useMemo(
    () => FILE_SECTIONS[variant] || FILE_SECTIONS.prt,
    [variant]
  );

  return (
    <div className="relative min-h-screen overflow-hidden">

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
          <TitleBlock tag={section.title} className="text-2xl font-semibold dark:text-slate-50" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Technical | {section.title2}
          </p>
          <ParagraphBlock tag={section.subtitle} className="text-xs text-slate-500 dark:text-slate-400" />
        </div>

        {section.fileKey && (
          <DocumentFolder
            folderKey={section.fileKey}
            title={section.title2}
          />
        )}

      </div>
    </div>
  );
}
