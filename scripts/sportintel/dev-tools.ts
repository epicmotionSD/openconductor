#!/usr/bin/env ts-node

/**
 * SportIntel Development Tools
 * 
 * Command line utilities for SportIntel development workflow
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SportIntelConfigManager } from '../../src/config/sportintel/development-config';
import SportIntelDatabaseUtils from './database-utils';
import { Logger } from '../../src/utils/logger';

const execAsync = promisify(exec);
const config = SportIntelConfigManager.getInstance();
const logger = Logger.getInstance();

interface CommandOptions {
  verbose?: boolean;
  environment?: string;
}

/**
 * Development Tools Class
 */
class SportIntelDevTools {
  private dbUtils: SportIntelDatabaseUtils;
  private spinner: ora.Ora;

  constructor() {
    this.dbUtils = new SportIntelDatabaseUtils();
    this.spinner = ora();
  }

  /**
   * Initialize development environment
   */
  async initializeEnvironment(options: CommandOptions): Promise<void> {
    this.spinner.start('Initializing SportIntel development environment...');

    try {
      // Check prerequisites
      await this.checkPrerequisites();

      // Setup databases
      await this.setupDatabases();

      // Install dependencies
      await this.installDependencies();

      // Generate configuration
      await this.generateConfiguration();

      this.spinner.succeed('Development environment initialized successfully!');
      
      console.log(chalk.green('\n✅ Next steps:'));
      console.log('1. Edit .env.sportintel with your API keys');
      console.log('2. Run: npm run dev:sportintel');
      console.log('3. Visit: http://localhost:3000');
    } catch (error) {
      this.spinner.fail('Failed to initialize development environment');
      console.error(chalk.red(error));
      process.exit(1);
    }
  }

  /**
   * Start development servers
   */
  async startDevelopment(options: CommandOptions): Promise<void> {
    this.spinner.start('Starting development servers...');

    try {
      // Start Docker services
      await execAsync('npm run docker:up');

      // Wait for services to be ready
      await this.waitForServices();

      // Start development processes
      const processes = [
        'npm run dev:server',
        'npm run dev:frontend',
        'npm run dev:ml',
      ];

      this.spinner.succeed('Starting all development processes...');
      
      console.log(chalk.blue('Starting concurrent processes:'));
      processes.forEach(cmd => console.log(`  ${chalk.cyan('•')} ${cmd}`));
      
      await execAsync('npm run dev:sportintel');
    } catch (error) {
      this.spinner.fail('Failed to start development servers');
      console.error(chalk.red(error));
      process.exit(1);
    }
  }

  /**
   * Run tests
   */
  async runTests(options: CommandOptions & { watch?: boolean; coverage?: boolean }): Promise<void> {
    const testType = options.watch ? 'watch mode' : 'single run';
    this.spinner.start(`Running SportIntel tests in ${testType}...`);

    try {
      let command = 'npm run test:sportintel';
      
      if (options.watch) {
        command = 'npm run test:watch';
      }

      if (options.coverage) {
        command += ' -- --coverage';
      }

      if (options.verbose) {
        command += ' -- --verbose';
      }

      await execAsync(command);
      this.spinner.succeed('All tests passed!');
    } catch (error) {
      this.spinner.fail('Some tests failed');
      if (options.verbose) {
        console.error(chalk.red(error));
      }
      process.exit(1);
    }
  }

