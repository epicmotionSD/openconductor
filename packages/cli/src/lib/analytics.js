import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { ApiClient } from './api-client.js';
import { logger } from '../utils/logger.js';

/**
 * Anonymous analytics tracking for OpenConductor CLI
 * All tracking is opt-in and anonymous by default
 */
export class Analytics {
  constructor() {
    this.configDir = this.getAnalyticsConfigDir();
    this.configPath = join(this.configDir, 'analytics.json');
    this.enabled = null; // null = not set, true/false = user choice
  }

  /**
   * Get analytics configuration directory
   */
  getAnalyticsConfigDir() {
    const platform = process.platform;
    
    if (platform === 'darwin') {
      return join(homedir(), 'Library/Application Support/OpenConductor');
    } else if (platform === 'win32') {
      const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
      return join(appData, 'OpenConductor');
    } else {
      const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
      return join(configHome, 'openconductor');
    }
  }

  /**
   * Check if analytics is enabled
   */
  async isEnabled() {
    if (this.enabled !== null) {
      return this.enabled;
    }

    try {
      if (existsSync(this.configPath)) {
        const content = await readFile(this.configPath, 'utf-8');
        const config = JSON.parse(content);
        this.enabled = config.enabled === true;
      } else {
        // First time - prompt user
        await this.promptForConsent();
      }
    } catch (error) {
      // Default to disabled on error
      this.enabled = false;
    }

    return this.enabled;
  }

