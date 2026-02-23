// src/pages/training/TrainingNationalLevel.jsx
import React from 'react';
import DocumentFolder from '@/components/DocumentFolder';
import ParagraphBlock from '@/components/cms/ParagraphBlock';
import TitleBlock from '@/components/cms/TitleBlock';

// Receives routes + onNavigate from Router
export default function DocOthers({ routes, onNavigate }) {

    return (
        <div className="min-h-screen px-4 py-4 md:px-10 md:py-6">
            {/* Header */}
            <div className="mb-4">
                <div className="mb-4">
                    <TitleBlock tag="document_others_heading" className="text-2xl font-semibold dark:text-slate-50" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Documents | Others
                    </p>
                    <ParagraphBlock tag="document_others_description" className="text-md text-slate-500 dark:text-slate-400" />
                </div>
            </div>

            {/* Document List */}
            <DocumentFolder
                folderKey="Document_Others"
                title="Related Documents"
            />
        </div>
    );
}
