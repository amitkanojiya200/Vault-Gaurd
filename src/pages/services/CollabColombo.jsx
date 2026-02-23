// src/pages/services/CollabColombo.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import DocumentFolder from '@/components/DocumentFolder';
import ParagraphBlock from '@/components/cms/ParagraphBlock';
import TitleBlock from '@/components/cms/TitleBlock';

export default function CollabColombo({ routes, onNavigate }) {
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
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
                        <span className="font-medium">Collaboration · International · CSC</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Indian Coast Guard · Collaboration
                    </p>
                    <TitleBlock tag="collaboration_international_csc_heading" className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50" />
                </div>

                {/* Main layout: Overview + 4 images stacked */}
                <div className="grid gap-4 lg:grid-cols-4 lg:items-start">
                    {/* Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl mb-5 col-span-4 border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                                <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="text-[0.75rem] font-semibold text-slate-800 dark:text-slate-100">
                                    Overview
                                </p>
                            </div>
                        </div>

                        <ParagraphBlock tag="international_colombo_overview" className="text-lg leading-relaxed text-slate-700 dark:text-slate-200  text-justify leading-relaxed break-words" />

                    </motion.div>

                </div>
                    <DocumentFolder
                        folderKey="Collab_Colombo"
                        title="Related Documents"
                    />
            </div>
        </div>
    );
}
