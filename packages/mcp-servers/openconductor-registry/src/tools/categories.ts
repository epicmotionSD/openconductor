/**
 * Get Category Statistics Tool
 *
 * Reads category counts the API already aggregates in
 * `data.filters.availableCategories` on every server list response.
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

    const sorted = [...categories].sort((a, b) => b.count - a.count);

    const categoriesText = sorted
      .map((cat) => `**${cat.category}** — ${cat.count} server${cat.count === 1 ? '' : 's'}`)
      .join('\n');

    const totalServers = categories.reduce((sum, cat) => sum + cat.count, 0);

    const summary = `📊 **MCP Server Categories Overview**

Total Servers: ${totalServers}
Categories: ${categories.length}

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
