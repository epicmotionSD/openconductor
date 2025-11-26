import clipboardy from 'clipboardy';
import { ApiClient } from '../lib/api-client.js';
import { ConfigManager } from '../lib/config-manager.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * List all available stacks
 */
export async function stackListCommand() {
  const api = new ApiClient();
  const spinner = ora('Fetching stacks...').start();

  try {
    const response = await api.client.get('/stacks');
    const stacks = response.data.stacks;

    spinner.stop();

    console.log();
    logger.header('📦 Available Stacks');
    console.log();

    stacks.forEach(stack => {
      console.log(`${stack.icon} ${chalk.bold(stack.name)}`);
      console.log(`  ${chalk.gray(stack.tagline)}`);
      console.log(`  ${stack.server_count} servers | ${stack.install_count} installs`);
      console.log(`  ${chalk.dim(`Install: openconductor stack install ${stack.slug}`)}`);
      console.log();
    });

    console.log(chalk.gray('💡 Stacks include pre-configured system prompts for Claude Desktop'));
    console.log();

  } catch (error) {
    spinner.stop();
    logger.error('Failed to fetch stacks:', error.message);
    process.exit(1);
  }
}

/**
 * Install a stack (all servers + system prompt)
 */
export async function stackInstallCommand(stackSlug, options = {}) {
  const api = new ApiClient();
  const config = new ConfigManager();
  const spinner = ora(`Loading ${stackSlug} stack...`).start();

  try {
    // 1. Fetch stack details
    const response = await api.client.get(`/stacks/${stackSlug}`);
    const stack = response.data;

    spinner.succeed(`Found ${stack.name}`);
    console.log();

    logger.info(`Installing ${stack.servers.length} servers...`);
    console.log();

    // 2. Install each server
    let installedCount = 0;
    let skippedCount = 0;

    for (const server of stack.servers) {
      const isInstalled = await config.isInstalled(server.slug);

      if (isInstalled && !options.force) {
        console.log(`  ${chalk.gray('○')} ${server.name} ${chalk.dim('(already installed)')}`);
        skippedCount++;
        continue;
      }

      const installSpinner = ora(server.name).start();

      try {
        // Get install configuration
        const installResponse = await api.client.get(`/servers/${server.slug}/install`);
        const installConfig = installResponse.data.config;

        // Add to Claude config
        await config.addServer(server.slug, installConfig);

        installSpinner.succeed(chalk.green(server.name));
        installedCount++;
      } catch (error) {
        installSpinner.fail(chalk.red(`${server.name} - ${error.message}`));
      }
    }

    console.log();
    logger.success(`✅ Installed ${stack.name}`);
    console.log(`   ${installedCount} new servers installed`);
    if (skippedCount > 0) {
      console.log(`   ${skippedCount} already installed (use --force to reinstall)`);
    }

    // 3. Copy system prompt to clipboard
    console.log();
    try {
      await clipboardy.write(stack.system_prompt);

      logger.info('📋 System Prompt copied to clipboard!');
      console.log();
      console.log(chalk.bold('📝 Next step: Paste into Claude Desktop'));
      console.log();
      console.log(chalk.gray('1. Open Claude Desktop'));
      console.log(chalk.gray('2. Go to Settings → Custom Instructions'));
      console.log(chalk.gray('3. Paste the prompt (Cmd+V / Ctrl+V)'));
      console.log(chalk.gray('4. Save and start using your new tools!'));
      console.log();
      console.log(chalk.dim('─'.repeat(60)));
      console.log(chalk.gray('Prompt preview:'));
      const preview = stack.system_prompt.split('\n').slice(0, 6).join('\n');
      console.log(chalk.dim(preview));
      console.log(chalk.dim('  ...'));
      console.log(chalk.dim('─'.repeat(60)));
      console.log();
      console.log(chalk.bold('💡 Try asking Claude:'));
      displayTryAsking(stackSlug);
      console.log();

    } catch (error) {
      logger.warn('Could not copy prompt to clipboard:', error.message);
      console.log();
      console.log(chalk.bold('System Prompt:'));
      console.log(chalk.dim('─'.repeat(60)));
      console.log(stack.system_prompt);
      console.log(chalk.dim('─'.repeat(60)));
      console.log();
    }

    // 4. Track installation analytics
    try {
      await api.client.post(`/stacks/${stackSlug}/install`);
    } catch (error) {
      // Silent fail - analytics shouldn't block UX
    }

    // 5. Suggest sharing
    console.log();
    console.log(chalk.gray('💬 Found this helpful? Share it:'));
    console.log(chalk.gray(`   openconductor stack share ${stackSlug}`));
    console.log();

  } catch (error) {
    spinner.stop();

    if (error.response?.status === 404) {
      logger.error(`Stack "${stackSlug}" not found`);
      console.log();
      console.log('Available stacks:');
      console.log('  • essential - Fundamental tools for everyday use');
      console.log('  • coder - Complete development environment');
      console.log('  • writer - Research and writing assistant');
      console.log();
      console.log('Run: openconductor stack list');
    } else {
      logger.error('Failed to install stack:', error.message);
    }

    process.exit(1);
  }
}

