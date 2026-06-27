#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from 'canvas';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICON_SVG = path.join(ROOT, 'assets/brand/icon-conductor.svg');
const OG_SVG = path.join(ROOT, 'assets/brand/og.svg');
const OUT_DIR = path.join(ROOT, 'packages/frontend/public');

async function rasterize(svgPath, w, h, outPath) {
  const svg = await fs.readFile(svgPath);
  const img = await loadImage(svg);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  await fs.writeFile(outPath, canvas.toBuffer('image/png'));
  console.log(`  ${path.relative(ROOT, outPath)}  ${w}x${h}`);
}

function pngToIco(pngBuffer, size) {
  // Minimal PNG-in-ICO container: 6B header + 16B entry + PNG payload.
  const HEADER = 6;
  const ENTRY = 16;
  const offset = HEADER + ENTRY;
  const ico = Buffer.alloc(offset + pngBuffer.length);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(1, 4);
  ico.writeUInt8(size >= 256 ? 0 : size, 6);
  ico.writeUInt8(size >= 256 ? 0 : size, 7);
  ico.writeUInt8(0, 8);
  ico.writeUInt8(0, 9);
  ico.writeUInt16LE(1, 10);
  ico.writeUInt16LE(32, 12);
  ico.writeUInt32LE(pngBuffer.length, 14);
  ico.writeUInt32LE(offset, 18);
  pngBuffer.copy(ico, offset);
  return ico;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log('Rasterizing brand SVGs:');

  await rasterize(ICON_SVG, 192, 192, path.join(OUT_DIR, 'icon-192.png'));
  await rasterize(ICON_SVG, 512, 512, path.join(OUT_DIR, 'icon-512.png'));
  await rasterize(ICON_SVG, 180, 180, path.join(OUT_DIR, 'apple-touch-icon.png'));
  await rasterize(OG_SVG, 1200, 630, path.join(OUT_DIR, 'og-image.png'));

  const svg = await fs.readFile(ICON_SVG);
  const img = await loadImage(svg);
  const c = createCanvas(32, 32);
  c.getContext('2d').drawImage(img, 0, 0, 32, 32);
  const ico = pngToIco(c.toBuffer('image/png'), 32);
  const favPath = path.join(OUT_DIR, 'favicon.ico');
  await fs.writeFile(favPath, ico);
  console.log(`  ${path.relative(ROOT, favPath)}  32x32 (PNG-in-ICO)`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
