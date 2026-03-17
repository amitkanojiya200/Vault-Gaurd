import React, { useState } from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import DocumentFolder from '@/components/DocumentFolder';
import TitleBlock from '@/components/cms/TitleBlock';
import ParagraphBlock from '@/components/cms/ParagraphBlock';

/* =========================================================
   STANDALONE PAGE
========================================================= */
export default function TrainingVideosPage({ onBack }) {

    return (
        <div className="min-h-screen px-4 py-4 md:px-10 md:py-6">
            {/* Back button (optional) */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="mb-4 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] dark:border-slate-700 dark:bg-slate-900"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Back
                </button>
            )}

            {/* Header */}
            <div className="mb-4">
                <div className="mb-4">
                    <TitleBlock tag="training_videos_heading" className="text-2xl font-semibold dark:text-slate-50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Services | Training | Videos
                    </p>
                    <ParagraphBlock tag="training_videos_description" className="text-md text-slate-500 dark:text-slate-400" />
                </div>
            </div>

            {/* Document List */}
            <DocumentFolder
                folderKey="Training_videos1"
                title="Related Videos"
            />
        </div>
    );
}
