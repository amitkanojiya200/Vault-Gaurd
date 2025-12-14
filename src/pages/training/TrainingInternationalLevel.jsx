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
import TrImg3 from '@/assets/images/training/trimg3.jpg';
import TrImg4 from '@/assets/images/training/trimg4.jpg';

// Function to render the table cells with proper styling
const renderCell = (content, isHeader = false, isMono = false) => (
  <td className={`px-6 py-3 whitespace-nowrap text-sm text-center ${isHeader ? 'font-medium' : 'font-normal'} ${isMono ? 'font-mono' : ''} ${isHeader ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
    {content === null ? '—' : content}
  </td>
);

const renderTitleCell = (title) => (
  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-left">
    {title}
  </td>
);

// Helper component for a single row
const TableRow = ({ serNo, title, coursesICG, coursesStakeholders, traineesICG, traineesStakeholders, isEven }) => (
  <tr className={isEven ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150'}>
    {renderCell(serNo, true)}
    {renderTitleCell(title)}
    {renderCell(coursesICG)}
    {renderCell(coursesStakeholders)}
    {renderCell(traineesICG, false, true)}
    {renderCell(traineesStakeholders, false, true)}
  </tr>
);

// Receives routes + onNavigate from Router
export default function TrainingInternationalLevel({ routes, onNavigate }) {
  const OPRC_TABS = [
    {
      id: routes.DOC_OPRC_1,
      label: 'OPRC Level-1',
      code: 'Level-1',
      blurb: 'Baseline awareness for international / regional OPRC responders.',
    },
    {
      id: routes.DOC_OPRC_2,
      label: 'OPRC Level-2',
      code: 'Level-2',
      blurb: 'Practical equipment handling and deployment for joint exercises.',
    },
  ];

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
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50">
            Training - International Level
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-slate-400">
            Structured national-level training for oil pollution preparedness, response
            and coordination. This view gives a quick overview of OPRC modules and lets
            you jump into detailed course material.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)]">
          {/* LEFT: Overview + TOC */}
          <div className="space-y-3">
            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
            >
              <div className="max-w-7xl mx-auto">
                <h1 className="lg:text-2xl sm:text-4xl font-extrabold text-gray-800 dark:text-white mb-6 text-left pt-5">
                  2.2 International Level
                </h1>
                <div className="overflow-x-auto shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-gray-200 dark:divide-gray-700">
                    {/* Table Header */}
                    <thead className="bg-(--orange500) dark:bg-(--orange500) text-white">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-orange-700 dark:border-orange-900 w-16"
                        >
                          Ser No.
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider border-r border-orange-700 dark:border-orange-900 min-w-[200px]"
                        >
                          Course Title
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider border-r border-orange-700 dark:border-orange-900"
                        >
                          No. of Courses
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                        >
                          No. of Foreign Trainees
                        </th>
                      </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Row 1 */}
                      <tr className="bg-white dark:bg-gray-800">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                          1
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                          OPRC Level-1
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center border-r border-gray-200 dark:border-gray-700">
                          02
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <span className="font-bold">35</span> (Bangladesh, Madagascar, Malaysia, Maldives, Mauritius, Mozambique, Myanmar, Nigeria, Seychelles, Sri Lanka, Vietnam)
                        </td>
                      </tr>
                      {/* Row 2 */}
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">
                          2
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">
                          OPRC Level-2
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center border-r border-gray-200 dark:border-gray-800">
                          02
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <span className="font-bold">19</span> (Bangladesh, Malaysia, Maldives, Mauritius, Mozambique, Nigeria, Sri Lanka, Vietnam)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* OPRC clickable tabs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100">
                    OPRC Training Modules
                  </p>
                  <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                    Click a module to open its detailed page with PPTs and exercises.
                  </p>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {OPRC_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onNavigate(tab.id)}
                    className="group flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[0.75rem] transition hover:border-sky-400 hover:bg-sky-50/90 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-sky-400/70 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-[0.65rem] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                        {tab.code}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-50">
                          {tab.label}
                        </p>
                        <p className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                          {tab.blurb}
                        </p>
                      </div>
                    </div>
                    <ArrowRightCircle className="h-4 w-4 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500 dark:text-slate-500" />
                  </button>
                ))}
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
      </div>
    </div>
  );
}
