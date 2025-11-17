-- Marketing Campaigns Schema
-- Supports campaign management, templates, and performance tracking

-- Campaign Templates table
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'product-hunt', 'twitter', 'linkedin', 'partnership', 'announcement'
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names required by template
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'product-hunt', 'twitter', 'linkedin', 'partnership', 'announcement'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'completed', 'archived'
  title VARCHAR(500),
  content TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  published_date TIMESTAMP WITH TIME ZONE,
  template_id UUID REFERENCES campaign_templates(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional campaign data, variables filled, etc.
  created_by VARCHAR(255), -- User who created the campaign
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Metrics table
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0, -- percentage
  reach INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, recorded_at)
);

-- Launch Schedule table (for planning launch weeks)
CREATE TABLE IF NOT EXISTS launch_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  campaign_ids JSONB DEFAULT '[]'::jsonb, -- Array of campaign IDs
  status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_date ON marketing_campaigns(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON marketing_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON campaign_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON campaign_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_launch_schedules_dates ON launch_schedules(start_date, end_date);

-- Insert default campaign templates
INSERT INTO campaign_templates (name, type, template, variables, description) VALUES
(
  'Product Hunt Launch',
  'product-hunt',
  '**Title:** {{product_name}} – {{tagline}}

**Description:**
{{description}}

**What makes us different:**
• {{feature_1}}
• {{feature_2}}
• {{feature_3}}

**Quick Start:**
```bash
{{install_command}}
```

{{cta}}',
  '["product_name", "tagline", "description", "feature_1", "feature_2", "feature_3", "install_command", "cta"]'::jsonb,
  'Standard template for Product Hunt launches'
),
(
  'Twitter Launch Thread',
  'twitter',
  '🚀 {{product_name}} is LIVE!

{{description}}

Key features:
→ {{feature_1}}
→ {{feature_2}}
→ {{feature_3}}

{{cta}}

#ProductHunt #LaunchWeek #{{hashtags}}',
  '["product_name", "description", "feature_1", "feature_2", "feature_3", "cta", "hashtags"]'::jsonb,
  'Twitter thread template for product launches'
),
(
  'Partnership Outreach',
  'partnership',
  'Subject: {{subject_line}}

Hi {{partner_name}},

{{introduction}}

**The Opportunity:**
{{opportunity_description}}

**What {{partner_company}} Users Get:**
→ {{benefit_1}}
→ {{benefit_2}}
→ {{benefit_3}}

**Integration Ideas:**
{{integration_ideas}}

{{closing}}

Best,
{{your_name}}',
  '["subject_line", "partner_name", "introduction", "opportunity_description", "partner_company", "benefit_1", "benefit_2", "benefit_3", "integration_ideas", "closing", "your_name"]'::jsonb,
  'Template for partnership and integration outreach'
),
(
  'LinkedIn Announcement',
  'linkedin',
  '🎉 Excited to announce: {{product_name}}!

{{description}}

Key highlights:
✅ {{feature_1}}
✅ {{feature_2}}
✅ {{feature_3}}

{{cta}}

#{{industry}} #{{technology}} #ProductLaunch',
  '["product_name", "description", "feature_1", "feature_2", "feature_3", "cta", "industry", "technology"]'::jsonb,
  'Professional announcement template for LinkedIn'
),
(
  'Weekly Update',
  'announcement',
  '📊 {{project_name}} Weekly Update - {{week_of}}

**This Week:**
{{achievements}}

**Metrics:**
• {{metric_1}}
• {{metric_2}}
• {{metric_3}}

**Coming Next:**
{{upcoming}}

{{footer}}',
  '["project_name", "week_of", "achievements", "metric_1", "metric_2", "metric_3", "upcoming", "footer"]'::jsonb,
  'Weekly community update template'
)
ON CONFLICT DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

CREATE TRIGGER update_launch_schedules_updated_at
  BEFORE UPDATE ON launch_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();
