-- Add billing columns to mcp_servers table
-- Run this migration to enable Stripe subscriptions

ALTER TABLE mcp_servers 
ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'none';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tier ON mcp_servers(tier);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_stripe_customer ON mcp_servers(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN mcp_servers.tier IS 'Subscription tier: free, PRO_SERVER, FEATURED_SERVER';
COMMENT ON COLUMN mcp_servers.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN mcp_servers.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN mcp_servers.subscription_status IS 'Subscription status: none, active, past_due, cancelled';
