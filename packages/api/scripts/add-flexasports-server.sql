-- Add FlexaSports MCP Server to OpenConductor Registry
-- This creates the first proprietary MCP server in the registry
-- Enables network effects: OpenConductor installs → FlexaSports discovery

-- Insert FlexaSports MCP server
INSERT INTO mcp_servers (
  slug,
  name,
  tagline,
  description,

  -- Repository Info
  repository_url,
  repository_owner,
  repository_name,
  default_branch,

  -- Package Info
  npm_package,
  docker_image,

  -- Classification
  category,
  subcategory,
  tags,

  -- Installation
  install_command,
  config_schema,
  config_example,

  -- Documentation
  readme_url,
  docs_url,
  homepage_url,

  -- Status
  verified,
  featured,
  deprecated,
  proprietary,
  api_key_required
) VALUES (
  'flexasports-mcp',
  'FlexaSports MCP Server',
  'DFS analytics and sports intelligence for AI agents',

  -- Description
  'Connect your AI agents to FlexaSports for real-time sports data, explainable DFS predictions, and multi-sport analytics across NFL, NBA, MLB, and NHL.

Features:
- Prop betting analysis with explainability
- DFS lineup optimization
- Injury impact analysis
- Real-time player statistics
- Matchup predictions
- Sentiment analysis from news & social media

Perfect for building AI-powered sports analytics tools, DFS assistants, and betting research applications.',

  -- Repository
  'https://github.com/sonnier-ventures/flexasports-mcp',
  'sonnier-ventures',
  'flexasports-mcp',
  'main',

  -- Packages
  '@flexasports/mcp-server',
  'flexasports/mcp-server:latest',

  -- Classification
  'api',
  'sports analytics',
  ARRAY['sports', 'analytics', 'dfs', 'predictions', 'ai', 'nfl', 'nba', 'mlb', 'nhl', 'betting', 'props', 'fantasy'],

  -- Installation
  'npm install -g @flexasports/mcp-server',

  -- Config Schema
  '{
    "type": "object",
    "required": ["command", "env"],
    "properties": {
      "command": {
        "type": "string",
        "const": "flexasports-mcp"
      },
      "args": {
        "type": "array",
        "items": { "type": "string" }
      },
      "env": {
        "type": "object",
        "required": ["FLEXASPORTS_API_KEY"],
        "properties": {
          "FLEXASPORTS_API_URL": {
            "type": "string",
            "default": "https://api.flexasports.ai"
          },
          "FLEXASPORTS_API_KEY": {
            "type": "string",
            "description": "Your FlexaSports API key from https://flexasports.ai"
          }
        }
      }
    }
  }'::jsonb,

  -- Config Example
  '{
    "mcpServers": {
      "flexasports": {
        "command": "flexasports-mcp",
        "args": ["--api-key", "YOUR_API_KEY"],
        "env": {
          "FLEXASPORTS_API_URL": "https://api.flexasports.ai",
          "FLEXASPORTS_API_KEY": "your-api-key-here"
        }
      }
    }
  }'::jsonb,

  -- Documentation
  'https://raw.githubusercontent.com/sonnier-ventures/flexasports-mcp/main/README.md',
  'https://docs.flexasports.ai',
  'https://flexasports.ai',

  -- Status
  true,   -- verified
  true,   -- featured (first proprietary server!)
  false,  -- not deprecated
  true,   -- proprietary
  true    -- api_key_required
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  verified = true,
  featured = true,
  proprietary = true,
  api_key_required = true,
  updated_at = NOW();

-- Add initial stats for FlexaSports
INSERT INTO server_stats (
  server_id,
  github_stars,
  github_forks,
  github_watchers,
  github_open_issues,
  npm_downloads_weekly,
  npm_downloads_total,
  cli_installs,
  page_views,
  upvotes,
  popularity_score,
  trending_score
)
SELECT
  id,
  0,      -- github_stars (will be synced automatically)
  0,      -- github_forks
  0,      -- github_watchers
  0,      -- github_open_issues
  0,      -- npm_downloads_weekly
  0,      -- npm_downloads_total
  0,      -- cli_installs
  0,      -- page_views
  0,      -- upvotes
  100.0,  -- popularity_score (featured = high initial score)
  50.0    -- trending_score
FROM mcp_servers
WHERE slug = 'flexasports-mcp'
ON CONFLICT (server_id) DO UPDATE SET
  popularity_score = GREATEST(server_stats.popularity_score, 100.0),
  updated_at = NOW();

-- Add to install velocity tracking (initialize)
INSERT INTO install_velocity (product, date, hour, install_count, unique_users)
VALUES ('flexasports', CURRENT_DATE, EXTRACT(HOUR FROM NOW())::INT, 0, 0)
ON CONFLICT (product, date, hour) DO NOTHING;

-- Add to discovery matrix (OpenConductor → FlexaSports path)
INSERT INTO discovery_matrix (source_product, destination_product, discovery_count, conversion_count)
VALUES ('openconductor', 'flexasports', 0, 0)
ON CONFLICT (source_product, destination_product) DO NOTHING;

-- Confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ FlexaSports MCP Server added to registry';
  RAISE NOTICE '   Slug: flexasports-mcp';
  RAISE NOTICE '   Status: Verified, Featured, Proprietary';
  RAISE NOTICE '   Category: API (Sports Analytics)';
  RAISE NOTICE '   Network Effects: Ready to track OpenConductor → FlexaSports discovery';
END $$;
