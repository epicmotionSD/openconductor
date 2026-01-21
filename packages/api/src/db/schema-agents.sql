-- Board of Directors - Revenue Sniper DevOps Agent Schema
-- Multi-agent supervisor system for autonomous revenue operations

-- Agent role enum
CREATE TYPE agent_role AS ENUM (
  'ceo',       -- Chief Executive - Supervisor, strategic decisions
  'cto',       -- Chief Technology - Architecture, template selection
  'cmo',       -- Chief Marketing - Trend analysis, campaigns
  'cfo',       -- Chief Financial - Revenue analysis, ad bleed detection
  'researcher', -- Intelligence gathering
  'architect',  -- Technical design
  'coder',      -- Code generation
  'reviewer'    -- Quality assurance
);

-- Agent status enum
CREATE TYPE agent_status AS ENUM (
  'idle',
  'active',
  'paused',
  'error',
  'offline'
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Decision type enum
CREATE TYPE decision_type AS ENUM (
  'deploy_template',
  'pause_keyword',
  'adjust_budget',
  'create_campaign',
  'flag_ad_bleed',
  'recommend_action',
  'escalate_to_human'
);

-- Signal type enum
CREATE TYPE signal_type AS ENUM (
  'trend',
  'ad_bleed',
  'opportunity',
  'threat',
  'competitor'
);

-- Signal source enum
CREATE TYPE signal_source AS ENUM (
  'apify',
  'google_ads',
  'google_trends',
  'social',
  'serp'
);

-- Ad bleed type enum
CREATE TYPE ad_bleed_type AS ENUM (
  'intent_mismatch',
  'cannibalization',
  'dead_trend',
  'negative_keyword',
  'competitor_gap'
);

-- Deployment status enum
CREATE TYPE deployment_status AS ENUM (
  'pending',
  'building',
  'deploying',
  'live',
  'failed',
  'rolled_back'
);

-- Template intent enum
CREATE TYPE template_intent AS ENUM (
  'transactional',
  'informational',
  'commercial',
  'navigational'
);

-- ============================================
-- AGENTS TABLE
-- ============================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  role agent_role NOT NULL,
  description TEXT,
  avatar VARCHAR(50), -- emoji or icon identifier

  -- Status
  status agent_status DEFAULT 'offline',

  -- Capabilities & Permissions
  capabilities TEXT[], -- e.g., ['trend_analysis', 'template_selection']
  permissions JSONB DEFAULT '{}',

  -- Manifest (configuration)
  manifest JSONB DEFAULT '{}',

  -- Metrics (cached for performance)
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  avg_response_time DECIMAL(10, 2) DEFAULT 0,
  success_rate DECIMAL(5, 2) DEFAULT 0,

  -- Timestamps
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role) -- Only one agent per role
);

CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_status ON agents(status);

-- ============================================
-- AGENT SESSIONS TABLE
-- ============================================
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  -- Session state
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Context
  context JSONB DEFAULT '{}', -- session context/memory

  -- Metrics
  tasks_processed INTEGER DEFAULT 0,
  decisions_made INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_active ON agent_sessions(agent_id, ended_at) WHERE ended_at IS NULL;

-- ============================================
-- AGENT TASKS TABLE (Inter-agent communication)
-- ============================================
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  to_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  -- Task details
  task_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}',

  -- Priority & Status
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',

  -- Result
  result JSONB,
  error TEXT,

  -- Timestamps
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_tasks_to_agent ON agent_tasks(to_agent_id, status);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status, priority DESC, created_at);
CREATE INDEX idx_agent_tasks_from_agent ON agent_tasks(from_agent_id);

-- ============================================
-- AGENT DECISIONS TABLE (Audit trail)
-- ============================================
CREATE TABLE agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_role agent_role,

  -- Decision details
  decision_type decision_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reasoning TEXT,
  data JSONB DEFAULT '{}',

  -- Confidence & Impact
  confidence DECIMAL(3, 2) DEFAULT 0, -- 0.00 to 1.00
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high', 'critical')),

  -- Approval
  approved BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(100), -- agent ID or 'human'
  executed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_type ON agent_decisions(decision_type);
CREATE INDEX idx_agent_decisions_pending ON agent_decisions(approved, created_at) WHERE approved = FALSE;
CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at DESC);

