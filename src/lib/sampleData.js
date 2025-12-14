// src/lib/sampleData.js
export default {
  kpis: {
    indexedFiles: 1243,
    storageUsedGB: 42,
    starred: 12,
    drivesMonitored: 3
  },

  // chart: monthly files added
  lineChart: {
    labels: ['May','Jun','Jul','Aug','Sep','Oct','Nov'],
    datasets: [
      {
        label: 'Files added',
        data: [12, 34, 22, 45, 38, 52, 31],
        fill: false,
        tension: 0.3,
        borderColor: 'var(--ocean)'
      }
    ]
  },

  // file type distribution (pie)
  pieChart: {
    labels: ['PDF', 'Docs', 'Images', 'Spreadsheets', 'Videos'],
    datasets: [
      {
        label: 'Types',
        data: [320, 210, 180, 110, 50],
        backgroundColor: [
          'rgba(28,126,235,0.9)', // ocean
          'rgba(15,76,129,0.9)',  // coastal
          'rgba(107, 181, 255,0.9)',
          'rgba(93, 138, 255,0.9)',
          'rgba(150, 200, 255,0.9)'
        ],
        hoverOffset: 6
      }
    ]
  },

  recentFiles: [
    { id: 1, name: 'Coastal_Patrol_Report_Aug.pdf', type: 'PDF', date: '2025-08-12', path: 'C:/Vault/Reports/Coastal_Patrol_Report_Aug.pdf' },
    { id: 2, name: 'Rescue_SOP_v3.docx', type: 'DOCX', date: '2025-07-03', path: 'D:/SOP/Rescue_SOP_v3.docx' },
    { id: 3, name: 'Drone_Capture_15.jpg', type: 'Image', date: '2025-06-22', path: 'E:/Media/Drone_Capture_15.jpg' },
    { id: 4, name: 'Ammunition_Inventory.xlsx', type: 'XLSX', date: '2025-05-11', path: 'C:/Vault/Inventory/Ammunition_Inventory.xlsx' },
    { id: 5, name: 'Harbor_Map_v2.pdf', type: 'PDF', date: '2025-04-20', path: 'C:/Vault/Maps/Harbor_Map_v2.pdf' }
  ],

  starred: [
    { id: 's1', name: 'TopSecret_Protocol.pdf', type: 'PDF', date: '2025-09-01' },
    { id: 's2', name: 'Command_Overview.docx', type: 'DOCX', date: '2025-08-28' },
    { id: 's3', name: 'Rescue_Checklist.pdf', type: 'PDF', date: '2025-07-15' }
  ]
}
