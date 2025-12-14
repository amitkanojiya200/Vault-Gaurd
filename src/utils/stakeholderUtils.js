/**
 * Gets the folder structure for a specific OPRC level
 * @param {string} level - The OPRC level ('Level1', 'Level2', 'Level3')
 * @returns {Promise<Object>} - Object containing years and their contents
 */
export async function getOprcStructure(level) {
  try {
    // In a real app, this would be an API call to your backend
    // For now, we'll return a mock structure based on the actual folder structure
    
    // Mock data structure based on the actual folder structure
    const mockData = {
      Level1: {
        '2023': [
          '2. IMO-I (Ports & OHAs) 13-17 Mar 23 Course Folder',
          '5. IMO-I (Ports & OHAs) 05-09 Jun 23 Course Folder',
          '7. IMO-I (Ports & OHAs) 28 Aug-01 Sep 23 Course Folder',
          '8. IMO-I (Ports And OHAs) 04-08 Dec 23 Course Folder',
          '9. IMO-I(ICG) 18-22 Dec 23 Course Folder'
        ],
        '2024': [
          '01.IMO LEVEL-I (PORTs & OHAs) 12-16 FEB 24',
          '03.IMO-I (STAKEHOLDERS) 01-05 JUL 24'
        ],
        '2025': [
          '1. 20-24 Jan 25',
          '2. 17-21 Mar 25 (Ports & OHAs)',
          '3. 24-28 Nov 25 (ICG)'
        ]
      },
      Level2: {
        '2022': [
          '2. IMO- II (18-22 Apr 22) TRG Report',
          '3. IMO-II (07-11 Nov 22) TRG Report'
        ],
        '2023': [
          '1. IMO-II (ICG) 20-24 Mar 23 Course Folder',
          '2. IMO-II (ICG) 11-15 SEP 23'
        ],
        '2024': [
          '01-05 Apr 24',
          '09-13 SEP 24',
          '10-14 Jun 24 by Ms OSCT'
        ],
        '2025': [
          '1. 19-23 May 25',
          '2. 15-19 Sep 25'
        ]
      },
      Level3: {
        '2022': [
          '2. IMO-III (27 -30 Jun 22) TRG Rreport',
          '3. IMO-III (19-22 Sep 22) TRG Report',
          '4. IMO- III (12-15 Dec 22) TRG Report'
        ],
        '2023': [
          '4. IMO- III (11-14 Dec 23)',
          '4. IMO- III (21 AUG TO 24 AUG 23)',
          '5. IMO-III (10-13 Apr 23) TRG Report'
        ],
        '2024': [
          // Add 2024 data as needed
        ],
        '2025': [
          // Add 2025 data as needed
        ]
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      years: Object.keys(mockData[level] || {}).sort((a, b) => b.localeCompare(a)), // Sort years in descending order
      documentsByYear: mockData[level] || {}
    };
  } catch (error) {
    console.error('Error fetching OPRC structure:', error);
    return { years: [], documentsByYear: {} };
  }
}

/**
 * Gets the file icon based on file extension
 * @param {string} fileName - The name of the file
 * @returns {string} - Emoji icon for the file type
 */
export function getFileIcon(fileName) {
  if (!fileName) return '📄';
  
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
    zip: '🗜️',
    rar: '🗜️',
    default: '📄',
  };
  
  return iconMap[ext] || iconMap.default;
}
