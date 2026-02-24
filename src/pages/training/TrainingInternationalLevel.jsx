// src/pages/training/TrainingInternationalLevel.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ListOrdered,
  ArrowRightCircle,
  ChevronLeft,
} from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import TrImg3 from '@/assets/internationalimg1.jpeg';
import TrImg4 from '@/assets/internationalimg2.jpeg';
import DocumentFolder from '@/components/DocumentFolder';
import TitleBlock from '@/components/cms/TitleBlock';
import TableBlock from '@/components/cms/TableBlock';

// Receives routes + onNavigate from Router
export default function TrainingInternationalLevel({ routes, onNavigate }) {

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background (match Dashboard/Home styles) */}
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
        {/* Top bar: Back button + chip */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNavigate(routes.HOME)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[0.7rem] text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[0.7rem] text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
            <span className="font-medium">International Training Capsule</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Indian Coast Guard · Training
          </p>
          <TitleBlock tag="training_international_level_heading1" className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50" />
        </div>

        {/* Main grid */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
          {/* LEFT: Overview + TOC */}
          <div className="space-y-3">
            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
            >
              <div className="max-w-7xl mx-auto">
                <TitleBlock tag="international_level_subheading1" className="lg:text-2xl sm:text-4xl font-extrabold text-gray-800 dark:text-white mb-6 text-left pt-5" />

                <TableBlock
                  tag="international_level_training_table1"
                  className="mt-8 shadow-lg"
                />

              </div>
            </motion.div>
          </div>

          {/* RIGHT: Images + OPRC tabs */}
          <div className="space-y-3">
            {/* Two image panels */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-5 flex-col items-center"
            >
              <div className="relative h-full overflow-hidden rounded-2xl">
                <img src={TrImg3} className='bg-cover' alt="ICG Training Image" />
              </div>
              <div className="relative h-full overflow-hidden rounded-2xl">
                <img src={TrImg4} className='bg-cover' alt="ICG Training Image" />
              </div>

            </motion.div>

          </div>

        </div>

        {/* Document List */}
        <div className="grid grid-flow-col auto-cols-fr gap-4 mt-10">
          <div className="">
            <TitleBlock tag="training_international_level_current_heading" className="text-2xl font-semibold dark:text-slate-50" />
            <DocumentFolder
              folderKey="Training_International_Level_Current"
              title="Related Documents"
            />
          </div>
          <div className="">
            <TitleBlock tag="training_international_level_archive_heading" className="text-2xl font-semibold dark:text-slate-50" />
            <DocumentFolder
              folderKey="Training_International_Level_Archive"
              title="Related Documents"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