  /**
   * Manage database
   */
  async manageDatabase(action: string, options: CommandOptions): Promise<void> {
    this.spinner.start(`Database ${action}...`);

    try {
      await this.dbUtils.connect();

      switch (action) {
        case 'migrate':
          await this.dbUtils.runMigrations();
          break;
        case 'seed':
          await this.dbUtils.seedDatabase();
          break;
        case 'reset':
          await this.dbUtils.resetDatabase();
          await this.dbUtils.runMigrations();
          await this.dbUtils.seedDatabase();
          break;
        case 'health':
          const health = await this.dbUtils.healthCheck();
          this.spinner.succeed('Database health check completed');
          console.log(chalk.blue('Health Status:'));
          console.log(`  PostgreSQL: ${health.postgres ? chalk.green('✓') : chalk.red('✗')}`);
          console.log(`  Redis: ${health.redis ? chalk.green('✓') : chalk.red('✗')}`);
          return;
        case 'stats':
          const stats = await this.dbUtils.getStatistics();
          this.spinner.succeed('Database statistics retrieved');
          console.log(chalk.blue('Statistics:'));
          console.log(JSON.stringify(stats, null, 2));
          return;
        default:
          throw new Error(`Unknown database action: ${action}`);
      }

      this.spinner.succeed(`Database ${action} completed successfully!`);
    } catch (error) {
      this.spinner.fail(`Database ${action} failed`);
      console.error(chalk.red(error));
      process.exit(1);
    } finally {
      await this.dbUtils.disconnect();
    }
  }

  /**
   * Generate code
   */
  async generateCode(type: string, name: string, options: CommandOptions): Promise<void> {
    this.spinner.start(`Generating ${type}: ${name}...`);

    try {
      switch (type) {
        case 'agent':
          await this.generateAgent(name);
          break;
        case 'plugin':
          await this.generatePlugin(name);
          break;
        case 'component':
          await this.generateComponent(name);
          break;
        case 'test':
          await this.generateTest(name);
          break;
        default:
          throw new Error(`Unknown generation type: ${type}`);
      }

      this.spinner.succeed(`Generated ${type}: ${name}`);
    } catch (error) {
      this.spinner.fail(`Failed to generate ${type}: ${name}`);
      console.error(chalk.red(error));
      process.exit(1);
    }
  }

  /**
   * Lint and format code
   */
  async lintAndFormat(options: CommandOptions & { fix?: boolean }): Promise<void> {
    this.spinner.start('Linting and formatting code...');

    try {
      const commands = [
        'npm run lint:sportintel',
        'npm run format:sportintel',
      ];

      if (options.fix) {
        commands[0] += ' -- --fix';
      }

      for (const command of commands) {
        await execAsync(command);
      }

      this.spinner.succeed('Code linting and formatting completed!');
    } catch (error) {
      this.spinner.fail('Linting or formatting issues found');
      if (options.verbose) {
        console.error(chalk.red(error));
      }
      process.exit(1);
    }
  }

