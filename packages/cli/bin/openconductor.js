#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import updateNotifier from 'update-notifier';
import boxen from 'boxen';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Commands
import { discoverCommand } from '../src/commands/discover.js';
import { installCommand } from '../src/commands/install.js';
import { listCommand } from '../src/commands/list.js';
import { removeCommand } from '../src/commands/remove.js';
import { updateCommand } from '../src/commands/update.js';
import { initCommand } from '../src/commands/init.js';
import { analyticsCommand } from '../src/lib/analytics.js';
import { stackListCommand, stackInstallCommand, stackShareCommand, stackShowCommand } from '../src/commands/stack.js';
import { badgeCommand, listBadgeTemplates } from '../src/commands/badge.js';
import { achievementsCommand, shareAchievements } from '../src/commands/achievements.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Check for updates
const notifier = updateNotifier({ pkg });
if (notifier.update) {
  console.log(
    boxen(
      `Update available: ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\n` +
      `Run ${chalk.cyan('npm install -g @openconductor/cli')} to update`,
      { padding: 1, margin: 1, borderStyle: 'round' }
    )
  );
}

// Configure CLI
program
  .name('openconductor')
  .description('The npm for AI agent tools - install MCP servers without the JSON hell')
  .version(pkg.version);

// Commands
program
  .command('discover')
  .description('Search for MCP servers')
  .argument('[query]', 'search query')
  .option('-c, --category <category>', 'filter by category')
  .option('-t, --tags <tags...>', 'filter by tags')
  .option('-l, --limit <number>', 'number of results', '10')
  .action(discoverCommand);

program
  .command('install')
  .description('Install an MCP server')
  .argument('<server>', 'server name or slug')
  .option('--config <path>', 'custom config file path')
  .option('--port <port>', 'custom port number')
  .option('--dry-run', 'simulate installation without making changes')
  .option('-y, --yes', 'skip confirmation prompts')
  .action(installCommand);

program
  .command('list')
  .description('List installed MCP servers')
  .option('--config <path>', 'custom config file path')
  .action(listCommand);

program
  .command('remove')
  .alias('uninstall')
  .description('Remove an installed MCP server')
  .argument('<server>', 'server name or slug')
  .option('--config <path>', 'custom config file path')
  .option('-y, --yes', 'skip confirmation')
  .action(removeCommand);

program
  .command('update')
  .description('Update an installed MCP server')
  .argument('[server]', 'server name (or all if omitted)')
  .option('--config <path>', 'custom config file path')
  .action(updateCommand);

program
  .command('init')
  .description('Initialize OpenConductor configuration')
  .option('--config <path>', 'custom config file path')
  .option('-f, --force', 'overwrite existing config')
  .action(initCommand);

// Stack commands - curated server collections with system prompts
const stackCmd = program
  .command('stack')
  .description('Manage MCP server stacks (curated collections)');

stackCmd
  .command('list')
  .description('List all available stacks')
  .action(stackListCommand);

stackCmd
  .command('install <stack>')
  .description('Install all servers in a stack + system prompt')
  .option('-f, --force', 'reinstall already installed servers')
  .action(stackInstallCommand);

stackCmd
  .command('show <stack>')
  .description('Show details about a stack')
  .action(stackShowCommand);

stackCmd
  .command('share <stack>')
  .description('Generate shareable link for a stack')
  .action(stackShareCommand);

// Badge command - for developers to generate installation badges
program
  .command('badge <server>')
  .description('Generate installation badge for your MCP server')
  .option('--simple', 'Generate simple badge only')
  .option('--command', 'Generate command snippet only')
  .option('--full', 'Generate full installation section (recommended)')
  .action(badgeCommand);

program
  .command('badge-templates')
  .description('List all available badge templates')
  .action(listBadgeTemplates);

// Achievements command - gamification for users
program
  .command('achievements')
  .alias('badges')
  .description('View your achievements and progress')
  .option('--all', 'Show locked achievements')
  .action(achievementsCommand);

program
  .command('share-achievements')
  .description('Share your achievements (coming soon)')
  .action(shareAchievements);

// Hidden command for analytics opt-out
program
  .command('analytics')
  .description('Manage analytics preferences')
  .option('--disable', 'Disable anonymous analytics')
  .option('--enable', 'Enable anonymous analytics')
  .option('--status', 'Show analytics status')
  .option('--show', 'Show what data is collected')
  .action(async (options) => {
    await analyticsCommand(options);
  });

// Show better help when no command provided
if (process.argv.length === 2) {
  console.log(`
${chalk.bold.cyan('OpenConductor')} ${chalk.dim(`v${pkg.version}`)} - The npm for AI agent tools

${chalk.bold('Quick Start:')}
  ${chalk.cyan('openconductor stack list')}         ${chalk.dim('# See available stacks')}
  ${chalk.cyan('openconductor stack install coder')}  ${chalk.dim('# Install Coder stack')}
  ${chalk.cyan('openconductor discover database')}   ${chalk.dim('# Search for servers')}
  ${chalk.cyan('openconductor install github-mcp')}  ${chalk.dim('# Install a server')}

${chalk.bold('Get Help:')}
  ${chalk.cyan('openconductor --help')}              ${chalk.dim('# Show all commands')}
  ${chalk.cyan('openconductor <command> --help')}    ${chalk.dim('# Command-specific help')}

${chalk.bold('Learn More:')} ${chalk.blue.underline('https://openconductor.ai')}
  `);
  process.exit(0);
}

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n✖ Fatal error:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n✖ Unhandled rejection:'), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Parse CLI arguments
program.parse();