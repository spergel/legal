const fs = require('fs');
const path = require('path');

// Create public/data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate empty data files
const files = [
  'all_events_combined.json',
  'locations.json',
  'communities.json'
];

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const emptyData = file === 'all_events_combined.json' ? [] : {};
  fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2));
  console.log(`Created ${file}`);
}); 