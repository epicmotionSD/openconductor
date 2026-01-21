-- OpenConductor Complete Database Migration
-- Run this in Supabase SQL Editor to set up all tables
-- Order: Base schema -> Agent schema -> Seed data

-- ============================================
-- STEP 1: BASE REGISTRY SCHEMA
-- ============================================

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
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description TEXT,

  -- Repository Info
  repository_url VARCHAR(500) NOT NULL UNIQUE,
  repository_owner VARCHAR(255) NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  default_branch VARCHAR(100) DEFAULT 'main',

  -- Package Info
  npm_package VARCHAR(255),
  pypi_package VARCHAR(255),
  docker_image VARCHAR(255),

  -- Classification
  category server_category NOT NULL,
  subcategory VARCHAR(100),
  tags TEXT[],

  -- Installation
  install_command TEXT,
  config_schema JSONB,
  config_example JSONB,

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

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED
);

-- Stats tracking table
CREATE TABLE server_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,

  github_stars INTEGER DEFAULT 0,
  github_forks INTEGER DEFAULT 0,
  github_watchers INTEGER DEFAULT 0,
  github_open_issues INTEGER DEFAULT 0,
  github_last_commit_at TIMESTAMPTZ,
  github_created_at TIMESTAMPTZ,

  npm_downloads_weekly INTEGER DEFAULT 0,
  npm_downloads_total INTEGER DEFAULT 0,
  npm_version VARCHAR(50),

  cli_installs INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,

  popularity_score DECIMAL(10, 2) DEFAULT 0,
  trending_score DECIMAL(10, 2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(server_id)
);

-- Server versions table
CREATE TABLE server_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,

  version VARCHAR(50) NOT NULL,
  tag_name VARCHAR(100),
  release_notes TEXT,
  release_url VARCHAR(500),

  published_at TIMESTAMPTZ,
  is_prerelease BOOLEAN DEFAULT FALSE,
  is_latest BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(server_id, version)
);

-- Server dependencies table
CREATE TABLE server_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  depends_on_server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,

  dependency_type VARCHAR(50),
  version_constraint VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(server_id, depends_on_server_id)
);

-- User interactions table
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,

  interaction_type VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, server_id, interaction_type)
);

-- Server reviews table
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

-- GitHub webhook logs table
CREATE TABLE github_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type VARCHAR(100),
  repository VARCHAR(255),
  payload JSONB,

  processed BOOLEAN DEFAULT FALSE,
  error TEXT,

  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- API usage tracking table
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  api_key_id UUID,
  ip_address INET,
  endpoint VARCHAR(255),
  method VARCHAR(10),

  response_time_ms INTEGER,
  status_code INTEGER,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,

  user_id UUID,
  permissions JSONB,

  rate_limit_per_hour INTEGER DEFAULT 1000,

  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Background jobs table
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  job_type VARCHAR(100) NOT NULL,
  payload JSONB,

  status VARCHAR(50) DEFAULT 'pending',
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

-- Server analytics snapshots table
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

-- ============================================
-- STEP 2: INDEXES FOR BASE SCHEMA
-- ============================================

CREATE INDEX idx_servers_category ON mcp_servers(category);
CREATE INDEX idx_servers_verified ON mcp_servers(verified) WHERE verified = TRUE;
CREATE INDEX idx_servers_featured ON mcp_servers(featured) WHERE featured = TRUE;
CREATE INDEX idx_servers_tags ON mcp_servers USING GIN(tags);
CREATE INDEX idx_servers_search ON mcp_servers USING GIN(search_vector);
CREATE INDEX idx_servers_repository ON mcp_servers(repository_owner, repository_name);
CREATE INDEX idx_servers_slug ON mcp_servers(slug);
CREATE INDEX idx_servers_created_at ON mcp_servers(created_at DESC);
CREATE INDEX idx_servers_updated_at ON mcp_servers(updated_at DESC);

CREATE INDEX idx_stats_popularity ON server_stats(popularity_score DESC);
CREATE INDEX idx_stats_trending ON server_stats(trending_score DESC);
CREATE INDEX idx_stats_server_id ON server_stats(server_id);
CREATE INDEX idx_stats_github_stars ON server_stats(github_stars DESC);
CREATE INDEX idx_stats_cli_installs ON server_stats(cli_installs DESC);

CREATE INDEX idx_versions_latest ON server_versions(server_id, is_latest) WHERE is_latest = TRUE;
CREATE INDEX idx_versions_server_id ON server_versions(server_id);
CREATE INDEX idx_versions_published_at ON server_versions(published_at DESC);

CREATE INDEX idx_dependencies_server_id ON server_dependencies(server_id);
CREATE INDEX idx_dependencies_depends_on ON server_dependencies(depends_on_server_id);

CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_server ON user_interactions(server_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);

CREATE INDEX idx_reviews_server_id ON server_reviews(server_id);
CREATE INDEX idx_reviews_user_id ON server_reviews(user_id);
CREATE INDEX idx_reviews_rating ON server_reviews(rating);
CREATE INDEX idx_reviews_created_at ON server_reviews(created_at DESC);

CREATE INDEX idx_webhook_logs_unprocessed ON github_webhook_logs(processed, received_at) WHERE processed = FALSE;
CREATE INDEX idx_webhook_logs_repository ON github_webhook_logs(repository);
CREATE INDEX idx_webhook_logs_event_type ON github_webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_received_at ON github_webhook_logs(received_at DESC);

CREATE INDEX idx_api_usage_time ON api_usage(created_at);
CREATE INDEX idx_api_usage_key ON api_usage(api_key_id, created_at);
CREATE INDEX idx_api_usage_ip ON api_usage(ip_address, created_at);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(active) WHERE active = TRUE;

CREATE INDEX idx_jobs_status_priority ON background_jobs(status, priority DESC, created_at);
CREATE INDEX idx_jobs_type ON background_jobs(job_type);
CREATE INDEX idx_jobs_scheduled_at ON background_jobs(scheduled_at);

CREATE INDEX idx_analytics_server_date ON server_analytics_snapshots(server_id, snapshot_date DESC);
CREATE INDEX idx_analytics_date ON server_analytics_snapshots(snapshot_date DESC);

-- ============================================
-- STEP 3: TRIGGERS FOR UPDATED_AT
-- ============================================

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

-- ============================================
-- STEP 4: VIEWS FOR BASE SCHEMA
-- ============================================

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

-- ============================================
-- STEP 5: AGENT SYSTEM ENUMS
-- ============================================

CREATE TYPE agent_role AS ENUM (
  'ceo',
  'cto',
  'cmo',
  'cfo',
  'researcher',
  'architect',
  'coder',
  'reviewer'
);

CREATE TYPE agent_status AS ENUM (
  'idle',
  'active',
  'paused',
  'error',
  'offline'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE decision_type AS ENUM (
  'deploy_template',
  'pause_keyword',
  'adjust_budget',
  'create_campaign',
  'flag_ad_bleed',
  'recommend_action',
  'escalate_to_human'
);

CREATE TYPE signal_type AS ENUM (
  'trend',
  'ad_bleed',
  'opportunity',
  'threat',
  'competitor'
);

CREATE TYPE signal_source AS ENUM (
  'apify',
  'google_ads',
  'google_trends',
  'social',
  'serp'
);

CREATE TYPE ad_bleed_type AS ENUM (
  'intent_mismatch',
  'cannibalization',
  'dead_trend',
  'negative_keyword',
  'competitor_gap'
);

CREATE TYPE deployment_status AS ENUM (
  'pending',
  'building',
  'deploying',
  'live',
  'failed',
  'rolled_back'
);

CREATE TYPE template_intent AS ENUM (
  'transactional',
  'informational',
  'commercial',
  'navigational'
);

-- ============================================
-- STEP 6: AGENT SYSTEM TABLES
-- ============================================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  role agent_role NOT NULL,
  description TEXT,
  avatar VARCHAR(50),

  status agent_status DEFAULT 'offline',

  capabilities TEXT[],
  permissions JSONB DEFAULT '{}',
  manifest JSONB DEFAULT '{}',

  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  avg_response_time DECIMAL(10, 2) DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 0,

  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role)
);

CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  context JSONB DEFAULT '{}',

  tasks_processed INTEGER DEFAULT 0,
  decisions_made INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  task_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}',

  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',

  result JSONB,
  error TEXT,

  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_role agent_role,

  decision_type decision_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reasoning TEXT,
  data JSONB DEFAULT '{}',

  confidence DECIMAL(3, 2) DEFAULT 0,
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high', 'critical')),

  approved BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(100),
  executed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE revenue_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  signal_type signal_type NOT NULL,
  source signal_source NOT NULL,

  keyword VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',

  confidence DECIMAL(3, 2) DEFAULT 0,
  urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),

  action_taken BOOLEAN DEFAULT FALSE,
  action_details TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE ad_bleed_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  bleed_type ad_bleed_type NOT NULL,
  keyword VARCHAR(255) NOT NULL,

  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  wasted_spend DECIMAL(10, 2) DEFAULT 0,
  wasted_spend_period VARCHAR(20) DEFAULT '7d',

  current_cpc DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 2),
  organic_rank INTEGER,

  recommendation TEXT,
  auto_fix_available BOOLEAN DEFAULT FALSE,

  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  template_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  purpose TEXT,

  target_intent template_intent NOT NULL,
  features TEXT[],

  component_schema JSONB DEFAULT '{}',

  deploy_count INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(5, 2),

  preview_url VARCHAR(500),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  template_id VARCHAR(10) REFERENCES templates(template_id),
  template_name VARCHAR(100),

  target_keyword VARCHAR(255),
  target_url VARCHAR(500),

  status deployment_status DEFAULT 'pending',

  triggered_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  approved_by VARCHAR(100),

  vercel_deployment_id VARCHAR(100),
  preview_url VARCHAR(500),
  live_url VARCHAR(500),

  roas_predicted DECIMAL(10, 2),
  roas_actual DECIMAL(10, 2),
  quality_score INTEGER,

  build_log TEXT,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ
);

CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  google_ads_campaign_id VARCHAR(100),

  name VARCHAR(255) NOT NULL,
  keywords TEXT[],

  daily_budget DECIMAL(10, 2),
  total_spend DECIMAL(10, 2) DEFAULT 0,

  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_click DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 2),
  roas DECIMAL(10, 2),

  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 7: AGENT SYSTEM INDEXES
-- ============================================

CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_status ON agents(status);

CREATE INDEX idx_agent_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_active ON agent_sessions(agent_id, ended_at) WHERE ended_at IS NULL;

CREATE INDEX idx_agent_tasks_to_agent ON agent_tasks(to_agent_id, status);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status, priority DESC, created_at);
CREATE INDEX idx_agent_tasks_from_agent ON agent_tasks(from_agent_id);

CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_type ON agent_decisions(decision_type);
CREATE INDEX idx_agent_decisions_pending ON agent_decisions(approved, created_at) WHERE approved = FALSE;
CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at DESC);

CREATE INDEX idx_revenue_signals_type ON revenue_signals(signal_type);
CREATE INDEX idx_revenue_signals_source ON revenue_signals(source);
CREATE INDEX idx_revenue_signals_keyword ON revenue_signals(keyword);
CREATE INDEX idx_revenue_signals_active ON revenue_signals(action_taken, created_at) WHERE action_taken = FALSE;
CREATE INDEX idx_revenue_signals_created ON revenue_signals(created_at DESC);

CREATE INDEX idx_ad_bleed_alerts_type ON ad_bleed_alerts(bleed_type);
CREATE INDEX idx_ad_bleed_alerts_keyword ON ad_bleed_alerts(keyword);
CREATE INDEX idx_ad_bleed_alerts_unresolved ON ad_bleed_alerts(resolved, severity) WHERE resolved = FALSE;
CREATE INDEX idx_ad_bleed_alerts_created ON ad_bleed_alerts(created_at DESC);

CREATE INDEX idx_templates_id ON templates(template_id);
CREATE INDEX idx_templates_intent ON templates(target_intent);

