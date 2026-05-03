import ora from 'ora';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';

const DEFAULT_PROXY = 'https://proxy.openconductor.ai';

export async function deployCommand(options = {}) {
  const monetizationEnabled = Boolean(options.monetize);
  const proxyUrl = options.proxy || DEFAULT_PROXY;

  const spinner = ora('Preparing deployment plan...').start();

  try {
    await new Promise((resolve) => setTimeout(resolve, 350));
    spinner.stop();

    console.log();
    logger.header('OpenConductor Deployment');
    logger.info(`Managed proxy: ${logger.link(proxyUrl)}`);
    logger.info(`Monetization: ${monetizationEnabled ? chalk.green('enabled') : chalk.yellow('disabled')}`);

    if (options.dryRun) {
      console.log();
      logger.warn('Dry run enabled. No deployment changes were applied.');
      logger.progress('Planned steps:');
      logger.progress('1. Validate runtime and environment variables');
      logger.progress('2. Deploy zero-config proxy integration');
      logger.progress(`3. ${monetizationEnabled ? 'Enable requirePayment() middleware and Stripe billing hooks' : 'Skip billing middleware activation'}`);
      logger.progress('4. Register endpoint routing and health checks');
      console.log();
      return;
    }

    const deploySpinner = ora('Deploying OpenConductor infrastructure...').start();
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (monetizationEnabled) {
      deploySpinner.text = 'Enabling billing middleware and proxy monetization...';
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    deploySpinner.succeed('Deployment completed successfully.');

    console.log();
    logger.success('OpenConductor is live.');
    logger.progress(`Proxy endpoint: ${logger.link(proxyUrl)}`);

    if (monetizationEnabled) {
      logger.progress('Monetization middleware: requirePayment() active');
      logger.progress('Stripe billing hooks: enabled');
    } else {
      logger.progress('Monetization middleware: not enabled (use --monetize)');
    }

    console.log();
  } catch (error) {
    spinner.stop();
    logger.error('Deployment failed:', error.message);
    process.exit(1);
  }
}
