import chalk from 'chalk';
import inquirer from 'inquirer';
import { ClaudeDesktopConfigManager } from '../config/claude-desktop';
import { spawn } from 'child_process';

interface ConfigOptions {
  show?: boolean;
  edit?: boolean;
  reset?: boolean;
}

export async function configCommand(options: ConfigOptions = {}) {
  try {
    const configManager = new ClaudeDesktopConfigManager();

    if (options.show) {
      await showConfig(configManager);
    } else if (options.edit) {
      await editConfig(configManager);
    } else if (options.reset) {
      await resetConfig(configManager);
    } else {
      // Interactive mode
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Show current configuration', value: 'show' },
            { name: 'Edit configuration file', value: 'edit' },
            { name: 'Validate configuration', value: 'validate' },
            { name: 'Show config file path', value: 'path' }
          ]
        }
      ]);

      switch (action) {
        case 'show':
          await showConfig(configManager);
          break;
        case 'edit':
          await editConfig(configManager);
          break;
        case 'validate':
          await validateConfig(configManager);
          break;
        case 'path':
          console.log(chalk.gray('Config file location:'));
          console.log(chalk.blue(configManager.getConfigPath()));
          break;
      }
    }

  } catch (error) {
    console.error(chalk.red('Error managing config:'), error.message);
    process.exit(1);
  }
}

async function showConfig(configManager: ClaudeDesktopConfigManager) {
  const config = await configManager.readConfig();
  
  console.log(chalk.bold('\n📄 Current Claude Desktop Configuration'));
  console.log(chalk.gray(`Location: ${configManager.getConfigPath()}`));
  console.log();
  
  if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
    console.log(chalk.yellow('No MCP servers configured.'));
  } else {
    console.log(chalk.gray(JSON.stringify(config, null, 2)));
  }
}

async function editConfig(configManager: ClaudeDesktopConfigManager) {
  const configPath = configManager.getConfigPath();
  const editor = process.env.EDITOR || 'nano';

  console.log(chalk.blue(`Opening config file in ${editor}...`));
  console.log(chalk.gray(`Path: ${configPath}`));

  const child = spawn(editor, [configPath], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log(chalk.green('\n✅ Configuration updated!'));
      console.log(chalk.gray('Remember to restart Claude Desktop for changes to take effect.'));
    } else {
      console.log(chalk.red('\n❌ Editor exited with error'));
    }
  });
}

async function resetConfig(configManager: ClaudeDesktopConfigManager) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'This will remove all MCP server configurations. Are you sure?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Reset cancelled.'));
    return;
  }

  // Create backup first
  const backupPath = await configManager.backupConfig();
  
  // Write empty config
  await configManager.writeConfig({ mcpServers: {} });
  
  console.log(chalk.green('✅ Configuration reset!'));
  console.log(chalk.gray(`Backup created: ${backupPath}`));
}

async function validateConfig(configManager: ClaudeDesktopConfigManager) {
  console.log(chalk.blue('🔍 Validating configuration...'));
  
  const validation = await configManager.validateConfig();
  
  if (validation.valid) {
    console.log(chalk.green('✅ Configuration is valid!'));
  } else {
    console.log(chalk.red('❌ Configuration has errors:'));
    for (const error of validation.errors) {
      console.log(chalk.red(`  • ${error}`));
    }
  }
}