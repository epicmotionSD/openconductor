# Changelog

All notable changes to OpenConductor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Major registry expansion**: 146 new MCP servers added (now **190+ total servers**)
  - **Data Warehouses**: Snowflake, BigQuery, Databricks, ClickHouse
  - **Vector Databases**: Pinecone, Weaviate, Qdrant, Chroma, LlamaIndex
  - **AI/ML Platforms**: OpenAI, Anthropic, Hugging Face, LangChain, Replicate, Stability AI, Midjourney
  - **Cloud Platforms**: AWS (S3, Lambda), Azure (Storage, Functions), Google Cloud, Vercel, Netlify, Railway, Render, Heroku
  - **Development Tools**: Docker, Kubernetes, Terraform, Pulumi, GitLab, Jira, Confluence, Linear, Asana, Monday.com
  - **Databases**: MySQL, MongoDB, Redis, Neo4j, TimescaleDB, MariaDB, Elasticsearch, Algolia, Meilisearch
  - **Communication**: Discord, Telegram, WhatsApp, Twilio, Zoom, Calendly, Mattermost, Rocket.Chat, Intercom, Zendesk
  - **Productivity**: Airtable, Google Sheets, Excel, Zapier, Make, n8n
  - **Design & Media**: Figma, Canva, Adobe Creative Cloud, Cloudinary, imgix, Vimeo
  - **Research**: arXiv, PubMed, Semantic Scholar, Wolfram Alpha
  - **Social Media**: Reddit, Twitter, LinkedIn, Instagram, Mastodon, Facebook, TikTok
  - **CMS**: WordPress, Medium, Ghost, Substack, Contentful, Sanity, Strapi, Prismic
  - **Authentication**: Auth0, Okta, Clerk, Logto
  - **Finance**: Plaid, QuickBooks, Xero, FreshBooks, Coinbase, Binance, Kraken, Alpaca
  - **Maps & Location**: Mapbox, HERE Maps, OpenStreetMap, what3words
  - **Travel**: Uber, Lyft, FlightAware, Booking.com, Airbnb, TripAdvisor, Yelp
  - **Weather & Space**: Weather API, OpenWeatherMap, NASA APIs
  - **And many more!**
- Comprehensive seeding system (`seed-all-servers.ts`)
  - Loads from 4 sources: TypeScript + 3 JSON files
  - Individual transactions per server to prevent cascading failures
  - Graceful handling of duplicate repository URLs
  - Detailed progress logging and summary statistics
- New seed data files:
  - `seed-additional-servers.json` (49 servers)
  - `seed-more-servers.json` (49 servers)
  - `seed-specialized-servers.json` (48 servers)

### Changed

- **Repository cleanup**: Archived temporary documentation and scripts to `/docs/archive/` and `/scripts/archive/`
- Consolidated database seeding: `db:seed` now uses `seed-all-servers.ts` as the primary seeding script
- Updated server counts throughout documentation (120+ → 190+)
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
