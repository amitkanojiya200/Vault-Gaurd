import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Zap, Layers, Users, Plane, Globe } from 'lucide-react';

// NOTE: Placeholder image imports removed as they are irrelevant to the new content
// If real assets were available, they would be imported here.

export default function NationalCollaboration({ routes, onNavigate }) {
    // Defines the key partner categories
    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background (Retained) */}
            {/* Using a placeholder for the background image as the asset path is not available */}
            <div
                className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75 saturate-150 bg-slate-950/90 dark:bg-gray-900/90"
                style={{
                    backgroundImage: 'url(https://placehold.co/1920x1080/0f172a/94a3b8?text=Collaborative+Waters)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div
                className="fixed inset-0 -z-10 backdrop-blur-xl opacity-90 dark:opacity-60"
                style={{
                    background:
                        'radial-gradient(circle at top, rgba(148,163,253,0.22), transparent 80%), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                }}
            />
            <div className="pointer-events-none fixed inset-0 -z-10 hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),_transparent_70%)] dark:block" />

            <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 text-slate-900 dark:text-gray-100">
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
                    <h1 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl dark:text-slate-50">
                        National Collaboration
                    </h1>
                </header>

                {/* Main Content Sections */}
                <div className="space-y-10">

                    {/* Section 1: Collaboration Frameworks and Exercises */}
                    <section className="bg-white/95 dark:bg-gray-800/90 p-6 md:p-8 rounded-xl shadow-2xl">
                        <p className="">The Indian Coast Guard (ICG) collaborates with various national and state agencies for pollution response through exercises like the National Level Pollution Response Exercise (NATPOLREX-X) and the National Oil Spill Disaster Contingency Plan (NOSDCP). Key partners include the Greater Chennai Corporation, State Pollution Control Boards, State Disaster Management Authorities, and other state administrations, which participate in mock drills and review meetings to strengthen coordination and preparedness for marine oil spills.</p>
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
    <h2 className="text-2xl font-extrabold text-center text-sky-700 dark:text-sky-300 my-6 border-b-2 border-sky-400 dark:border-sky-600 pb-3">
        Key Collaborations and Exercises
    </h2>
    <ul className="space-y-4 list-disc list-inside">
        <li className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition duration-300 border-l-4 border-sky-500">
            <span className="font-semibold text-sky-600 dark:text-sky-400">NATPOLREX-X:</span> The ICG conducts this national-level exercise to test India's preparedness for marine oil spills and improve inter-agency coordination. The 10th edition in October 2025 involved a shoreline cleanup drill at Marina Beach with the Greater Chennai Corporation and other local agencies.
        </li>
        <li className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition duration-300 border-l-4 border-sky-500">
            <span className="font-semibold text-sky-600 dark:text-sky-400">NOSDCP:</span> The ICG is the nodal agency for the National Oil Spill Disaster Contingency Plan, which coordinates the national response framework. The plan includes regular meetings to review and enhance preparedness.
        </li>
        <li className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition duration-300 border-l-4 border-sky-500">
            <span className="font-semibold text-sky-600 dark:text-sky-400">State and local government agencies:</span> State governments are responsible for coordinating district and local administrations for shoreline response. During NATPOLREX-X, the Greater Chennai Corporation, State Pollution Control Board, and State Disaster Management Authority have worked alongside the ICG.
        </li>
        <li className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition duration-300 border-l-4 border-sky-500">
            <span className="font-semibold text-sky-600 dark:text-sky-400">Other national agencies:</span> The Indian Air Force collaborates by providing rapid support and relief using its large aircraft, as seen in previous exercises. The military also participates, as demonstrated by a joint exercise with the Garrison Battalion in Maharashtra.
        </li>
    </ul>
</div>

                    </section>

                </div>

            </div>
        </div>
    );
}