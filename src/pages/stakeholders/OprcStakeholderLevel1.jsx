import React from 'react';
import DocumentFolder from '@/components/DocumentFolder';
import TitleBlock from '@/components/cms/TitleBlock';
import ParagraphBlock from '@/components/cms/ParagraphBlock';

const OprcStakeholderLevel1 = () => {
  return (
    <div className="h-screen w-full px-4 py-4 md:px-10 md:py-6 gap-10">
      <div className="mb-4">
        <TitleBlock tag="stakeholder_others_heading" className="text-2xl font-semibold dark:text-slate-50" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Stakeholder | Others
        </p>
        <ParagraphBlock tag="stakeholder_others_description" className="text-md text-slate-500 dark:text-slate-400" />
      </div>
      <DocumentFolder
        folderKey="Oprc_Stakeholders"
        title="Related Documents"
      />
    </div>
  );
};

export default OprcStakeholderLevel1;
