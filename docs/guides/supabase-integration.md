# OpenConductor + Supabase Integration Guide

> **Your data layer meets your AI agents**

## What You Get

Connect AI agents directly to your Supabase database with the same security model, permissions, and real-time capabilities as your applications. One unified data layer for your entire stack.

**Key Benefits:**
- Query Supabase tables with AI agents
- Respect Row Level Security policies automatically
- Real-time agent updates via Supabase subscriptions
- Same database, same security, unified access

## Quick Start (5 Minutes)

### 1. Install OpenConductor
```bash
npm install -g @openconductor/cli
```

### 2. Connect to Your Supabase Database
```bash
# Essential agents for Supabase integration
openconductor install postgresql-mcp supabase-mcp

# Optional: Real-time and analytics
openconductor install realtime-mcp analytics-mcp
```

### 3. Configure Database Connection
```bash
# Use your existing Supabase connection string
openconductor config --database-url $SUPABASE_URL
openconductor config --supabase-key $SUPABASE_ANON_KEY
```

## Real World Example: Customer Support Agent

Let's build a complete Supabase + OpenConductor customer support system:

### Step 1: Your Supabase Setup
```sql
-- Your existing tables
CREATE TABLE customers (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY,
  customer_id uuid REFERENCES customers(id),
  subject text NOT NULL,
  status text DEFAULT 'open'
);
```

### Step 2: Deploy Your App
```bash
# Your existing app deployment
supabase db push
vercel deploy  # or your preferred hosting
```

### Step 3: Add AI Customer Support
```bash
# Install agents that understand your database
openconductor install postgresql-mcp support-mcp

# Configure for your Supabase instance
openconductor config --supabase-project your-project-ref
```

### What Your AI Agents Can Now Do:
- **Customer Lookup**: Query customer data respecting RLS policies
- **Ticket Management**: Create, update, and close support tickets
- **Data Analysis**: Generate insights about support patterns
- **Real-time Responses**: React to new tickets via Supabase real-time

## Advanced Integration

### Row Level Security Integration
```sql
-- Your RLS policies apply to AI agents automatically
CREATE POLICY "Users can only see their own data" 
ON customers FOR SELECT 
USING (auth.uid() = user_id);
```

AI agents respect these policies when querying data.

### Real-time Agent Updates
```bash
# Agents that respond to database changes
openconductor install realtime-mcp webhook-mcp

# Configure real-time subscriptions
openconductor config --realtime-tables "support_tickets,customers"
```

### Multi-Environment Setup
```bash
# Development database
openconductor config --env dev --database-url $SUPABASE_DEV_URL

# Production database
openconductor config --env prod --database-url $SUPABASE_PROD_URL
```

## Security Best Practices

### Database Permissions
- Use service role key for agent database access
- Configure specific agent permissions in Supabase
- Never expose anon key in agent configuration

### Configuration Management
```bash
# Secure configuration storage
openconductor config --secure --database-url $SUPABASE_URL
openconductor config --secure --service-key $SUPABASE_SERVICE_KEY
```

## Troubleshooting

### Common Issues

**Q: Agents can't query Supabase tables**
A: Check database URL and permissions: `openconductor status postgresql-mcp`

**Q: RLS policies blocking agent access**
A: Agents need service role access for administrative queries

**Q: Real-time subscriptions not working**
A: Verify Supabase project configuration: `openconductor config --check-realtime`

## What's Next

**Coming December 2024:**
- **Supabase Dashboard Integration**: "Manage AI Agents" button in Supabase
- **Auto-Schema Detection**: Agents automatically understand your table structure
- **Template Library**: Pre-built agent configurations for common Supabase patterns

**Perfect Integration:**
```bash
# The future (December)
supabase init my-project --with-openconductor
openconductor init --stack supabase --auto-detect-schema
```

---

**Ready to connect your data layer?**

→ [Install OpenConductor](https://openconductor.ai)  
→ [Browse Database Agents](https://openconductor.ai/discover?category=database)  
→ [Join Supabase + AI Community](https://discord.gg/openconductor)

*Your data layer meets your AI agents.*