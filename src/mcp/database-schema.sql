-- OpenConductor MCP Database Schema Extensions
-- Comprehensive schema supporting both Trinity AI agents and MCP server registry
-- Version: 2.0.0 (MCP Integration)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create custom types for MCP functionality
CREATE TYPE subscription_tier AS ENUM ('free', 'professional', 'team', 'enterprise');
CREATE TYPE mcp_transport AS ENUM ('stdio', 'http_sse', 'websocket');
CREATE TYPE performance_tier AS ENUM ('basic', 'standard', 'premium', 'enterprise');
CREATE TYPE server_status AS ENUM ('pending', 'active', 'deprecated', 'archived');
CREATE TYPE workflow_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE execution_status AS ENUM ('queued', 'running', 'completed', 'failed', 'canceled');
CREATE TYPE execution_trigger AS ENUM ('manual', 'scheduled', 'webhook', 'api');
CREATE TYPE usage_event_type AS ENUM ('workflow_execution', 'api_call', 'server_install', 'tool_usage');
CREATE TYPE resource_type AS ENUM ('workflow', 'server', 'tool', 'api_endpoint');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid');
CREATE TYPE interaction_type AS ENUM ('view', 'install', 'uninstall', 'rate', 'star', 'fork');
CREATE TYPE interaction_outcome AS ENUM ('success', 'failure', 'abandoned');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE license_type AS ENUM ('open_source', 'commercial', 'freemium', 'enterprise');
CREATE TYPE template_status AS ENUM ('draft', 'published', 'featured', 'archived');

-- =====================================================
-- ENHANCED USER MANAGEMENT FOR MCP
-- =====================================================

-- Enhanced users table (assumes existing users table, adding MCP-specific columns)
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free';
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS mcp_settings JSONB DEFAULT '{}';

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    avatar_url TEXT,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    plan subscription_tier DEFAULT 'free',
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    mcp_settings JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MCP SERVER REGISTRY (CORE NEW FUNCTIONALITY)
-- =====================================================

-- MCP Server Registry - Core server information
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES users(id),
    
    -- Technical Details
    transport_type mcp_transport DEFAULT 'stdio',
    repository_url TEXT,
    documentation_url TEXT,
    npm_package VARCHAR(255),
    docker_image TEXT,
    
    -- Installation & Configuration
    installation_command TEXT,
    configuration_schema JSONB,
    environment_variables JSONB DEFAULT '{}',
    
    -- Metadata & Discovery
    categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    use_cases TEXT[] DEFAULT '{}',
    
    -- AI-Enhanced Search (pgvector embeddings)
    description_embedding vector(1536),
    use_case_embedding vector(1536),
    
    -- Performance & Compatibility
    performance_tier performance_tier DEFAULT 'standard',
    compatibility_score FLOAT DEFAULT 0.0,
    avg_response_time_ms INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    
    -- Community & Quality
    download_count INTEGER DEFAULT 0,
    star_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    rating_average FLOAT DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    
    -- Versioning
    version VARCHAR(20) DEFAULT '1.0.0',
    latest_version VARCHAR(20),
    last_updated TIMESTAMP,
    
    -- Status & Moderation
    status server_status DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_official BOOLEAN DEFAULT false,
    
    -- Analytics
    weekly_downloads INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,
    
    -- Enterprise features
    enterprise_tier performance_tier DEFAULT 'basic',
    sla_tier VARCHAR(20) DEFAULT 'community',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- MCP Server Tools Registry - Individual tools provided by servers
CREATE TABLE mcp_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    
    -- Tool specification
    input_schema JSONB,
    output_schema JSONB,
    examples JSONB DEFAULT '[]',
    
    -- AI Enhancement for discovery
    description_embedding vector(1536),
    
    -- Usage analytics
    usage_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 1.0,
    last_used TIMESTAMP,
    
    -- Tool metadata
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_server_tool UNIQUE(server_id, name)
);

-- MCP Workflows - Workflows using MCP servers
CREATE TABLE mcp_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Workflow Definition (DAG structure)
    definition JSONB NOT NULL, -- nodes, edges, configuration
    version INTEGER DEFAULT 1,
    
    -- Sharing & Templates
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    template_id UUID,
    
    -- Execution Configuration  
    timeout_seconds INTEGER DEFAULT 300,
    retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff": "exponential"}',
    
    -- Analytics & Performance
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    last_executed TIMESTAMP,
    
    -- Community Features
    star_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- Status
    status workflow_status DEFAULT 'draft',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow templates marketplace
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template Configuration
    template_definition JSONB NOT NULL,
    required_servers UUID[] DEFAULT '{}',
    difficulty_level difficulty_level DEFAULT 'beginner',
    
    -- Marketplace Features
    price_usd DECIMAL(8, 2) DEFAULT 0.00,
    license_type license_type DEFAULT 'open_source',
    
    -- Community Metrics
    download_count INTEGER DEFAULT 0,
    rating_average FLOAT DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    star_count INTEGER DEFAULT 0,
    
    -- Discovery
    tags TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    use_cases TEXT[] DEFAULT '{}',
    
    -- Status
    is_featured BOOLEAN DEFAULT false,
    status template_status DEFAULT 'draft',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add template reference to workflows (separate to avoid circular dependency)
