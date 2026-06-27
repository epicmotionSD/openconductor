const fs = require('fs');
const path = require('path');

const dbDir = __dirname;
const files = [
  'seed-additional-servers.json', 
  'seed-more-servers.json', 
  'seed-specialized-servers.json'
];

let total = 0;

console.log('=== SEED FILE COUNTS ===');
files.forEach(f => {
  try {
    const filePath = path.join(dbDir, f);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(f + ':', data.length);
    total += data.length;
  } catch(e) {
    console.log(f + ': error -', e.message);
  }
});

// Check the TypeScript seed file
try {
  const tsPath = path.join(dbDir, 'seed-new-servers-2025.ts');
  const content = fs.readFileSync(tsPath, 'utf8');
  // Count export const newServers2025 array elements
  const match = content.match(/export const newServers2025[^=]*=\s*\[/);
  if (match) {
    // Count the objects in the array by counting slug definitions
    const slugMatches = content.match(/slug:\s*['"][^'"]+['"]/g);
    if (slugMatches) {
      console.log('seed-new-servers-2025.ts:', slugMatches.length);
      total += slugMatches.length;
    }
  }
} catch(e) {
  console.log('seed-new-servers-2025.ts: error -', e.message);
}

console.log('\nTotal in seed files:', total);
console.log('Currently in DB: 182');
console.log('Difference:', total - 182);
