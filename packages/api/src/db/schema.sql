-- OpenConductor Registry API Database Schema
-- Complete implementation following the technical specification

-- Server categories enum
CREATE TYPE server_category AS ENUM (
  'memory',
  'filesystem', 
  'database',
  'api',
  'search',
  'communication',
  'monitoring',
  'development',
  'custom'
);

-- Main MCP servers registry table
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,  -- URL-safe: "openmemory"
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,
  
  -- Repository Info
  repository_url VARCHAR(500) NOT NULL UNIQUE,
  repository_owner VARCHAR(255) NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  default_branch VARCHAR(100) DEFAULT 'main',
  
  -- Package Info
  npm_package VARCHAR(255),  -- @openconductor/memory
  pypi_package VARCHAR(255),  -- For Python MCP servers
  docker_image VARCHAR(255),  -- openconductor/memory:latest
  
  -- Classification
  category server_category NOT NULL,
  subcategory VARCHAR(100),
  tags TEXT[],  -- PostgreSQL array: {'memory', 'semantic', 'AI'}
  
  -- Installation
  install_command TEXT,  -- Custom install if not npm/pypi
  config_schema JSONB,   -- JSON Schema for MCP config
  config_example JSONB,  -- Example configuration
  
  -- Documentation
  readme_url VARCHAR(500),
  docs_url VARCHAR(500),
  homepage_url VARCHAR(500),
  
  -- Status
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  deprecated BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  
  -- Full-text search (tsvector for PostgreSQL FTS)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_servers_category ON mcp_servers(category);
CREATE INDEX idx_servers_verified ON mcp_servers(verified) WHERE verified = TRUE;
CREATE INDEX idx_servers_featured ON mcp_servers(featured) WHERE featured = TRUE;
CREATE INDEX idx_servers_tags ON mcp_servers USING GIN(tags);
CREATE INDEX idx_servers_search ON mcp_servers USING GIN(search_vector);
CREATE INDEX idx_servers_repository ON mcp_servers(repository_owner, repository_name);
CREATE INDEX idx_servers_slug ON mcp_servers(slug);
CREATE INDEX idx_servers_created_at ON mcp_servers(created_at DESC);
CREATE INDEX idx_servers_updated_at ON mcp_servers(updated_at DESC);

-- Stats tracking table
CREATE TABLE server_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  
  -- GitHub stats
  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  github_watchers INTEGER DEFAULT 0,
  github_open_issues INTEGER DEFAULT 0,
  github_last_commit_at TIMESTAMPTZ,
  github_created_at TIMESTAMPTZ,
  
  -- Package stats
  npm_downloads_weekly INTEGER DEFAULT 0,
  npm_downloads_total INTEGER DEFAULT 0,
  npm_version VARCHAR(50),
  
  -- OpenConductor-specific stats
  cli_installs INTEGER DEFAULT 0,  -- Tracked by CLI
  page_views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  
  -- Computed metrics
  popularity_score DECIMAL(10, 2) DEFAULT 0,
  trending_score DECIMAL(10, 2) DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(server_id)
);

CREATE INDEX idx_stats_popularity ON server_stats(popularity_score DESC);
CREATE INDEX idx_stats_trending ON server_stats(trending_score DESC);
CREATE INDEX idx_stats_server_id ON server_stats(server_id);
CREATE INDEX idx_stats_github_stars ON server_stats(github_stars DESC);
CREATE INDEX idx_stats_cli_installs ON server_stats(cli_installs DESC);

-- Server versions table (track releases)
CREATE TABLE server_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  
  version VARCHAR(50) NOT NULL,  -- 1.2.3
  tag_name VARCHAR(100),         -- v1.2.3
  release_notes TEXT,
  release_url VARCHAR(500),
  
  published_at TIMESTAMPTZ,
  is_prerelease BOOLEAN DEFAULT FALSE,
  is_latest BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(server_id, version)
);

CREATE INDEX idx_versions_latest ON server_versions(server_id, is_latest) 
  WHERE is_latest = TRUE;
CREATE INDEX idx_versions_server_id ON server_versions(server_id);
CREATE INDEX idx_versions_published_at ON server_versions(published_at DESC);

-- Server dependencies table (what MCP servers does this server use?)
CREATE TABLE server_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  depends_on_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  
  dependency_type VARCHAR(50), -- 'required', 'optional', 'dev'
  version_constraint VARCHAR(100), -- '>= 1.0.0'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(server_id, depends_on_server_id)
);

