// src/pages/services/Operations.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import bgImage2 from '@/assets/dbg2.png';
import Opr1 from '@/assets/images/operations/opr1.png';
import Opr2 from '@/assets/images/operations/opr2.png';

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
                        <ShieldCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-300" />
                        <span className="font-medium">Collaboration · International · CSC</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-5">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Indian Coast Guard · Operations
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl dark:text-slate-50">
                        Operations
                    </h1>
                </div>

                {/* Main layout: Overview + 4 images stacked */}
                <div className="p-4 sm:p-6 md:p-8 space-y-8 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200">
                    {/* 1. Introduction */}
                    <section>
                        <h2 className="text-xl font-bold text-sky-700 dark:text-sky-300 mb-3">
                            1. Introduction
                        </h2>
                        <p className="text-sm leading-relaxed">
                            <strong>CGPRT (W)</strong> acts as a specialized unit providing **Technical and Advisory support** to all ICG units/ Ports and Oil Handling Agencies and also undertakes **PR Operations** as required during incidents in Western Region. This unit also conducts **Joint Inspections**, monitors all **PR exercises** and **PR equipment inventory/ capability details** holding with all Ports/ OHAs in Western Region as per **NOSDCP**.
                        </p>
                    </section>

                    {/* 2. Operations (Modified Block) */}
                    <section>
                        <h2 className="text-xl font-bold text-sky-700 dark:text-sky-300 mb-3">
                            2. Operations
                        </h2>
                        <p className="text-sm leading-relaxed mb-4">
                            <strong>CGPRT (W)</strong> has been vested with the responsibility of **Oil spill response in the Western Region** and therefore keeps all PR Equipment, operational and ready for dispatch, at short notice. Major Operations undertaken by this unit since last Annual Inspection in Mar 25 are as follows:
                        </p>

                        {/* 2.1. Sinking of MV MSC ELSA 3 - Detailed Content */}
                        <div className="pl-4 border-l-2 border-sky-400 dark:border-sky-600 space-y-2 mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                2.1. Sinking of MV MSC ELSA 3
                            </h3>
                            <p className="text-sm leading-relaxed">
                                At about **0750 hours on 25 May 25**, MV MSC ELSA 3 reportedly sank in position off Alleppey. The vessel was holding **88 MT Marine Gas Oil (MGO)** and **367 MT Very Low Sulphur Fuel Oil (VLSFO)** onboard.
                            </p>
                            <p className="text-sm leading-relaxed">
                                On **26 May 25**, PR equipment along with **3000 ltrs of OSD** were embarked onboard **ICGS Samudra Prahari** to carry out oil spill response at sea if the need arose.
                            </p>
                            <p className="text-sm leading-relaxed">
                                A **two-member strike team** from CGPRT(W) was also deputed onboard ship for rendering expert advice on PR operations. Further, a **four-member specialist team** from CGPRT (W) was deputed on **27 Jun 25** for advising State Government on shoreline cleanup. The team met the District Collectors of Kollam & Trivandrum and advised the administration on readiness for shoreline cleanup. Training sessions in both districts were undertaken so that local administration officials understood the methodology for shoreline cleanup.
                            </p>
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
                        <h2 className="text-xl font-bold text-sky-700 dark:text-sky-300 mb-3">
                            3. Exercises
                        </h2>
                        <p className="text-sm leading-relaxed mb-4">
                            The unit has participated actively in the exercise: -
                        </p>

                        {/* 3.1. Exercise Prasthan-01/25 */}
                        <div className="pl-4 border-l-2 border-sky-400 dark:border-sky-600 space-y-2">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                3.1. Exercise Prasthan-01/25
                            </h3>
                            <p className="text-sm leading-relaxed">
                                Exercise **Prasthan 01/25** was conducted by Western Naval Command on **28 Apr 25**. The exercise was conducted at **HI platform in Heera Field** (operator M/s ONGC). One officer was deputed as **neutral umpire** to provide specialist advice in the scenario of an oil spill and another officer was deputed to be part of the **crisis management group**. Exercise **Prasthan 02/25** is planned on **18 Nov 25** and IPC and FPC scheduled on **04 Nov** & **12 Nov 25** respectively.
                            </p>
                        </div>
                    </section>

                    {/* 4. Joint Inspections */}
                    <section>
                        <h2 className="text-xl font-bold text-sky-700 dark:text-sky-300 mb-3">
                            4. Joint Inspections
                        </h2>
                        <p className="text-sm leading-relaxed mb-4">
                            Joint Inspections of Ports and OHAs of Western Region for **Tier-I PR capabilities** are carried out by **CGPRT (W)** along with representatives from **MoPSW** for Ports and **OISD** for OHAs on **yearly basis**. The schedule and status of joint inspections of Ports and OHAs for current calendar year are as follows: -
                        </p>

                        {/* 4.1. Ports Table */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                                4.1. Ports
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                    <thead className="bg-slate-100 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ser No.</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ports</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date of Inspection</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">1</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">JNPA, Mumbai</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Apr 25</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 dark:text-green-400">Completed</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">2</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">MbPA, Mumbai</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">3</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">New Mangalore Port Trust</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Oct 25</td>
                                            <td className="px-4 py-2 text-sm text-amber-600 dark:text-amber-400">Dates awaited from Ministry of Ports, Shipping and Waterways</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">4</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Mormugao Port Trust, Goa</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">5</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Cochin Port Authority</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Mar 26</td>
                                            <td className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400">Planned to be undertaken as per schedule</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 4.2. OHAs Table */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                                4.2. OHAs
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                    <thead className="bg-slate-100 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ser No.</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">OHAs</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date of Inspection</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">1</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Oil and Natural Gas Corporation, Mumbai</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">Nov 25</td>
                                            <td className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400">Planned to be undertaken as per schedule</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 4.3. Review of Contingency Plans Table */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                                4.3. Review of Contingency Plans
                            </h3>
                            <p className="text-sm leading-relaxed mb-3">
                                The unit had received OSCPs of Port/ OHA from CGRHQ (W) for scrutiny. Review of all Contingency plans completed and observations forwarded to CGRHQ (W) and their status are as follows: -
                            </p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                    <thead className="bg-slate-100 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ser No.</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name of Ports / OHAs</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">1</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">M/s Adani Vizhinjam Port Pvt Ltd</td>
                                            <td className="px-4 py-2 text-sm text-green-600 dark:text-green-400">Completed & forwarded with observation</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">2</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">M/s Jawahar Lal Nehru Port Authority</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* 5. Embarkations */}
                    <section>
                        <h2 className="text-xl font-bold text-sky-700 dark:text-sky-300 mb-3">
                            5. Embarkations
                        </h2>
                        <p className="text-sm leading-relaxed mb-4">
                            PR equipment are embarked onboard ships and aircraft for operations and exercise as well as for monsoon deployments. The details of embarkations under taken since last inspections are as follows: -
                        </p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                                <thead className="bg-slate-100 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ser No.</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Unit</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Exercise</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">1</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">ICGS Apoorva</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">21 Nov 24 - 09 Jun 25</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">Exercise Prasthan- 02/24</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">2</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">ICGS Samrat</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">27-28 Mar 25</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">Harbour demo. for students from World Maritime University.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">3</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">ICGS Samrat</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">11-28 Apr 25</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">Monsoon Deployment</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">4</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">ICGS Sankalp</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">16-26 Apr 25</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">-</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">5</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">ICGS Samudra Prahari</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">25 Jun - 01 Jul 25</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 dark:text-red-400">PR Operation for sinking of MV MSC ELSA 3</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">6</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">ICGS Samudra Prahari</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">18 Sep - 24 Oct 25</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">NATPOLREX - X</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 6. Availability of Oil Spill Dispersant (OSD) */}
                    <section>
                        <h2 className="text-xl font-bold text-sky-700 dark:text-sky-300 mb-3">
                            6. Availability of Oil Spill Dispersant (OSD)
                        </h2>
                        <p className="text-sm leading-relaxed">
                            <strong>CGPRT (W)</strong> is authorized for **3000 ltrs Type-III** and **5000 ltrs Type-II OSD**. As per policy the minimum stock level that should be maintained is **1/5th** of the authorized scale. Presently the unit is holding **5,400 ltrs** of active usable OSD (<strong>2,000 ltrs Type-II</strong>, **1,000 ltrs Type-II & III** and **2,400 ltrs Type-III**).
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
