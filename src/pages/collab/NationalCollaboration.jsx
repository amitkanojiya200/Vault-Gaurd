import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Zap, Layers, Users, Plane, Globe } from 'lucide-react';
import TitleBlock from '@/components/cms/TitleBlock';
import ParagraphBlock from '@/components/cms/ParagraphBlock';
import DocumentFolder from '@/components/DocumentFolder';

// NOTE: Placeholder image imports removed as they are irrelevant to the new content
// If real assets were available, they would be imported here.

export default function NationalCollaboration({ routes, onNavigate }) {
    // Defines the key partner categories
    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="relative z-10 mx-auto w-full px-15 py-8 text-slate-900 dark:text-gray-100">
                {/* Top bar: Back + chip */}
                <div className="mb-6 flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={() => onNavigate(routes.HOME)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-[0.7rem] text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Back to Home</span>
                    </button>

                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-slate-700">
                        <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                        <span className="font-medium">National Collaboration</span>
                    </div>
                </div>

                {/* Header */}
                <header className="mb-8">
                    <p className="text-[0.8rem] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                        Indian Coast Guard
                    </p>
                    <TitleBlock tag="national_collaboration_heading1" className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl dark:text-slate-50" />
                </header>

                {/* Main Content Sections */}
                <div className="space-y-10">
                    {/* Section 1: Collaboration Frameworks and Exercises */}
                    <section className="bg-white/95 dark:bg-gray-800/90 p-6 md:p-8 rounded-xl shadow-md">
                        <ParagraphBlock tag="collaboration_national_level_description" className="text-md text-slate-500 dark:text-slate-400" />
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-10">
                            <TitleBlock tag="national_collaboration_heading2" className="text-2xl font-extrabold text-center text-(--orange500) dark:text-(--orange400) my-6 border-b-2 border-(--orange400) dark:border-(--orange400) pb-3" />
                            <ParagraphBlock tag="collaboration_national_level_para_1" className="font-semibold text-(--orange500) dark:text-(--orange400)" />

                        </div>
                    </section>
                    {/* Section 2: Stakeholders MOU with CG */}
                    <section className="bg-white/95 dark:bg-gray-800/90 p-6 md:p-8 rounded-xl shadow-md">
                        <TitleBlock tag="national_collaboration_stake_mou_with_cg" className="mt-2 text-2xl font-extrabold text-slate-900 md:text-xl dark:text-slate-50" />
                        <ParagraphBlock tag="national_collaboration_stake_mou_with_cg_para" className="font-semibold text-(--orange500) dark:text-(--orange400)" />
                        <div className="mt-4">
                            <DocumentFolder
                                folderKey="Operations_Joint_Inspection_OHS"
                                title="Related Documents"
                            />
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}