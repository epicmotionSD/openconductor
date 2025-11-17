-- Migration 007: MCP Server Discovery System
-- Created: 2025-11-17
-- Purpose: Automated discovery, validation, and community submissions

-- =====================================================
-- Discovery Queue - Repos to process
-- =====================================================
CREATE TABLE IF NOT EXISTS discovery_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_url VARCHAR(500) NOT NULL UNIQUE,
  repository_full_name VARCHAR(255), -- e.g., "owner/repo"
  source_type VARCHAR(50) NOT NULL, -- 'github_search', 'community_submission', 'awesome_list', 'manual', 'webhook'
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- Higher = more important
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'skipped'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context (submitter info, search query, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_discovery_queue_pending ON discovery_queue(status, priority DESC, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_discovery_queue_retry ON discovery_queue(next_retry_at)
  WHERE status = 'failed' AND retry_count < max_retries;
CREATE INDEX idx_discovery_queue_source ON discovery_queue(source_type, created_at DESC);

-- =====================================================
-- Server Validations - Track validation results
-- =====================================================
CREATE TABLE IF NOT EXISTS server_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  repository_url VARCHAR(500), -- For pre-creation validation
  validation_type VARCHAR(50) NOT NULL, -- 'package_json', 'sdk_dependency', 'install_test', 'functional_test', 'structure'
  passed BOOLEAN NOT NULL,
  score INTEGER, -- 0-100 quality score
  details JSONB DEFAULT '{}', -- Detailed results
  error_message TEXT,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validator_version VARCHAR(50) -- Track which version of validator ran
);

CREATE INDEX idx_validations_server ON server_validations(server_id, validated_at DESC);
CREATE INDEX idx_validations_url ON server_validations(repository_url, validated_at DESC);
CREATE INDEX idx_validations_type ON server_validations(validation_type, passed);

-- =====================================================
-- Community Submissions - User-submitted servers
-- =====================================================
CREATE TABLE IF NOT EXISTS server_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_url VARCHAR(500) NOT NULL,
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  submitter_github VARCHAR(255),
  description TEXT,
  suggested_category VARCHAR(50),
  suggested_tags TEXT[], -- User-suggested tags
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'duplicate', 'auto_added'
  auto_processed BOOLEAN DEFAULT false, -- Was it auto-approved?
  review_notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE SET NULL, -- Linked after creation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON server_submissions(status, created_at DESC);
CREATE INDEX idx_submissions_url ON server_submissions(repository_url);
CREATE INDEX idx_submissions_pending ON server_submissions(created_at DESC)
  WHERE status = 'pending';

-- =====================================================
-- Discovery Sources - Track where servers came from
-- =====================================================
CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'github_search', 'topic_watch', 'manual_submission', 'awesome_list', 'webhook', 'community'
  source_metadata JSONB DEFAULT '{}', -- Search query, topic name, submitter info, etc.
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discovered_by VARCHAR(255) -- User/system that discovered it
);

CREATE INDEX idx_discovery_sources_server ON discovery_sources(server_id);
CREATE INDEX idx_discovery_sources_type ON discovery_sources(source_type, discovered_at DESC);

-- =====================================================
-- Fork Detection - Track repository relationships
-- =====================================================
CREATE TABLE IF NOT EXISTS repository_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  parent_server_id UUID REFERENCES mcp_servers(id) ON DELETE SET NULL,
  relationship_type VARCHAR(50) NOT NULL, -- 'fork', 'duplicate', 'template', 'related'
  confidence_score NUMERIC(3,2), -- 0.00-1.00 confidence in relationship
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- GitHub fork data, similarity scores, etc.
  UNIQUE(server_id, parent_server_id, relationship_type)
);

CREATE INDEX idx_repo_relationships_server ON repository_relationships(server_id);
CREATE INDEX idx_repo_relationships_parent ON repository_relationships(parent_server_id);
CREATE INDEX idx_repo_relationships_forks ON repository_relationships(relationship_type)
  WHERE relationship_type = 'fork';

-- =====================================================
-- Discovery Stats - Track discovery performance
-- =====================================================
CREATE TABLE IF NOT EXISTS discovery_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  repos_discovered INTEGER DEFAULT 0,
  repos_validated INTEGER DEFAULT 0,
  repos_added INTEGER DEFAULT 0,
  repos_rejected INTEGER DEFAULT 0,
  validation_pass_rate NUMERIC(5,2), -- Percentage
  avg_validation_time_ms INTEGER,
  source_breakdown JSONB DEFAULT '{}', -- Count by source type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_discovery_stats_date ON discovery_stats(date DESC);

