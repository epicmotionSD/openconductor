-- OpenConductor Ecosystem Analytics Migration
-- Adds cross-product tracking, user journeys, and real-time velocity metrics

-- 1. Ecosystem-wide event tracking
-- Tracks all events across OpenConductor, FlexaBrain, FlexaSports, and X3O
CREATE TABLE IF NOT EXISTS ecosystem_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash VARCHAR(64) NOT NULL,  -- Anonymous SHA-256 hash of machine ID
  session_id UUID NOT NULL,
  product VARCHAR(50) NOT NULL,  -- 'openconductor', 'flexabrain', 'flexasports', 'x3o', 'sportintel'
  event_type VARCHAR(50) NOT NULL,  -- 'install', 'discovery', 'usage', 'conversion', 'ecosystem_referral'
  server_slug VARCHAR(255),  -- For OpenConductor installs only
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecosystem_events_user_hash ON ecosystem_events(user_hash);
CREATE INDEX IF NOT EXISTS idx_ecosystem_events_session ON ecosystem_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ecosystem_events_product_type ON ecosystem_events(product, event_type);
CREATE INDEX IF NOT EXISTS idx_ecosystem_events_created_at ON ecosystem_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecosystem_events_server_slug ON ecosystem_events(server_slug) WHERE server_slug IS NOT NULL;

-- 2. Cross-product user journeys
-- Tracks user discovery paths across the entire ecosystem
CREATE TABLE IF NOT EXISTS user_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash VARCHAR(64) NOT NULL UNIQUE,
  first_touchpoint VARCHAR(50),  -- First product discovered
  last_touchpoint VARCHAR(50),   -- Most recent product
  products_discovered TEXT[] DEFAULT '{}',  -- Array: ['openconductor', 'flexasports']
  conversion_path TEXT[] DEFAULT '{}',      -- Ordered discovery path
  total_interactions INT DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user_hash ON user_journeys(user_hash);
CREATE INDEX IF NOT EXISTS idx_user_journeys_first_touchpoint ON user_journeys(first_touchpoint);
CREATE INDEX IF NOT EXISTS idx_user_journeys_products ON user_journeys USING GIN(products_discovered);
CREATE INDEX IF NOT EXISTS idx_user_journeys_last_seen ON user_journeys(last_seen_at DESC);

-- 3. Product discovery matrix
-- Tracks which products lead users to discover other products
CREATE TABLE IF NOT EXISTS discovery_matrix (
  source_product VARCHAR(50),
  destination_product VARCHAR(50),
  discovery_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (source_product, destination_product)
);

CREATE INDEX IF NOT EXISTS idx_discovery_matrix_source ON discovery_matrix(source_product);
CREATE INDEX IF NOT EXISTS idx_discovery_matrix_destination ON discovery_matrix(destination_product);
CREATE INDEX IF NOT EXISTS idx_discovery_matrix_discovery_count ON discovery_matrix(discovery_count DESC);

-- 4. Real-time install velocity metrics
-- Tracks installs by product, date, and hour for real-time growth monitoring
CREATE TABLE IF NOT EXISTS install_velocity (
  id SERIAL PRIMARY KEY,
  product VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  hour INT NOT NULL CHECK (hour >= 0 AND hour < 24),
  install_count INT DEFAULT 0,
  unique_users INT DEFAULT 0,
  UNIQUE (product, date, hour)
);

CREATE INDEX IF NOT EXISTS idx_install_velocity_product_date ON install_velocity(product, date DESC, hour DESC);
CREATE INDEX IF NOT EXISTS idx_install_velocity_date ON install_velocity(date DESC);

-- 5. Add proprietary and API key flags to mcp_servers table
ALTER TABLE mcp_servers
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS api_key_required BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_mcp_servers_proprietary ON mcp_servers(proprietary) WHERE proprietary = TRUE;

-- 6. Create view for real-time analytics dashboard
CREATE OR REPLACE VIEW ecosystem_analytics_summary AS
SELECT
  product,
  COUNT(DISTINCT user_hash) as total_users,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_type = 'install') as total_installs,
  COUNT(*) FILTER (WHERE event_type = 'discovery') as total_discoveries,
  COUNT(*) FILTER (WHERE event_type = 'ecosystem_referral') as total_referrals,
  MAX(created_at) as last_event_at
FROM ecosystem_events
GROUP BY product;

-- 7. Create view for hourly growth metrics
CREATE OR REPLACE VIEW hourly_growth AS
SELECT
  product,
  date,
  hour,
  install_count,
  unique_users,
  LAG(install_count) OVER (PARTITION BY product ORDER BY date, hour) as previous_hour_installs,
  install_count - LAG(install_count) OVER (PARTITION BY product ORDER BY date, hour) as hourly_growth,
  CASE
    WHEN LAG(install_count) OVER (PARTITION BY product ORDER BY date, hour) > 0
    THEN ROUND(
      ((install_count - LAG(install_count) OVER (PARTITION BY product ORDER BY date, hour))::DECIMAL /
       LAG(install_count) OVER (PARTITION BY product ORDER BY date, hour)) * 100,
      2
    )
    ELSE 0
  END as growth_percentage