CREATE INDEX idx_deployments_template ON deployments(template_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_keyword ON deployments(target_keyword);
CREATE INDEX idx_deployments_created ON deployments(created_at DESC);

CREATE INDEX idx_ad_campaigns_active ON ad_campaigns(active) WHERE active = TRUE;
CREATE INDEX idx_ad_campaigns_google_id ON ad_campaigns(google_ads_campaign_id);

-- ============================================
-- STEP 8: AGENT SYSTEM TRIGGERS
-- ============================================

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 9: COMMAND CENTER VIEW
-- ============================================

CREATE VIEW command_center_summary AS
SELECT
  (SELECT COUNT(*) FROM agents WHERE status = 'active') as active_agents,
  (SELECT COUNT(*) FROM agent_tasks WHERE status = 'pending') as pending_tasks,
  (SELECT COUNT(*) FROM agent_decisions WHERE approved = FALSE) as pending_decisions,
  (SELECT COUNT(*) FROM revenue_signals WHERE action_taken = FALSE AND created_at > NOW() - INTERVAL '24 hours') as recent_signals,
  (SELECT COUNT(*) FROM ad_bleed_alerts WHERE resolved = FALSE) as active_alerts,
  (SELECT COUNT(*) FROM deployments WHERE created_at > NOW() - INTERVAL '24 hours') as deployments_today,
  (SELECT COALESCE(SUM(wasted_spend), 0) FROM ad_bleed_alerts WHERE resolved = FALSE) as total_ad_bleed;

-- ============================================
-- STEP 10: SEED BOARD OF DIRECTORS
-- ============================================

INSERT INTO agents (name, role, description, avatar, status, capabilities, permissions) VALUES
  ('Atlas', 'ceo', 'Chief Executive Officer - Strategic supervisor and coordinator', '🎯', 'idle',
   ARRAY['strategic_planning', 'task_delegation', 'decision_approval', 'escalation'],
   '{"canDeploy": true, "canModifyBudget": true, "canAccessApify": true, "canAccessGoogleAds": true, "canCreateTasks": true, "canApproveDecisions": true}'::jsonb),

  ('Nova', 'cto', 'Chief Technology Officer - Template selection and technical architecture', '🔧', 'idle',
   ARRAY['template_selection', 'code_review', 'technical_decisions', 'deployment_management'],
   '{"canDeploy": true, "canModifyBudget": false, "canAccessApify": true, "canAccessGoogleAds": false, "canCreateTasks": true, "canApproveDecisions": true}'::jsonb),

  ('Pulse', 'cmo', 'Chief Marketing Officer - Trend analysis and campaign strategy', '📈', 'idle',
   ARRAY['trend_analysis', 'campaign_optimization', 'content_strategy', 'keyword_research'],
   '{"canDeploy": false, "canModifyBudget": false, "canAccessApify": true, "canAccessGoogleAds": true, "canCreateTasks": true, "canApproveDecisions": false}'::jsonb),

  ('Apex', 'cfo', 'Chief Financial Officer - Revenue analysis and ad spend optimization', '💰', 'idle',
   ARRAY['revenue_analysis', 'ad_bleed_detection', 'budget_optimization', 'roas_forecasting'],
   '{"canDeploy": false, "canModifyBudget": true, "canAccessApify": false, "canAccessGoogleAds": true, "canCreateTasks": true, "canApproveDecisions": false}'::jsonb);

-- ============================================
-- STEP 11: SEED LANDING PAGE TEMPLATES
-- ============================================

INSERT INTO templates (template_id, name, description, purpose, target_intent, features) VALUES
  ('T01', 'The Converter', 'High-intent PPC landing page optimized for conversions', 'Capture high-intent PPC traffic', 'transactional',
   ARRAY['Hero section', 'Trust bar', 'Single CTA', 'Testimonials', 'FAQ']),

  ('T02', 'The Booking Portal', 'Streamlined appointment scheduling interface', 'Drive appointment bookings', 'transactional',
   ARRAY['Calendar picker', 'Service selection', 'Payment integration', 'Confirmation flow']),

  ('T03', 'The Visual Gallery', 'Portfolio showcase with before/after comparisons', 'Display work portfolio', 'commercial',
   ARRAY['Masonry grid', 'Before/after slider', 'Category filters', 'Lightbox view']),

  ('T04', 'The Educational Hub', 'SEO-optimized blog post template', 'Rank for informational queries', 'informational',
   ARRAY['Table of contents', 'FAQ schema', 'Related content', 'Author bio', 'Share buttons']),

  ('T05', 'The Comparison Guide', 'Service/product comparison with decision support', 'Win decision-phase searches', 'commercial',
   ARRAY['Comparison table', 'Cost calculator', 'Pros/cons lists', 'CTA sections']),

  ('T06', 'The Product Drop', 'Single product showcase for e-commerce', 'Drive product sales', 'transactional',
   ARRAY['Product hero', 'Add to cart', 'Reviews', 'Related products', 'Trust badges']),

  ('T07', 'The Local Geo-Page', 'Location-specific landing page for local SEO', 'Capture local search traffic', 'transactional',
   ARRAY['Dynamic city/service H1', 'Map embed', 'Local business schema', 'Neighborhood content']),

  ('T08', 'The Lead Magnet', 'Email capture page with value exchange', 'Build email list', 'informational',
   ARRAY['Squeeze form', 'PDF delivery', 'Thank you page', 'Email integration']),

  ('T09', 'The Review Wall', 'Aggregated reviews and testimonials page', 'Build social proof', 'commercial',
   ARRAY['Review aggregation', 'Video testimonials', 'Rating summary', 'Platform badges']),

  ('T10', 'The Link-in-Bio', 'Mobile-optimized link routing page', 'Route social traffic', 'navigational',
   ARRAY['Mobile menu', 'Featured links', 'Analytics tracking', 'Custom branding']);

-- ============================================
-- STEP 9: RAG / VECTOR SEARCH
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE server_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_server_embeddings_server_id ON server_embeddings(server_id);
CREATE INDEX idx_server_embeddings_source ON server_embeddings(source_type);
CREATE INDEX idx_server_embeddings_embedding ON server_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER update_server_embeddings_updated_at
  BEFORE UPDATE ON server_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- Next steps:
-- 1. Run the MCP server seeding script to populate registry
-- 2. Configure .env with database credentials
-- 3. Start the API server
-- 4. Verify CLI connectivity
