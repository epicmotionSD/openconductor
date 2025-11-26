#!/usr/bin/env node

/**
 * OpenConductor Registry MCP Server
 *
 * Provides access to OpenConductor's registry of 120+ MCP servers through
 * the Model Context Protocol, enabling server discovery directly in Claude.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { OpenConductorAPIClient } from './api-client.js';
import { discoverServers, discoverServersSchema } from './tools/discover.js';
import { searchServers, searchServersSchema } from './tools/search.js';
import { getServerDetails, getServerDetailsSchema } from './tools/details.js';
import { getTrendingServers, getTrendingServersSchema } from './tools/trending.js';
import { getCategoryStats, getCategoryStatsSchema } from './tools/categories.js';
import { listStacks, listStacksSchema, getStackDetails, getStackDetailsSchema, shareStack, shareStackSchema } from './tools/stacks.js';

// Initialize API client
const apiClient = new OpenConductorAPIClient();

// Create MCP server
const server = new Server(
  {
    name: 'openconductor-registry',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'discover_servers',
        description: 'Discover MCP servers from the OpenConductor registry. Browse all 120+ available servers or filter by category and search query. Perfect for exploring what MCP servers are available.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Optional search query to filter servers by name or description',
            },
            category: {
              type: 'string',
              description: 'Filter by category (e.g., "database", "memory", "filesystem", "api", "productivity")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of servers to return (default: 10)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'search_servers',
        description: 'Search for MCP servers by name, description, or tags. Use this when you know what you\'re looking for (e.g., "database", "GitHub", "memory management").',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for finding MCP servers',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_server_details',
        description: 'Get detailed information about a specific MCP server including installation instructions, configuration requirements, and metadata. Use this after discovering a server to learn how to install and use it.',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'The unique slug identifier for the server (e.g., "openmemory", "github")',
            },
          },
          required: ['slug'],
        },
      },
      {
        name: 'get_trending_servers',
        description: 'Get the most popular and trending MCP servers based on GitHub stars, recent installs, and community activity. Great for discovering what the community is using.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of trending servers to return (default: 10)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'get_category_stats',
        description: 'Get statistics and overview of all MCP server categories including server counts, total stars, and install counts per category. Useful for understanding the MCP ecosystem.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_stacks',
        description: 'List all available MCP server stacks from OpenConductor. Stacks are curated collections of servers designed for specific use cases (coding, writing, data analysis, etc.) with system prompts that give Claude specialized capabilities. Perfect for discovering pre-configured workflows.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of stacks to return (default: 10)',
              default: 10,
            },
          },
        },
      },
      {
        name: 'get_stack_details',
        description: 'Get detailed information about a specific stack including all included servers, system prompt overview, installation instructions, and usage examples. Use this to learn about a stack before installing it.',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'The stack slug (e.g., "coder", "writer", "essential")',
            },
          },
          required: ['slug'],
        },
      },
      {
        name: 'share_stack',
        description: 'Generate shareable URLs and installation instructions for a stack. Great for recommending stacks to others or sharing on social media.',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'The stack slug to share',
            },
          },
          required: ['slug'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'discover_servers': {
        const validatedArgs = discoverServersSchema.parse(args);
        return await discoverServers(validatedArgs, apiClient);
      }

      case 'search_servers': {
        const validatedArgs = searchServersSchema.parse(args);
        return await searchServers(validatedArgs, apiClient);
      }

      case 'get_server_details': {
        const validatedArgs = getServerDetailsSchema.parse(args);
        return await getServerDetails(validatedArgs, apiClient);
      }

      case 'get_trending_servers': {
        const validatedArgs = getTrendingServersSchema.parse(args);
        return await getTrendingServers(validatedArgs, apiClient);
      }

      case 'get_category_stats': {
        const validatedArgs = getCategoryStatsSchema.parse(args);
        return await getCategoryStats(validatedArgs, apiClient);
      }

      case 'list_stacks': {
        const validatedArgs = listStacksSchema.parse(args);
        return await listStacks(validatedArgs, apiClient);
      }

      case 'get_stack_details': {
        const validatedArgs = getStackDetailsSchema.parse(args);
        return await getStackDetails(validatedArgs, apiClient);
      }

      case 'share_stack': {
        const validatedArgs = shareStackSchema.parse(args);
        return await shareStack(validatedArgs, apiClient);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('OpenConductor Registry MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
