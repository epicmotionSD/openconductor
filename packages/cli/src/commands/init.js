import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Listr } from 'listr2';
import { ConfigManager } from '../lib/config-manager.js';
import { resolvePlatformConfig } from '../lib/platforms.js';
import { logger } from '../utils/logger.js';

export async function initCommand(options) {
  try {
    console.log();
    logger.header('🚀 Initialize OpenConductor Configuration');

    const platformConfig = resolvePlatformConfig(options);
    const configManager = new ConfigManager(platformConfig.configPath, platformConfig);
    const configInfo = configManager.getConfigInfo();

    // Check if config already exists
    if (configInfo.exists && !options.force) {
      logger.warn('Configuration file already exists:');
      console.log(`  ${logger.path(configInfo.path)}`);
      console.log();
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'View existing configuration', value: 'view' },
            { name: 'Reinitialize (backup existing)', value: 'reinit' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);

      if (action === 'cancel') {
        logger.info('Initialization cancelled.');
        return;
      } else if (action === 'view') {
        await showExistingConfig(configManager);
        return;
      } else if (action === 'reinit') {
        options.force = true;
      }
    }

    // Platform-specific information
    console.log(chalk.bold('🖥️  Platform Information:'));
    console.log(`  OS: ${process.platform}`);
    console.log(`  Config location: ${logger.path(configInfo.path)}`);
    console.log(`  Target: ${platformConfig.label}`);
    console.log(`  Node.js: ${process.version}`);
    console.log();

    // Interactive setup
    const setupAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupType',
        message: 'How would you like to set up your MCP configuration?',
        choices: [
          { 
            name: '🎯 Quick setup (recommended servers)', 
            value: 'quick',
            short: 'Quick setup'
          },
          { 
            name: '🔧 Custom setup (choose your own servers)', 
            value: 'custom',
            short: 'Custom setup'
          },
          { 
            name: '📄 Empty configuration (add servers later)', 
            value: 'empty',
            short: 'Empty config'
          }
        ]
      }
    ]);

    // Initialize based on user choice
    let selectedServers = [];
    
    if (setupAnswers.setupType === 'quick') {
      selectedServers = await handleQuickSetup();
    } else if (setupAnswers.setupType === 'custom') {
      selectedServers = await handleCustomSetup();
    }

    // Perform initialization
    const initTasks = new Listr([
      {
        title: 'Creating backup',
        skip: () => !configInfo.exists,
        task: async (ctx) => {
          const backupPath = await configManager.backupConfig();
          ctx.backupPath = backupPath;
          return backupPath ? `Backup: ${backupPath}` : 'No backup needed';
        }
      },
      {
        title: 'Initializing configuration',
        task: async (ctx) => {
          const configPath = await configManager.initializeConfig(options.force);
          ctx.configPath = configPath;
          return `Created: ${configPath}`;
        }
      },
      {
        title: 'Installing selected servers',
        skip: () => selectedServers.length === 0,
        task: async (ctx) => {
          // This would normally call install command for each server
          // For now, just add them to config
          ctx.installedCount = selectedServers.length;
          return `${selectedServers.length} servers queued for installation`;
        }
      },
      {
        title: 'Validating configuration',
        task: async () => {
          await configManager.validateConfig();
          return 'Configuration validated';
        }
      }
    ], {
      rendererOptions: { collapse: false }
    });

    console.log();
    const context = await initTasks.run();

    // Success message
    console.log();
    logger.success('🎉 OpenConductor initialized successfully!');
    console.log();

    // Show what was created
    console.log(chalk.bold('📁 Configuration Details:'));
    console.log(`  Location: ${logger.path(context.configPath)}`);
    console.log(`  Platform: ${platformConfig.label}`);
    
    if (context.backupPath) {
      console.log(`  Backup: ${logger.path(context.backupPath)}`);
    }
    
    console.log();

    // Next steps based on setup type
    if (selectedServers.length > 0) {
      console.log(chalk.bold('🚀 Next Steps:'));
      logger.progress('1. Install the selected servers:');
      
      selectedServers.forEach(server => {
        logger.progress(`   ${logger.code(`openconductor install ${server.slug}`)}`);
      });
      
      logger.progress(`2. Restart ${platformConfig.label}`);
      logger.progress('3. Start using your MCP servers!');
    } else {
      console.log(chalk.bold('🚀 Next Steps:'));
      logger.progress('1. Discover MCP servers:');
      logger.progress(`   ${logger.code('openconductor discover')}`);
      logger.progress('2. Install servers you like:');
      logger.progress(`   ${logger.code('openconductor install <server-name>')}`);
      logger.progress('3. List your installed servers:');
      logger.progress(`   ${logger.code('openconductor list')}`);
    }
    
    console.log();

    // Helpful tips
    console.log(chalk.dim('💡 Tips:'));
    console.log(chalk.dim(`  • ${logger.code('openconductor --help')} - Show all available commands`));
    console.log(chalk.dim(`  • ${logger.code('openconductor discover memory')} - Search for memory servers`));
    console.log(chalk.dim(`  • ${logger.code('openconductor config --show')} - View your configuration`));
    console.log();

  } catch (error) {
    logger.error('Initialization failed:', error.message);
    
    if (error.message.includes('permission denied')) {
      logger.info('Permission denied. Try running with elevated privileges:');
      logger.progress('macOS/Linux: ' + logger.code('sudo openconductor init'));
      logger.progress('Windows: Run as Administrator');
    }
    
    process.exit(1);
  }
}

