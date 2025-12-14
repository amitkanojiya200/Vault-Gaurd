// src/pages/services/CollabSacep.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Globe2, Users } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';

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
                        <Globe2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
                        <span className="font-medium">Collaboration · International · SACEP</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Indian Coast Guard · International Collaboration
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50">
                        South Asia Co-operative Environment Programme (SACEP)
                    </h1>
                </div>

                {/* Main grid: Overview + Member Countries */}
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)]">
                    {/* Overview */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
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

                        <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200  text-justify leading-relaxed break-words">
                            South Asia Co-operative Environment Programme (SACEP) is an inter-governmental organization, established in 1982 by the governments of South Asia to promote and support protection, management and enhancement of the environment in the region. SACEP member countries are Afghanistan , Bangladesh , Bhutan , India , Maldives , Nepal , Pakistan and Sri Lanka.
                            South Asia is one of the most diverse regions in the world. Bordered to the north by the Himalayas and to the south by the Indian Ocean, covers a diversity of ecosystems from lush tropical forest to harsh, dry desert. It is also one of the most populous regions, with over 1 billion people living in India alone. Although never remounted as a single country, the movements of peoples over thousands of years has resulted in strong commonalities between cultures. Yet there remains a huge diversity of languages, religions and outlooks across the sub-continent. . Most of the South Asian nations share many similar environmental problems, stemming from poverty and its consequences on natural resources. According to the World Bank, during the past decade, South Asia has been the second fastest economically growing region in the world, and their efforts at increased production have put increasing pressure on natural resources and the environment. Significant natural resource concerns of the region include depletion of water quality and quantity, dwindling forests and coastal resources, and soil degradation resulting from nutrient depletion and salinization
                            Many countries of the region have taken actions for the protection and management of the environment. They are also party to many multilateral environmental agreements requiring them to work cooperatively for the mitigation of concern issues. SACEP supports national government’s efforts for environmental protection and sustainable development.
                            Since its creation, SACEP has implemented a number of projects and programmes in the areas of environment education, environment legislation, biodiversity, air pollution, and the protection and management of the coastal environment. SACEP is also secretariat for the South Asian Seas Programme.
                            The Malé Declaration on control and prevention of air pollution and its likely transboundary effects for South Asia is another significant efforts which encourages intergovernmental cooperation to combat the transboundary air pollution problem

                        </p>
                        <ul className="mt-3 space-y-1.5 text-lg text-slate-700 dark:text-slate-200  text-justify leading-relaxed break-words">
                            <li className="flex items-start gap-2">
                                <span className='font-bold text-xl underline'>
                                    Some of the salient attributes of South Asia are as follows:
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    1. The region covers almost <strong>one twentieth</strong> of the earth's surface and provides a home for about <strong>one fifth</strong> of the world population.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    2. The degree of <strong>urbanization</strong> in **1999** ranged from **7 percent** in Bhutan to **33 percent** in Pakistan. **Mumbai, Calcutta, Delhi, Karachi and Dhaka** are fast growing cities with population more than **10 million**.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    3. Over <strong>30 percent</strong> of the population earns <strong>less than one dollar per day</strong> and the per capita GNP for 1998 ranged from US$ 210 to 1,130. It is <strong>US$ 210 in Nepal</strong> to <strong>1,130 in Maldives</strong>.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    4. Although the economies of the countries are primarily agricultural, <strong>industrialization</strong> has increased during the past decade.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    5. South asia is home to <strong>14 percent</strong> of the world's remaining <strong>mangrove forests</strong> and the <strong>Sundarbans</strong> found between Bangladesh and India is one of the <strong>largest continuous mangrove stretch</strong> in the world.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    6. <strong>6 percent</strong> of the world's <strong>coral reefs</strong> are in the South Asian seas. The <strong>atolls of Maldives and Lakshadweep islands</strong> of the region, are biodiversity rich marine habitats.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    7. <strong>Hindu Kush Himalayan belt</strong> is home to over <strong>25,000 major plant species</strong>, comprising <strong>10 percent</strong> of the world's flora.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span>
                                    8. The region is prone to <strong>natural disasters</strong> such as <strong>cyclones, floods and landslides</strong>. From 1990-1999, the region accounted for over <strong>60 percent</strong> of disaster-related deaths worldwide.
                                </span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Member Countries */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/85 dark:shadow-black/40"
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                    Member Countries
                                </p>
                            </div>
                        </div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {memberCountries.map((country) => (
                                <div
                                    key={country}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-lg dark:border-slate-700 dark:bg-slate-900/80"
                                >
                                    <span className="truncate text-slate-800 dark:text-slate-100">
                                        {country}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Member
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
