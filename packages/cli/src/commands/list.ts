import chalk from 'chalk';
import { ClaudeDesktopConfigManager } from '../config/claude-desktop';

interface ListOptions {
  config?: string;
  format?: 'table' | 'json';
}

export async function listCommand(options: ListOptions = {}) {
  try {
    const configManager = new ClaudeDesktopConfigManager(options.config);
    const servers = await configManager.listServers();
    
    if (Object.keys(servers).length === 0) {
      console.log(chalk.yellow('No MCP servers installed.'));
      console.log(chalk.gray('💡 Install a server: openconductor install <server-name>'));
      console.log(chalk.gray('💡 Discover servers: openconductor discover'));
      return;
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(servers, null, 2));
      return;
    }

    // Table format
    console.log(chalk.bold(`\n📋 Installed MCP Servers (${Object.keys(servers).length})`));
    console.log(chalk.gray(`Config: ${configManager.getConfigPath()}`));
    console.log();

    for (const [serverName, serverConfig] of Object.entries(servers)) {
      displayServerEntry(serverName, serverConfig as any);
    }

    console.log(chalk.gray('\n💡 To uninstall: Edit the config file manually'));
    console.log(chalk.gray('💡 To reinstall: openconductor install <server-name> --force'));

  } catch (error) {
    console.error(chalk.red('Error listing servers:'), error.message);
    process.exit(1);
  }
}

function displayServerEntry(name: string, config: any) {
  console.log(chalk.bold(name));
  console.log(chalk.gray(`  Command: ${config.command}`));
  
  if (config.args && config.args.length > 0) {
    console.log(chalk.gray(`  Args: ${config.args.join(' ')}`));
  }
  
  if (config.env && Object.keys(config.env).length > 0) {
    console.log(chalk.gray(`  Environment variables: ${Object.keys(config.env).length} set`));
  }
  
  console.log();
}