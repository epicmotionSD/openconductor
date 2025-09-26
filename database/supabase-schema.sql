-- OpenConductor Supabase Production Database Schema
-- Comprehensive schema for MCP platform with pgvector semantic search

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
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

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    plan subscription_tier DEFAULT 'free',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- MCP Server Registry
CREATE TABLE public.mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    author_id UUID REFERENCES public.users(id),
    
    -- Technical Details
    transport_type mcp_transport DEFAULT 'stdio',
    repository_url TEXT,
    documentation_url TEXT,
    npm_package VARCHAR(255),
    docker_image TEXT,
    
    -- Metadata & Discovery
    categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    use_cases TEXT[] DEFAULT '{}',
    
    -- AI-Enhanced Search (pgvector)
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
    last_updated TIMESTAMP,
    
    -- Status & Moderation
    status server_status DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Analytics
    weekly_downloads INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for MCP servers
CREATE INDEX idx_mcp_servers_embedding ON mcp_servers 
    USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_mcp_servers_search ON mcp_servers 
    USING GIN (to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_mcp_servers_status ON mcp_servers (status);
CREATE INDEX idx_mcp_servers_categories ON mcp_servers USING GIN (categories);
CREATE INDEX idx_mcp_servers_tags ON mcp_servers USING GIN (tags);

-- Enable RLS for MCP servers
ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

-- RLS policies for MCP servers
CREATE POLICY "MCP servers are viewable by everyone" ON public.mcp_servers
    FOR SELECT USING (status = 'active'::server_status);

CREATE POLICY "Users can create MCP servers" ON public.mcp_servers
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own MCP servers" ON public.mcp_servers
    FOR UPDATE USING (auth.uid() = author_id);

-- MCP Server Tools Registry
CREATE TABLE public.mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    input_schema JSONB,
    output_schema JSONB,
    examples JSONB DEFAULT '[]',
    
    -- AI Enhancement
    description_embedding vector(1536),
    
    -- Usage Analytics
    usage_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 1.0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_server_tool UNIQUE(server_id, name)
);

-- Workflow Management
CREATE TABLE public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Workflow Definition
    definition JSONB NOT NULL, -- DAG structure, nodes, edges
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    
    -- Execution Configuration  
    timeout_seconds INTEGER DEFAULT 300,
    retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff": "exponential"}',
    
    -- Analytics & Performance
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    
    -- Community
    star_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    
    -- Status
    status workflow_status DEFAULT 'draft',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for workflows
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflows
CREATE POLICY "Users can view own workflows" ON public.workflows
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON public.workflows
    FOR UPDATE USING (auth.uid() = user_id);

-- Workflow Executions
CREATE TABLE public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    user_id UUID REFERENCES public.users(id),
    
    -- Execution Context
    trigger_type execution_trigger DEFAULT 'manual',
    input_data JSONB,
    
    -- State Management
    status execution_status DEFAULT 'running',
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
    
    -- Resource Usage
    tokens_consumed INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 4) DEFAULT 0.0000
);

-- Enable RLS for workflow executions
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow executions
CREATE POLICY "Users can view own executions" ON public.workflow_executions
    FOR SELECT USING (auth.uid() = user_id);

-- Subscription Management
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Stripe Integration
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    
    -- Plan Details
    plan subscription_tier NOT NULL,
    status subscription_status DEFAULT 'active',
    
    -- Billing Cycle
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    
    -- Usage Limits
    workflow_executions_limit INTEGER,
    workflow_executions_used INTEGER DEFAULT 0,
    api_calls_limit INTEGER,
    api_calls_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    canceled_at TIMESTAMP
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Trinity AI Agent States
CREATE TABLE public.trinity_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    agent_type VARCHAR(50) NOT NULL, -- 'oracle', 'sentinel', 'sage'
    
    -- Agent State
    confidence FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'idle',
    last_update TIMESTAMP DEFAULT NOW(),
    
    -- Metrics
    requests_processed INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
    avg_response_time_ms INTEGER DEFAULT 0,
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    -- MCP Workflows
    connected_workflows UUID[] DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_agent UNIQUE(user_id, agent_type)
);

-- Functions for maintaining updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON public.mcp_servers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trinity_agents_updated_at BEFORE UPDATE ON public.trinity_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed data for production
INSERT INTO public.mcp_servers (name, display_name, description, categories, tags, status, is_verified, is_featured, download_count, star_count, performance_tier) VALUES
('file-system-server', 'File System Server', 'Secure file operations with sandboxing', ARRAY['storage', 'files'], ARRAY['filesystem', 'storage', 'files'], 'active', true, true, 1250, 89, 'premium'),
('postgres-server', 'PostgreSQL Server', 'Database operations and query execution', ARRAY['database', 'sql'], ARRAY['postgresql', 'database', 'sql'], 'active', true, true, 890, 67, 'standard'),
('slack-server', 'Slack Integration', 'Send messages and manage Slack workspaces', ARRAY['communication', 'messaging'], ARRAY['slack', 'messaging', 'notifications'], 'active', true, false, 654, 45, 'standard'),
('aws-server', 'AWS Services', 'Interact with AWS services and resources', ARRAY['cloud', 'infrastructure'], ARRAY['aws', 'cloud', 'infrastructure'], 'active', true, true, 432, 34, 'enterprise'),
('monitoring-server', 'Monitoring & Alerts', 'System monitoring and alerting capabilities', ARRAY['monitoring', 'observability'], ARRAY['monitoring', 'alerts', 'observability'], 'active', true, false, 321, 28, 'standard');