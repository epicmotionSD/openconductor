/**
 * Discover MCP Servers Tool
 */

import { z } from 'zod';
import { OpenConductorAPIClient } from '../api-client.js';

export const discoverServersSchema = z.object({
  query: z.string().optional().describe('Optional search query to filter servers'),
  category: z.string().optional().describe('Filter by category (e.g., "database", "memory", "filesystem")'),
  limit: z.number().optional().default(10).describe('Maximum number of servers to return (default: 10)'),
});

export async function discoverServers(
  args: z.infer<typeof discoverServersSchema>,
  apiClient: OpenConductorAPIClient
) {
  const { query, category, limit } = args;

  try {
    const result = await apiClient.discoverServers({
      query,
      category,
      limit,
      offset: 0,
    });

    if (result.servers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No MCP servers found matching your criteria. Try adjusting your search query or category filter.',
          },
        ],
      };
    }

    const serversText = result.servers.map((server, index) => {
      const stars = server.github_stars ? `⭐ ${server.github_stars}` : '';
      const installs = server.install_count ? `📦 ${server.install_count} installs` : '';
      const verified = server.verified ? '✅ Verified' : '';

      return `${index + 1}. **${server.name}** (${server.slug})
   Category: ${server.category}
   ${server.description}
   ${[stars, installs, verified].filter(Boolean).join(' • ')}
   Install: \`openconductor install ${server.slug}\`
   GitHub: ${server.github_url}`;
    }).join('\n\n');

    const summary = `Found ${result.total} MCP servers${query ? ` matching "${query}"` : ''}${category ? ` in category "${category}"` : ''}\n\n${serversText}`;

    return {
      content: [
        {
          type: 'text',
          text: summary,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error discovering servers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
