#!/usr/bin/env node

/**
 * Convert social-preview.svg to social-preview.png
 * Uses native Node.js and canvas
 */

const fs = require('fs');
const path = require('path');

// Try using canvas if available
let Canvas;
try {
  Canvas = require('canvas');
} catch (err) {
  console.log('Canvas not installed. Installing...');
  require('child_process').execSync('npm install canvas', { stdio: 'inherit' });
  Canvas = require('canvas');
}

const { createCanvas, loadImage } = Canvas;

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '../packages/frontend/public/social-preview.svg');
  const pngPath = path.join(__dirname, '../packages/frontend/public/social-preview.png');

  console.log('📖 Reading SVG file...');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('🎨 Converting to PNG...');

  // Create canvas
  const canvas = createCanvas(1280, 640);
  const ctx = canvas.getContext('2d');

  // Load and draw the SVG
  const img = await loadImage(svgBuffer);
  ctx.drawImage(img, 0, 0, 1280, 640);

  // Save as PNG
  console.log('💾 Saving PNG...');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(pngPath, buffer);

  console.log('✅ Success! Created: ' + pngPath);
  console.log('📏 Dimensions: 1280x640 pixels');
  console.log('📦 Size: ' + (buffer.length / 1024).toFixed(2) + ' KB');
  console.log('\n🚀 Next step: Upload to GitHub Settings → Social preview');
}

convertSvgToPng().catch(err => {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Alternative: Use the browser converter at http://localhost:3000/convert-social-preview.html');
  console.log('   Or use online tool: https://svgtopng.com/');
  process.exit(1);
});
