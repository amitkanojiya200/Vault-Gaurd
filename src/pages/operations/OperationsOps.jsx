// src/pages/services/Operations.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import Opr1 from '@/assets/images/operations/opr1.png';
import Opr2 from '@/assets/images/operations/opr2.png';
import DocumentFolder from '@/components/DocumentFolder';
import ParagraphBlock from '@/components/cms/ParagraphBlock';
import TitleBlock from '@/components/cms/TitleBlock';
import TableBlock from '@/components/cms/TableBlock';

export default function Operations({ routes, onNavigate }) {
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
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-(--orange500)" />
                        <span className="font-medium">Collaboration · International · CSC</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Indian Coast Guard · Operations
                    </p>
                    <TitleBlock tag="operation_heading" className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50" />
                </div>

                {/* Main layout: Overview + 4 images stacked */}
                <div className="p-4 sm:p-6 mb-5 md:p-8 space-y-8 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200">
                    {/* 1. Introduction */}
                    <section>
                        <TitleBlock tag="operation_heading_1" className="text-xl font-bold text-(--orange500) dark:text-(--orange500) mb-3" />
                        <ParagraphBlock tag="operation_para_1" />
                    </section>

                    {/* 2. Operations (Modified Block) */}
                    <section>
                        <TitleBlock tag="operation_heading_2" className="text-xl font-bold text-(--orange500) dark:text-(--orange500) mb-3" />
                        <ParagraphBlock tag="operation_para_2" />

                        {/* 2.1. Sinking of MV MSC ELSA 3 - Detailed Content */}
                        <div className="pl-4 border-l-2 border-sky-400 dark:border-sky-600 space-y-2 my-6">
                            <TitleBlock tag="operation_heading_3" />
                            <ParagraphBlock tag="operation_para_3" />
                        </div>

                        {/* Image Section 1 */}
                        <div className="my-8 flex justify-center gap-50">
                            <div className="rounded-lg overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700">
                                <img src={Opr1} alt="Oil Spill Response Activity 1" className="w-60 h-60 object-cover" />
                            </div>
                            {/* Image Section 2 */}
                            <div className="rounded-lg overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700">
                                <img src={Opr2} alt="Shoreline Cleanup Training Activity 2" className="w-60 h-60 object-cover" />
                            </div>
                        </div>


                    </section>

                    {/* 3. Exercises */}
                    <section>
                        <TitleBlock tag="operation_top_heading_4" className="text-xl font-bold text-(--orange500) dark:text-(--orange500) mb-3" />

                        {/* 3.1. Exercise Prasthan-01/25 */}
                        <div className="pl-4 border-l-2 border-sky-400 dark:border-sky-600 space-y-2">
                            <TitleBlock tag="operation_heading_4" className="text-lg font-semibold text-slate-800 dark:text-slate-100" />
                            <ParagraphBlock tag="operation_para_4" className="text-sm leading-relaxed" />
                        </div>
                    </section>

                    {/* 4. Joint Inspections */}
                    <section>
                        <TitleBlock tag="operation_heading_5" className="text-xl font-bold text-(--orange500) dark:text-(--orange500) mb-3" />
                        <ParagraphBlock tag="operation_para_5" className="text-sm leading-relaxed" />
                    </section>

                    {/* 5. Embarkations */}
                    <section>
                        <TitleBlock tag="operation_heading_6" className="text-xl font-bold text-(--orange500) dark:text-(--orange500) mb-3" />
                        <ParagraphBlock tag="operation_para_6" className="text-sm leading-relaxed" />
                        <TableBlock
                            tag="operations_ops_table4"
                            className="mt-8 shadow-lg"
                        />
                    </section>

                    {/* 6. Availability of Oil Spill Dispersant (OSD) */}
                    <section>

                        <TitleBlock tag="operation_heading_7" className="text-xl font-bold text-(--orange500) dark:text-(--orange500) mb-3" />
                        <ParagraphBlock tag="operation_para_7" className="text-sm leading-relaxed" />
                    </section>
                </div>
                <DocumentFolder
                    folderKey="Operations_OPS"
                    title="Related Documents"
                />
            </div>
        </div>
    );
}