/**
 * Generate shareable URL for a stack
 */
export async function stackShareCommand(stackSlug) {
  const api = new ApiClient();
  const spinner = ora('Generating share link...').start();

  try {
    // Fetch stack to verify it exists
    const response = await api.client.get(`/stacks/${stackSlug}`);
    const stack = response.data;

    spinner.succeed('Share link ready!');
    console.log();

    // Generate URLs
    const stackUrl = `https://openconductor.ai/stack/${stack.slug}`;
    const shortUrl = `https://openconductor.ai/s/${stack.short_code}`;
    const installCommand = `openconductor stack install ${stack.slug}`;

    // Copy short URL to clipboard
    try {
      await clipboardy.write(shortUrl);
      logger.info('📋 Link copied to clipboard!');
    } catch (error) {
      // Silent fail
    }

    console.log();
    console.log(chalk.bold('🔗 Share this stack:'));
    console.log();
    console.log(`  ${chalk.cyan(shortUrl)}`);
    console.log();

    console.log(chalk.bold('📦 Installation command:'));
    console.log();
    console.log(`  ${chalk.gray('$')} ${chalk.green(installCommand)}`);
    console.log();

    // Generate Twitter share text
    const twitterText = encodeURIComponent(
      `Just set up ${stack.name} with @openconductor - ${stack.tagline}\n\nTry it: ${shortUrl}`
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;

    console.log(chalk.bold('🐦 Share on social media:'));
    console.log();
    console.log(`  Twitter: ${chalk.blue(twitterUrl)}`);
    console.log();

    console.log(chalk.gray('💡 Tip: Share what you built with your new tools!'));
    console.log();

  } catch (error) {
    spinner.stop();

    if (error.response?.status === 404) {
      logger.error(`Stack "${stackSlug}" not found`);
      console.log();
      console.log('Run: openconductor stack list');
    } else {
      logger.error('Failed to generate share link:', error.message);
    }

    process.exit(1);
  }
}

/**
 * Show example prompts for each stack
 */
function displayTryAsking(stackSlug) {
  const examples = {
    essential: [
      '  "Search for the latest news on artificial intelligence"',
      '  "Remember that my project deadline is next Friday at 5pm"',
      '  "Fetch the current weather from wttr.in/London"',
      '  "Create a todo list file in my documents folder"'
    ],
    coder: [
      '  "Help me design a database schema for a blog platform"',
      '  "Review my latest GitHub PR and suggest improvements"',
      '  "Debug this error: Cannot read property \'map\' of undefined"',
      '  "Plan the architecture for a real-time chat feature"',
      '  "Search for best practices for React Server Components"'
    ],
    writer: [
      '  "Research recent AI developments and write a 500-word article"',
      '  "Find recent studies on climate change and summarize the findings"',
      '  "Write a blog post about productivity in a friendly, conversational tone"',
      '  "Create an outline for a white paper on blockchain technology"',
      '  "Remember my writing style: clear, concise, data-driven"'
    ]
  };

  const stackExamples = examples[stackSlug] || [];
  stackExamples.forEach(example => {
    console.log(chalk.cyan(example));
  });
}

/**
 * Show details about a specific stack
 */
export async function stackShowCommand(stackSlug) {
  const api = new ApiClient();
  const spinner = ora('Loading stack details...').start();

  try {
    const response = await api.client.get(`/stacks/${stackSlug}`);
    const stack = response.data;

    spinner.stop();
    console.log();

    logger.header(`${stack.icon} ${stack.name}`);
    console.log();
    console.log(chalk.bold(stack.tagline));
    console.log();
    console.log(stack.description);
    console.log();

    console.log(chalk.bold('📦 Included Servers:'));
    console.log();

    stack.servers.forEach((server, index) => {
      const stars = server.github_stars > 0 ? chalk.yellow(`⭐ ${server.github_stars}`) : '';
      console.log(`  ${index + 1}. ${chalk.bold(server.name)} ${stars}`);
      console.log(`     ${chalk.gray(server.description)}`);
      console.log();
    });

    console.log(chalk.bold('📊 Stats:'));
    console.log(`  Servers: ${stack.servers.length}`);
    console.log(`  Installs: ${stack.install_count}`);
    console.log();

    console.log(chalk.bold('🚀 Install this stack:'));
    console.log(`  ${chalk.green(`openconductor stack install ${stack.slug}`)}`);
    console.log();

  } catch (error) {
    spinner.stop();

    if (error.response?.status === 404) {
      logger.error(`Stack "${stackSlug}" not found`);
      console.log();
      console.log('Run: openconductor stack list');
    } else {
      logger.error('Failed to fetch stack details:', error.message);
    }

    process.exit(1);
  }
}
