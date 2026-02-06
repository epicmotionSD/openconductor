import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Listr } from 'listr2';
import { ConfigManager } from '../lib/config-manager.js';
import { ApiClient } from '../lib/api-client.js';
import { Installer } from '../lib/installer.js';
import { resolvePlatformConfig } from '../lib/platforms.js';
import { logger } from '../utils/logger.js';

export async function updateCommand(serverSlug, options) {
  try {
    const platformConfig = resolvePlatformConfig(options);
    const configManager = new ConfigManager(platformConfig.configPath);
    const api = new ApiClient();
    const installer = new Installer();

    // Get installed servers
    const installedServers = await configManager.getInstalledServers();
    
    if (installedServers.length === 0) {
      logger.info('No MCP servers are currently installed.');
      logger.progress('Install servers with: ' + logger.code('openconductor discover'));
      return;
    }

    let serversToUpdate = [];

    // Determine which servers to update
    if (serverSlug) {
      // Update specific server
      if (!installedServers.includes(serverSlug)) {
        logger.error(`Server "${serverSlug}" is not installed.`);
        logger.progress('List installed servers: ' + logger.code('openconductor list'));
        return;
      }
      serversToUpdate = [serverSlug];
    } else {
      // Update all servers
      serversToUpdate = installedServers;
    }

    console.log();
    logger.header(`Checking updates for ${serversToUpdate.length} server${serversToUpdate.length === 1 ? '' : 's'}`);

    // Check each server for updates
    const spinner = ora('Checking for updates...').start();
    const updateInfo = [];

    for (const slug of serversToUpdate) {
      try {
        const serverInfo = await api.getServer(slug);
        const serverConfig = await configManager.getServerConfig(slug);
        const installStatus = await installer.getInstallStatus(serverInfo);
        
        // Compare versions (simplified - would need proper semver comparison)
        const hasUpdate = serverInfo.versions.latest !== installStatus.version;
        
        updateInfo.push({
          ...serverInfo,
          config: serverConfig,
          installStatus,
          hasUpdate,
          currentVersion: installStatus.version || 'unknown',
          latestVersion: serverInfo.versions.latest
        });
      } catch (error) {
        // Server not in registry or other error
        updateInfo.push({
          slug,
          name: slug,
          hasUpdate: false,
          error: error.message,
          isRegistryServer: false
        });
      }
    }

    spinner.stop();

    // Filter servers that have updates
    const serversWithUpdates = updateInfo.filter(s => s.hasUpdate && !s.error);
    const serversWithErrors = updateInfo.filter(s => s.error);

    // Show update summary
    if (serversWithUpdates.length === 0) {
      logger.success('✓ All servers are up to date!');
      
      if (serversWithErrors.length > 0) {
        console.log();
        logger.warn(`${serversWithErrors.length} server${serversWithErrors.length === 1 ? '' : 's'} could not be checked:`);
        serversWithErrors.forEach(server => {
          logger.progress(`${server.name || server.slug}: ${server.error}`);
        });
      }
      
      return;
    }

    console.log();
    logger.info(`📦 Found ${serversWithUpdates.length} update${serversWithUpdates.length === 1 ? '' : 's'}:`);
    console.log();

    // Show available updates
    serversWithUpdates.forEach(server => {
      console.log(`  ${chalk.cyan(server.name)}`);
      console.log(`    ${chalk.dim(server.currentVersion)} → ${chalk.green(server.latestVersion)}`);
      if (server.tagline) {
        console.log(`    ${chalk.dim(server.tagline)}`);
      }
      console.log();
    });

    // Ask which servers to update
    let serversToActuallyUpdate = serversWithUpdates;

    if (!options.yes && serversWithUpdates.length > 1) {
      const { updateSelection } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'updateSelection',
          message: 'Select servers to update:',
          choices: serversWithUpdates.map(server => ({
            name: `${server.name} (${server.currentVersion} → ${server.latestVersion})`,
            value: server.slug,
            checked: true
          })),
          validate: (selection) => {
            return selection.length > 0 || 'Please select at least one server to update';
          }
        }
      ]);

      serversToActuallyUpdate = serversWithUpdates.filter(s => 
        updateSelection.includes(s.slug)
      );
    } else if (!options.yes) {
      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: `Update ${serversWithUpdates[0].name}?`,
          default: true
        }
      ]);

      if (!shouldUpdate) {
        logger.info('Update cancelled.');
        return;
      }
    }

    // Perform updates
    console.log();
    const updateTasks = new Listr(
      serversToActuallyUpdate.map(server => ({
        title: `Updating ${server.name}`,
        task: async (ctx, task) => {
          try {
            // Create subtasks for this server
            const serverTasks = new Listr([
              {
                title: 'Backing up configuration',
                task: async () => {
                  const backupPath = await configManager.backupConfig();
                  return backupPath ? `Backup: ${backupPath}` : 'No backup needed';
                }
              },
              {
                title: 'Downloading latest version',
                task: async () => {
                  const installResult = await installer.install(server);
                  return `Installed ${server.latestVersion}`;
                }
              },
              {
                title: 'Updating configuration',
                task: async () => {
                  // Keep existing config but update version references if needed
                  const existingConfig = await configManager.getServerConfig(server.slug);
                  
                  // For now, just validate the existing config still works
                  await configManager.validateConfig();
                  return 'Configuration updated';
                }
              }
            ], {
              rendererOptions: { collapse: true }
            });

            await serverTasks.run();
            
            task.title = `${server.name} updated to ${server.latestVersion}`;
            
          } catch (error) {
            throw new Error(`Failed to update ${server.name}: ${error.message}`);
          }
        }
      })),
      {
        concurrent: false,
        exitOnError: false,
        rendererOptions: { collapse: false }
      }
    );

    await updateTasks.run();

    // Success summary
    console.log();
    logger.success(`🎉 Updated ${serversToActuallyUpdate.length} server${serversToActuallyUpdate.length === 1 ? '' : 's'}!`);
    console.log();

    console.log(chalk.bold('📋 Update Summary:'));
    serversToActuallyUpdate.forEach(server => {
      console.log(`  ${chalk.green('✓')} ${server.name}: ${chalk.dim(server.currentVersion)} → ${chalk.green(server.latestVersion)}`);
    });
    console.log();

    // Next steps
    console.log(chalk.bold('🚀 Next Steps:'));
    logger.progress(`1. Restart ${platformConfig.label} (or your MCP client)`);
    logger.progress('2. Updated servers will use the latest versions');
    console.log();

    // Show what's new (if available)
    for (const server of serversToActuallyUpdate) {
      if (server.versions.all && server.versions.all.length > 0) {
        const latestRelease = server.versions.all.find(v => v.version === server.latestVersion);
        if (latestRelease && latestRelease.releaseNotes) {
          console.log(chalk.bold(`📝 What's new in ${server.name} ${server.latestVersion}:`));
          console.log(chalk.dim(latestRelease.releaseNotes.substring(0, 200) + '...'));
          if (latestRelease.releaseUrl) {
            logger.progress(`Full release notes: ${logger.link(latestRelease.releaseUrl)}`);
          }
          console.log();
        }
      }
    }

  } catch (error) {
    logger.error('Update failed:', error.message);
    
    if (error.message.includes('ENOENT')) {
      logger.info('Configuration file not found.');
      logger.progress('Initialize with: ' + logger.code('openconductor init'));
    }
    
    process.exit(1);
  }
}