async function handleQuickSetup() {
  console.log();
  logger.info('🎯 Quick Setup - Recommended MCP Servers');
  console.log('The following servers are popular and well-maintained:');
  console.log();

  const recommendedServers = [
    {
      name: 'OpenMemory',
      slug: 'openmemory', 
      description: 'Hierarchical memory for AI agents',
      category: 'memory'
    },
    {
      name: 'Filesystem MCP',
      slug: 'filesystem-mcp',
      description: 'Secure file operations',
      category: 'filesystem'  
    },
    {
      name: 'GitHub MCP',
      slug: 'github-mcp',
      description: 'Repository management',
      category: 'api'
    }
  ];

  const { selectedServers } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select servers to install:',
      choices: recommendedServers.map(server => ({
        name: `${logger.categoryIcon(server.category)} ${server.name} - ${server.description}`,
        value: server,
        checked: true
      }))
    }
  ]);

  return selectedServers;
}

async function handleCustomSetup() {
  console.log();
  logger.info('🔧 Custom Setup');
  logger.info('You can browse and select from all available servers.');
  console.log();

  // This would integrate with the discover command
  // For now, provide guidance
  const { shouldDiscover } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldDiscover',
      message: 'Would you like to browse available servers now?',
      default: true
    }
  ]);

  if (shouldDiscover) {
    logger.info('Opening server browser...');
    logger.progress('Run: ' + logger.code('openconductor discover'));
    // Could programmatically call discover command here
    return [];
  }

  return [];
}

async function showExistingConfig(configManager) {
  const spinner = ora('Loading configuration...').start();
  
  try {
    const config = await configManager.readConfig();
    const serverMap = configManager.getServers(config);
    const installedServers = Object.keys(serverMap);
    
    spinner.stop();
    
    console.log();
    logger.info('📄 Current Configuration:');
    console.log(`  Location: ${logger.path(configManager.configPath)}`);
    console.log(`  Servers: ${installedServers.length} installed`);
    console.log();

    if (installedServers.length > 0) {
      console.log(chalk.bold('Installed Servers:'));
      installedServers.forEach(serverName => {
        const serverConfig = serverMap[serverName];
        const serverSummary = serverConfig.command || serverConfig.url || 'custom config';
        console.log(`  ${chalk.cyan(serverName)}: ${serverSummary}`);
      });
      console.log();
    }

    logger.info('💡 Useful commands:');
    logger.progress(logger.code('openconductor list') + ' - View detailed server status');
    logger.progress(logger.code('openconductor config --show') + ' - Show full configuration');
    logger.progress(logger.code('openconductor discover') + ' - Find more servers');
    console.log();
    
  } catch (error) {
    spinner.stop();
    logger.error('Failed to read configuration:', error.message);
  }
}

/**
 * Reset configuration to defaults
 */
export async function resetConfig(options = {}) {
  const configManager = new ConfigManager(options.config);
  const configInfo = configManager.getConfigInfo();

  if (!configInfo.exists) {
    logger.info('No configuration file exists to reset.');
    return;
  }

  console.log();
  logger.warn('⚠️  This will reset your entire MCP configuration!');
  console.log(`Configuration file: ${logger.path(configInfo.path)}`);
  console.log();

  if (!options.yes) {
    const { shouldReset } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldReset',
        message: 'Are you sure you want to reset your configuration?',
        default: false
      }
    ]);

    if (!shouldReset) {
      logger.info('Reset cancelled.');
      return;
    }
  }

  try {
    // Create backup first
    const backupPath = await configManager.backupConfig();
    
    // Reset to default
    await configManager.initializeConfig(true);
    
    logger.success('✓ Configuration reset successfully');
    console.log();
    console.log(`  New config: ${logger.path(configInfo.path)}`);
    
    if (backupPath) {
      console.log(`  Backup: ${logger.path(backupPath)}`);
    }
    
    console.log();
    logger.info('🚀 Next steps:');
    logger.progress(logger.code('openconductor discover') + ' - Find servers to install');
    logger.progress(logger.code('openconductor init') + ' - Run setup wizard again');
    
  } catch (error) {
    logger.error('Reset failed:', error.message);
    process.exit(1);
  }
}