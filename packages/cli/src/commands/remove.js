import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Listr } from 'listr2';
import { ConfigManager } from '../lib/config-manager.js';
import { ApiClient } from '../lib/api-client.js';
import { Installer } from '../lib/installer.js';
import { logger } from '../utils/logger.js';

export async function removeCommand(serverSlug, options) {
  try {
    const configManager = new ConfigManager(options.config);
    const api = new ApiClient();
    const installer = new Installer();

    // Check if server is installed
    const isInstalled = await configManager.isInstalled(serverSlug);
    if (!isInstalled) {
      logger.warn(`Server "${serverSlug}" is not installed.`);
      console.log();
      logger.info('List installed servers with:');
      logger.progress(logger.code('openconductor list'));
      return;
    }

    // Get server details for better UX
    let serverInfo;
    try {
      serverInfo = await api.getServer(serverSlug);
    } catch (error) {
      // Server might not be in registry (custom installation)
      serverInfo = {
        slug: serverSlug,
        name: serverSlug,
        category: 'custom',
        isRegistryServer: false
      };
    }

    // Get current config for this server
    const serverConfig = await configManager.getServerConfig(serverSlug);
    
    // Show removal plan
    console.log();
    logger.header(`Removing ${serverInfo.name || serverSlug}`);
    
    if (serverInfo.tagline) {
      console.log(chalk.dim(serverInfo.tagline));
      console.log();
    }

    console.log(chalk.bold('🗑️  Removal Plan:'));
    console.log(`  Server: ${chalk.cyan(serverInfo.name || serverSlug)}`);
    console.log(`  Method: ${serverConfig.command} (${getInstallMethod(serverConfig)})`);
    
    const configInfo = configManager.getConfigInfo();
    console.log(`  Config: ${logger.path(configInfo.path)}`);
    
    if (serverConfig.env?.PORT) {
      console.log(`  Port: ${serverConfig.env.PORT} (will be freed)`);
    }
    
    console.log();

    // Warning about potential issues
    if (serverInfo.isRegistryServer !== false && serverInfo.stats?.installs > 1000) {
      console.log(chalk.yellow.bold('⚠️  Popular Server Warning'));
      console.log(chalk.yellow(`This is a popular server with ${logger.formatNumber(serverInfo.stats.installs)} installs.`));
      console.log(chalk.yellow('Make sure you understand the impact of removing it.'));
      console.log();
    }

    // Confirmation prompt
    if (!options.yes) {
      const { shouldRemove } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldRemove',
          message: 'Are you sure you want to remove this server?',
          default: false
        }
      ]);
      
      if (!shouldRemove) {
        logger.info('Removal cancelled.');
        return;
      }

      // Double confirmation for verified servers
      if (serverInfo.verified && serverInfo.stats?.installs > 100) {
        const { finalConfirmation } = await inquirer.prompt([
          {
            type: 'confirm',  
            name: 'finalConfirmation',
            message: 'This is a verified, popular server. Really remove it?',
            default: false
          }
        ]);

        if (!finalConfirmation) {
          logger.info('Removal cancelled.');
          return;
        }
      }
    }

    // Removal tasks
    const tasks = new Listr([
      {
        title: 'Backing up configuration',
        task: async (ctx) => {
          const backupPath = await configManager.backupConfig();
          ctx.backupPath = backupPath;
          
          if (backupPath) {
            return `Backup created: ${backupPath}`;
          } else {
            return 'No backup needed';
          }
        }
      },
      {
        title: 'Removing from configuration',
        task: async (ctx) => {
          const removed = await configManager.removeServer(serverSlug);
          if (!removed) {
            throw new Error('Server not found in configuration');
          }
          return 'Removed from MCP configuration';
        }
      },
      {
        title: 'Validating configuration',
        task: async (ctx) => {
          const isValid = await configManager.validateConfig();
          if (!isValid) {
            throw new Error('Configuration validation failed after removal');
          }
          return 'Configuration validated';
        }
      },
      {
        title: 'Cleaning up package installation',
        skip: () => getInstallMethod(serverConfig) === 'unknown',
        task: async (ctx) => {
          try {
            const method = getInstallMethod(serverConfig);
            
            if (serverInfo.isRegistryServer !== false && method !== 'unknown') {
              await installer.uninstall(serverInfo, method);
              return `Uninstalled ${method} package`;
            } else {
              return 'Skipped (custom installation)';
            }
          } catch (error) {
            // Non-critical if cleanup fails
            ctx.cleanupWarning = error.message;
            return 'Package cleanup skipped (non-critical)';
          }
        }
      }
    ], {
      rendererOptions: { 
        collapse: false,
        showTimer: true 
      },
      exitOnError: false
    });

    // Run removal tasks
    console.log();
    const context = await tasks.run().catch((error) => {
      logger.error('Removal failed:', error.message);
      
      if (error.context?.backupPath) {
        logger.info(`Configuration restored from backup: ${error.context.backupPath}`);
      }
      
      throw error;
    });

    // Success message
    console.log();
    logger.success(`✅ ${serverInfo.name || serverSlug} removed successfully!`);
    console.log();

    // Removal summary
    console.log(chalk.bold('📋 Removal Summary:'));
    console.log(`  Server: ${chalk.cyan(serverInfo.name || serverSlug)}`);
    console.log(`  Config: ${logger.path(configInfo.path)}`);
    
    if (context.backupPath) {
      console.log(`  Backup: ${logger.path(context.backupPath)}`);
    }

    if (context.cleanupWarning) {
      console.log(`  ${chalk.yellow('⚠')} Package cleanup: ${context.cleanupWarning}`);
    }
    
    console.log();

    // Next steps
    console.log(chalk.bold('🚀 Next Steps:'));
    logger.progress('1. Restart Claude Desktop (or your MCP client)');
    logger.progress(`2. The "${serverInfo.name || serverSlug}" server will no longer be available`);
    console.log();

    // Show remaining servers
    const remainingServers = await configManager.getInstalledServers();
    if (remainingServers.length > 0) {
      logger.info(`💡 You still have ${remainingServers.length} servers installed:`);
      remainingServers.slice(0, 3).forEach(serverName => {
        logger.progress(serverName);
      });
      
      if (remainingServers.length > 3) {
        logger.progress(`... and ${remainingServers.length - 3} more`);
      }
      
      console.log();
      logger.progress(`View all: ${logger.code('openconductor list')}`);
    } else {
      logger.info('💡 No MCP servers remaining. Discover new ones:');
      logger.progress(logger.code('openconductor discover'));
    }
    
    console.log();

  } catch (error) {
    logger.error('Failed to remove server:', error.message);
    
    if (error.message.includes('ENOENT')) {
      logger.info('Configuration file not found.');
      logger.progress('Initialize with: ' + logger.code('openconductor init'));
    } else if (error.message.includes('not found in configuration')) {
      logger.info('Server was not found in your configuration.');
      logger.progress('Check installed servers: ' + logger.code('openconductor list'));
    }
    
    process.exit(1);
  }
}

