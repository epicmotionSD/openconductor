#!/usr/bin/env node

/**
 * SportIntel MCP Server
 *
 * Provides sports data, fantasy insights, and betting analysis through
 * the Model Context Protocol, enabling AI-powered sports intelligence directly in Claude.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ESPNProvider } from './providers/espn.js';
import { getLiveScores, getLiveScoresSchema } from './tools/live-scores.js';
import { getStandings, getStandingsSchema } from './tools/standings.js';
import { searchTeams, searchTeamsSchema } from './tools/team-search.js';

// Initialize providers
const espn = new ESPNProvider();

// Create MCP server
const server = new Server(
  {
    name: 'sportintel',
    version: '1.0.0',
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
        name: 'get_live_scores',
        description: 'Get live scores and game results for NBA, NFL, MLB, NHL, or MLS. Shows current games in progress, completed games, and upcoming games with scores, records, and status.',
        inputSchema: {
          type: 'object',
          properties: {
            sport: {
              type: 'string',
              enum: ['basketball', 'football', 'baseball', 'hockey', 'soccer'],
              description: 'Sport type to get scores for',
            },
            league: {
              type: 'string',
              description: 'League abbreviation (NBA, NFL, MLB, NHL, MLS). Defaults to main league for sport.',
            },
          },
          required: ['sport'],
        },
      },
      {
        name: 'get_standings',
        description: 'Get current standings for any major sports league including wins, losses, win percentage, and games behind. Organized by division/conference.',
        inputSchema: {
          type: 'object',
          properties: {
            sport: {
              type: 'string',
              enum: ['basketball', 'football', 'baseball', 'hockey', 'soccer'],
              description: 'Sport type',
            },
            league: {
              type: 'string',
              description: 'League abbreviation (NBA, NFL, MLB, NHL, MLS)',
            },
          },
          required: ['sport'],
        },
      },
      {
        name: 'search_teams',
        description: 'Search for teams by name or city across all major sports leagues. Useful for finding team IDs and basic info before getting detailed schedules or stats.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Team name or city to search (e.g., "Lakers", "Boston", "Cowboys")',
            },
            sport: {
              type: 'string',
              enum: ['basketball', 'football', 'baseball', 'hockey', 'soccer'],
              description: 'Filter by sport type',
            },
            league: {
              type: 'string',
              description: 'Filter by league (NBA, NFL, MLB, NHL, MLS)',
            },
          },
          required: ['query'],
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
      case 'get_live_scores': {
        const validatedArgs = getLiveScoresSchema.parse(args);
        return await getLiveScores(validatedArgs, espn);
      }

      case 'get_standings': {
        const validatedArgs = getStandingsSchema.parse(args);
        return await getStandings(validatedArgs, espn);
      }

      case 'search_teams': {
        const validatedArgs = searchTeamsSchema.parse(args);
        return await searchTeams(validatedArgs, espn);
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
  console.error('SportIntel MCP Server running on stdio');
  console.error('Providing sports data, fantasy insights, and betting analysis');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
