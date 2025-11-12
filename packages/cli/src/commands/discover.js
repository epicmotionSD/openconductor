import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { ApiClient } from '../lib/api-client.js';
import { logger } from '../utils/logger.js';

export async function discoverCommand(query, options) {
  const spinner = ora('Searching MCP servers...').start();
  
  try {
    const api = new ApiClient();
    
    // Build search params
    const params = {
      q: query || '',
      limit: parseInt(options.limit, 10),
    };
    
    if (options.category) {
      params.category = options.category;
    }
    
    if (options.tags) {
      params.tags = options.tags;
    }

    // Search registry using our enterprise API
    const results = await api.searchServers(params);
    
    spinner.stop();
    
    if (results.servers.length === 0) {
      logger.warn('No servers found matching your query.');
      console.log();
      logger.info('Try one of these options:');
      logger.progress('Browse all servers: ' + logger.code('openconductor discover'));
      logger.progress('Search by category: ' + logger.code('openconductor discover --category memory'));
      logger.progress('View trending: ' + logger.code('openconductor trending'));
      logger.progress('Web interface: ' + logger.link('https://openconductor.ai/discover'));
      console.log();
      
      // Show suggestions if we have any
      if (results.suggestions && results.suggestions.length > 0) {
        logger.info('Did you mean:');
        results.suggestions.forEach(suggestion => {
          logger.progress(logger.code(`openconductor discover "${suggestion}"`));
        });
        console.log();
      }
      return;
    }

    // Display results in a beautiful table
    console.log();
    logger.header(`Found ${results.servers.length} servers`);
    
    const table = new Table({
      head: [
        chalk.cyan('Server'),
        chalk.cyan('Category'), 
        chalk.cyan('⭐ Stars'),
        chalk.cyan('📦 Installs'),
        chalk.cyan('Description')
      ],
      colWidths: [25, 15, 10, 12, 50],
      wordWrap: true,
      style: {
        head: [],
        border: ['gray']
      }
    });

    results.servers.forEach((server) => {
      const categoryIcon = logger.categoryIcon(server.category);
      const starsFormatted = logger.formatNumber(server.stats.stars);
      const installsFormatted = logger.formatNumber(server.stats.installs);
      
      table.push([
        chalk.bold(server.name) + (server.verified ? chalk.green(' ✓') : ''),
        `${categoryIcon} ${server.category}`,
        starsFormatted,
        installsFormatted,
        server.tagline || server.description?.substring(0, 47) + '...'
      ]);
    });

    console.log(table.toString());
    console.log();

    // Show filters applied
    if (query || options.category || options.tags) {
      console.log(chalk.dim('Filters applied:'));
      if (query) console.log(chalk.dim(`  Query: "${query}"`));
      if (options.category) console.log(chalk.dim(`  Category: ${options.category}`));
      if (options.tags) console.log(chalk.dim(`  Tags: ${options.tags.join(', ')}`));
      console.log();
    }

    // Interactive menu
    await showInteractiveMenu(api, results.servers);

  } catch (error) {
    spinner.stop();
    logger.error('Failed to search servers:', error.message);
    
    if (error.message.includes('unreachable')) {
      logger.info('Registry temporarily unavailable. Try again in a moment.');
      logger.progress('Or browse servers at: ' + logger.link('https://openconductor.ai'));
    } else if (error.response?.status === 503) {
      logger.info('Registry is under maintenance. Try again in a few minutes.');
    }
    
    process.exit(1);
  }
}

async function showInteractiveMenu(api, servers) {
  const choices = [
    { name: '🚀 Install a server', value: 'install' },
    { name: '📋 View server details', value: 'details' },
    { name: '🔍 Refine search', value: 'refine' },
    { name: '📈 Show trending servers', value: 'trending' },
    { name: '📂 Browse by category', value: 'categories' },
    { name: '🚪 Exit', value: 'exit' }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices,
      pageSize: 10
    }
  ]);

  switch (action) {
    case 'install':
      await handleInstallFlow(servers);
      break;
    case 'details':
      await handleDetailsFlow(api, servers);
      break;
    case 'refine':
      await handleRefineSearch();
      break;
    case 'trending':
      await handleTrending(api);
      break;
    case 'categories':
      await handleCategories(api);
      break;
    case 'exit':
    default:
      logger.info('Happy building! 🚀');
      break;
  }
}

async function handleInstallFlow(servers) {
  const { server } = await inquirer.prompt([
    {
      type: 'list',
      name: 'server',
      message: 'Select server to install:',
      choices: servers.map(s => ({
        name: `${s.name} - ${s.tagline} ${s.verified ? chalk.green('✓') : ''}`,
        value: s.slug
      })),
      pageSize: 10
    }
  ]);
  
  // Import and call install command
  const { installCommand } = await import('./install.js');
  await installCommand(server, {});
}

