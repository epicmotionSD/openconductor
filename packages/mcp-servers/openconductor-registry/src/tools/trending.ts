/**
 * Get Trending Servers Tool
 */

import { z } from 'zod';
import { OpenConductorAPIClient } from '../api-client.js';

export const getTrendingServersSchema = z.object({
  limit: z.number().optional().default(10).describe('Maximum number of trending servers to return (default: 10)'),
});

export async function getTrendingServers(
  args: z.infer<typeof getTrendingServersSchema>,
  apiClient: OpenConductorAPIClient
) {
  const { limit } = args;

  try {
    const servers = await apiClient.getTrendingServers(limit);

    if (servers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No trending servers available at the moment.',
          },
        ],
      };
    }

    const serversText = servers.map((server, index) => {
      const stars = server.github_stars ? `⭐ ${server.github_stars}` : '';
      const installs = server.install_count ? `📦 ${server.install_count} installs` : '';
      const verified = server.verified ? '✅' : '';

      return `${index + 1}. **${server.name}** ${verified}
   ${server.description}
   Category: ${server.category}
   ${[stars, installs].filter(Boolean).join(' • ')}
   \`openconductor install ${server.slug}\``;
    }).join('\n\n');

    const summary = `🔥 **Trending MCP Servers**

These are the most popular MCP servers right now based on GitHub stars, recent installs, and community activity:

${serversText}

💡 Tip: Use \`get_server_details\` with the server slug to learn more about any server.`;

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
          text: `Error fetching trending servers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
