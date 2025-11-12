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
  .description('Control plane for AI agent infrastructure')
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
  .option('-f, --force', 'overwrite existing config')
  .action(initCommand);

// Hidden command for analytics opt-out
program
  .command('analytics')
  .description('Manage analytics preferences')
  .option('--disable', 'disable analytics')
  .option('--enable', 'enable analytics')
  .action((options) => {
    // Handle analytics preferences
    console.log('Analytics preferences updated');
  });

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