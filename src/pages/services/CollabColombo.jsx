// src/pages/services/CollabColombo.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';

export default function CollabColombo({ routes, onNavigate }) {
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
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50">
                        Colombo Security Conclave
                    </h1>
                </div>

                {/* Main layout: Overview + 4 images stacked */}
                <div className="grid gap-4 lg:grid-cols-4 lg:items-start">
                    {/* Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl col-span-3 border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
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

                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                            The Colombo Security Conclave (CSC), a regional security grouping, officially welcomed Bangladesh as its fifth member state on Wednesday. The announcement came during the 8th Deputy National Security Adviser (DNSA) level meeting, hosted virtually by Mauritius. The existing members – India, Sri Lanka, Mauritius, and the Maldives – warmly received Bangladesh into the fold, while Seychelles participated as an observer state.
                            <br /><br />
                            The Colombo Security Conclave was established in 2020, when India, Sri Lanka and the Maldives agreed to expand the scope of their trilateral meeting on maritime cooperation. Mauritius joined the conclave at the fifth meeting of the grouping in Male in March 2022.
                            <br /><br />
                            During Wednesday’s virtual meeting, member states reviewed the progress of activities outlined in the CSC’s Roadmap for 2023-2024. They also discussed decisions taken at previous high-level meetings, including the 7th DNSA level meeting hosted by the Maldives in July 2023 and the 6th NSA level meeting in Mauritius last December.
                        </p>

                    </motion.div>

                </div>
            </div>
        </div>
    );
}
