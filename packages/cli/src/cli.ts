#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { discoverCommand } from './commands/discover';
import { installCommand } from './commands/install';
import { listCommand } from './commands/list';
import { configCommand } from './commands/config';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.blue('  ___                   ____                _            _            ')}
${chalk.blue(' / _ \\ _ __   ___ _ __  / ___|___  _ __   __| |_   _  ___| |_ ___  _ __ ')}
${chalk.blue('| | | | \'_ \\ / _ \\ \'_ \\| |   / _ \\| \'_ \\ / _\` | | | |/ __| __/ _ \\| \'__|')}
${chalk.blue('| |_| | |_) |  __/ | | | |__| (_) | | | | (_| | |_| | (__| || (_) | |   ')}
${chalk.blue(' \\___/| .__/ \\___|_| |_|\\____\\___/|_| |_|\\__,_|\\__,_|\\___|\\__\\___/|_|   ')}
${chalk.blue('      |_|                                                             ')}

${chalk.gray('The Control Plane for AI Agent Systems')}
${chalk.gray('Discover, orchestrate, and monitor MCP servers')}
`;

program
  .name('openconductor')
  .description(banner)
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--api-url <url>', 'OpenConductor API URL', 'https://api.openconductor.ai')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().verbose) {
      process.env.VERBOSE = 'true';
    }
    if (thisCommand.opts().apiUrl) {
      process.env.OPENCONDUCTOR_API_URL = thisCommand.opts().apiUrl;
    }
  });

// Discover command - search for MCP servers
program
  .command('discover')
  .alias('search')
  .description('Discover and search MCP servers')
  .argument('[query]', 'Search query (server name, description, or tags)')
  .option('-c, --category <category>', 'Filter by category (memory, filesystem, database, api, custom)')
  .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
  .option('--verified', 'Show only verified servers')
  .option('-l, --limit <number>', 'Number of results to show', '10')
  .action(discoverCommand);

// Install command - install MCP server to Claude Desktop config
program
  .command('install')
  .description('Install MCP server to Claude Desktop configuration')
  .argument('<server>', 'Server name or ID to install')
  .option('--config <path>', 'Custom config file path')
  .option('--force', 'Force overwrite if server already exists')
  .option('--dry-run', 'Show what would be installed without making changes')
  .action(installCommand);

// List command - show installed servers
program
  .command('list')
  .alias('ls')
  .description('List installed MCP servers')
  .option('--config <path>', 'Custom config file path')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(listCommand);

// Config command - manage configuration
program
  .command('config')
  .description('Manage OpenConductor configuration')
  .option('--show', 'Show current configuration')
  .option('--edit', 'Open configuration in editor')
  .option('--reset', 'Reset to default configuration')
  .action(configCommand);

// Init command - initialize new project with MCP servers
program
  .command('init')
  .description('Initialize a new project with OpenConductor')
  .option('--template <template>', 'Project template (basic, advanced)')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Initializing new OpenConductor project...'));
    console.log(chalk.gray('This feature is coming soon!'));
  });

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str))
});

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log(chalk.gray('Run "openconductor --help" for available commands'));
  process.exit(1);
});

// Parse arguments
if (process.argv.length === 2) {
  // Show help if no command provided
  program.outputHelp();
} else {
  program.parse();
}

export default program;