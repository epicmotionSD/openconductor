/**
 * Get Server Details Tool
 */

import { z } from 'zod';
import { OpenConductorAPIClient } from '../api-client.js';

export const getServerDetailsSchema = z.object({
  slug: z.string().describe('The unique slug identifier for the MCP server (e.g., "openmemory", "github")'),
});

export async function getServerDetails(
  args: z.infer<typeof getServerDetailsSchema>,
  apiClient: OpenConductorAPIClient
) {
  const { slug } = args;

  try {
    const server = await apiClient.getServerDetails(slug);

    const stars = server.github_stars ? `⭐ ${server.github_stars} stars` : '';
    const installs = server.install_count ? `📦 ${server.install_count} installs` : '';
    const verified = server.verified ? '✅ Verified' : '⚠️ Community';
    const tags = server.tags?.length ? `\nTags: ${server.tags.join(', ')}` : '';

    let installInstructions = `### Quick Install
\`\`\`bash
openconductor install ${server.slug}
\`\`\``;

    if (server.installation) {
      installInstructions += `\n\n### Manual Installation
Command: \`${server.installation.command}\``;

      if (server.installation.args?.length) {
        installInstructions += `\nArguments: ${server.installation.args.join(' ')}`;
      }

      if (server.installation.env) {
        installInstructions += `\n\nRequired Environment Variables:`;
        Object.entries(server.installation.env).forEach(([key, value]) => {
          installInstructions += `\n- \`${key}\`: ${value}`;
        });
      }
    }

    const details = `# ${server.name}

**Category:** ${server.category}
**Status:** ${verified}
**Author:** ${server.author}
${[stars, installs].filter(Boolean).join(' • ')}${tags}

## Description
${server.description}

${installInstructions}

## Links
- GitHub: ${server.github_url}
${server.npm_package ? `- NPM: https://www.npmjs.com/package/${server.npm_package}` : ''}
- OpenConductor: https://openconductor.ai/servers/${server.slug}

## Metadata
- Created: ${new Date(server.created_at).toLocaleDateString()}
- Last Updated: ${new Date(server.updated_at).toLocaleDateString()}
- Server ID: ${server.id}`;

    return {
      content: [
        {
          type: 'text',
          text: details,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching server details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
