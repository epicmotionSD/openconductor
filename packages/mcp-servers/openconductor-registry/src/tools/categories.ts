/**
 * Get Category Statistics Tool
 */

import { z } from 'zod';
import { OpenConductorAPIClient } from '../api-client.js';

export const getCategoryStatsSchema = z.object({});

export async function getCategoryStats(
  args: z.infer<typeof getCategoryStatsSchema>,
  apiClient: OpenConductorAPIClient
) {
  try {
    const categories = await apiClient.getCategoryStats();

    if (categories.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No category statistics available.',
          },
        ],
      };
    }

    const categoriesText = categories
      .sort((a, b) => b.count - a.count)
      .map((cat) => {
        return `**${cat.category}**
   Servers: ${cat.count}
   Total Stars: ⭐ ${cat.total_stars.toLocaleString()}
   Total Installs: 📦 ${cat.total_installs.toLocaleString()}`;
      })
      .join('\n\n');

    const totalServers = categories.reduce((sum, cat) => sum + cat.count, 0);
    const totalStars = categories.reduce((sum, cat) => sum + cat.total_stars, 0);

    const summary = `📊 **MCP Server Categories Overview**

Total Servers: ${totalServers}
Total GitHub Stars: ⭐ ${totalStars.toLocaleString()}

${categoriesText}

💡 Use \`discover_servers\` with a category filter to explore servers in a specific category.`;

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
          text: `Error fetching category statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
