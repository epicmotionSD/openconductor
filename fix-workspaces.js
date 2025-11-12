const fs = require('fs');
const path = require('path');

const packages = ['api', 'cli', 'frontend'];

packages.forEach(pkg => {
  const pkgPath = path.join('packages', pkg, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const content = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Fix dependencies
    if (content.dependencies?.['@openconductor/shared']) {
      content.dependencies['@openconductor/shared'] = 'workspace:*';
    }
    if (content.devDependencies?.['@openconductor/shared']) {
      content.devDependencies['@openconductor/shared'] = 'workspace:*';
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(content, null, 2));
    console.log(`Fixed ${pkg}`);
  }
});
