/**
 * Search MCP Servers Tool
 */

import { z } from 'zod';
import { OpenConductorAPIClient } from '../api-client.js';

export const searchServersSchema = z.object({
  query: z.string().describe('Search query for finding MCP servers by name, description, or tags'),
  limit: z.number().optional().default(10).describe('Maximum number of results to return (default: 10)'),
});

export async function searchServers(
  args: z.infer<typeof searchServersSchema>,
  apiClient: OpenConductorAPIClient
) {
  const { query, limit } = args;

  try {
    const result = await apiClient.searchServers(query, limit);

    if (result.servers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No MCP servers found matching "${query}". Try a different search term or use discover_servers to browse all available servers.`,
          },
        ],
      };
    }

    const serversText = result.servers.map((server, index) => {
      const tags = server.tags?.length ? server.tags.join(', ') : '';
      const stars = server.github_stars ? `⭐ ${server.github_stars}` : '';
      const verified = server.verified ? '✅ Verified' : '';

      return `${index + 1}. **${server.name}**
   Slug: ${server.slug}
   Category: ${server.category}
   ${server.description}
   ${tags ? `Tags: ${tags}` : ''}
   ${[stars, verified].filter(Boolean).join(' • ')}

   Quick Install:
   \`\`\`bash
   openconductor install ${server.slug}
   \`\`\``;
    }).join('\n\n');

    const summary = `Found ${result.total} server${result.total === 1 ? '' : 's'} matching "${query}"\n\n${serversText}`;

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
          text: `Error searching servers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
