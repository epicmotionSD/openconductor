import { z } from 'zod';
import { OpenConductorAPIClient } from '../api-client.js';

export const listStacksSchema = z.object({
  limit: z.number().optional().default(10),
});

export const getStackDetailsSchema = z.object({
  slug: z.string(),
});

export const shareStackSchema = z.object({
  slug: z.string(),
});

/**
 * List all available stacks from OpenConductor
 */
export async function listStacks(
  args: z.infer<typeof listStacksSchema>,
  apiClient: OpenConductorAPIClient
) {
  try {
    const response = await apiClient.get('/stacks');
    const stacks = response.data.stacks.slice(0, args.limit);

    const stackList = stacks.map((stack: any) =>
      `${stack.icon} **${stack.name}** (${stack.slug})
  ${stack.tagline}
  ${stack.server_count} servers | ${stack.install_count} installs
  Install: openconductor stack install ${stack.slug}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# OpenConductor Stacks

${stackList}

**What are Stacks?**
Stacks are curated collections of MCP servers designed for specific use cases. Each stack includes:
- Pre-configured servers that work great together
- A system prompt that gives Claude a specialized persona
- Installation instructions and examples
- Ready to use in 10 seconds

**How to use:**
1. Install OpenConductor CLI: \`npm install -g @openconductor/cli\`
2. Install a stack: \`openconductor stack install <slug>\`
3. Paste the system prompt (auto-copied to clipboard) into Claude Desktop
4. Start using your specialized AI assistant!

Learn more: https://openconductor.ai/stacks`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to list stacks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get details about a specific stack
 */
export async function getStackDetails(
  args: z.infer<typeof getStackDetailsSchema>,
  apiClient: OpenConductorAPIClient
) {
  try {
    const response = await apiClient.get(`/stacks/${args.slug}`);
    const stack = response.data;

    const serverList = stack.servers.map((server: any, index: number) =>
      `${index + 1}. **${server.name}** ${server.github_stars ? `⭐ ${server.github_stars}` : ''}
   ${server.description}
   Repository: ${server.repository_url}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `# ${stack.icon} ${stack.name}

**${stack.tagline}**

${stack.description}

## Included Servers (${stack.servers.length})

${serverList}

## System Prompt

The ${stack.name} comes with a specialized system prompt that gives Claude:
- Understanding of available tools
- Best practices for using this stack
- Step-by-step workflow guidance
- Example prompts to get started

## Installation

\`\`\`bash
# Install the stack
openconductor stack install ${stack.slug}

# The system prompt will be automatically copied to your clipboard
# Paste it into Claude Desktop's custom instructions
\`\`\`

## Usage Examples

After installing, try asking Claude:
${stack.slug === 'coder' ? `
- "Help me design a database schema for a blog platform"
- "Debug this Python function and suggest improvements"
- "Search for React best practices and implement them"
` : stack.slug === 'writer' ? `
- "Research the latest trends in AI and write a blog post"
- "Help me outline a technical article about databases"
- "Fact-check this draft and suggest improvements"
` : stack.slug === 'essential' ? `
- "Find information about Node.js performance optimization"
- "Help me organize my project files"
- "Remember this API endpoint for future reference"
` : ''}

## Stats

- Servers: ${stack.servers.length}
- Total Installs: ${stack.install_count}
- Share: https://openconductor.ai/s/${stack.short_code}

Learn more: https://openconductor.ai/stacks/${stack.slug}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to get stack details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Share a stack
 */
export async function shareStack(
  args: z.infer<typeof shareStackSchema>,
  apiClient: OpenConductorAPIClient
) {
  try {
    const response = await apiClient.get(`/stacks/${args.slug}`);
    const stack = response.data;

    return {
      content: [
        {
          type: 'text',
          text: `# Share ${stack.icon} ${stack.name}

**Short URL:** https://openconductor.ai/s/${stack.short_code}

**Install Command:**
\`\`\`bash
openconductor stack install ${stack.slug}
\`\`\`

**For Social Media:**
🚀 Check out the ${stack.name} for Claude! ${stack.tagline}

Install in 10 seconds:
openconductor.ai/s/${stack.short_code}

#AI #MCP #Claude #OpenConductor

**For Teams:**
Install the ${stack.name} to get started:

1. Install CLI: npm install -g @openconductor/cli
2. Install stack: openconductor stack install ${stack.slug}
3. The system prompt will be copied to your clipboard
4. Paste into Claude Desktop > Custom Instructions

This gives your team a ${stack.tagline.toLowerCase()} setup instantly.

Learn more: https://openconductor.ai/stacks/${stack.slug}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to share stack: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
