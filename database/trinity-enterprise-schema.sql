-- Trinity Agent Enterprise Database Schema
-- Port from x3o.ai production system
-- Supports Oracle Analytics, Sentinel Monitoring, Sage Optimization

-- Core Trinity Agent Configuration
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('oracle', 'sentinel', 'sage')),
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name),
    INDEX idx_ai_agents_type (type),
    INDEX idx_ai_agents_status (status)
);

-- Organizations for Enterprise Support
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255),
    plan_type VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (plan_type IN ('trial', 'professional', 'team', 'enterprise')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'incomplete')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_organizations_plan_type (plan_type),
    INDEX idx_organizations_subscription_status (subscription_status),
    INDEX idx_organizations_stripe_customer_id (stripe_customer_id)
);

-- Users with Trinity Agent Access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    avatar_url TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    trial_token VARCHAR(255) UNIQUE,
    trial_agents VARCHAR(255)[] NOT NULL DEFAULT '{}', -- Array of agent types user has trial access to
    trial_interactions_remaining JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"oracle": 100, "sentinel": 50, "sage": 200}
    last_activity_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_users_organization_id (organization_id),
    INDEX idx_users_email (email),
    INDEX idx_users_trial_token (trial_token)
);

-- NextAuth Integration Tables
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, provider_account_id),
    INDEX idx_accounts_user_id (user_id)
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_expires (expires)
);

CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (identifier, token),
    INDEX idx_verification_tokens_expires (expires)
);

-- Trinity Agent Interactions and Usage Tracking
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    interaction_type VARCHAR(100) NOT NULL, -- 'prediction', 'monitoring', 'advisory', etc.
    input_data JSONB,
    output_data JSONB,
    confidence_score DECIMAL(5,3),
    processing_time_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    roi_impact DECIMAL(12,2), -- Calculated ROI impact in dollars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_ai_interactions_user_id (user_id),
    INDEX idx_ai_interactions_organization_id (organization_id),
    INDEX idx_ai_interactions_agent_id (agent_id),
    INDEX idx_ai_interactions_agent_type (agent_type),
    INDEX idx_ai_interactions_created_at (created_at),
    INDEX idx_ai_interactions_success (success)
);

-- ROI Tracking and Analytics
CREATE TABLE roi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_interactions INTEGER NOT NULL DEFAULT 0,
    successful_interactions INTEGER NOT NULL DEFAULT 0,
    total_processing_time_ms BIGINT NOT NULL DEFAULT 0,
    average_confidence DECIMAL(5,3),
    projected_monthly_savings DECIMAL(12,2),
    time_reduction_hours DECIMAL(8,2),
    efficiency_improvement_percent DECIMAL(5,2),
    decision_accuracy_percent DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_roi_metrics_organization_id (organization_id),
    INDEX idx_roi_metrics_agent_type (agent_type),
    INDEX idx_roi_metrics_period_start (period_start),
    UNIQUE(organization_id, agent_type, period_start, period_end)
);

-- System Configuration for Trinity Agents
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_system_config_category (category),
    INDEX idx_system_config_is_public (is_public)
);

-- Agent Workflows and Automations
CREATE TABLE agent_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_type VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(100) NOT NULL, -- 'prediction_threshold', 'alert_correlation', 'advisory_request'
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    workflow_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    execution_count INTEGER NOT NULL DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_agent_workflows_organization_id (organization_id),
    INDEX idx_agent_workflows_agent_type (agent_type),
    INDEX idx_agent_workflows_trigger_type (trigger_type),
    INDEX idx_agent_workflows_is_active (is_active)
);

-- Workflow Execution History
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES agent_workflows(id) ON DELETE CASCADE,
    triggered_by_interaction_id UUID REFERENCES ai_interactions(id),
    status VARCHAR(50) NOT NULL DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    execution_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    INDEX idx_workflow_executions_workflow_id (workflow_id),
    INDEX idx_workflow_executions_status (status),
    INDEX idx_workflow_executions_started_at (started_at)
);

-- Subscription and Billing Management
CREATE TABLE subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    interaction_limit INTEGER, -- NULL for unlimited
    monthly_price DECIMAL(10,2) NOT NULL,
    stripe_price_id VARCHAR(255),
    stripe_subscription_item_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_subscription_items_organization_id (organization_id),
    INDEX idx_subscription_items_agent_type (agent_type),
    INDEX idx_subscription_items_is_active (is_active)
);

-- Usage tracking for billing
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_item_id UUID NOT NULL REFERENCES subscription_items(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    overage_count INTEGER NOT NULL DEFAULT 0,
    total_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
    stripe_usage_record_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_usage_records_organization_id (organization_id),
    INDEX idx_usage_records_subscription_item_id (subscription_item_id),
    INDEX idx_usage_records_period_start (period_start),
    UNIQUE(subscription_item_id, period_start, period_end)
);

