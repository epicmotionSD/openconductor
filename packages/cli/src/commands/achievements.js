#!/usr/bin/env node

/**
 * OpenConductor Achievements System
 * Track and display user achievements and badges
 */

import chalk from 'chalk';
import ora from 'ora';
import { logger } from '../utils/logger.js';
import { ApiClient } from '../lib/api-client.js';
import { ConfigManager } from '../lib/config-manager.js';

const apiClient = new ApiClient();
const configManager = new ConfigManager();

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
  // Installation Achievements
  FIRST_INSTALL: {
    id: 'first-install',
    name: '🎯 First Steps',
    description: 'Install your first MCP server',
    icon: '🎯',
    rarity: 'common',
    points: 10
  },

  FIVE_SERVERS: {
    id: 'five-servers',
    name: '📦 Collector',
    description: 'Install 5 different MCP servers',
    icon: '📦',
    rarity: 'common',
    points: 25
  },

  TEN_SERVERS: {
    id: 'ten-servers',
    name: '🏆 Power User',
    description: 'Install 10 different MCP servers',
    icon: '🏆',
    rarity: 'uncommon',
    points: 50
  },

  TWENTY_SERVERS: {
    id: 'twenty-servers',
    name: '👑 Master Collector',
    description: 'Install 20 different MCP servers',
    icon: '👑',
    rarity: 'rare',
    points: 100
  },

  // Stack Achievements
  FIRST_STACK: {
    id: 'first-stack',
    name: '⚡ Stack Starter',
    description: 'Install your first Stack',
    icon: '⚡',
    rarity: 'common',
    points: 15
  },

  ALL_STACKS: {
    id: 'all-stacks',
    name: '🌟 Stack Master',
    description: 'Install all available Stacks',
    icon: '🌟',
    rarity: 'rare',
    points: 75
  },

  // Category Achievements
  DATABASE_PRO: {
    id: 'database-pro',
    name: '🗄️ Database Pro',
    description: 'Install 3 database servers',
    icon: '🗄️',
    rarity: 'uncommon',
    points: 30
  },

  API_MASTER: {
    id: 'api-master',
    name: '🔌 API Master',
    description: 'Install 5 API integration servers',
    icon: '🔌',
    rarity: 'uncommon',
    points: 30
  },

  MEMORY_EXPERT: {
    id: 'memory-expert',
    name: '🧠 Memory Expert',
    description: 'Install all memory/context servers',
    icon: '🧠',
    rarity: 'rare',
    points: 50
  },

  // Special Achievements
  EARLY_ADOPTER: {
    id: 'early-adopter',
    name: '🚀 Early Adopter',
    description: 'Joined OpenConductor in the first month',
    icon: '🚀',
    rarity: 'legendary',
    points: 200
  },

  CONTRIBUTOR: {
    id: 'contributor',
    name: '💎 Contributor',
    description: 'Submit a server to the registry',
    icon: '💎',
    rarity: 'epic',
    points: 150
  },

  VERIFIED_SERVER: {
    id: 'verified-server',
    name: '✅ Verified Developer',
    description: 'Have a verified server in the registry',
    icon: '✅',
    rarity: 'epic',
    points: 150
  },

  // Engagement Achievements
  WEEK_STREAK: {
    id: 'week-streak',
    name: '🔥 Week Streak',
    description: 'Install servers 7 days in a row',
    icon: '🔥',
    rarity: 'uncommon',
    points: 40
  },

  EXPLORER: {
    id: 'explorer',
    name: '🗺️ Explorer',
    description: 'Try servers from 5 different categories',
    icon: '🗺️',
    rarity: 'uncommon',
    points: 35
  },

  REVIEWER: {
    id: 'reviewer',
    name: '⭐ Reviewer',
    description: 'Leave feedback on 5 servers',
    icon: '⭐',
    rarity: 'rare',
    points: 60
  }
};

/**
 * Display user achievements
 */
export async function achievementsCommand(options = {}) {
  const spinner = ora('Loading achievements...').start();

  try {
    // Get user's install history
    const config = await configManager.readConfig();
    const installedServers = Object.keys(configManager.getServers(config));

    // Calculate achievements
    const userAchievements = calculateAchievements(installedServers);

    spinner.succeed('Achievements loaded');

    // Display achievements
    displayAchievements(userAchievements, options);

  } catch (error) {
    spinner.fail('Failed to load achievements');
    logger.error(error.message);
  }
}

/**
 * Calculate which achievements user has earned
 */
