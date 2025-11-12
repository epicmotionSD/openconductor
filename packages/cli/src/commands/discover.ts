import chalk from 'chalk';
import ora from 'ora';
import { api } from '../utils/api';
import type { MCPServerCategory } from '@openconductor/shared';

interface DiscoverOptions {
  category?: MCPServerCategory;
  tags?: string;
  verified?: boolean;
  limit?: string;
}

export async function discoverCommand(query?: string, options: DiscoverOptions = {}) {
  const spinner = ora('Searching MCP servers...').start();
  
  try {
    // Parse options
    const searchParams = {
      query,
      category: options.category,
      tags: options.tags?.split(',').map(tag => tag.trim()),
      verified: options.verified,
      limit: parseInt(options.limit || '10'),
      offset: 0
    };

    const result = await api.searchServers(searchParams);
    spinner.stop();

    if (result.servers.length === 0) {
      console.log(chalk.yellow('No servers found matching your criteria.'));
      console.log(chalk.gray('Try broadening your search or removing filters.'));
      return;
    }

    // Display header
    console.log(chalk.bold(`\n🔍 Found ${result.servers.length} MCP server${result.servers.length === 1 ? '' : 's'}`));
    if (result.hasMore) {
      console.log(chalk.gray(`Showing first ${result.servers.length} results`));
    }
    console.log();

    // Display servers
    for (const server of result.servers) {
      displayServer(server);
    }

    // Show install hint
    console.log(chalk.gray('\n💡 To install a server: openconductor install <server-name>'));
    console.log(chalk.gray('💡 For more details: openconductor discover <server-name>'));

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Error discovering servers:'), error.message);
    process.exit(1);
  }
}

function displayServer(server: any) {
  const categoryColors = {
    memory: chalk.blue,
    filesystem: chalk.green,
    database: chalk.yellow,
    api: chalk.magenta,
    custom: chalk.cyan
  };

  const categoryColor = categoryColors[server.category] || chalk.gray;
  const verifiedBadge = server.verified ? chalk.green('✓ VERIFIED') : '';

  console.log(chalk.bold(server.name) + ' ' + verifiedBadge);
  console.log(chalk.gray(server.description));
  console.log(
    categoryColor(`📁 ${server.category}`) + '  ' +
    chalk.gray(`⭐ ${server.stats.githubStars}`) + '  ' +
    chalk.gray(`📦 ${server.stats.npmDownloads} downloads`)
  );
  
  if (server.tags && server.tags.length > 0) {
    console.log(chalk.gray('🏷️  ' + server.tags.join(', ')));
  }
  
  console.log(chalk.blue(`🔗 ${server.repository}`));
  console.log();
}