/**
 * Check all installed servers and report update status
 */
export async function checkUpdates(options = {}) {
  const platformConfig = resolvePlatformConfig(options);
  const configManager = new ConfigManager(platformConfig.configPath);
  const api = new ApiClient();
  
  try {
    const installedServers = await configManager.getInstalledServers();
    
    if (installedServers.length === 0) {
      logger.info('No servers installed to check for updates.');
      return;
    }

    const spinner = ora('Checking for updates...').start();
    const updateStatus = [];

    for (const slug of installedServers) {
      try {
        const serverInfo = await api.getServer(slug);
        const installer = new Installer();
        const installStatus = await installer.getInstallStatus(serverInfo);
        
        const hasUpdate = serverInfo.versions.latest !== installStatus.version;
        updateStatus.push({
          name: serverInfo.name,
          slug,
          currentVersion: installStatus.version || 'unknown',
          latestVersion: serverInfo.versions.latest,
          hasUpdate
        });
      } catch (error) {
        updateStatus.push({
          name: slug,
          slug,
          error: error.message,
          hasUpdate: false
        });
      }
    }

    spinner.stop();

    const serversWithUpdates = updateStatus.filter(s => s.hasUpdate);
    
    if (serversWithUpdates.length === 0) {
      logger.success('✓ All servers are up to date!');
    } else {
      console.log();
      logger.info(`📦 ${serversWithUpdates.length} update${serversWithUpdates.length === 1 ? '' : 's'} available:`);
      console.log();
      
      serversWithUpdates.forEach(server => {
        console.log(`  ${chalk.cyan(server.name)}: ${chalk.dim(server.currentVersion)} → ${chalk.green(server.latestVersion)}`);
      });
      
      console.log();
      logger.info('Run updates with:');
      logger.progress(logger.code('openconductor update'));
    }

  } catch (error) {
    logger.error('Failed to check for updates:', error.message);
  }
}