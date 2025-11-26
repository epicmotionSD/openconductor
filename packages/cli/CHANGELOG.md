# Changelog

All notable changes to the OpenConductor CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2025-11-23

### 🐛 Bug Fixes

#### Badge Command Fix
- **Fixed**: Badge command was failing with "apiClient.get is not a function" error
- **Fixed**: ApiClient default URL was pointing to wrong endpoint (www.openconductor.ai instead of api.openconductor.ai)
- **Improved**: Enhanced getServer() fallback logic to handle API errors gracefully
  - Now falls back to search endpoint for any error (not just 404)
  - Converts hyphenated slugs to space-separated search terms
  - Finds exact slug match from search results

#### Technical Changes
- Updated ApiClient baseURL from `https://www.openconductor.ai/api/v1` to `https://api.openconductor.ai/v1`
- Improved error handling in badge.js to use getServer() method instead of direct get()
- Enhanced search fallback to replace hyphens with spaces for better matching

## [1.3.0] - 2025-11-22

### 🎉 New Features

#### Badge System for Developers
- **`openconductor badge <server>`** - Generate installation badges for MCP server READMEs
  - Simple badge generation
  - Command snippet templates
  - Full installation section templates
  - Automatic clipboard copy
  - Multiple badge styles (--simple, --command, --full)
- **`openconductor badge-templates`** - List all available badge templates

#### Achievement System (Gamification)
- **`openconductor achievements`** - View your unlocked achievements and progress
  - 15 unlockable achievements across 5 categories
  - Point system with 7 rank tiers (Newcomer → Legendary)
  - Rarity system (Common, Uncommon, Rare, Epic, Legendary)
  - Progress tracking based on installed servers
  - View locked achievements with `--all` flag
- **`openconductor badges`** - Alias for achievements command

#### Achievement Categories
- Installation Achievements: First Steps, Collector, Power User, Master Collector
- Stack Achievements: Stack Starter, Stack Master
- Category Achievements: Database Pro, API Master, Memory Expert
- Special Achievements: Early Adopter, Contributor, Verified Developer
- Engagement Achievements: Week Streak, Explorer, Reviewer

### 🔧 Improvements
- Enhanced help documentation for new commands
- Better error handling in badge generation
- Improved clipboard integration

## [1.2.0] - 2025-11-22

### 🎉 Stacks System
- Stack commands: list, install, show, share
- System prompt auto-generation
- 3 curated stacks: Coder, Writer, Essential

## [1.1.1] - 2025-11-22

### 🐛 Bug Fixes
- Fixed API response data extraction

## [1.0.0] - 2025-11-15

### 🎉 Initial Release
- Core commands: discover, install, list, remove, update, init
- 190+ MCP servers in registry
