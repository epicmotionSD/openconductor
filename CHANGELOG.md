# Changelog

All notable changes to OpenConductor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 30 new MCP servers to the registry (now 120+ total servers)
  - Cloud platforms: AWS, Azure, Google Cloud Run, Cloudflare
  - Search engines: Tavily, Exa, Bright Data, Firecrawl
  - Productivity: Notion, Stripe, Square, Mailgun
  - Databases: Neon Postgres, Supabase, ClickHouse, Neo4j
  - Dev tools: Atlassian, GitLab, CircleCI, GitHub Actions, Vercel, Render, Apollo GraphQL, Semgrep
  - Specialized: Browserbase, ElevenLabs, Mapbox, Auth0, Apify, Riza
- Automated seeding script for adding new servers (`add-new-servers-2025.ts`)
- Comprehensive seed data file (`seed-new-servers-2025.ts`)
- Better error handling for duplicate servers during seeding

### Changed

- CLI API client now uses `https://www.openconductor.ai` (with www) for better reliability
- Increased API client timeout from 10s to 30s to handle slower responses
- Added `maxRedirects: 5` to axios configuration for better redirect handling
- Improved database connection pool settings for better reliability:
  - Increased connection timeouts from 10s to 30s
  - Added minimum connection pool size (2 connections)
  - Enabled TCP keep-alive for long-running connections
  - Increased idle timeout from 30s to 60s
  - Added query and statement timeouts (60s)
- Updated README to reflect 120+ servers (up from 60+)
- Removed unused parameters from PostgreSQL event handlers

### Fixed

- Connection timeout issues when API is under load
- Redirect handling between openconductor.ai and www.openconductor.ai
- Database connection pool exhaustion during high traffic
- Duplicate server handling during bulk imports

## [1.0.3] - 2024-11-20

### Changed

- CLI version bump to 1.0.3

## Previous Releases

See git history for older releases.

[Unreleased]: https://github.com/epicmotionSD/openconductor/compare/main...HEAD
[1.0.3]: https://github.com/epicmotionSD/openconductor/releases/tag/v1.0.3
