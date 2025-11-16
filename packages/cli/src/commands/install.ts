import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { api } from '../utils/api';
import { ClaudeDesktopConfigManager } from '../config/claude-desktop';
import { getAnalytics } from '../lib/ecosystem-analytics';

interface InstallOptions {
  config?: string;
  force?: boolean;
  dryRun?: boolean;
}

export async function installCommand(serverIdentifier: string, options: InstallOptions = {}) {
  const spinner = ora('Looking up MCP server...').start();
  
  try {
    // Get server info from API
    const server = await api.getServer(serverIdentifier);
    spinner.stop();
    
    console.log(chalk.bold(`\n📦 Installing: ${server.name}`));
    console.log(chalk.gray(server.description));
    console.log();

    // Initialize config manager
    const configManager = new ClaudeDesktopConfigManager(options.config);
    
    // Check if server already exists
    const serverExists = await configManager.hasServer(server.name);
    if (serverExists && !options.force) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Server '${server.name}' already exists. Overwrite?`,
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Installation cancelled.'));
        return;
      }
    }

    // Prepare server configuration
    const serverConfig = prepareServerConfig(server);
    
    // Show what will be installed
    console.log(chalk.bold('Configuration to be added:'));
    console.log(chalk.gray(JSON.stringify({
      [server.name]: serverConfig
    }, null, 2)));
    console.log();

    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no changes made'));
      console.log(chalk.gray(`Would add '${server.name}' to: ${configManager.getConfigPath()}`));
      return;
    }

    // Confirm installation
    if (!options.force) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Install this MCP server?',
          default: true
        }
      ]);
      
      if (!proceed) {
        console.log(chalk.yellow('Installation cancelled.'));
        return;
      }
    }

    // Create backup
    const spinner2 = ora('Creating backup and installing...').start();
    const backupPath = await configManager.backupConfig();
    
    // Install server
    await configManager.addServer(server.name, serverConfig);

    spinner2.stop();

    // Track successful installation
    const analytics = getAnalytics();
    await analytics.trackInstall(server.slug, {
      server_name: server.name,
      category: server.category,
      verified: server.verified,
      forced: options.force || false,
      had_existing: serverExists
    });

    console.log(chalk.green('✅ Installation successful!'));
    console.log(chalk.gray(`📁 Config file: ${configManager.getConfigPath()}`));
    console.log(chalk.gray(`💾 Backup created: ${backupPath}`));
    console.log();
    
    // Show next steps
    console.log(chalk.bold('🚀 Next steps:'));
    console.log(chalk.gray('1. Restart Claude Desktop'));
    console.log(chalk.gray('2. The MCP server should now be available'));
    
    if (server.installation?.npm) {
      console.log(chalk.gray(`3. Make sure to install dependencies: ${server.installation.npm}`));
    }
    
    // Show environment variables if needed
    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
      console.log(chalk.yellow('\n⚠️  Environment variables required:'));
      for (const [key, value] of Object.entries(serverConfig.env)) {
        const displayValue = value.includes('your_') ? chalk.red(value) : value;
        console.log(chalk.gray(`   ${key}=${displayValue}`));
      }
      console.log(chalk.gray('   Update these values in your config file.'));
    }

  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Error installing server:'), error.message);
    
    if (error.message.includes('not found')) {
      console.log(chalk.gray('\n💡 Try searching for servers: openconductor discover'));
    }
    
    process.exit(1);
  }
}

function prepareServerConfig(server: any) {
  const config = server.configExample || {};
  
  // Ensure required fields
  if (!config.command) {
    // Try to infer command from installation info
    if (server.installation?.npm) {
      const packageName = server.npmPackage || extractPackageName(server.installation.npm);
      config.command = `npx ${packageName}`;
    } else {
      config.command = `# TODO: Set command for ${server.name}`;
    }
  }
  
  return {
    command: config.command,
    ...(config.args && { args: config.args }),
    ...(config.env && { env: config.env })
  };
}

function extractPackageName(npmCommand: string): string {
  // Extract package name from "npm install package-name"
  const match = npmCommand.match(/(?:npm install|npm i)\s+(@?[a-zA-Z0-9-_/@]+)/);
  return match ? match[1] : 'unknown';
}