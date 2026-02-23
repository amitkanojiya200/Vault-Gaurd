import React, { useState } from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import ModalPdfViewer from '@/components/ModalPdfViewer';
import DocumentFolder from '@/components/DocumentFolder';
import TitleBlock from '@/components/cms/TitleBlock';
import ParagraphBlock from '@/components/cms/ParagraphBlock';

/* =========================================================
   STANDALONE PAGE
========================================================= */
export default function OperationsJoinInspection({ onBack }) {

    return (
        <div className="min-h-screen p-4 md:p-10">
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
                <TitleBlock tag="joint_inspection_heading" className="text-2xl font-semibold dark:text-slate-50" />
                <ParagraphBlock tag="joint_inspection_description" className="text-md text-slate-500 dark:text-slate-400" />
            </div>

            {/* Document List */}
            <div className="grid grid-flow-col auto-cols-fr gap-4">

                <div className="">
                    <TitleBlock tag="joint_inspection_ports_heading" className="text-2xl font-semibold dark:text-slate-50" />
                    <DocumentFolder
                        folderKey="Operations_Joint_Inspection_Ports"
                        title="Related Documents"
                    />
                </div>
                <div className="">
                    <TitleBlock tag="joint_inspection_ohs_heading" className="text-2xl font-semibold dark:text-slate-50" />
                    <DocumentFolder
                        folderKey="Operations_Joint_Inspection_OHS"
                        title="Related Documents"
                    />
                </div>
            </div>
        </div>
    );
}
