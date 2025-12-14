import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Download, ArrowLeft } from 'lucide-react';
import { getFileIcon } from '../../../utils/fileUtils';
import ModalPdfViewer from '../../../components/ModalPdfViewer';

const OprcBasePage = ({ level, title }) => {
  const [structure, setStructure] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: title, path: '' }]);
  const [currentPath, setCurrentPath] = useState('');
  const navigate = useNavigate();

  // Fetch directory structure when component mounts or path changes
  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const response = await fetch(`/api/stakeholder/oprc/${level}${currentPath}`);
        const data = await response.json();
        setStructure(data);
      } catch (error) {
        console.error('Error fetching directory structure:', error);
        // Fallback to mock data for development
        setStructure(getMockStructure(currentPath));
      }
    };

    fetchStructure();
  }, [level, currentPath]);

  // Mock data for development
  const getMockStructure = (path) => {
    // This would be replaced with actual API call in production
    const mockData = {
      '': {
        type: 'directory',
        children: ['2022', '2023', '2024', '2025']
      },
      '/2022': {
        type: 'directory',
        children: ['2. IMO- II (18-22 Apr 22) TRG Report', '3. IMO-II (07-11 Nov 22) TRG Report']
      },
      '/2023': {
        type: 'directory',
        children: [
          '1. IMO-II (ICG) 20-24 Mar 23 Course Folder',
          '2. IMO-II (ICG) 11-15 SEP 23'
        ]
      },
      // Add more mock data as needed
    };

    return mockData[path] || { type: 'directory', children: [] };
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const navigateToFolder = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setBreadcrumbs(prev => [
      ...prev,
      { name: folderName, path: newPath }
    ]);
  };

  const navigateToBreadcrumb = (index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    const newPath = index === 0 ? '' : newBreadcrumbs[newBreadcrumbs.length - 1].path;
    
    setBreadcrumbs(newBreadcrumbs);
    setCurrentPath(newPath);
  };

  const handleFileClick = (fileName) => {
    setSelectedFile({
      name: fileName,
      path: `/Stakeholder/OPRC-${level}${currentPath ? `/${currentPath}` : ''}/${fileName}`
    });
    setIsPdfViewerOpen(true);
  };

  const handleDownload = (e, fileName) => {
    e.stopPropagation();
    const filePath = `/Stakeholder/OPRC-${level}${currentPath ? `/${currentPath}` : ''}/${fileName}`;
    console.log('Downloading file:', filePath);
    // In a real app, you would trigger a download here
    // window.open(filePath, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/stakeholders')}
            className="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Stakeholders
          </button>
          <span className="text-slate-500">/</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-slate-500">/</span>}
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`${index === breadcrumbs.length - 1 
                  ? 'text-slate-700 dark:text-slate-300 font-medium' 
                  : 'text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300'}`}
              >
                {index === 0 ? title : crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
          {title} Documents
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Browse and access all {title} documents organized by year and course.
        </p>

        {/* Directory Listing */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            {structure.children && structure.children.length > 0 ? (
              <div className="space-y-2">
                {structure.children.map((item) => {
                  const isDirectory = !item.includes('.');
                  const isExpanded = expandedFolders[item];
                  
                  return (
                    <div key={item} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => isDirectory ? navigateToFolder(item) : handleFileClick(item)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isDirectory ? (
                            isExpanded ? (
                              <FolderOpen className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Folder className="h-5 w-5 text-amber-500" />
                            )
                          ) : (
                            <span className="text-lg">{getFileIcon(item)}</span>
                          )}
                          <span className="text-left">
                            {item}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {!isDirectory && (
                            <button
                              onClick={(e) => handleDownload(e, item)}
                              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mr-2"
                              title="Download"
                            >
                              <Download className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                            </button>
                          )}
                          {isDirectory && (
                            isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-slate-500" />
                            )
                          )}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isDirectory && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-slate-200 dark:border-slate-700 p-2 pl-10 bg-slate-50 dark:bg-slate-800/50">
                              <div className="animate-pulse text-sm text-slate-500 dark:text-slate-400">
                                Loading...
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No documents found in this directory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedFile && (
        <ModalPdfViewer
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          filePath={selectedFile.path}
          fileName={selectedFile.name}
        />
      )}
    </div>
  );
};

export default OprcBasePage;