async function handleDetailsFlow(api, servers) {
  const { server } = await inquirer.prompt([
    {
      type: 'list',
      name: 'server', 
      message: 'Select server to view details:',
      choices: servers.map(s => ({
        name: `${s.name} - ${logger.formatNumber(s.stats.stars)} stars`,
        value: s.slug
      })),
      pageSize: 10
    }
  ]);
  
  // Show detailed info
  const spinner = ora('Fetching server details...').start();
  const details = await api.getServer(server);
  spinner.stop();

  await displayServerDetails(details);
}

async function handleRefineSearch() {
  const questions = [
    {
      type: 'input',
      name: 'query',
      message: 'Enter search query:'
    },
    {
      type: 'list',
      name: 'category',
      message: 'Filter by category:',
      choices: [
        { name: 'All categories', value: null },
        { name: '🧠 Memory & State', value: 'memory' },
        { name: '📁 File System', value: 'filesystem' },
        { name: '🗄️ Databases', value: 'database' },
        { name: '🔌 API Integration', value: 'api' },
        { name: '🔍 Search', value: 'search' },
        { name: '💬 Communication', value: 'communication' },
        { name: '📊 Monitoring', value: 'monitoring' },
        { name: '⚒️ Development', value: 'development' },
        { name: '🔧 Custom', value: 'custom' }
      ]
    },
    {
      type: 'input',
      name: 'limit',
      message: 'Number of results:',
      default: '10',
      validate: (input) => {
        const num = parseInt(input);
        return (num > 0 && num <= 50) || 'Please enter a number between 1 and 50';
      }
    }
  ];

  const answers = await inquirer.prompt(questions);
  
  // Re-run discover with new parameters
  const newOptions = {
    category: answers.category,
    limit: answers.limit
  };
  
  await discoverCommand(answers.query, newOptions);
}

async function handleTrending(api) {
  const spinner = ora('Fetching trending servers...').start();
  
  try {
    const trending = await api.getTrending('7d');
    spinner.stop();
    
    if (trending.servers.length === 0) {
      logger.info('No trending servers found for the past 7 days.');
      return;
    }

    logger.header('🔥 Trending Servers (7 days)');
    
    const table = new Table({
      head: [
        chalk.cyan('Rank'),
        chalk.cyan('Server'),
        chalk.cyan('Growth'),
        chalk.cyan('⭐ Stars'),
        chalk.cyan('Category')
      ],
      colWidths: [8, 25, 15, 10, 15],
      style: { head: [], border: ['gray'] }
    });

    trending.servers.forEach((server, index) => {
      const rank = (index + 1).toString();
      const growth = server.growth.percentage > 0 
        ? chalk.green(`+${server.growth.percentage}%`)
        : chalk.gray('0%');
      
      table.push([
        chalk.yellow(rank),
        chalk.bold(server.name) + (server.verified ? chalk.green(' ✓') : ''),
        growth,
        logger.formatNumber(server.stats.stars),
        `${logger.categoryIcon(server.category)} ${server.category}`
      ]);
    });

    console.log(table.toString());
    console.log();
    logger.info('Install any server with: ' + logger.code('openconductor install <server-name>'));
    console.log();
    
  } catch (error) {
    spinner.stop();
    logger.error('Failed to fetch trending servers:', error.message);
  }
}

async function handleCategories(api) {
  const spinner = ora('Loading categories...').start();
  
  try {
    const categories = await api.getCategories();
    spinner.stop();
    
    logger.header('📂 Server Categories');
    
    const choices = categories.categories.map(cat => ({
      name: `${cat.icon} ${cat.displayName} (${cat.count} servers) - ${cat.description}`,
      value: cat.name
    }));

    const { selectedCategory } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCategory',
        message: 'Select category to explore:',
        choices,
        pageSize: 10
      }
    ]);

    // Show servers in selected category
    await discoverCommand('', { category: selectedCategory, limit: '20' });
    
  } catch (error) {
    spinner.stop();
    logger.error('Failed to load categories:', error.message);
  }
}

