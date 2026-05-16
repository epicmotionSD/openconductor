#!/usr/bin/env node
/**
 * Prebuild script for Vercel deployment
 * Copies and builds the shared package into the API for serverless deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.resolve(__dirname, '..');
const sharedSrcDir = path.resolve(apiDir, '../shared/src');
const sharedDistDir = path.resolve(apiDir, 'node_modules/@openconductor/shared/dist');

console.log('Prebuild: Setting up shared package for Vercel...');

// Check if we're in Vercel (no access to ../shared)
const sharedExists = fs.existsSync(path.resolve(apiDir, '../shared'));

if (sharedExists) {
  console.log('Prebuild: Found shared package at ../shared, building it...');
  try {
    execSync('npm install && npm run build', {
      cwd: path.resolve(apiDir, '../shared'),
      stdio: 'inherit'
    });
    console.log('Prebuild: Shared package built successfully');
  } catch (err) {
    console.error('Prebuild: Failed to build shared package', err.message);
    process.exit(1);
  }
} else {
  console.log('Prebuild: No shared package at ../shared (Vercel deployment)');
  console.log('Prebuild: Creating inline shared package...');

  // Create the shared package structure in node_modules
  const sharedDir = path.resolve(apiDir, 'node_modules/@openconductor/shared');
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.mkdirSync(path.join(sharedDir, 'dist'), { recursive: true });

  // Create a minimal package.json
  const pkgJson = {
    name: '@openconductor/shared',
    version: '1.0.0',
    main: 'dist/index.js',
    types: 'dist/index.d.ts'
  };
  fs.writeFileSync(path.join(sharedDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

  // Copy the pre-built shared files if they exist in this package
  const localSharedDist = path.resolve(apiDir, 'shared-dist');
  if (fs.existsSync(localSharedDist)) {
    console.log('Prebuild: Copying pre-built shared dist...');
    copyDir(localSharedDist, path.join(sharedDir, 'dist'));
  } else {
    console.log('Prebuild: No pre-built shared files, creating stubs...');
    // Create minimal stubs for the shared types
    const indexContent = `
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = '1.0.0';
exports.MCP_PROTOCOL = 'stdio';
`;
    fs.writeFileSync(path.join(sharedDir, 'dist/index.js'), indexContent);
    fs.writeFileSync(path.join(sharedDir, 'dist/index.d.ts'), `
export declare const VERSION = "1.0.0";
export declare const MCP_PROTOCOL = "stdio";
export type MCPTransport = 'stdio' | 'websocket' | 'http';
export interface APIResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
`);
  }

  console.log('Prebuild: Inline shared package created');
}

console.log('Prebuild: Complete');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
