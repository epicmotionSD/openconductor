#!/usr/bin/env node

/**
 * Quick test script for the OpenConductor Registry MCP Server
 *
 * This script simulates Claude calling the MCP server tools.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('🚀 Testing OpenConductor Registry MCP Server\n');

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseData = '';

server.stdout.on('data', (data) => {
  responseData += data.toString();

  // Try to parse and display JSON responses
  const lines = responseData.split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const json = JSON.parse(line);
        console.log('📦 Response:', JSON.stringify(json, null, 2));
      } catch (e) {
        // Not JSON, ignore
      }
    }
  });
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Send initialize request
setTimeout(() => {
  console.log('📡 Sending initialize request...\n');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// List tools after 2 seconds
setTimeout(() => {
  console.log('\n📡 Requesting list of tools...\n');
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 2000);

// Exit after 5 seconds
setTimeout(() => {
  console.log('\n✅ Test complete!\n');
  server.kill();
  process.exit(0);
}, 5000);