/**
 * Determine installation method from server config
 */
function getInstallMethod(serverConfig) {
  if (serverConfig.command === 'npx' || serverConfig.command.includes('npm')) {
    return 'npm';
  } else if (serverConfig.command === 'docker') {
    return 'docker';
  } else {
    return 'unknown';
  }
}

/**
 * Bulk remove multiple servers
 */
export async function removeMultipleServers(serverSlugs, options) {
  logger.header(`Removing ${serverSlugs.length} servers`);
  
  const configManager = new ConfigManager(options.config);
  const installedServers = await configManager.getInstalledServers();
  
  // Filter to only installed servers
  const toRemove = serverSlugs.filter(slug => installedServers.includes(slug));
  const notInstalled = serverSlugs.filter(slug => !installedServers.includes(slug));
  
  if (notInstalled.length > 0) {
    logger.warn('Some servers are not installed:');
    notInstalled.forEach(slug => logger.progress(slug));
    console.log();
  }
  
  if (toRemove.length === 0) {
    logger.info('No servers to remove.');
    return;
  }

  // Confirm bulk removal
  if (!options.yes) {
    const { shouldProceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldProceed',
        message: `Remove ${toRemove.length} servers?`,
        default: false
      }
    ]);
    
    if (!shouldProceed) {
      logger.info('Bulk removal cancelled.');
      return;
    }
  }

  // Remove each server
  let successful = 0;
  let failed = 0;
  
  for (const slug of toRemove) {
    try {
      await removeCommand(slug, { ...options, yes: true });
      successful++;
    } catch (error) {
      logger.error(`Failed to remove ${slug}:`, error.message);
      failed++;
    }
  }

  console.log();
  logger.info(`Bulk removal complete: ${chalk.green(successful)} successful, ${chalk.red(failed)} failed`);
}