-- =====================================================
-- Validation Rules - Configurable validation criteria
-- =====================================================
CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_type VARCHAR(50) NOT NULL, -- 'package_json', 'file_structure', 'dependency', 'test'
  enabled BOOLEAN DEFAULT true,
  required BOOLEAN DEFAULT true, -- Must pass for server to be added
  criteria JSONB NOT NULL, -- Rule configuration
  weight INTEGER DEFAULT 1, -- For scoring
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default validation rules
INSERT INTO validation_rules (rule_name, rule_type, required, criteria, weight) VALUES
  ('has_package_json', 'file_structure', true, '{"files": ["package.json"]}', 10),
  ('has_mcp_sdk', 'dependency', true, '{"package": "@modelcontextprotocol/sdk", "minVersion": "0.1.0"}', 20),
  ('npm_install_works', 'test', true, '{"timeout": 60000, "allowedExitCodes": [0]}', 15),
  ('has_readme', 'file_structure', false, '{"files": ["README.md", "readme.md"]}', 5),
  ('has_typescript', 'file_structure', false, '{"files": ["tsconfig.json"]}', 3),
  ('has_tests', 'file_structure', false, '{"patterns": ["**/*.test.ts", "**/*.spec.ts", "test/**"]}', 5),
  ('functional_test', 'test', false, '{"timeout": 30000}', 10)
ON CONFLICT (rule_name) DO NOTHING;

-- =====================================================
-- Triggers for automatic timestamp updates
-- =====================================================
CREATE OR REPLACE FUNCTION update_discovery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submission_timestamp
  BEFORE UPDATE ON server_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_timestamp();

-- =====================================================
-- Functions for discovery operations
-- =====================================================

-- Function to add repo to discovery queue (idempotent)
CREATE OR REPLACE FUNCTION queue_repo_for_discovery(
  p_repository_url VARCHAR(500),
  p_source_type VARCHAR(50),
  p_priority INTEGER DEFAULT 5,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO discovery_queue (repository_url, source_type, priority, metadata)
  VALUES (p_repository_url, p_source_type, p_priority, p_metadata)
  ON CONFLICT (repository_url)
  DO UPDATE SET
    priority = GREATEST(discovery_queue.priority, p_priority),
    metadata = discovery_queue.metadata || p_metadata
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next repo from queue
CREATE OR REPLACE FUNCTION get_next_discovery_item()
RETURNS TABLE (
  id UUID,
  repository_url VARCHAR(500),
  source_type VARCHAR(50),
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE discovery_queue
  SET
    status = 'processing',
    processed_at = NOW()
  WHERE discovery_queue.id = (
    SELECT discovery_queue.id
    FROM discovery_queue
    WHERE discovery_queue.status = 'pending'
    ORDER BY discovery_queue.priority DESC, discovery_queue.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    discovery_queue.id,
    discovery_queue.repository_url,
    discovery_queue.source_type,
    discovery_queue.priority;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats
CREATE OR REPLACE FUNCTION update_discovery_daily_stats()
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO discovery_stats (
    date,
    repos_discovered,
    repos_validated,
    repos_added,
    repos_rejected
  )
  SELECT
    v_today,
    COUNT(*) FILTER (WHERE status IN ('completed', 'failed')),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'completed' AND processed_at IS NOT NULL),
    COUNT(*) FILTER (WHERE status = 'failed')
  FROM discovery_queue
  WHERE DATE(processed_at) = v_today
  ON CONFLICT (date)
  DO UPDATE SET
    repos_discovered = EXCLUDED.repos_discovered,
    repos_validated = EXCLUDED.repos_validated,
    repos_added = EXCLUDED.repos_added,
    repos_rejected = EXCLUDED.repos_rejected,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views for convenient querying
-- =====================================================

-- View: Pending discoveries with priority
CREATE OR REPLACE VIEW v_pending_discoveries AS
SELECT
  dq.id,
  dq.repository_url,
  dq.repository_full_name,
  dq.source_type,
  dq.priority,
  dq.retry_count,
  dq.created_at,
  dq.metadata,
  CASE
    WHEN dq.retry_count = 0 THEN 'new'
    WHEN dq.retry_count < dq.max_retries THEN 'retry'
    ELSE 'max_retries'
  END as discovery_stage
FROM discovery_queue dq
WHERE dq.status = 'pending'
  OR (dq.status = 'failed' AND dq.retry_count < dq.max_retries AND dq.next_retry_at <= NOW())
ORDER BY dq.priority DESC, dq.created_at ASC;

-- View: Server validation summary
CREATE OR REPLACE VIEW v_server_validation_summary AS
SELECT
  s.id as server_id,
  s.name,
  s.repository_url,
  s.verified,
  COUNT(sv.id) as total_validations,
  COUNT(*) FILTER (WHERE sv.passed = true) as passed_validations,
  COUNT(*) FILTER (WHERE sv.passed = false) as failed_validations,
  MAX(sv.validated_at) as last_validated,
  AVG(sv.score)::INTEGER as avg_score
FROM mcp_servers s
LEFT JOIN server_validations sv ON s.id = sv.server_id
GROUP BY s.id, s.name, s.repository_url, s.verified;

COMMENT ON TABLE discovery_queue IS 'Queue of repositories to discover and validate';
COMMENT ON TABLE server_validations IS 'Validation results for MCP servers';
COMMENT ON TABLE server_submissions IS 'Community-submitted server suggestions';
COMMENT ON TABLE discovery_sources IS 'Tracks how each server was discovered';
COMMENT ON TABLE repository_relationships IS 'Tracks forks, duplicates, and related repos';
COMMENT ON TABLE validation_rules IS 'Configurable validation criteria';
COMMENT ON TABLE discovery_stats IS 'Daily discovery and validation statistics';
