#!/usr/bin/env node

/**
 * Trinity Command Center MCP Server
 *
 * Three-namespace MCP server for the OpenConductor Command Center.
 * Connects via stdio transport — designed for Claude Desktop integration.
 *
 *   Oracle    (3 tools) — read-only queries & analysis
 *   Sentinel  (3 tools) — monitoring & anomaly detection
 *   Sage      (5 tools) — write operations & synthesis
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerOracleTools } from './tools/oracle.js';
import { registerSentinelTools } from './tools/sentinel.js';
import { registerSageTools } from './tools/sage.js';

const server = new McpServer({
  name: 'trinity-cc',
  version: '0.1.0',
});

registerOracleTools(server);
registerSentinelTools(server);
registerSageTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
