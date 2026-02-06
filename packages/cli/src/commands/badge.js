#!/usr/bin/env node

/**
 * OpenConductor Badge Command
 * Generate installation badges and snippets for MCP server developers
 */

import chalk from 'chalk';
import ora from 'ora';
import clipboardy from 'clipboardy';
import { logger } from '../utils/logger.js';
import { ApiClient } from '../lib/api-client.js';

const apiClient = new ApiClient();

/**
 * Generate badge markdown for a server
 */
export async function badgeCommand(serverSlug, options = {}) {
  const spinner = ora('Generating badge...').start();

  try {
    // Fetch server details using the getServer method
    const server = await apiClient.getServer(serverSlug);

    if (!server) {
      spinner.fail(`Server not found: ${serverSlug}`);
      logger.error('Make sure the server slug is correct.');
      logger.info('Search for servers: openconductor discover <query>');
      return;
    }

    spinner.succeed(`Found: ${server.name}`);

    // Generate badge URLs
    const badgeUrl = generateBadgeUrl(serverSlug);
    const serverUrl = `https://openconductor.ai/servers/${serverSlug}`;

    // Generate markdown snippets
    const snippets = {
      simple: generateSimpleBadge(badgeUrl, serverUrl),
      command: generateCommandSnippet(serverSlug, server.name),
      full: generateFullInstallSection(serverSlug, server.name, badgeUrl, serverUrl)
    };

    // Display options
    console.log('\n' + chalk.bold.blue('📦 Installation Badge Options'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    if (options.simple || !options.command && !options.full) {
      console.log(chalk.bold.green('Option 1: Simple Badge'));
      console.log(chalk.gray('Perfect for: Adding to existing README\n'));
      console.log(chalk.white(snippets.simple));
      console.log();
    }

    if (options.command || !options.simple && !options.full) {
      console.log(chalk.bold.green('Option 2: Command Snippet'));
      console.log(chalk.gray('Perfect for: Adding installation instructions\n'));
      console.log(chalk.white(snippets.command));
      console.log();
    }

    if (options.full) {
      console.log(chalk.bold.green('Option 3: Full Installation Section (Recommended)'));
      console.log(chalk.gray('Perfect for: Complete README installation section\n'));
      console.log(chalk.white(snippets.full));
      console.log();
    }

    // Copy to clipboard
    let snippetToCopy;
    if (options.full) {
      snippetToCopy = snippets.full;
    } else if (options.command) {
      snippetToCopy = snippets.command;
    } else {
      snippetToCopy = snippets.simple;
    }

    try {
      await clipboardy.write(snippetToCopy);
      console.log(chalk.green('✓ Copied to clipboard!'));
    } catch (err) {
      console.log(chalk.yellow('⚠ Could not copy to clipboard'));
    }

    // Show benefits
    console.log('\n' + chalk.bold.blue('🎯 Why Add This Badge?'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white('  • ') + chalk.cyan('Lower barrier to installation') + ' = more users');
    console.log(chalk.white('  • ') + chalk.cyan('Weekly install analytics') + ' (GitHub doesn\'t provide this)');
    console.log(chalk.white('  • ') + chalk.cyan('Featured placement') + ' in OpenConductor registry');
    console.log(chalk.white('  • ') + chalk.cyan('1-click installation') + ' for your users\n');

    // Show next steps
    console.log(chalk.bold.blue('📋 Next Steps:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white('  1. Add the snippet to your README.md'));
    console.log(chalk.white('  2. Commit and push to GitHub'));
    console.log(chalk.white('  3. Your server will be marked as "Featured" automatically'));
    console.log(chalk.white(`  4. View analytics at: ${serverUrl}\n`));

  } catch (error) {
    spinner.fail('Failed to generate badge');
    logger.error(error.message);

    if (error.message.includes('not found')) {
      logger.info(`Server "${serverSlug}" not found in registry`);
      logger.info('Tip: Search for your server: openconductor discover <query>');
    }
  }
}

/**
 * Generate shields.io badge URL
 */
function generateBadgeUrl(serverSlug) {
  const label = 'Install%20with';
  const message = 'OpenConductor';
  const color = 'blue';
  const style = 'for-the-badge';

  // SVG icon (base64 encoded)
  const icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMiA3TDEyIDEyTDIyIDdMMTIgMloiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yIDEyTDEyIDE3TDIyIDEyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMiAxN0wxMiAyMkwyMiAxNyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';

  return `https://img.shields.io/badge/${label}-${message}-${color}?style=${style}&logo=${encodeURIComponent(icon)}`;
}

/**
 * Generate simple badge markdown
 */
function generateSimpleBadge(badgeUrl, serverUrl) {
  return `[![Install with OpenConductor](${badgeUrl})](${serverUrl})`;
}

/**
 * Generate command snippet
 */
function generateCommandSnippet(serverSlug, serverName) {
  return `## Quick Install

Install **${serverName}** with one command using [OpenConductor](https://openconductor.ai):

\`\`\`bash
npx @openconductor/cli install ${serverSlug}
\`\`\`

Or install globally:

\`\`\`bash
npm install -g @openconductor/cli
openconductor install ${serverSlug}
\`\`\``;
}

/**
 * Generate full installation section
 */
function generateFullInstallSection(serverSlug, serverName, badgeUrl, serverUrl) {
  return `## Installation

### 🚀 Quick Install (Recommended)

The fastest way to install **${serverName}** is with [OpenConductor](https://openconductor.ai) - the npm for MCP servers:

\`\`\`bash
npx @openconductor/cli install ${serverSlug}
\`\`\`

OpenConductor will:
 - ✅ Automatically detect and install dependencies
 - ✅ Configure your MCP client config
 - ✅ Handle port conflicts and validation
 - ✅ Provide restart instructions for your MCP client

[![Install with OpenConductor](${badgeUrl})](${serverUrl})

### 📋 Manual Installation

<details>
<summary>Click to expand manual installation instructions</summary>

\`\`\`bash
# Add your manual installation steps here
\`\`\`

</details>`;
}

/**
 * List all available badge templates
 */
export async function listBadgeTemplates() {
  console.log('\n' + chalk.bold.blue('📦 Available Badge Templates'));
  console.log(chalk.gray('='.repeat(60)) + '\n');

  console.log(chalk.bold.green('1. Simple Badge'));
  console.log(chalk.gray('   Just the badge image with link'));
  console.log(chalk.cyan('   Usage: ') + chalk.white('openconductor badge <slug> --simple\n'));

  console.log(chalk.bold.green('2. Command Snippet'));
  console.log(chalk.gray('   Installation commands only'));
  console.log(chalk.cyan('   Usage: ') + chalk.white('openconductor badge <slug> --command\n'));

  console.log(chalk.bold.green('3. Full Installation Section'));
  console.log(chalk.gray('   Complete installation section with badge'));
  console.log(chalk.cyan('   Usage: ') + chalk.white('openconductor badge <slug> --full\n'));

  console.log(chalk.yellow('💡 Tip: ') + 'Run without flags to see all options');
}

export default badgeCommand;