ALTER TABLE mcp_workflows ADD COLUMN template_id UUID REFERENCES workflow_templates(id);

-- MCP Workflow Executions (High-Volume Table - Partitioned)
CREATE TABLE mcp_workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES mcp_workflows(id),
    user_id UUID REFERENCES users(id),
    
    -- Execution Context
    trigger_type execution_trigger DEFAULT 'manual',
    input_data JSONB,
    
    -- State Management
    status execution_status DEFAULT 'queued',
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    
    -- Results & Logging
    output_data JSONB,
    error_message TEXT,
    execution_log JSONB DEFAULT '[]',
    
    -- Performance Metrics
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    execution_time_ms INTEGER,
    
    -- Resource Usage & Billing
    tokens_consumed INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    servers_used TEXT[] DEFAULT '{}',
    cost_usd DECIMAL(10, 4) DEFAULT 0.0000,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
) PARTITION BY RANGE (started_at);

-- =====================================================
-- SUBSCRIPTION & BILLING SYSTEM
-- =====================================================

-- Subscription plans and billing
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe Integration
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    
    -- Plan Details
    plan subscription_tier NOT NULL,
    status subscription_status DEFAULT 'active',
    
    -- Billing Cycle
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    
    -- Usage Limits & Tracking
    workflow_executions_limit INTEGER,
    workflow_executions_used INTEGER DEFAULT 0,
    api_calls_limit INTEGER,
    api_calls_used INTEGER DEFAULT 0,
    server_installs_limit INTEGER,
    server_installs_used INTEGER DEFAULT 0,
    
    -- Enterprise features
    enterprise_features JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    canceled_at TIMESTAMP
);

-- Usage events for billing and analytics
CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Event Classification
    event_type usage_event_type NOT NULL,
    resource_type resource_type NOT NULL,
    resource_id UUID,
    
    -- Metrics
    quantity INTEGER DEFAULT 1,
    cost_usd DECIMAL(10, 4) DEFAULT 0.0000,
    
    -- Context
    metadata JSONB DEFAULT '{}',
    
    -- Billing period
    billing_period DATE DEFAULT CURRENT_DATE,
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- =====================================================
-- COMMUNITY FEATURES & SOCIAL
-- =====================================================

-- Server stars (community engagement)
CREATE TABLE server_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, server_id)
);

-- Workflow stars
CREATE TABLE workflow_stars (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES mcp_workflows(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, workflow_id)
);

-- Server ratings and reviews
CREATE TABLE server_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, server_id)
);

-- =====================================================
-- ANALYTICS & USER BEHAVIOR
-- =====================================================

-- User interactions for ML/recommendation engine
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    interaction_type interaction_type NOT NULL,
    resource_id UUID NOT NULL,
    resource_type resource_type NOT NULL,
    
    -- Context & Behavior Analysis
    session_id UUID,
    duration_ms INTEGER,
    outcome interaction_outcome,
    
    -- ML Feature Engineering
    user_context JSONB DEFAULT '{}', -- skill level, preferences, history
    resource_context JSONB DEFAULT '{}', -- server metadata, performance
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    timestamp TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- MCP Server indexes
CREATE INDEX idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX idx_mcp_servers_author_id ON mcp_servers(author_id);
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX idx_mcp_servers_categories ON mcp_servers USING GIN(categories);
CREATE INDEX idx_mcp_servers_tags ON mcp_servers USING GIN(tags);
CREATE INDEX idx_mcp_servers_is_featured ON mcp_servers(is_featured) WHERE is_featured = true;
CREATE INDEX idx_mcp_servers_performance_tier ON mcp_servers(performance_tier);

