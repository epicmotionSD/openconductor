import chalk from 'chalk';
import ora from 'ora';
import { api } from '../utils/api';
import type { MCPServerCategory } from '@openconductor/shared';
import { getAnalytics, matchQueryToSuggestions } from '../lib/ecosystem-analytics';

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

    // Track discovery event
    const analytics = getAnalytics();
    await analytics.trackDiscovery(query || '*', result.servers.length, {
      category: options.category,
      tags: options.tags,
      verified: options.verified
    });

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

    // Show ecosystem suggestions
    await showEcosystemSuggestions(query, analytics);

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

async function showEcosystemSuggestions(query: string | undefined, analytics: any) {
  const suggestions = matchQueryToSuggestions(query);

  if (suggestions.length > 0) {
    console.log(chalk.blue('\n💡 You might also be interested in:'));

    for (const suggestion of suggestions) {
      console.log(chalk.bold(`\n   ${suggestion.product}`));
      console.log(chalk.gray(`   ${suggestion.reason}`));
      console.log(chalk.cyan(`   ${suggestion.cta}`));
      console.log(chalk.gray(`   ${suggestion.url}`));
    }

    // Track ecosystem discovery (only track the first suggestion)
    if (suggestions[0]) {
      const destination = suggestions[0].product.toLowerCase().replace(/\s+/g, '');
      if (destination === 'flexabrain' || destination === 'flexasports' || destination.includes('x3o')) {
        await analytics.trackEcosystemReferral(
          destination.includes('x3o') ? 'x3o' : destination as any,
          {
            matched_keywords: suggestions[0].keywords.filter(k => query?.toLowerCase().includes(k)),
            query
          }
        );
      }
    }
  }
}