FROM install_velocity
ORDER BY product, date DESC, hour DESC;

-- 8. Create function to automatically update install velocity on insert
CREATE OR REPLACE FUNCTION increment_install_velocity()
RETURNS TRIGGER AS $$
DECLARE
  event_date DATE;
  event_hour INT;
BEGIN
  -- Only process install events
  IF NEW.event_type = 'install' THEN
    event_date := DATE(NEW.created_at);
    event_hour := EXTRACT(HOUR FROM NEW.created_at)::INT;

    INSERT INTO install_velocity (product, date, hour, install_count, unique_users)
    VALUES (NEW.product, event_date, event_hour, 1, 1)
    ON CONFLICT (product, date, hour) DO UPDATE SET
      install_count = install_velocity.install_count + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment install velocity
DROP TRIGGER IF EXISTS trigger_increment_install_velocity ON ecosystem_events;
CREATE TRIGGER trigger_increment_install_velocity
AFTER INSERT ON ecosystem_events
FOR EACH ROW
EXECUTE FUNCTION increment_install_velocity();

-- 9. Create function to update user journey
CREATE OR REPLACE FUNCTION update_user_journey_on_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_journeys (
    user_hash,
    first_touchpoint,
    last_touchpoint,
    products_discovered,
    conversion_path,
    total_interactions
  ) VALUES (
    NEW.user_hash,
    NEW.product,
    NEW.product,
    ARRAY[NEW.product],
    ARRAY[NEW.product],
    1
  )
  ON CONFLICT (user_hash) DO UPDATE SET
    last_touchpoint = NEW.product,
    products_discovered = ARRAY(
      SELECT DISTINCT unnest(user_journeys.products_discovered || NEW.product)
    ),
    conversion_path = CASE
      WHEN NOT (NEW.product = ANY(user_journeys.conversion_path))
      THEN user_journeys.conversion_path || NEW.product
      ELSE user_journeys.conversion_path
    END,
    total_interactions = user_journeys.total_interactions + 1,
    last_seen_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update user journey
DROP TRIGGER IF EXISTS trigger_update_user_journey ON ecosystem_events;
CREATE TRIGGER trigger_update_user_journey
AFTER INSERT ON ecosystem_events
FOR EACH ROW
EXECUTE FUNCTION update_user_journey_on_event();

-- 10. Create function to update discovery matrix
CREATE OR REPLACE FUNCTION update_discovery_matrix_on_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process ecosystem_referral events
  IF NEW.event_type = 'ecosystem_referral' AND NEW.metadata ? 'destination' THEN
    INSERT INTO discovery_matrix (source_product, destination_product, discovery_count)
    VALUES (NEW.product, NEW.metadata->>'destination', 1)
    ON CONFLICT (source_product, destination_product) DO UPDATE SET
      discovery_count = discovery_matrix.discovery_count + 1,
      last_updated = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update discovery matrix
DROP TRIGGER IF EXISTS trigger_update_discovery_matrix ON ecosystem_events;
CREATE TRIGGER trigger_update_discovery_matrix
AFTER INSERT ON ecosystem_events
FOR EACH ROW
EXECUTE FUNCTION update_discovery_matrix_on_referral();

-- 11. Seed initial data for testing
-- Initialize install velocity with current date/hour
INSERT INTO install_velocity (product, date, hour, install_count, unique_users)
VALUES ('openconductor', CURRENT_DATE, EXTRACT(HOUR FROM NOW())::INT, 0, 0)
ON CONFLICT (product, date, hour) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE ecosystem_events IS 'Tracks all events across the entire Sonnier Ventures ecosystem';
COMMENT ON TABLE user_journeys IS 'Tracks user discovery paths and cross-product conversions';
COMMENT ON TABLE discovery_matrix IS 'Network effects tracking - which products drive discovery of others';
COMMENT ON TABLE install_velocity IS 'Real-time install metrics by product, date, and hour';
COMMENT ON COLUMN mcp_servers.proprietary IS 'True for proprietary servers requiring authentication (e.g., FlexaSports)';
COMMENT ON COLUMN mcp_servers.api_key_required IS 'True if server requires API key for authentication';

-- Migration complete
DO $$
BEGIN
  RAISE NOTICE 'Ecosystem analytics migration completed successfully';
  RAISE NOTICE 'Tables created: ecosystem_events, user_journeys, discovery_matrix, install_velocity';
  RAISE NOTICE 'Triggers created: Auto-increment velocity, journey tracking, discovery matrix';
END $$;