-- Vector indexes for semantic search
CREATE INDEX idx_mcp_servers_description_embedding ON mcp_servers 
USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_mcp_servers_use_case_embedding ON mcp_servers 
USING ivfflat (use_case_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_mcp_tools_description_embedding ON mcp_tools 
USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX idx_mcp_servers_search ON mcp_servers 
USING GIN (to_tsvector('english', name || ' ' || description));

-- MCP Workflow indexes
CREATE INDEX idx_mcp_workflows_user_id ON mcp_workflows(user_id);
CREATE INDEX idx_mcp_workflows_status ON mcp_workflows(status);
CREATE INDEX idx_mcp_workflows_is_public ON mcp_workflows(is_public) WHERE is_public = true;
CREATE INDEX idx_mcp_workflows_is_template ON mcp_workflows(is_template) WHERE is_template = true;
CREATE INDEX idx_mcp_workflows_tags ON mcp_workflows USING GIN(tags);

-- Execution indexes
CREATE INDEX idx_mcp_workflow_executions_user_id ON mcp_workflow_executions(user_id);
CREATE INDEX idx_mcp_workflow_executions_status ON mcp_workflow_executions(status);
CREATE INDEX idx_mcp_workflow_executions_workflow_id ON mcp_workflow_executions(workflow_id);

-- Subscription and billing indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Usage events indexes
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_billing_period ON usage_events(billing_period);

-- Community feature indexes
CREATE INDEX idx_server_stars_server_id ON server_stars(server_id);
CREATE INDEX idx_workflow_stars_workflow_id ON workflow_stars(workflow_id);
CREATE INDEX idx_server_ratings_server_id ON server_ratings(server_id);
CREATE INDEX idx_server_ratings_rating ON server_ratings(rating);

-- Analytics indexes
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_resource_type ON user_interactions(resource_type);
CREATE INDEX idx_user_interactions_interaction_type ON user_interactions(interaction_type);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to MCP tables
CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON mcp_servers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_tools_updated_at BEFORE UPDATE ON mcp_tools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_workflows_updated_at BEFORE UPDATE ON mcp_workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update server star count
CREATE OR REPLACE FUNCTION update_server_star_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mcp_servers 
        SET star_count = star_count + 1 
        WHERE id = NEW.server_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mcp_servers 
        SET star_count = star_count - 1 
        WHERE id = OLD.server_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply star count triggers
CREATE TRIGGER update_server_stars_count 
    AFTER INSERT OR DELETE ON server_stars
    FOR EACH ROW EXECUTE FUNCTION update_server_star_count();

-- Function to update workflow star count
CREATE OR REPLACE FUNCTION update_workflow_star_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE mcp_workflows 
        SET star_count = star_count + 1 
        WHERE id = NEW.workflow_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE mcp_workflows 
        SET star_count = star_count - 1 
        WHERE id = OLD.workflow_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_stars_count 
    AFTER INSERT OR DELETE ON workflow_stars
    FOR EACH ROW EXECUTE FUNCTION update_workflow_star_count();

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- Create a view for easy server discovery
CREATE VIEW server_discovery AS
SELECT 
    s.id,
    s.name,
    s.display_name,
    s.description,
    s.categories,
    s.tags,
    s.star_count,
    s.download_count,
    s.rating_average,
    s.is_featured,
    s.is_verified,
    s.performance_tier,
    u.name as author_name,
    COUNT(t.id) as tool_count
FROM mcp_servers s
LEFT JOIN users u ON s.author_id = u.id
LEFT JOIN mcp_tools t ON s.id = t.server_id
WHERE s.status = 'active'
GROUP BY s.id, u.name;

-- Workflow discovery view
CREATE VIEW workflow_discovery AS
SELECT 
    w.id,
    w.name,
    w.description,
    w.tags,
    w.star_count,
    w.execution_count,
    w.is_public,
    w.is_template,
    u.name as author_name,
    w.created_at
FROM mcp_workflows w
LEFT JOIN users u ON w.user_id = u.id
WHERE w.status = 'published' AND w.is_public = true;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE mcp_servers IS 'MCP server registry - the core of the "npm for MCP servers" platform';
COMMENT ON TABLE mcp_workflows IS 'User-created workflows using MCP servers';
COMMENT ON TABLE server_stars IS 'Community engagement - users starring favorite servers';
COMMENT ON TABLE usage_events IS 'Usage tracking for billing and analytics - partitioned for performance';
COMMENT ON TABLE subscriptions IS 'Subscription plans and billing management with Stripe integration';

COMMENT ON COLUMN mcp_servers.description_embedding IS 'Vector embedding for semantic search of server descriptions';
COMMENT ON COLUMN mcp_servers.performance_tier IS 'Performance classification for filtering and recommendations';
COMMENT ON COLUMN mcp_workflows.definition IS 'JSON workflow definition with DAG structure, nodes, and edges';

COMMENT ON VIEW server_discovery IS 'Optimized view for server discovery and search functionality';
COMMENT ON VIEW workflow_discovery IS 'Public workflows available for discovery and sharing';