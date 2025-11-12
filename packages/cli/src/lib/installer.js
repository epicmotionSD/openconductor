import { execa } from 'execa';
import { access } from 'fs/promises';
import { logger } from '../utils/logger.js';

/**
 * Handles installation of MCP servers via npm, docker, or manual
 */
export class Installer {
  /**
   * Install a server based on its installation method
   */
  async install(server) {
    const { installation } = server;
    
    if (installation.npm) {
      return this.installNpm(installation.npm, server);
    } else if (installation.docker) {
      return this.installDocker(installation.docker, server);
    } else if (installation.manual) {
      throw new Error('Manual installation not yet supported via CLI. Please follow instructions at: ' + server.repository.url);
    } else {
      throw new Error('No supported installation method found for this server');
    }
  }

  /**
   * Install via npm
   */
  async installNpm(packageName, server) {
    try {
      // Check if package is global or local
      const isGlobal = packageName.startsWith('@') || !packageName.includes('/');
      
      // Install the package
      const installArgs = isGlobal 
        ? ['install', '-g', packageName]
        : ['install', packageName];
      
      await execa('npm', installArgs, {
        stdio: process.env.DEBUG ? 'inherit' : 'pipe'
      });

      // Determine command
      let command;
      if (isGlobal) {
        // Global package - command is usually package name without scope
        const commandName = packageName.split('/').pop();
        command = commandName;
      } else {
        // Local package - use npx
        command = 'npx';
      }

      return {
        path: packageName,
        command,
        args: isGlobal ? [] : ['-y', packageName],
        method: 'npm'
      };
    } catch (error) {
      throw new Error(`Failed to install npm package: ${error.message}`);
    }
  }

  /**
   * Install via docker
   */
  async installDocker(imageName, server) {
    try {
      // Check if docker is available
      await execa('docker', ['--version']);

      // Pull the image
      await execa('docker', ['pull', imageName], {
        stdio: process.env.DEBUG ? 'inherit' : 'pipe'
      });

      return {
        path: imageName,
        command: 'docker',
        args: [
          'run',
          '--rm',
          '-i',
          '--name', `mcp-${server.slug}`,
          imageName
        ],
        method: 'docker'
      };
    } catch (error) {
      if (error.message.includes('docker: command not found')) {
        throw new Error('Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/');
      }
      throw new Error(`Failed to install docker image: ${error.message}`);
    }
  }

  /**
   * Uninstall a server
   */
  async uninstall(server, installMethod) {
    if (installMethod === 'npm') {
      return this.uninstallNpm(server.installation.npm);
    } else if (installMethod === 'docker') {
      return this.uninstallDocker(server.installation.docker);
    }
  }

  /**
   * Uninstall npm package
   */
  async uninstallNpm(packageName) {
    try {
      const isGlobal = packageName.startsWith('@') || !packageName.includes('/');
      const uninstallArgs = isGlobal
        ? ['uninstall', '-g', packageName]
        : ['uninstall', packageName];
      
      await execa('npm', uninstallArgs, {
        stdio: process.env.DEBUG ? 'inherit' : 'pipe'
      });
    } catch (error) {
      // Non-critical if package wasn't installed
      if (process.env.DEBUG) {
        logger.warn(`Failed to uninstall ${packageName}:`, error.message);
      }
    }
  }

  /**
   * Uninstall docker image
   */
  async uninstallDocker(imageName) {
    try {
      await execa('docker', ['rmi', imageName], {
        stdio: process.env.DEBUG ? 'inherit' : 'pipe'
      });
    } catch (error) {
      if (process.env.DEBUG) {
        logger.warn(`Failed to remove docker image ${imageName}:`, error.message);
      }
    }
  }

  /**
   * Check if a package/image is already installed
   */
  async isInstalled(packageName, method = 'npm') {
    try {
      if (method === 'npm') {
        const { stdout } = await execa('npm', ['list', '-g', packageName, '--depth=0']);
        return stdout.includes(packageName);
      } else if (method === 'docker') {
        const { stdout } = await execa('docker', ['images', packageName, '-q']);
        return stdout.trim().length > 0;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Check system requirements
   */
  async checkRequirements(server) {
    const requirements = server.requirements || {};
    const issues = [];

    // Check Node.js version
    if (requirements.node) {
      const currentNode = process.version;
      // Simple version check - could be enhanced with semver
      if (!this.satisfiesVersion(currentNode, requirements.node)) {
        issues.push(`Node.js ${requirements.node} required (current: ${currentNode})`);
      }
    }

    // Check Docker if needed
    if (requirements.docker || server.installation.docker) {
      try {
        await execa('docker', ['--version']);
      } catch (error) {
        issues.push('Docker is required but not installed');
      }
    }

    // Check Python if needed
    if (requirements.python) {
      try {
        await execa('python', ['--version']);
      } catch (error) {
        try {
          await execa('python3', ['--version']);
        } catch (error2) {
          issues.push(`Python ${requirements.python} required but not found`);
        }
      }
    }

    return {
      satisfied: issues.length === 0,
      issues
    };
  }

  /**
   * Simple version satisfaction check
   * TODO: Replace with proper semver comparison
   */
  satisfiesVersion(current, required) {
    // Strip 'v' prefix if present
    current = current.replace(/^v/, '');
    required = required.replace(/^>=?\s*/, '');

    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }

    return true; // Equal
  }

  /**
   * Get installation status for a server
   */
  async getInstallStatus(server) {
    const status = {
      installed: false,
      method: null,
      version: null,
      issues: []
    };

    // Check npm installation
    if (server.installation.npm) {
      const isInstalled = await this.isInstalled(server.installation.npm, 'npm');
      if (isInstalled) {
        status.installed = true;
        status.method = 'npm';
        // TODO: Get actual version
        status.version = 'unknown';
      }
    }

    // Check docker installation
    if (server.installation.docker && !status.installed) {
      const isInstalled = await this.isInstalled(server.installation.docker, 'docker');
      if (isInstalled) {
        status.installed = true;
        status.method = 'docker';
      }
    }

    // Check requirements
    const reqCheck = await this.checkRequirements(server);
    status.issues = reqCheck.issues;

    return status;
  }
}