async function displayServerDetails(server) {
  console.log();
  logger.header(`${server.name} ${server.verified ? chalk.green('✓ Verified') : ''}`);
  
  if (server.tagline) {
    console.log(chalk.dim(server.tagline));
    console.log();
  }
  
  console.log(chalk.bold('Description:'));
  console.log(server.description);
  console.log();
  
  // Repository info
  console.log(chalk.bold('Repository:'));
  console.log(`  URL: ${logger.link(server.repository.url)}`);
  console.log(`  Stars: ${chalk.yellow('⭐')} ${logger.formatNumber(server.repository.stars)}`);
  console.log(`  Last updated: ${logger.formatTimeAgo(server.repository.lastCommit)}`);
  console.log();
  
  // Category and tags
  console.log(chalk.bold('Classification:'));
  console.log(`  Category: ${logger.categoryIcon(server.category)} ${server.category}`);
  if (server.tags.length > 0) {
    console.log(`  Tags: ${server.tags.join(', ')}`);
  }
  console.log();
  
  // Installation info
  console.log(chalk.bold('Installation:'));
  if (server.packages.npm) {
    console.log(`  npm: ${logger.code(`npm install -g ${server.packages.npm.name}`)}`);
  }
  if (server.packages.docker) {
    console.log(`  Docker: ${logger.code(`docker pull ${server.packages.docker.image}`)}`);
  }
  console.log(`  OpenConductor: ${logger.code(`openconductor install ${server.slug}`)}`);
  console.log();
  
  // Stats
  console.log(chalk.bold('Statistics:'));
  console.log(`  ${chalk.yellow('⭐')} Stars: ${logger.formatNumber(server.repository.stars)}`);
  console.log(`  📦 Installs: ${logger.formatNumber(server.stats.installs)}`);
  if (server.stats.popularity > 0) {
    console.log(`  📊 Popularity: ${server.stats.popularity}/100`);
  }
  console.log();

  // Documentation
  if (server.documentation.docsUrl || server.documentation.homepageUrl) {
    console.log(chalk.bold('Documentation:'));
    if (server.documentation.docsUrl) {
      console.log(`  Docs: ${logger.link(server.documentation.docsUrl)}`);
    }
    if (server.documentation.homepageUrl) {
      console.log(`  Homepage: ${logger.link(server.documentation.homepageUrl)}`);
    }
    console.log();
  }

  // Quick actions
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do with this server?',
      choices: [
        { name: '🚀 Install this server', value: 'install' },
        { name: '🔗 Open repository', value: 'repo' },
        { name: '🔙 Back to results', value: 'back' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'install':
      const { installCommand } = await import('./install.js');
      await installCommand(server.slug, {});
      break;
    case 'repo':
      logger.info('Opening repository in browser...');
      // Could use 'open' package to launch browser
      console.log(logger.link(server.repository.url));
      break;
    case 'back':
      // Could implement back navigation
      logger.info('Use the up arrow or re-run the discover command');
      break;
    case 'exit':
    default:
      break;
  }
}

/**
 * Show trending servers (can be called directly or from discover)
 */
export async function showTrending(period = '7d') {
  const spinner = ora('Fetching trending servers...').start();
  
  try {
    const api = new ApiClient();
    const trending = await api.getTrending(period);
    spinner.stop();
    
    if (trending.servers.length === 0) {
      logger.info(`No trending servers found for the past ${period}.`);
      return;
    }

    logger.header(`🔥 Trending Servers (${period})`);
    
    const table = new Table({
      head: [
        chalk.cyan('#'),
        chalk.cyan('Server'),
        chalk.cyan('Growth'),
        chalk.cyan('⭐ Stars'),
        chalk.cyan('Category')
      ],
      colWidths: [5, 25, 15, 10, 20],
      style: { head: [], border: ['gray'] }
    });

    trending.servers.forEach((server, index) => {
      const rank = chalk.yellow(`${index + 1}.`);
      const name = server.name + (server.verified ? chalk.green(' ✓') : '');
      const growth = server.growth.percentage > 0 
        ? chalk.green(`↗ +${server.growth.percentage}%`)
        : chalk.gray('→ 0%');
      const category = `${logger.categoryIcon(server.category)} ${server.category}`;
      
      table.push([
        rank,
        chalk.bold(name),
        growth,
        logger.formatNumber(server.stats.stars),
        category
      ]);
    });

    console.log(table.toString());
    console.log();
    
    logger.info('💡 Tips:');
    logger.progress('Install with: ' + logger.code('openconductor install <server-name>'));
    logger.progress('View details: ' + logger.code('openconductor discover <server-name>'));
    console.log();
    
  } catch (error) {
    spinner.stop();
    logger.error('Failed to fetch trending servers:', error.message);
  }
}

/**
 * Browse servers by category
 */
export async function browseByCategory() {
  const spinner = ora('Loading categories...').start();
  
  try {
    const api = new ApiClient();
    const categoriesData = await api.getCategories();
    spinner.stop();
    
    logger.header('📂 Browse by Category');
    
    const choices = categoriesData.categories.map(cat => ({
      name: `${cat.icon} ${cat.displayName} (${cat.count} servers)\n    ${chalk.dim(cat.description)}`,
      value: cat.name,
      short: `${cat.icon} ${cat.displayName}`
    }));

    const { selectedCategory } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCategory',
        message: 'Select a category to explore:',
        choices,
        pageSize: 8
      }
    ]);

    // Show servers in selected category
    await discoverCommand('', { category: selectedCategory, limit: '20' });
    
  } catch (error) {
    spinner.stop();
    logger.error('Failed to load categories:', error.message);
  }
}