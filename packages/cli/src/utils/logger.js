import chalk from 'chalk';

/**
 * Pretty logger utility for the CLI with colored output and different log levels
 */
export const logger = {
  /**
   * Information message (blue)
   */
  info(message, ...args) {
    console.log(chalk.blue('ℹ'), message, ...args);
  },
  
  /**
   * Success message (green)
   */
  success(message, ...args) {
    console.log(chalk.green('✓'), message, ...args);
  },
  
  /**
   * Warning message (yellow)
   */
  warn(message, ...args) {
    console.log(chalk.yellow('⚠'), message, ...args);
  },
  
  /**
   * Error message (red)
   */
  error(message, ...args) {
    console.error(chalk.red('✖'), message, ...args);
  },
  
  /**
   * Debug message (gray, only shown if DEBUG env var is set)
   */
  debug(message, ...args) {
    if (process.env.DEBUG) {
      console.log(chalk.gray('DEBUG:'), message, ...args);
    }
  },

  /**
   * Step message for processes (cyan)
   */
  step(message, ...args) {
    console.log(chalk.cyan('→'), message, ...args);
  },

  /**
   * Progress message (dim)
   */
  progress(message, ...args) {
    console.log(chalk.dim('  ' + message), ...args);
  },

  /**
   * Highlight important text (bold)
   */
  highlight(text) {
    return chalk.bold(text);
  },

  /**
   * Format URL links (blue underline)
   */
  link(url) {
    return chalk.blue.underline(url);
  },

  /**
   * Format code/commands (cyan)
   */
  code(text) {
    return chalk.cyan(text);
  },

  /**
   * Format file paths (yellow)
   */
  path(filePath) {
    return chalk.yellow(filePath);
  },

  /**
   * Print a divider line
   */
  divider() {
    console.log(chalk.dim('─'.repeat(60)));
  },

  /**
   * Print an empty line
   */
  newline() {
    console.log();
  },

  /**
   * Print header text with styling
   */
  header(text) {
    console.log();
    console.log(chalk.bold.cyan(text));
    console.log(chalk.dim('─'.repeat(text.length)));
    console.log();
  },

  /**
   * Print a boxed message
   */
  box(message, title) {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const width = Math.max(maxLength + 4, 40);
    
    console.log();
    console.log(chalk.cyan('┌' + '─'.repeat(width - 2) + '┐'));
    
    if (title) {
      const padding = Math.max(0, width - title.length - 4);
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      console.log(chalk.cyan('│') + ' '.repeat(leftPad) + chalk.bold(title) + ' '.repeat(rightPad) + chalk.cyan('│'));
      console.log(chalk.cyan('├' + '─'.repeat(width - 2) + '┤'));
    }
    
    lines.forEach(line => {
      const padding = width - line.length - 4;
      console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(padding + 1) + chalk.cyan('│'));
    });
    
    console.log(chalk.cyan('└' + '─'.repeat(width - 2) + '┘'));
    console.log();
  },

  /**
   * Print installation status indicators
   */
  status: {
    installed: chalk.green('● installed'),
    available: chalk.blue('○ available'),
    updating: chalk.yellow('◐ updating'),
    error: chalk.red('✖ error'),
    pending: chalk.dim('○ pending')
  },

  /**
   * Format server categories with emojis
   */
  categoryIcon(category) {
    const icons = {
      memory: '🧠',
      filesystem: '📁', 
      database: '🗄️',
      api: '🔌',
      search: '🔍',
      communication: '💬',
      monitoring: '📊',
      development: '⚒️',
      custom: '🔧'
    };
    
    return icons[category] || '📦';
  },

  /**
   * Format numbers with proper units
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  /**
   * Format relative time
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'today';
    } else if (days === 1) {
      return 'yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)} weeks ago`;
    } else if (days < 365) {
      return `${Math.floor(days / 30)} months ago`;
    } else {
      return `${Math.floor(days / 365)} years ago`;
    }
  },

  /**
   * Show troubleshooting help
   */
  troubleshoot(error) {
    console.log();
    this.error('Installation failed:', error.message);
    console.log();
    this.info('Troubleshooting:');
    this.progress('Check your internet connection');
    this.progress('Verify Node.js version >= 18.0.0');
    this.progress('Try running with sudo/admin privileges');
    this.progress('Check the server\'s GitHub repository for specific requirements');
    console.log();
    this.info('Still having issues?');
    this.progress('Report at: ' + this.link('https://github.com/openconductor/openconductor/issues'));
    console.log();
  }
};