  /**
   * Build for production
   */
  async buildProduction(options: CommandOptions): Promise<void> {
    this.spinner.start('Building for production...');

    try {
      await execAsync('npm run build:sportintel');
      this.spinner.succeed('Production build completed!');
      
      console.log(chalk.green('\n📦 Build artifacts:'));
      console.log('  Backend: ./dist/');
      console.log('  Frontend: ./frontend/build/');
      console.log('  Docker: docker-compose.sportintel.yml');
    } catch (error) {
      this.spinner.fail('Production build failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  }

  /**
   * Clean development artifacts
   */
  async cleanArtifacts(options: CommandOptions): Promise<void> {
    this.spinner.start('Cleaning development artifacts...');

    try {
      const cleanupPaths = [
        'dist',
        'node_modules/.cache',
        'frontend/build',
        'coverage',
        'logs',
        '.nyc_output',
      ];

      for (const cleanupPath of cleanupPaths) {
        try {
          await fs.rm(cleanupPath, { recursive: true, force: true });
        } catch (error) {
          // Ignore if path doesn't exist
        }
      }

      // Clear caches
      await execAsync('npm run cache:clear').catch(() => {});

      this.spinner.succeed('Development artifacts cleaned!');
    } catch (error) {
      this.spinner.fail('Failed to clean artifacts');
      console.error(chalk.red(error));
      process.exit(1);
    }
  }

  /**
   * Show system information
   */
  async showSystemInfo(options: CommandOptions): Promise<void> {
    console.log(chalk.blue('🏟️  SportIntel Development Environment Info\n'));

    try {
      // Environment info
      console.log(chalk.yellow('Environment:'));
      console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Config: ${config.getConfig().environment}`);
      console.log('');

      // Version info
      const { stdout: nodeVersion } = await execAsync('node --version');
      const { stdout: npmVersion } = await execAsync('npm --version');
      
      console.log(chalk.yellow('Versions:'));
      console.log(`  Node.js: ${nodeVersion.trim()}`);
      console.log(`  npm: ${npmVersion.trim()}`);
      console.log('');

      // Docker info
      try {
        const { stdout: dockerVersion } = await execAsync('docker --version');
        console.log(`  Docker: ${dockerVersion.trim()}`);
      } catch (error) {
        console.log(`  Docker: ${chalk.red('Not available')}`);
      }
      console.log('');

      // Database health
      await this.dbUtils.connect();
      const health = await this.dbUtils.healthCheck();
      
      console.log(chalk.yellow('Database Health:'));
      console.log(`  PostgreSQL: ${health.postgres ? chalk.green('✓ Connected') : chalk.red('✗ Disconnected')}`);
      console.log(`  Redis: ${health.redis ? chalk.green('✓ Connected') : chalk.red('✗ Disconnected')}`);
      console.log('');

      // Feature flags
      const features = config.getSection('features');
      console.log(chalk.yellow('Features:'));
      Object.entries(features).forEach(([feature, enabled]) => {
        const status = enabled ? chalk.green('✓') : chalk.gray('✗');
        console.log(`  ${feature}: ${status}`);
      });
      console.log('');

      // API providers
      const providers = config.getSection('api').providers;
      console.log(chalk.yellow('API Providers:'));
      Object.entries(providers).forEach(([provider, providerConfig]) => {
        const status = providerConfig.enabled ? chalk.green('✓') : chalk.gray('✗');
        console.log(`  ${provider}: ${status}`);
      });

      await this.dbUtils.disconnect();
    } catch (error) {
      console.error(chalk.red('Failed to retrieve system info:'), error);
    }
  }

  // Private helper methods

  private async checkPrerequisites(): Promise<void> {
    const requirements = [
      { cmd: 'node --version', name: 'Node.js' },
      { cmd: 'npm --version', name: 'npm' },
      { cmd: 'docker --version', name: 'Docker' },
    ];

    for (const req of requirements) {
      try {
        await execAsync(req.cmd);
      } catch (error) {
        throw new Error(`${req.name} is not installed or not available in PATH`);
      }
    }
  }

  private async setupDatabases(): Promise<void> {
    await execAsync('npm run docker:up');
    await this.waitForServices();
  }

  private async installDependencies(): Promise<void> {
    await execAsync('npm install');
  }

  private async generateConfiguration(): Promise<void> {
    // Configuration is automatically generated by SportIntelConfigManager
    const configExport = config.exportConfig(false);
    await fs.writeFile(
      'config.sportintel.json',
      JSON.stringify(configExport, null, 2)
    );
  }

  private async waitForServices(): Promise<void> {
    let retries = 30;
    while (retries > 0) {
      try {
        await this.dbUtils.connect();
        const health = await this.dbUtils.healthCheck();
        if (health.postgres && health.redis) {
          await this.dbUtils.disconnect();
          return;
        }
        await this.dbUtils.disconnect();
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries--;
    }
    
    throw new Error('Services failed to start within timeout');
  }

  private async generateAgent(name: string): Promise<void> {
    const agentTemplate = `
/**
 * ${name} Agent
 * Generated SportIntel Trinity AI Agent
 */

import { BaseAgent } from '../../base-agent';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';

export class ${name}Agent extends BaseAgent {
  constructor() {
    super('${name.toLowerCase()}', SportIntelConfigManager.getInstance());
  }

  async process(input: any): Promise<any> {
    // TODO: Implement ${name} agent logic
    return { result: 'Not implemented' };
  }
}

export default ${name}Agent;
`;

    const agentPath = `src/agents/sportintel/${name.toLowerCase()}-agent.ts`;
    await fs.writeFile(agentPath, agentTemplate.trim());
  }

  private async generatePlugin(name: string): Promise<void> {
    const pluginTemplate = `
/**
 * ${name} Plugin
 * Generated SportIntel Plugin
 */

import { BasePlugin } from '../../plugins/base-plugin';

export class ${name}Plugin extends BasePlugin {
  getName(): string {
    return '${name.toLowerCase()}';
  }

  async initialize(): Promise<void> {
    // TODO: Initialize ${name} plugin
  }

  async process(data: any): Promise<any> {
    // TODO: Implement ${name} plugin logic
    return data;
  }
}

export default ${name}Plugin;
`;

    const pluginPath = `src/plugins/sportintel/${name.toLowerCase()}-plugin.ts`;
    await fs.writeFile(pluginPath, pluginTemplate.trim());
  }

  private async generateComponent(name: string): Promise<void> {
    const componentTemplate = `
/**
 * ${name} Component
 * Generated SportIntel React Component
 */

import React from 'react';
import './${name}.css';

interface ${name}Props {
  // TODO: Define component props
}

const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div className="${name.toLowerCase()}">
      <h2>${name}</h2>
      {/* TODO: Implement component */}
    </div>
  );
};

export default ${name};
`;

    const componentPath = `frontend/src/components/sportintel/${name}.tsx`;
    await fs.writeFile(componentPath, componentTemplate.trim());
  }

  private async generateTest(name: string): Promise<void> {
    const testTemplate = `
/**
 * ${name} Tests
 * Generated SportIntel Test Suite
 */

import { ${name} } from '../${name.toLowerCase()}';

describe('${name}', () => {
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup after tests
  });

  it('should be defined', () => {
    expect(${name}).toBeDefined();
  });

  // TODO: Add more tests
});
`;

    const testPath = `src/test/sportintel/${name.toLowerCase()}.test.ts`;
    await fs.writeFile(testPath, testTemplate.trim());
  }
}

// CLI Program Definition
program
  .name('sportintel-dev')
  .description('SportIntel Development Tools')
  .version('1.0.0')
  .option('-v, --verbose', 'verbose output')
  .option('-e, --environment <env>', 'environment', 'development');

// Initialize command
program
  .command('init')
  .description('Initialize SportIntel development environment')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.initializeEnvironment({ ...program.opts(), ...options });
  });

// Start command
program
  .command('start')
  .description('Start development servers')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.startDevelopment({ ...program.opts(), ...options });
  });

// Test commands
program
  .command('test')
  .description('Run tests')
  .option('-w, --watch', 'watch mode')
  .option('-c, --coverage', 'generate coverage report')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.runTests({ ...program.opts(), ...options });
  });

// Database commands
program
  .command('db <action>')
  .description('Database management (migrate, seed, reset, health, stats)')
  .action(async (action, options) => {
    const tools = new SportIntelDevTools();
    await tools.manageDatabase(action, { ...program.opts(), ...options });
  });

// Generate commands
program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate code (agent, plugin, component, test)')
  .action(async (type, name, options) => {
    const tools = new SportIntelDevTools();
    await tools.generateCode(type, name, { ...program.opts(), ...options });
  });

// Lint command
program
  .command('lint')
  .description('Lint and format code')
  .option('-f, --fix', 'automatically fix issues')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.lintAndFormat({ ...program.opts(), ...options });
  });

// Build command
program
  .command('build')
  .description('Build for production')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.buildProduction({ ...program.opts(), ...options });
  });

// Clean command
program
  .command('clean')
  .description('Clean development artifacts')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.cleanArtifacts({ ...program.opts(), ...options });
  });

// Info command
program
  .command('info')
  .description('Show system information')
  .action(async (options) => {
    const tools = new SportIntelDevTools();
    await tools.showSystemInfo({ ...program.opts(), ...options });
  });

// Parse CLI arguments
program.parse();

export { SportIntelDevTools };
export default program;