CREATE INDEX idx_dependencies_server_id ON server_dependencies(server_id);
CREATE INDEX idx_dependencies_depends_on ON server_dependencies(depends_on_server_id);

-- User interactions table (for logged-in users)
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- From auth system
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  
  interaction_type VARCHAR(50), -- 'install', 'upvote', 'bookmark'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, server_id, interaction_type)
);

CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_server ON user_interactions(server_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);

-- Server reviews/ratings table
CREATE TABLE server_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(server_id, user_id)
);

CREATE INDEX idx_reviews_server_id ON server_reviews(server_id);
CREATE INDEX idx_reviews_user_id ON server_reviews(user_id);
CREATE INDEX idx_reviews_rating ON server_reviews(rating);
CREATE INDEX idx_reviews_created_at ON server_reviews(created_at DESC);

-- GitHub webhook logs table
CREATE TABLE github_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type VARCHAR(100),  -- 'push', 'release', 'star'
  repository VARCHAR(255),
  payload JSONB,
  
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_logs_unprocessed ON github_webhook_logs(processed, received_at) 
  WHERE processed = FALSE;
CREATE INDEX idx_webhook_logs_repository ON github_webhook_logs(repository);
CREATE INDEX idx_webhook_logs_event_type ON github_webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_received_at ON github_webhook_logs(received_at DESC);

-- API usage tracking table (for rate limiting and analytics)
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  api_key_id UUID,  -- NULL for anonymous
  ip_address INET,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  
  response_time_ms INTEGER,
  status_code INTEGER,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for better performance - implement in production
CREATE INDEX idx_api_usage_time ON api_usage(created_at);
CREATE INDEX idx_api_usage_key ON api_usage(api_key_id, created_at);
CREATE INDEX idx_api_usage_ip ON api_usage(ip_address, created_at);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);

-- API keys table for authentication
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  user_id UUID,  -- Optional user association
  permissions JSONB,  -- Permissions object
  
  rate_limit_per_hour INTEGER DEFAULT 1000,
  
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(active) WHERE active = TRUE;

-- Background jobs table for async processing
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  job_type VARCHAR(100) NOT NULL,  -- 'github_sync', 'stats_calculation', etc.
  payload JSONB,
  
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  priority INTEGER DEFAULT 0,
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  error TEXT,
  result JSONB,
  
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status_priority ON background_jobs(status, priority DESC, created_at);
CREATE INDEX idx_jobs_type ON background_jobs(job_type);
CREATE INDEX idx_jobs_scheduled_at ON background_jobs(scheduled_at);

-- Server analytics snapshot table (for trending calculations)
CREATE TABLE server_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  
  snapshot_date DATE NOT NULL,
  
  github_stars INTEGER DEFAULT 0,
  cli_installs INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(server_id, snapshot_date)
);

CREATE INDEX idx_analytics_server_date ON server_analytics_snapshots(server_id, snapshot_date DESC);
CREATE INDEX idx_analytics_date ON server_analytics_snapshots(snapshot_date DESC);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mcp_servers_updated_at 
  BEFORE UPDATE ON mcp_servers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_reviews_updated_at 
  BEFORE UPDATE ON server_reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_background_jobs_updated_at 
  BEFORE UPDATE ON background_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW servers_with_stats AS
SELECT 
  s.*,
  st.github_stars,
  st.github_forks,
  st.github_watchers,
  st.github_open_issues,
  st.github_last_commit_at,
  st.npm_downloads_weekly,
  st.npm_downloads_total,
  st.cli_installs,
  st.page_views,
  st.upvotes,
  st.popularity_score,
  st.trending_score,
  v.version as latest_version,
  v.published_at as latest_release_at
FROM mcp_servers s
LEFT JOIN server_stats st ON s.id = st.server_id
LEFT JOIN server_versions v ON s.id = v.server_id AND v.is_latest = true;

-- Popular servers view
CREATE VIEW popular_servers AS
SELECT 
  s.*,
  st.popularity_score,
  st.github_stars,
  st.cli_installs
FROM mcp_servers s
JOIN server_stats st ON s.id = st.server_id
WHERE s.verified = true
ORDER BY st.popularity_score DESC;

-- Trending servers view
CREATE VIEW trending_servers AS
SELECT 
  s.*,
  st.trending_score,
  st.popularity_score,
  st.github_stars,
  st.cli_installs
FROM mcp_servers s
JOIN server_stats st ON s.id = st.server_id
WHERE s.verified = true AND st.trending_score > 0
ORDER BY st.trending_score DESC;