  /**
   * Prompt user for analytics consent on first use
   */
  async promptForConsent() {
    console.log();
    logger.info('📊 Help improve OpenConductor');
    console.log();
    console.log('OpenConductor collects anonymous usage data to improve the CLI experience.');
    console.log('This includes:');
    console.log('  • Commands used (discover, install, etc.)');
    console.log('  • Installation success/failure rates');
    console.log('  • Popular MCP servers');
    console.log('  • Error frequency (no personal data)');
    console.log();
    console.log('This data is:');
    console.log('  ✓ Completely anonymous (no personal information)');
    console.log('  ✓ Used only to improve OpenConductor');
    console.log('  ✓ Never shared with third parties');
    console.log('  ✓ Can be disabled at any time');
    console.log();

    const { enableAnalytics } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableAnalytics',
        message: 'Enable anonymous analytics?',
        default: true
      }
    ]);

    await this.setEnabled(enableAnalytics);
    
    if (enableAnalytics) {
      logger.success('✓ Analytics enabled. Thank you for helping improve OpenConductor!');
      console.log();
      logger.info('You can disable analytics anytime with:');
      logger.progress(logger.code('openconductor analytics --disable'));
    } else {
      logger.info('Analytics disabled. You can enable them later with:');
      logger.progress(logger.code('openconductor analytics --enable'));
    }
    
    console.log();
  }

  /**
   * Enable or disable analytics
   */
  async setEnabled(enabled) {
    try {
      await mkdir(this.configDir, { recursive: true });
      
      const config = {
        enabled,
        userId: this.generateUserId(),
        consentDate: new Date().toISOString(),
        version: '1.0.0'
      };

      await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      this.enabled = enabled;
      
      return true;
    } catch (error) {
      logger.debug('Failed to save analytics preference:', error.message);
      return false;
    }
  }

  /**
   * Track a CLI event
   */
  async trackEvent(eventName, properties = {}) {
    try {
      const isAnalyticsEnabled = await this.isEnabled();
      if (!isAnalyticsEnabled) {
        return;
      }

      const api = new ApiClient();
      
      const eventData = {
        event: eventName,
        properties: {
          ...properties,
          platform: process.platform,
          nodeVersion: process.version,
          cliVersion: this.getCLIVersion(),
          timestamp: new Date().toISOString()
        },
        userId: await this.getUserId()
      };

      // Send to analytics endpoint (fire and forget)
      api.trackEvent(eventData).catch(error => {
        // Fail silently - analytics should never break the CLI
        logger.debug('Analytics tracking failed:', error.message);
      });

    } catch (error) {
      // Always fail silently for analytics
      logger.debug('Analytics error:', error.message);
    }
  }

  /**
   * Track install event
   */
  async trackInstall(serverId, serverName, method, success = true) {
    await this.trackEvent('server_install', {
      serverId,
      serverName,
      method,
      success
    });
  }

  /**
   * Track search event  
   */
  async trackSearch(query, category, resultCount) {
    await this.trackEvent('server_search', {
      hasQuery: !!query,
      queryLength: query?.length || 0,
      category,
      resultCount
    });
  }

  /**
   * Track command usage
   */
  async trackCommand(command, subcommand, args = {}) {
    await this.trackEvent('command_used', {
      command,
      subcommand,
      args: Object.keys(args) // Don't send actual values for privacy
    });
  }

  /**
   * Track errors (no sensitive data)
   */
  async trackError(command, errorType, errorCode) {
    await this.trackEvent('cli_error', {
      command,
      errorType,
      errorCode
    });
  }

  /**
   * Get analytics status for display
   */
  async getStatus() {
    const enabled = await this.isEnabled();
    const configExists = existsSync(this.configPath);
    
    return {
      enabled,
      configPath: this.configPath,
      configExists,
      userId: enabled ? await this.getUserId() : null
    };
  }

  /**
   * Generate anonymous user ID (machine-based, consistent)
   */
  generateUserId() {
    // Create a consistent but anonymous ID based on machine characteristics
    const { hostname } = require('os');
    const crypto = require('crypto');
    
    // Use hostname + platform + home directory as seed (not PII)
    const seed = hostname() + process.platform + homedir();
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    
    // Take first 16 characters for a shorter ID
    return hash.substring(0, 16);
  }

  /**
   * Get user ID from config
   */
  async getUserId() {
    try {
      if (existsSync(this.configPath)) {
        const content = await readFile(this.configPath, 'utf-8');
        const config = JSON.parse(content);
        return config.userId;
      }
    } catch (error) {
      // Return null on error
    }
    return null;
  }

  /**
   * Get CLI version from package.json
   */
  getCLIVersion() {
    try {
      const { readFileSync } = require('fs');
      const { fileURLToPath } = require('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const pkg = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf-8')
      );
      return pkg.version;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Show analytics help
   */
  async showHelp() {
    const status = await this.getStatus();
    
    console.log();
    logger.header('📊 Analytics Information');
    
    console.log(chalk.bold('Current Status:'));
    console.log(`  Enabled: ${status.enabled ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`  Config: ${logger.path(status.configPath)}`);
    
    if (status.enabled && status.userId) {
      console.log(`  Anonymous ID: ${chalk.dim(status.userId)}`);
    }
    
    console.log();
    
    console.log(chalk.bold('What we track:'));
    console.log('  ✓ Commands used (discover, install, etc.)');
    console.log('  ✓ Installation success/failure rates');
    console.log('  ✓ Popular MCP servers');
    console.log('  ✓ Error frequency');
    console.log();
    
    console.log(chalk.bold('What we DON\'T track:'));
    console.log('  ✗ Personal information');
    console.log('  ✗ File paths or contents');
    console.log('  ✗ Environment variables');
    console.log('  ✗ Server configurations');
    console.log();
    
    console.log(chalk.bold('Privacy:'));
    console.log('  • All data is anonymous');
    console.log('  • Data is used only to improve OpenConductor');
    console.log('  • Never shared with third parties');
    console.log('  • Can be disabled at any time');
    console.log();
    
    logger.info('Control analytics:');
    logger.progress(logger.code('openconductor analytics --enable') + '  - Enable tracking');
    logger.progress(logger.code('openconductor analytics --disable') + ' - Disable tracking');
    console.log();
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience functions
export async function trackInstall(serverId, version, metadata = {}) {
  await analytics.trackInstall(serverId, metadata.serverName, metadata.method);
}

export async function trackSearch(query, category, resultCount) {
  await analytics.trackSearch(query, category, resultCount);
}

export async function trackCommand(command, subcommand, args) {
  await analytics.trackCommand(command, subcommand, args);
}

export async function trackError(command, error) {
  // Extract safe error info
  const errorType = error.constructor.name;
  const errorCode = error.code || 'UNKNOWN';
  
  await analytics.trackError(command, errorType, errorCode);
}

/**
 * Analytics command handler
 */
export async function analyticsCommand(options) {
  if (options.enable) {
    await analytics.setEnabled(true);
    logger.success('✓ Analytics enabled');
    logger.info('Thank you for helping improve OpenConductor!');
    return;
  }
  
  if (options.disable) {
    await analytics.setEnabled(false);
    logger.success('✓ Analytics disabled');
    logger.info('You can re-enable anytime with: ' + logger.code('openconductor analytics --enable'));
    return;
  }
  
  // Show analytics information
  await analytics.showHelp();
}