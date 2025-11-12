import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { Listr } from 'listr2';
import { ApiClient } from '../lib/api-client.js';
import { ConfigManager } from '../lib/config-manager.js';
import { Installer } from '../lib/installer.js';
import { PortManager } from '../lib/port-manager.js';
import { logger } from '../utils/logger.js';

export async function installCommand(serverSlug, options) {
  try {
    const api = new ApiClient();
    const configManager = new ConfigManager(options.config);
    const installer = new Installer();
    const portManager = new PortManager();

    // Get server details from registry
    const spinner = ora('Fetching server details...').start();
    let server;
    
    try {
      server = await api.getServer(serverSlug);
    } catch (error) {
      spinner.stop();
      
      if (error.message.includes('not found')) {
        logger.error(`Server "${serverSlug}" not found in registry.`);
        console.log();
        logger.info('Search for servers with:');
        logger.progress(logger.code('openconductor discover'));
        logger.progress(logger.code(`openconductor discover "${serverSlug}"`));
        console.log();
        
        // Suggest similar servers
        try {
          const suggestions = await api.searchServers({ q: serverSlug, limit: 3 });
          if (suggestions.servers.length > 0) {
            logger.info('Did you mean one of these?');
            suggestions.servers.forEach(s => {
              logger.progress(`${s.name} (${logger.code(`openconductor install ${s.slug}`)})`);
            });
            console.log();
          }
        } catch (e) {
          // Ignore suggestion errors
        }
        
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    spinner.stop();

    // Check if already installed
    const isAlreadyInstalled = await configManager.isInstalled(server.slug);
    if (isAlreadyInstalled && !options.force) {
      if (!options.yes) {
        const { shouldReinstall } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldReinstall',
            message: `${server.name} is already installed. Reinstall?`,
            default: false
          }
        ]);
        
        if (!shouldReinstall) {
          logger.info('Installation cancelled.');
          return;
        }
      }
    }

    // Show installation plan
    console.log();
    logger.header(`Installing ${server.name}`);
    console.log(chalk.dim(server.tagline || server.description));
    console.log();
    
    // Display installation details
    console.log(chalk.bold('Installation Plan:'));
    console.log(`  Server: ${chalk.cyan(server.name)} ${server.verified ? chalk.green('✓ verified') : chalk.yellow('⚠ unverified')}`);
    console.log(`  Method: ${server.packages.npm ? 'npm' : server.packages.docker ? 'docker' : 'manual'}`);
    console.log(`  Category: ${logger.categoryIcon(server.category)} ${server.category}`);
    
    if (server.packages.npm) {
      console.log(`  Package: ${chalk.cyan(server.packages.npm.name)}`);
    }
    if (server.packages.docker) {
      console.log(`  Image: ${chalk.cyan(server.packages.docker.image)}`);
    }
    
    const configInfo = configManager.getConfigInfo();
    console.log(`  Config: ${logger.path(configInfo.path)}`);
    console.log();

    // Check requirements first
    const reqCheck = await installer.checkRequirements(server);
    if (!reqCheck.satisfied) {
      logger.error('System requirements not met:');
      reqCheck.issues.forEach(issue => {
        logger.progress(chalk.red('✖ ' + issue));
      });
      console.log();
      logger.info('Please install the required dependencies and try again.');
      process.exit(1);
    }

    // Confirmation prompt
    if (!options.yes && !options.dryRun) {
      const { shouldProceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldProceed',
          message: 'Continue with installation?',
          default: true
        }
      ]);
      
      if (!shouldProceed) {
        logger.info('Installation cancelled.');
        return;
      }
    }

    // Dry run mode - show what would happen
    if (options.dryRun) {
      console.log(chalk.yellow.bold('🔍 DRY RUN MODE - No changes will be made'));
      console.log();
      
      const port = options.port || await portManager.allocatePort();
      
      console.log(chalk.bold('Would install:'));
      console.log(`  Package: ${server.packages.npm?.name || server.packages.docker?.image || 'manual'}`);
      console.log(`  Port: ${port}`);
      console.log(`  Config location: ${configInfo.path}`);
      console.log();
      
      console.log(chalk.bold('MCP configuration that would be added:'));
      const mcpConfig = {
        [server.slug]: {
          command: server.packages.npm ? 'npx' : server.packages.docker ? 'docker' : server.slug,
          args: server.packages.npm ? ['-y', server.packages.npm.name] : 
                server.packages.docker ? ['run', '--rm', '-i', server.packages.docker.image] : [],
          env: {
            PORT: port.toString()
          }
        }
      };
      
      console.log(JSON.stringify({ mcpServers: mcpConfig }, null, 2));
      console.log();
      
      logger.info('To actually install, run:');
      logger.progress(logger.code(`openconductor install ${server.slug}`));
      
      return;
    }

    // Installation tasks with Listr2
    const tasks = new Listr([
      {
        title: 'Checking system requirements',
        task: async (ctx) => {
          const check = await installer.checkRequirements(server);
          if (!check.satisfied) {
            throw new Error(`Requirements not met: ${check.issues.join(', ')}`);
          }
          ctx.requirements = check;
        }
      },
      {
        title: 'Backing up configuration',
        task: async (ctx) => {
          const backupPath = await configManager.backupConfig();
          ctx.backupPath = backupPath;
          
          if (backupPath) {
            return `Backed up to ${backupPath}`;
          } else {
            return 'No existing config to backup';
          }
        }
      },
      {
        title: 'Allocating port',
        skip: () => options.port !== undefined,
        task: async (ctx) => {
          const config = await configManager.readConfig();
          const existingPorts = portManager.getAllocatedPorts(config);
          ctx.port = options.port || await portManager.allocatePortAvoiding(existingPorts);
          return `Allocated port ${ctx.port}`;
        }
      },
      {
        title: 'Installing server package',
        task: async (ctx) => {
          const installResult = await installer.install(server);
          ctx.installResult = installResult;
          return `Installed via ${installResult.method}`;
        }
      },
      {
        title: 'Configuring MCP server',
        task: async (ctx) => {
          // Build MCP config based on install result
          const mcpConfig = {
            command: ctx.installResult.command,
            args: ctx.installResult.args || [],
            env: {
              PORT: ctx.port?.toString(),
              ...server.configuration.example?.env
            }
          };

          // Add to Claude Desktop config
          await configManager.addServer(server.slug, mcpConfig);
          ctx.configPath = configManager.configPath;
          
          return `Added to ${configManager.configPath}`;
        }
      },
      {
        title: 'Validating configuration',
        task: async (ctx) => {
          const isValid = await configManager.validateConfig();
          if (!isValid) {
            throw new Error('Configuration validation failed');
          }
          return 'Configuration validated';
        }
      },
      {
        title: 'Tracking installation',
        task: async (ctx) => {
          // Track installation analytics (anonymous)
          await api.trackInstall(server.id, server.versions.latest, {
            method: ctx.installResult.method,
            port: ctx.port
          });
          return 'Install tracked';
        }
      }
    ], {
      rendererOptions: { 
        collapse: false,
        showTimer: true
      },
      exitOnError: false
    });

    // Run installation tasks
    console.log();
    const context = await tasks.run().catch((error) => {
      logger.error('Installation failed during setup:', error.message);
      
      if (error.context?.backupPath) {
        logger.info(`Configuration restored from backup: ${error.context.backupPath}`);
      }
      
      throw error;
    });

    // Success! 
    console.log();
    logger.success(`🎉 ${server.name} installed successfully!`);
    console.log();
    
    // Installation summary
    console.log(chalk.bold('📋 Installation Summary:'));
    console.log(`  Server: ${chalk.cyan(server.name)} ${chalk.green('✓')}`);
    console.log(`  Method: ${context.installResult.method}`);
    console.log(`  Port: ${chalk.cyan(context.port || 'default')}`);
    console.log(`  Config: ${logger.path(context.configPath)}`);
    
    if (context.backupPath) {
      console.log(`  Backup: ${logger.path(context.backupPath)}`);
    }
    
    console.log();
    
    // Next steps
    console.log(chalk.bold('🚀 Next Steps:'));
    logger.progress('1. Restart Claude Desktop (or your MCP client)');
    logger.progress(`2. The "${server.name}" server will be available`);
    
    if (server.documentation.docsUrl) {
      logger.progress(`3. Read the docs: ${logger.link(server.documentation.docsUrl)}`);
    }
    
    console.log();
    
    // Useful commands
    console.log(chalk.bold('💡 Useful Commands:'));
    logger.progress(`List all servers: ${logger.code('openconductor list')}`);
    logger.progress(`View server config: ${logger.code('openconductor config --show')}`);
    logger.progress(`Remove server: ${logger.code(`openconductor remove ${server.slug}`)}`);
    console.log();

    // Show configuration preview
    if (process.env.DEBUG) {
      console.log(chalk.bold('🔧 MCP Configuration Added:'));
      const addedConfig = {
        [server.slug]: {
          command: context.installResult.command,
          args: context.installResult.args || [],
          env: { PORT: context.port?.toString() }
        }
      };
      console.log(JSON.stringify({ mcpServers: addedConfig }, null, 2));
      console.log();
    }

  } catch (error) {
    logger.troubleshoot(error);
    process.exit(1);
  }
}