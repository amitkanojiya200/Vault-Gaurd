import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Download, ArrowLeft } from 'lucide-react';
import { getOprcStructure, getFileIcon } from '../../../utils/stakeholderUtils';
import { useRoute, ROUTES } from '../../../router/Router';

const OprcStakeholderBase = ({ level, title }) => {
  const { navigate } = useRoute();
  const [years, setYears] = useState([]);
  const [documentsByYear, setDocumentsByYear] = useState({});
  const [expandedYears, setExpandedYears] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { years, documentsByYear } = await getOprcStructure(level);
        setYears(years);
        setDocumentsByYear(documentsByYear);
        
        // Expand the first year by default
        if (years.length > 0) {
          setExpandedYears({ [years[0]]: true });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [level]);

  const toggleYear = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const handleFileClick = (year, fileName) => {
    // Construct the path to the folder/file in the public Stakeholder tree
    const filePath = `/Stakeholder/OPRC-${level}/${year}/${fileName}`;
    // Open directly in a new tab so it behaves like a normal PDF/DOC link
    window.open(filePath, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (e, year, fileName) => {
    e.stopPropagation();
    const filePath = `/Stakeholder/OPRC-${level}/${year}/${fileName}`;
    window.open(filePath, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading {title} documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(ROUTES.STAKEHOLDERS)}
            className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Stakeholders
          </button>
          <span className="text-slate-500">/</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {title} Stakeholder
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
          {title} Stakeholder Documents
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Browse and access all {title} stakeholder documents organized by year.
        </p>

        {/* Documents by Year */}
        <div className="space-y-4">
          {years.length > 0 ? (
            years.map((year) => (
              <div key={year} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedYears[year] ? (
                      <ChevronDown className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    )}
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {year}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {documentsByYear[year]?.length || 0} items
                  </span>
                </button>

                <AnimatePresence>
                  {expandedYears[year] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        {documentsByYear[year]?.length > 0 ? (
                          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {documentsByYear[year].map((doc, index) => (
                              <li key={index}>
                                <div 
                                  onClick={() => handleFileClick(year, doc)}
                                  className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">
                                      {getFileIcon(doc)}
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {doc}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => handleDownload(e, year, doc)}
                                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                            No documents found for this year.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No documents found for {title}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OprcStakeholderBase;