function calculateAchievements(installedServers) {
  const earned = [];
  const locked = [];
  const serverCount = installedServers.length;

  // Check each achievement
  for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
    let isEarned = false;

    switch (achievement.id) {
      case 'first-install':
        isEarned = serverCount >= 1;
        break;

      case 'five-servers':
        isEarned = serverCount >= 5;
        break;

      case 'ten-servers':
        isEarned = serverCount >= 10;
        break;

      case 'twenty-servers':
        isEarned = serverCount >= 20;
        break;

      // Stack achievements require API call (future implementation)
      case 'first-stack':
      case 'all-stacks':
        // TODO: Check stack installations
        isEarned = false;
        break;

      // Category achievements require server metadata
      case 'database-pro':
      case 'api-master':
      case 'memory-expert':
      case 'explorer':
        // TODO: Check categories from API
        isEarned = false;
        break;

      // Special achievements require API data
      case 'early-adopter':
      case 'contributor':
      case 'verified-server':
      case 'week-streak':
      case 'reviewer':
        // TODO: Check from API
        isEarned = false;
        break;

      default:
        isEarned = false;
    }

    if (isEarned) {
      earned.push({ ...achievement, earnedAt: new Date() });
    } else {
      locked.push(achievement);
    }
  }

  return { earned, locked, totalPoints: calculateTotalPoints(earned) };
}

/**
 * Calculate total achievement points
 */
function calculateTotalPoints(achievements) {
  return achievements.reduce((total, achievement) => total + achievement.points, 0);
}

/**
 * Display achievements in terminal
 */
function displayAchievements(userAchievements, options = {}) {
  const { earned, locked, totalPoints } = userAchievements;

  console.log('\n' + chalk.bold.blue('🏆 Your Achievements'));
  console.log(chalk.gray('='.repeat(60)) + '\n');

  // Display stats
  console.log(chalk.bold('Stats:'));
  console.log(chalk.white(`  Unlocked: ${earned.length}/${earned.length + locked.length}`));
  console.log(chalk.white(`  Points:   ${totalPoints}`));
  console.log(chalk.white(`  Rank:     ${calculateRank(totalPoints)}`));
  console.log();

  // Display earned achievements
  if (earned.length > 0) {
    console.log(chalk.bold.green('✅ Unlocked Achievements:'));
    console.log(chalk.gray('─'.repeat(60)));

    earned.forEach(achievement => {
      const rarityColor = getRarityColor(achievement.rarity);
      console.log(`  ${achievement.icon}  ${chalk.bold(achievement.name)} ${rarityColor('(' + achievement.rarity + ')')}`);
      console.log(`      ${chalk.gray(achievement.description)}`);
      console.log(`      ${chalk.cyan('+' + achievement.points + ' points')}`);
      console.log();
    });
  }

  // Display locked achievements (if requested)
  if (options.all && locked.length > 0) {
    console.log(chalk.bold.gray('🔒 Locked Achievements:'));
    console.log(chalk.gray('─'.repeat(60)));

    locked.forEach(achievement => {
      const rarityColor = getRarityColor(achievement.rarity);
      console.log(`  ${chalk.gray('🔒')}  ${chalk.gray(achievement.name)} ${rarityColor('(' + achievement.rarity + ')')}`);
      console.log(`      ${chalk.gray(achievement.description)}`);
      console.log(`      ${chalk.gray('+' + achievement.points + ' points')}`);
      console.log();
    });
  }

  // Next achievement tip
  if (locked.length > 0) {
    const nextAchievement = locked[0];
    console.log(chalk.bold.yellow('💡 Next Achievement:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(`  ${nextAchievement.icon}  ${chalk.yellow(nextAchievement.name)}`);
    console.log(`      ${chalk.white(nextAchievement.description)}`);
    console.log(`      ${chalk.cyan('Earn ' + nextAchievement.points + ' points')}`);
    console.log();
  }

  // Tip
  if (!options.all) {
    console.log(chalk.gray('💡 Tip: Use ') + chalk.white('openconductor achievements --all') + chalk.gray(' to see locked achievements'));
    console.log();
  }
}

/**
 * Get color for rarity
 */
function getRarityColor(rarity) {
  switch (rarity) {
    case 'common':
      return chalk.gray;
    case 'uncommon':
      return chalk.green;
    case 'rare':
      return chalk.blue;
    case 'epic':
      return chalk.magenta;
    case 'legendary':
      return chalk.yellow;
    default:
      return chalk.white;
  }
}

/**
 * Calculate user rank based on points
 */
function calculateRank(points) {
  if (points >= 1000) return chalk.yellow('🌟 Legendary');
  if (points >= 500) return chalk.magenta('💎 Epic');
  if (points >= 250) return chalk.blue('🏆 Master');
  if (points >= 100) return chalk.green('⚡ Expert');
  if (points >= 50) return chalk.cyan('📦 Collector');
  if (points >= 10) return chalk.white('🎯 Beginner');
  return chalk.gray('🆕 Newcomer');
}

/**
 * Share achievements (future feature)
 */
export async function shareAchievements() {
  console.log(chalk.yellow('🚧 Coming soon: Share your achievements on social media!'));
  console.log(chalk.gray('   This feature will generate a shareable image of your progress.'));
}

export default achievementsCommand;
