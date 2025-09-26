#!/usr/bin/env node

/**
 * OpenConductor NPX Installer
 * Usage: npx @openconductor/install
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
};

class OpenConductorInstaller {
  constructor() {
    this.installDir = process.env.OPENCONDUCTOR_INSTALL_DIR || path.join(os.homedir(), '.openconductor');
    this.version = process.env.OPENCONDUCTOR_VERSION || 'latest';
    this.environment = {};
    this.recommendedServers = [];
    this.installationLog = [];
  }

  // Logging methods
  log(message) {
    console.log(`${colors.green}[OpenConductor]${colors.reset} ${message}`);
    this.installationLog.push(`[${new Date().toISOString()}] ${message}`);
  }

  warn(message) {
    console.log(`${colors.yellow}[OpenConductor]${colors.reset} ⚠️  ${message}`);
    this.installationLog.push(`[${new Date().toISOString()}] WARNING: ${message}`);
  }

  error(message) {
    console.error(`${colors.red}[OpenConductor]${colors.reset} ❌ ${message}`);
    this.installationLog.push(`[${new Date().toISOString()}] ERROR: ${message}`);
  }

  success(message) {
    console.log(`${colors.green}[OpenConductor]${colors.reset} ✅ ${message}`);
    this.installationLog.push(`[${new Date().toISOString()}] SUCCESS: ${message}`);
  }

  info(message) {
    console.log(`${colors.blue}[OpenConductor]${colors.reset} ℹ️  ${message}`);
    this.installationLog.push(`[${new Date().toISOString()}] INFO: ${message}`);
  }

  // Show installation banner
  showBanner() {
    console.log(colors.cyan);
    console.log(`
   ____                   _____                _            _             
  / __ \\                 / ____|              | |          | |            
 | |  | |_ __   ___ _ __ | |     ___  _ __   __| |_   _  ___| |_ ___  _ __ 
 | |  | | '_ \\ / _ \\ '_ \\| |    / _ \\| '_ \\ / _\`| | | |/ __| __/ _ \\| '__|
 | |__| | |_) |  __/ | | | |___| (_) | | | | (_| | |_| | (__| || (_) | |   
  \\____/| .__/ \\___|_| |_|\\_____\\___/|_| |_|\\__,_|\\__,_|\\___|\\__\\___/|_|   
        | |                                                               
        |_|                                                               

        🚀 The Open-Source Intelligent Internal Developer Platform
        
`);
    console.log(colors.reset);
    this.log('Starting OpenConductor installation...');
    this.log('This will take about 2-5 minutes and get you to your first working workflow in under 15 minutes!');
  }

  // Detect development environment
  async detectEnvironment() {
    this.info('🔍 Detecting your development environment...');
    
    const env = {
      os: process.platform,
      node: process.version,
      npm: this.getCommandVersion('npm'),
      yarn: this.getCommandVersion('yarn'),
      pnpm: this.getCommandVersion('pnpm'),
      tools: this.detectDevelopmentTools(),
      project: this.detectProjectType(),
      cloudProviders: this.detectCloudProviders(),
      databases: this.detectDatabases(),
      cicd: this.detectCICDTools(),
    };

    this.environment = env;
    this.success(`Environment detection complete! Detected ${Object.keys(env.tools).length} development tools.`);
    return env;
  }

  // Get version of a command
  getCommandVersion(command) {
    try {
      const version = execSync(`${command} --version`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      return version.trim();
    } catch {
      return null;
    }
  }

  // Detect development tools
  detectDevelopmentTools() {
    const tools = {};
    
    // Version control
    if (this.commandExists('git')) tools.git = this.getCommandVersion('git');
    
    // Container tools
    if (this.commandExists('docker')) tools.docker = this.getCommandVersion('docker');
    if (this.commandExists('kubectl')) tools.kubernetes = this.getCommandVersion('kubectl');
    
    // Monitoring
    if (fs.existsSync('prometheus.yml') || fs.existsSync('./prometheus')) tools.prometheus = true;
    if (fs.existsSync('./grafana')) tools.grafana = true;
    
    // Communication
    if (fs.existsSync('.slack-config') || process.env.SLACK_TOKEN) tools.slack = true;
    
    this.success(`Found development tools: ${Object.keys(tools).join(', ')}`);
    return tools;
  }

  // Detect project type
  detectProjectType() {
    const cwd = process.cwd();
    
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
      this.success('Detected Node.js project');
      return 'nodejs';
    }
    
    if (fs.existsSync(path.join(cwd, 'requirements.txt')) || 
        fs.existsSync(path.join(cwd, 'pyproject.toml'))) {
      this.success('Detected Python project');
      return 'python';
    }
    
    if (fs.existsSync(path.join(cwd, 'Cargo.toml'))) {
      this.success('Detected Rust project');
      return 'rust';
    }
    
    if (fs.existsSync(path.join(cwd, 'go.mod'))) {
      this.success('Detected Go project');
      return 'go';
    }
    
    if (fs.existsSync(path.join(cwd, 'Dockerfile'))) {
      this.success('Detected Docker project');
      return 'docker';
    }
    
    return 'generic';
  }

  // Detect cloud providers
  detectCloudProviders() {
    const providers = {};
    
    if (this.commandExists('aws')) providers.aws = true;
    if (this.commandExists('gcloud')) providers.gcp = true;
    if (this.commandExists('az')) providers.azure = true;
    
    if (Object.keys(providers).length > 0) {
      this.success(`Detected cloud providers: ${Object.keys(providers).join(', ')}`);
    }
    
    return providers;
  }

  // Detect databases
  detectDatabases() {
    const databases = {};
    
    if (this.commandExists('psql')) databases.postgresql = true;
    if (this.commandExists('mysql')) databases.mysql = true;
    if (this.commandExists('redis-cli')) databases.redis = true;
    if (this.commandExists('mongo')) databases.mongodb = true;
    
    if (Object.keys(databases).length > 0) {
      this.success(`Detected databases: ${Object.keys(databases).join(', ')}`);
    }
    
    return databases;
  }

  // Detect CI/CD tools
  detectCICDTools() {
    const cicd = {};
    
    if (fs.existsSync('.github/workflows')) cicd.github_actions = true;
    if (fs.existsSync('.gitlab-ci.yml')) cicd.gitlab_ci = true;
    if (fs.existsSync('Jenkinsfile')) cicd.jenkins = true;
    if (fs.existsSync('.circleci/config.yml')) cicd.circleci = true;
    
    if (Object.keys(cicd).length > 0) {
      this.success(`Detected CI/CD: ${Object.keys(cicd).join(', ')}`);
    }
    
    return cicd;
  }

  // Check if command exists
  commandExists(command) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  // Generate intelligent server recommendations
  generateServerRecommendations() {
    this.info('🤖 Analyzing your environment to recommend MCP servers...');
    
    const recommendations = [];
    
    // Base recommendations
    recommendations.push({
      name: 'file-manager',
      description: 'Essential file operations and management',
      priority: 'high',
      category: 'core'
    });
    
    recommendations.push({
      name: 'git-tools',
      description: 'Git repository management and automation',
      priority: 'high',
      category: 'development'
    });

    // Tool-specific recommendations
    if (this.environment.tools?.docker) {
      recommendations.push({
        name: 'docker-manager',
        description: 'Docker container management and automation',
        priority: 'high',
        category: 'containers'
      });
    }

    if (this.environment.tools?.kubernetes) {
      recommendations.push({
        name: 'k8s-operator',
        description: 'Kubernetes cluster operations and management',
        priority: 'high',
        category: 'orchestration'
      });
    }

    if (this.environment.cloudProviders?.aws) {
      recommendations.push({
        name: 'aws-toolkit',
        description: 'AWS cloud operations and resource management',
        priority: 'medium',
        category: 'cloud'
      });
    }

    if (this.environment.cloudProviders?.gcp) {
      recommendations.push({
        name: 'gcp-toolkit',
        description: 'Google Cloud Platform operations',
        priority: 'medium',
        category: 'cloud'
      });
    }

    if (this.environment.databases?.postgresql) {
      recommendations.push({
        name: 'postgres-admin',
        description: 'PostgreSQL database administration and queries',
        priority: 'medium',
        category: 'database'
      });
    }

    if (this.environment.databases?.redis) {
      recommendations.push({
        name: 'redis-manager',
        description: 'Redis cache management and operations',
        priority: 'medium',
        category: 'database'
      });
    }

    if (this.environment.tools?.slack) {
      recommendations.push({
        name: 'slack-integration',
        description: 'Team communication and workflow notifications',
        priority: 'medium',
        category: 'communication'
      });
    }

    if (this.environment.tools?.prometheus) {
      recommendations.push({
        name: 'prometheus-metrics',
        description: 'Monitoring, alerting, and metrics collection',
        priority: 'medium',
        category: 'monitoring'
      });
    }

    // Project-specific recommendations
    if (this.environment.project === 'nodejs') {
      recommendations.push({
        name: 'npm-manager',
        description: 'NPM package management and automation',
        priority: 'high',
        category: 'development'
      });
    }

    if (this.environment.project === 'python') {
      recommendations.push({
        name: 'python-toolkit',
        description: 'Python development tools and package management',
        priority: 'high',
        category: 'development'
      });
    }

    // CI/CD recommendations
    if (this.environment.cicd?.github_actions) {
      recommendations.push({
        name: 'github-actions',
        description: 'GitHub Actions workflow automation',
        priority: 'medium',
        category: 'cicd'
      });
    }

    this.recommendedServers = recommendations;
    this.success(`Generated ${recommendations.length} personalized server recommendations!`);
    
    return recommendations;
  }

  // Setup installation directory
  async setupInstallDirectory() {
    this.info(`Setting up installation directory: ${this.installDir}`);
    
    // Create directories
    const dirs = [
      this.installDir,
      path.join(this.installDir, 'data'),
      path.join(this.installDir, 'logs'),
      path.join(this.installDir, 'servers'),
      path.join(this.installDir, 'workflows'),
      path.join(this.installDir, 'templates')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    this.success('Installation directory created!');
  }

  // Install OpenConductor core
  async installCore() {
    this.info('Installing OpenConductor core platform...');
    
    // Change to install directory
    process.chdir(this.installDir);
    
    // Create package.json if it doesn't exist
    const packageJsonPath = path.join(this.installDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: 'openconductor-installation',
        version: '1.0.0',
        description: 'OpenConductor platform installation',
        private: true,
        scripts: {
          start: 'openconductor start',
          dev: 'openconductor dev',
          stop: 'openconductor stop'
        }
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    // Determine package manager
    let installCommand;
    if (this.environment.pnpm) {
      installCommand = `pnpm install @openconductor/core@${this.version}`;
    } else if (this.environment.yarn) {
      installCommand = `yarn add @openconductor/core@${this.version}`;
    } else {
      installCommand = `npm install @openconductor/core@${this.version}`;
    }
    
    // Execute installation
    try {
      execSync(installCommand, { stdio: 'inherit' });
      this.success('OpenConductor core installed!');
    } catch (error) {
      throw new Error(`Failed to install OpenConductor core: ${error.message}`);
    }
  }

  // Create configuration
  async createConfiguration() {
    this.info('📝 Creating your personalized configuration...');
    
    const config = {
      version: '1.0.0',
      environment: this.environment,
      installation: {
        date: new Date().toISOString(),
        version: this.version,
        autoConfigured: true,
        installer: 'npx'
      },
      trinity: {
        oracle: {
          enabled: true,
          autoRecommendations: true,
          predictionModels: ['server-compatibility', 'workflow-optimization']
        },
        sentinel: {
          enabled: true,
          autoMonitoring: true,
          healthChecks: ['servers', 'workflows', 'system']
        },
        sage: {
          enabled: true,
          autoAdvice: true,
          advisoryDomains: ['performance', 'security', 'best-practices']
        }
      },
      servers: {
        autoInstall: true,
        recommendations: this.recommendedServers,
        installationMethod: 'npm'
      },
      onboarding: {
        completed: false,
        targetTime: 900, // 15 minutes
        personalizedFlow: true
      },
      ui: {
        theme: 'bloomberg-terminal',
        mode: 'guided',
        showAdvancedFeatures: false
      }
    };
    
    const configPath = path.join(this.installDir, 'openconductor.config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    this.success('Configuration created!');
    return config;
  }

  // Create server installation queue
  async createServerQueue() {
    const serverQueue = {
      autoInstall: true,
      installationOrder: this.recommendedServers.map((server, index) => ({
        ...server,
        order: index + 1,
        autoInstall: true,
        installationMethod: this.environment.pnpm ? 'pnpm' : 
                           this.environment.yarn ? 'yarn' : 'npm'
      }))
    };
    
    const queuePath = path.join(this.installDir, 'server-queue.json');
    fs.writeFileSync(queuePath, JSON.stringify(serverQueue, null, 2));
    
    this.success('Server installation queue created!');
  }

  // Create quick start scripts
  async createQuickStart() {
    this.info('📋 Creating quick start commands...');
    
    // Create start script
    const startScript = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting OpenConductor...');
const child = spawn('npx', ['@openconductor/core', 'start', '--config', 'openconductor.config.json'], {
  cwd: __dirname,
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start OpenConductor:', error);
  process.exit(1);
});
`;

    const devScript = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

console.log('🛠️  Starting OpenConductor in development mode...');
const child = spawn('npx', ['@openconductor/core', 'dev', '--config', 'openconductor.config.json'], {
  cwd: __dirname,
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start OpenConductor:', error);
  process.exit(1);
});
`;

    fs.writeFileSync(path.join(this.installDir, 'start.js'), startScript);
    fs.writeFileSync(path.join(this.installDir, 'dev.js'), devScript);
    
    // Make executable
    fs.chmodSync(path.join(this.installDir, 'start.js'), '755');
    fs.chmodSync(path.join(this.installDir, 'dev.js'), '755');
    
    this.success('Quick start scripts created!');
  }

  // Complete installation
  async completeInstallation() {
    this.success('🎉 OpenConductor installation complete!');
    
    console.log();
    console.log(colors.cyan + '━'.repeat(100) + colors.reset);
    console.log(`${colors.green}  Installation Summary${colors.reset}`);
    console.log(colors.cyan + '━'.repeat(100) + colors.reset);
    console.log();
    console.log(`${colors.blue}  📁 Installation Directory:${colors.reset} ${this.installDir}`);
    console.log(`${colors.blue}  🤖 Recommended Servers:${colors.reset} ${this.recommendedServers.length} servers queued`);
    console.log(`${colors.blue}  ⚡ Trinity AI Agents:${colors.reset} Oracle, Sentinel, and Sage enabled`);
    console.log(`${colors.blue}  🎯 Target Setup Time:${colors.reset} 15 minutes to first workflow`);
    console.log(`${colors.blue}  🛠️  Project Type:${colors.reset} ${this.environment.project}`);
    console.log(`${colors.blue}  🔧 Development Tools:${colors.reset} ${Object.keys(this.environment.tools).length} detected`);
    console.log();
    console.log(colors.cyan + '━'.repeat(100) + colors.reset);
    console.log(`${colors.green}  Next Steps${colors.reset}`);
    console.log(colors.cyan + '━'.repeat(100) + colors.reset);
    console.log();
    console.log(`${colors.yellow}  1. Start OpenConductor:${colors.reset}`);
    console.log(`     ${colors.blue}cd ${this.installDir} && node start.js${colors.reset}`);
    console.log();
    console.log(`${colors.yellow}  2. Open your browser:${colors.reset}`);
    console.log(`     ${colors.blue}http://localhost:3000${colors.reset}`);
    console.log();
    console.log(`${colors.yellow}  3. Complete the 15-minute onboarding:${colors.reset}`);
    console.log(`     ${colors.blue}Follow the guided setup to create your first workflow${colors.reset}`);
    console.log();
    console.log(`${colors.yellow}  4. Get help:${colors.reset}`);
    console.log(`     ${colors.blue}https://docs.openconductor.ai${colors.reset}`);
    console.log();
    console.log(colors.cyan + '━'.repeat(100) + colors.reset);
    console.log();
    console.log(`${colors.green}🚀 Ready to start your OpenConductor journey!${colors.reset}`);
  }

  // Main installation flow
  async install() {
    try {
      this.showBanner();
      
      await this.detectEnvironment();
      
      this.generateServerRecommendations();
      
      await this.setupInstallDirectory();
      
      await this.installCore();
      
      await this.createConfiguration();
      
      await this.createServerQueue();
      
      await this.createQuickStart();
      
      await this.completeInstallation();
      
    } catch (error) {
      this.error(`Installation failed: ${error.message}`);
      console.log('\nInstallation log:');
      console.log(this.installationLog.join('\n'));
      console.log('\nPlease report this issue at: https://github.com/openconductor/core/issues');
      process.exit(1);
    }
  }
}

// Run installer
if (require.main === module) {
  const installer = new OpenConductorInstaller();
  installer.install();
}

module.exports = OpenConductorInstaller;