/**
 * Fetches the directory structure from the public folder
 * @param {string} basePath - Base path to start scanning from (e.g., '/Stakeholder')
 * @returns {Promise<Object>} - Object representing the directory structure
 */
export async function fetchDirectoryStructure(basePath = '') {
  try {
    // In a real app, this would be an API call to your backend
    // For now, we'll return a mock structure
    return {
      'OPRC-Level1': {
        '2023': ['document1.pdf', 'document2.pdf'],
        '2022': ['document1.pdf', 'document2.pdf', 'document3.pdf'],
      },
      'OPRC-Level2': {
        '2023': ['document1.pdf', 'document2.pdf'],
        '2022': ['document1.pdf', 'document2.pdf'],
      },
      'OPRC-Level3': {
        '2023': ['document1.pdf'],
        '2022': ['document1.pdf', 'document2.pdf'],
        '2021': ['document1.pdf', 'document2.pdf', 'document3.pdf'],
      },
    };
  } catch (error) {
    console.error('Error fetching directory structure:', error);
    return {};
  }
}

/**
 * Formats the directory structure into a more usable format for the UI
 * @param {Object} structure - Raw directory structure
 * @returns {Array} - Formatted array of documents by year
 */
export function formatDocumentsByYear(structure, level) {
  if (!structure[level]) return [];
  
  return Object.entries(structure[level])
    .map(([year, files]) => ({
      year,
      documents: files.map((file, index) => ({
        id: `doc-${level}-${year}-${index}`,
        name: file.replace(/\.\w+$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        path: `/Stakeholder/${level}/${year}/${file}`,
        type: file.split('.').pop().toLowerCase(),
      })),
    }))
    .sort((a, b) => b.year.localeCompare(a.year)); // Sort years in descending order
}

/**
 * Gets the appropriate icon for a file based on its extension
 * @param {string} fileName - Name of the file
 * @returns {React.Component} - Icon component
 */
export function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const iconMap = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    default: '📄',
  };
  
  return iconMap[ext] || iconMap.default;
}
