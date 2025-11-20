-- Roadmap Management Schema
-- Supports public roadmap, feature requests, and progress tracking

-- Roadmap Categories table
CREATE TABLE IF NOT EXISTS roadmap_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
  icon VARCHAR(50), -- Icon name for UI
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roadmap Items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES roadmap_categories(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in-progress', 'completed', 'on-hold', 'cancelled'
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  target_quarter VARCHAR(20), -- e.g., 'Q1 2025', 'Q2 2025'
  target_date DATE,
  completed_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  owner VARCHAR(255), -- Team member responsible
  tags JSONB DEFAULT '[]'::jsonb, -- Array of tag strings
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional flexible data
  vote_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roadmap Updates table (progress tracking)
CREATE TABLE IF NOT EXISTS roadmap_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  update_type VARCHAR(50) DEFAULT 'progress', -- 'progress', 'milestone', 'delay', 'completion'
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  progress_change INTEGER, -- Change in progress percentage
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Votes table (for feature prioritization)
CREATE TABLE IF NOT EXISTS roadmap_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL, -- Email, user ID, or anonymized identifier
  vote_value INTEGER DEFAULT 1, -- Can support weighted voting in future
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(roadmap_item_id, user_identifier)
);

-- Milestones table (for grouping related roadmap items)
CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'postponed'
  roadmap_item_ids JSONB DEFAULT '[]'::jsonb, -- Array of roadmap item IDs
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_priority ON roadmap_items(priority);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category ON roadmap_items(category_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_public ON roadmap_items(is_public);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_featured ON roadmap_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_target_date ON roadmap_items(target_date);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_created_at ON roadmap_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_updates_item_id ON roadmap_updates(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_updates_created_at ON roadmap_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_votes_item_id ON roadmap_votes(roadmap_item_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_categories_active ON roadmap_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_status ON roadmap_milestones(status);

-- Insert default categories
INSERT INTO roadmap_categories (name, slug, description, color, icon, display_order) VALUES
(
  'Core Features',
  'core-features',
  'Essential functionality and core platform features',
  '#3B82F6',
  'Zap',
  1
),
(
  'Integrations',
  'integrations',
  'Third-party integrations and ecosystem expansion',
  '#10B981',
  'Puzzle',
  2
),
(
  'Developer Experience',
  'developer-experience',
  'Tools, documentation, and improvements for developers',
  '#8B5CF6',
  'Code',
  3
),
(
  'Performance',
  'performance',
  'Speed, scalability, and optimization improvements',
  '#F59E0B',
  'Gauge',
  4
),
(
  'Security',
  'security',
  'Security enhancements and compliance features',
  '#EF4444',
  'Shield',
  5
),
(
  'Community',
  'community',
  'Community features, governance, and collaboration tools',
  '#EC4899',
  'Users',
  6
)
ON CONFLICT DO NOTHING;

-- Insert sample roadmap items
INSERT INTO roadmap_items (title, slug, description, category_id, status, priority, target_quarter, progress_percentage, owner, tags, is_featured) VALUES
(
  'Enhanced Search Capabilities',
  'enhanced-search',
  'Implement advanced search with filters, facets, and semantic search for MCP servers',
  (SELECT id FROM roadmap_categories WHERE slug = 'core-features'),
  'in-progress',
  'high',
  'Q1 2025',
  45,
  'Engineering Team',
  '["search", "discovery", "ux"]'::jsonb,
  true
),
(
  'Smithery.ai Integration',
  'smithery-integration',
  'Deep integration with Smithery.ai for enhanced server discovery and management',
  (SELECT id FROM roadmap_categories WHERE slug = 'integrations'),
  'planned',
  'high',
  'Q1 2025',
  0,
  'Partnerships Team',
  '["integration", "partnership", "smithery"]'::jsonb,
  true
),
(
  'CLI Performance Optimization',
  'cli-optimization',
  'Optimize CLI install times and reduce bundle size by 50%',
  (SELECT id FROM roadmap_categories WHERE slug = 'performance'),
  'in-progress',
  'medium',
  'Q1 2025',
  60,
  'Engineering Team',
  '["cli", "performance", "optimization"]'::jsonb,
  false
),
(
  'GraphQL API',
  'graphql-api',
  'Provide GraphQL API alongside REST for flexible data querying',
  (SELECT id FROM roadmap_categories WHERE slug = 'developer-experience'),
  'planned',
  'medium',
  'Q2 2025',
  0,
  'API Team',
  '["api", "graphql", "developer"]'::jsonb,
  false
),
(
  'OAuth Integration',
  'oauth-integration',
  'Support OAuth authentication for secure server installations',
  (SELECT id FROM roadmap_categories WHERE slug = 'security'),
  'planned',
  'high',
  'Q2 2025',
  0,
  'Security Team',
  '["auth", "oauth", "security"]'::jsonb,
  true
),
(
  'Community Server Voting',
  'community-voting',
  'Allow community to vote on server quality and request new servers',
  (SELECT id FROM roadmap_categories WHERE slug = 'community'),
  'completed',
  'medium',
  'Q4 2024',
  100,
  'Product Team',
  '["community", "voting", "feedback"]'::jsonb,
  false
)
ON CONFLICT DO NOTHING;

-- Insert sample updates for in-progress items
INSERT INTO roadmap_updates (roadmap_item_id, title, content, update_type, new_status, progress_change, created_by) VALUES
(
  (SELECT id FROM roadmap_items WHERE slug = 'enhanced-search'),
  'Search backend implementation complete',
  'Completed the backend search infrastructure with Elasticsearch integration. Now working on frontend UI components.',
  'progress',
  'in-progress',
  25,
  'Engineering Team'
),
(
  (SELECT id FROM roadmap_items WHERE slug = 'cli-optimization'),
  'Reduced bundle size by 30%',
  'Successfully optimized dependencies and tree-shaking. Bundle size reduced from 12MB to 8.4MB. Working on further optimizations.',
  'milestone',
  'in-progress',
  35,
  'Engineering Team'
)
ON CONFLICT DO NOTHING;

-- Add triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roadmap_categories_updated_at
  BEFORE UPDATE ON roadmap_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();

CREATE TRIGGER update_roadmap_milestones_updated_at
  BEFORE UPDATE ON roadmap_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();

-- Add trigger to update vote_count on roadmap_items
CREATE OR REPLACE FUNCTION update_roadmap_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE roadmap_items
    SET vote_count = vote_count + NEW.vote_value
    WHERE id = NEW.roadmap_item_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE roadmap_items
    SET vote_count = vote_count - OLD.vote_value
    WHERE id = OLD.roadmap_item_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE roadmap_items
    SET vote_count = vote_count + (NEW.vote_value - OLD.vote_value)
    WHERE id = NEW.roadmap_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roadmap_votes_count
  AFTER INSERT OR UPDATE OR DELETE ON roadmap_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_vote_count();
