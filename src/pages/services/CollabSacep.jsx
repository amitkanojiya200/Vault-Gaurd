// src/pages/services/CollabSacep.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Globe2, Users } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import DocumentFolder from '@/components/DocumentFolder';
import TitleBlock from '@/components/cms/TitleBlock';
import ParagraphBlock from '@/components/cms/ParagraphBlock';

export default function CollabSacep({ routes, onNavigate }) {
    const memberCountries = [
        'Afghanistan',
        'Bangladesh',
        'Bhutan',
        'India',
        'Maldives',
        'Nepal',
        'Pakistan',
        'Sri Lanka',
    ];

    return (
        <div className="relative min-h-screen overflow-hidden">

            <div className="relative z-10 px-4 py-4 text-slate-900 md:px-10 md:py-6 dark:text-[var(--soft-white,_#e5e7eb)]">
                {/* Top bar: Back + chip */}
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
                        <Globe2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
                        <span className="font-medium">Collaboration · International · SACEP</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Indian Coast Guard · International Collaboration
                    </p>
                    <TitleBlock tag="international_sacep_heading1" className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50" />
                </div>

                {/* Main grid: Overview + Member Countries */}
                {/* Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl mb-5 border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
                >
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                            <Globe2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Overview
                            </p>
                        </div>
                    </div>

                    <ParagraphBlock tag="international_sacep_para_1" className="text-lg leading-relaxed text-slate-700 dark:text-slate-200  text-justify leading-relaxed break-words" />

                    <ParagraphBlock tag="international_sacep_para_2" className="text-lg leading-relaxed text-slate-700 dark:text-slate-200  text-justify leading-relaxed break-words" />

                </motion.div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    {/* Member Countries */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
                    >
                        <div className="mb-5 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Member Countries
                                </p>
                            </div>
                        </div>

                        <div className="mt-2 grid gap-2">
                            <ParagraphBlock tag="international_sacep_member_country" className="text-2xl leading-relaxed text-slate-700 dark:text-slate-200  text-justify leading-relaxed break-words" />
                        </div>
                    </motion.div>

                    {/* Document upload section */}
                    <DocumentFolder
                        folderKey="Collab_SACEP"
                        title="Related Documents"
                    />
                </div>
            </div>
        </div>
    );
}
