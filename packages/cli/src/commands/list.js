import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import { ConfigManager } from '../lib/config-manager.js';
import { ApiClient } from '../lib/api-client.js';
import { Installer } from '../lib/installer.js';
import { logger } from '../utils/logger.js';

export async function listCommand(options) {
  try {
    const configManager = new ConfigManager(options.config);
    const config = await configManager.readConfig();

    if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
      logger.info('No MCP servers installed.');
      console.log();
      logger.info('Discover and install servers with:');
      logger.progress(logger.code('openconductor discover'));
      logger.progress(logger.code('openconductor install <server-name>'));
      console.log();
      logger.info('Browse the registry:');
      logger.progress(logger.link('https://openconductor.ai/discover'));
      return;
    }

    const installedServers = Object.keys(config.mcpServers);
    const spinner = ora(`Checking status of ${installedServers.length} servers...`).start();

    // Get detailed info from registry for installed servers
    const api = new ApiClient();
    const installer = new Installer();
    const serverDetails = [];

    for (const serverId of installedServers) {
      try {
        const serverInfo = await api.getServer(serverId);
        const installStatus = await installer.getInstallStatus(serverInfo);
        const serverConfig = config.mcpServers[serverId];
        
        serverDetails.push({
          ...serverInfo,
          config: serverConfig,
          installStatus,
          isRunning: await checkServerRunning(serverConfig)
        });
      } catch (error) {
        // Server might not be in registry (custom server)
        serverDetails.push({
          slug: serverId,
          name: serverId,
          category: 'custom',
          config: config.mcpServers[serverId],
          installStatus: { installed: true, method: 'unknown' },
          isRunning: await checkServerRunning(config.mcpServers[serverId]),
          isRegistryServer: false
        });
      }
    }

    spinner.stop();

    // Display results
    console.log();
    logger.header(`Installed MCP Servers (${serverDetails.length})`);

    if (options.format === 'json') {
      console.log(JSON.stringify(serverDetails, null, 2));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('Server'),
        chalk.cyan('Status'),
        chalk.cyan('Method'),
        chalk.cyan('Port'),
        chalk.cyan('Category'),
        chalk.cyan('Last Update')
      ],
      colWidths: [25, 12, 12, 8, 15, 15],
      style: {
        head: [],
        border: ['gray']
      }
    });

    serverDetails.forEach((server) => {
      // Determine overall status
      let status;
      if (!server.installStatus.installed) {
        status = logger.status.error + ' missing';
      } else if (server.isRunning) {
        status = logger.status.installed;
      } else {
        status = logger.status.available;
      }

      // Get port from config
      const port = server.config.env?.PORT || 'auto';
      
      // Format last update
      let lastUpdate = 'unknown';
      if (server.repository?.lastCommit) {
        lastUpdate = logger.formatTimeAgo(server.repository.lastCommit);
      }

      // Format category with icon
      let categoryDisplay = server.category;
      if (server.isRegistryServer !== false) {
        categoryDisplay = `${logger.categoryIcon(server.category)} ${server.category}`;
      }

      table.push([
        chalk.bold(server.name) + (server.verified ? chalk.green(' ✓') : ''),
        status,
        server.installStatus.method || 'unknown',
        port,
        categoryDisplay,
        chalk.dim(lastUpdate)
      ]);
    });

    console.log(table.toString());
    console.log();

    // Configuration info
    const configInfo = configManager.getConfigInfo();
    console.log(chalk.bold('📁 Configuration:'));
    console.log(`  File: ${logger.path(configInfo.path)}`);
    console.log(`  Exists: ${configInfo.exists ? chalk.green('✓') : chalk.red('✖')}`);
    console.log(`  Platform: ${configInfo.platform}`);
    console.log();

    // Summary stats
    const runningCount = serverDetails.filter(s => s.isRunning).length;
    const verifiedCount = serverDetails.filter(s => s.verified).length;
    const errorCount = serverDetails.filter(s => !s.installStatus.installed).length;

    console.log(chalk.bold('📊 Summary:'));
    console.log(`  Total: ${serverDetails.length} servers`);
    console.log(`  Running: ${chalk.green(runningCount)} active`);
    console.log(`  Verified: ${chalk.blue(verifiedCount)} verified`);
    
    if (errorCount > 0) {
      console.log(`  Issues: ${chalk.red(errorCount)} servers have problems`);
    }
    
    console.log();

    // Show issues if any
    const problemServers = serverDetails.filter(s => 
      !s.installStatus.installed || s.installStatus.issues.length > 0
    );

    if (problemServers.length > 0) {
      console.log(chalk.yellow.bold('⚠️  Issues Found:'));
      
      problemServers.forEach(server => {
        console.log(`  ${chalk.red('✖')} ${server.name}:`);
        
        if (!server.installStatus.installed) {
          console.log(`    - Package not installed (${server.installStatus.method || 'unknown'} method)`);
        }
        
        server.installStatus.issues.forEach(issue => {
          console.log(`    - ${issue}`);
        });
      });
      
      console.log();
      logger.info('💡 Fix issues:');
      logger.progress(`Reinstall: ${logger.code('openconductor install <server-name> --force')}`);
      logger.progress(`Remove broken: ${logger.code('openconductor remove <server-name>')}`);
      console.log();
    }

    // Helpful commands
    console.log(chalk.dim('💡 What\'s next?'));
    console.log(chalk.dim(`  ${logger.code('openconductor discover')}          # Find more servers`));
    console.log(chalk.dim(`  ${logger.code('openconductor config --show')}    # View full config`));
    console.log(chalk.dim(`  ${logger.code('openconductor remove <server>')}  # Remove a server`));
    console.log();

  } catch (error) {
    logger.error('Failed to list servers:', error.message);
    
    if (error.message.includes('ENOENT')) {
      logger.info('Claude Desktop configuration file not found.');
      logger.progress('Initialize with: ' + logger.code('openconductor init'));
    }
    
    process.exit(1);
  }
}

/**
 * Check if a server process is currently running
 * This is a best-effort check and may not be 100% accurate
 */
async function checkServerRunning(serverConfig) {
  try {
    // For now, return false since we can't reliably check without process management
    // In a more advanced implementation, we could:
    // 1. Check if port is in use
    // 2. Try to ping a health endpoint
    // 3. Check process list for the command
    
    // Simple port check if PORT is specified
    if (serverConfig.env?.PORT) {
      const { PortManager } = await import('../lib/port-manager.js');
      const portManager = new PortManager();
      const isAvailable = await portManager.isPortAvailable(parseInt(serverConfig.env.PORT));
      return !isAvailable; // Port in use = server running
    }
    
    return false; // Default to not running
  } catch (error) {
    return false;
  }
}