-- Alerts and Notifications
CREATE TABLE alert_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    threshold_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    notification_channels JSONB NOT NULL DEFAULT '[]'::jsonb, -- email, slack, webhook
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_alert_configurations_organization_id (organization_id),
    INDEX idx_alert_configurations_agent_type (agent_type),
    INDEX idx_alert_configurations_is_active (is_active)
);

CREATE TABLE alert_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_configuration_id UUID NOT NULL REFERENCES alert_configurations(id) ON DELETE CASCADE,
    triggered_by_interaction_id UUID REFERENCES ai_interactions(id),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_alert_incidents_organization_id (organization_id),
    INDEX idx_alert_incidents_alert_configuration_id (alert_configuration_id),
    INDEX idx_alert_incidents_severity (severity),
    INDEX idx_alert_incidents_status (status),
    INDEX idx_alert_incidents_created_at (created_at)
);

-- Insert Default Trinity Agents
INSERT INTO ai_agents (name, type, display_name, description, capabilities, configuration) VALUES
    ('oracle-analytics', 'oracle', 'Oracle Analytics', 'Advanced business intelligence with predictive analytics', 
     '["time_series_forecasting", "pattern_recognition", "anomaly_detection", "ml_inference"]', 
     '{"max_predictions_per_day": 1000, "confidence_threshold": 0.7, "models": ["lstm", "arima", "linear_regression"]}'),
     
    ('sentinel-monitoring', 'sentinel', 'Sentinel Monitoring', '24/7 autonomous system monitoring with intelligent alerting',
     '["real_time_monitoring", "alert_correlation", "performance_tracking", "health_checks"]',
     '{"check_interval_seconds": 30, "alert_cooldown_minutes": 5, "max_alerts_per_hour": 50}'),
     
    ('sage-optimization', 'sage', 'Sage Optimization', 'Intelligent content generation and process optimization',
     '["decision_support", "process_optimization", "strategic_planning", "risk_assessment"]',
     '{"recommendation_limit_per_day": 500, "confidence_threshold": 0.6, "analysis_depth": "comprehensive"}');

-- Insert Default System Configuration
INSERT INTO system_config (key, value, description, category, is_public) VALUES
    ('trinity_agent_trial_limits', '{"oracle": 100, "sentinel": 50, "sage": 200}', 'Default interaction limits for 14-day trials', 'trial_management', false),
    ('roi_calculation_settings', '{"time_savings_multiplier": 150, "efficiency_multiplier": 1.2, "cost_per_hour": 75}', 'Settings for ROI calculations', 'analytics', false),
    ('enterprise_features', '{"advanced_analytics": true, "custom_workflows": true, "priority_support": true}', 'Enterprise feature flags', 'features', false),
    ('trial_duration_days', '14', 'Trial period duration in days', 'trial_management', true);

-- Create Functions for ROI Calculations
CREATE OR REPLACE FUNCTION calculate_roi_metrics(org_id UUID, agent_type_param VARCHAR(50), start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE(
    total_interactions INTEGER,
    successful_interactions INTEGER,
    avg_processing_time DECIMAL,
    avg_confidence DECIMAL,
    projected_savings DECIMAL,
    time_reduction DECIMAL,
    efficiency_improvement DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_interactions,
        COUNT(*) FILTER (WHERE success = true)::INTEGER as successful_interactions,
        AVG(processing_time_ms)::DECIMAL as avg_processing_time,
        AVG(confidence_score)::DECIMAL as avg_confidence,
        SUM(COALESCE(roi_impact, 0))::DECIMAL as projected_savings,
        (COUNT(*) * 0.25)::DECIMAL as time_reduction, -- Assuming 15 min saved per interaction
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*)::DECIMAL * 100)
            ELSE 0::DECIMAL 
        END as efficiency_improvement
    FROM ai_interactions 
    WHERE organization_id = org_id 
        AND agent_type = agent_type_param 
        AND created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for ROI Impact Calculation
CREATE OR REPLACE FUNCTION update_roi_impact()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple ROI calculation based on agent type and success
    IF NEW.success = true THEN
        CASE NEW.agent_type
            WHEN 'oracle' THEN NEW.roi_impact = 150.00; -- Predictive insights value
            WHEN 'sentinel' THEN NEW.roi_impact = 75.00; -- Monitoring efficiency value  
            WHEN 'sage' THEN NEW.roi_impact = 200.00; -- Strategic advisory value
            ELSE NEW.roi_impact = 50.00;
        END CASE;
    ELSE
        NEW.roi_impact = 0.00;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roi_impact
    BEFORE INSERT ON ai_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_roi_impact();

-- Create Indexes for Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_org_agent_date ON ai_interactions(organization_id, agent_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_executions_completed ON workflow_executions(completed_at) WHERE status = 'completed';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_trial_active ON users(trial_token) WHERE trial_token IS NOT NULL;