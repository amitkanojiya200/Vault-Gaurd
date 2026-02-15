import React, { useState } from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import ModalPdfViewer from '@/components/ModalPdfViewer';
import { openBundledPpt } from '@/lib/defaultOpener';
import DocumentFolder from '@/components/DocumentFolder';

/* =========================================================
   DOCUMENT LIST (STANDALONE)
========================================================= */
const DOCUMENTS = [
    {
        id: 'doc-1',
        label: 'Joint Inspection',
        fileName: 'Joint Inspection.pdf',
        path: '/servicesOprDocs/Joint Inspection.pdf',
    },
];

/* =========================================================
   STANDALONE PAGE
========================================================= */
export default function OperationsJoinInspection({ onBack }) {
    const [activePdf, setActivePdf] = useState(null);

    function handleOpenFile(item) {
        const ext = item.fileName.split('.').pop().toLowerCase();

        // PDF → internal viewer
        if (ext === 'pdf') {
            setActivePdf({
                title: item.label,
                url: item.path,
            });
            return;
        }

        // Non-PDF → OS default app (Tauri)
        openBundledPpt(item.path).catch((err) => {
            console.error('Failed to open file:', err);
        });
    }

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
                <h1 className="text-2xl font-semibold dark:text-slate-50">
                    Case Study
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click a document to view or open
                </p>
            </div>

            {/* PDF Viewer */}
            {activePdf && (
                <ModalPdfViewer
                    title={activePdf.title}
                    src={activePdf.url}
                    onClose={() => setActivePdf(null)}
                />
            )}

            {/* Document List */}
            <DocumentFolder
                folderKey="Operations_Case_Study"
                title="Case Study Documents"
            />
            {/* <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900/85">
                {DOCUMENTS.map((doc) => (
                    <button
                        key={doc.id}
                        onClick={() => handleOpenFile(doc)}
                        className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left transition hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-400"
                    >
                        <div className="min-w-0">
                            <div className="truncate font-medium text-slate-900 dark:text-slate-50">
                                {doc.label}
                            </div>
                            <div className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">
                                {doc.fileName}
                            </div>
                        </div>
                        <FileText className="h-4 w-4 text-slate-400 group-hover:text-sky-500" />
                    </button>
                ))}
            </div> */}
        </div>
    );
}