-- ============================================
-- REVENUE SIGNALS TABLE (Intelligence data)
-- ============================================
CREATE TABLE revenue_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  signal_type signal_type NOT NULL,
  source signal_source NOT NULL,

  -- Signal details
  keyword VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',

  -- Assessment
  confidence DECIMAL(3, 2) DEFAULT 0,
  urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),

  -- Action tracking
  action_taken BOOLEAN DEFAULT FALSE,
  action_details TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_revenue_signals_type ON revenue_signals(signal_type);
CREATE INDEX idx_revenue_signals_source ON revenue_signals(source);
CREATE INDEX idx_revenue_signals_keyword ON revenue_signals(keyword);
CREATE INDEX idx_revenue_signals_active ON revenue_signals(action_taken, created_at) WHERE action_taken = FALSE;
CREATE INDEX idx_revenue_signals_created ON revenue_signals(created_at DESC);

-- ============================================
-- AD BLEED ALERTS TABLE
-- ============================================
CREATE TABLE ad_bleed_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  bleed_type ad_bleed_type NOT NULL,
  keyword VARCHAR(255) NOT NULL,

  -- Severity & Impact
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  wasted_spend DECIMAL(10, 2) DEFAULT 0,
  wasted_spend_period VARCHAR(20) DEFAULT '7d',

  -- Metrics
  current_cpc DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 2),
  organic_rank INTEGER,

  -- Recommendation
  recommendation TEXT,
  auto_fix_available BOOLEAN DEFAULT FALSE,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_bleed_alerts_type ON ad_bleed_alerts(bleed_type);
CREATE INDEX idx_ad_bleed_alerts_keyword ON ad_bleed_alerts(keyword);
CREATE INDEX idx_ad_bleed_alerts_unresolved ON ad_bleed_alerts(resolved, severity) WHERE resolved = FALSE;
CREATE INDEX idx_ad_bleed_alerts_created ON ad_bleed_alerts(created_at DESC);

-- ============================================
-- TEMPLATES TABLE
-- ============================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  template_id VARCHAR(10) UNIQUE NOT NULL, -- T01-T10
  name VARCHAR(100) NOT NULL,
  description TEXT,
  purpose TEXT,

  -- Classification
  target_intent template_intent NOT NULL,
  features TEXT[],

  -- Schema
  component_schema JSONB DEFAULT '{}',

  -- Stats
  deploy_count INTEGER DEFAULT 0,
  avg_conversion_rate DECIMAL(5, 2),

  -- Preview
  preview_url VARCHAR(500),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_id ON templates(template_id);
CREATE INDEX idx_templates_intent ON templates(target_intent);

-- ============================================
-- DEPLOYMENTS TABLE
-- ============================================
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  template_id VARCHAR(10) REFERENCES templates(template_id),
  template_name VARCHAR(100),

  -- Target
  target_keyword VARCHAR(255),
  target_url VARCHAR(500),

  -- Status
  status deployment_status DEFAULT 'pending',

  -- Attribution
  triggered_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  approved_by VARCHAR(100), -- agent ID or 'human'

  -- Vercel
  vercel_deployment_id VARCHAR(100),
  preview_url VARCHAR(500),
  live_url VARCHAR(500),

  -- Metrics
  roas_predicted DECIMAL(10, 2),
  roas_actual DECIMAL(10, 2),
  quality_score INTEGER,

  -- Logs
  build_log TEXT,
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ
);

CREATE INDEX idx_deployments_template ON deployments(template_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_keyword ON deployments(target_keyword);
CREATE INDEX idx_deployments_created ON deployments(created_at DESC);

-- ============================================
-- AD CAMPAIGNS TABLE (For tracking)
-- ============================================
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- External IDs
  google_ads_campaign_id VARCHAR(100),

  -- Campaign details
  name VARCHAR(255) NOT NULL,
  keywords TEXT[],

  -- Budget
  daily_budget DECIMAL(10, 2),
  total_spend DECIMAL(10, 2) DEFAULT 0,

  -- Performance
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_click DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 2),
  roas DECIMAL(10, 2),

  -- Status
  active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_active ON ad_campaigns(active) WHERE active = TRUE;
CREATE INDEX idx_ad_campaigns_google_id ON ad_campaigns(google_ads_campaign_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
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
-- SEED DATA: Default Board of Directors
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
-- SEED DATA: Top 10 Templates
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
-- VIEW: Command Center Summary
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
