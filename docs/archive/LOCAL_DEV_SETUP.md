# Local Development Setup - Network Issue Workaround

## Current Situation

Your local WSL2 environment cannot connect directly to the Supabase PostgreSQL pooler on port **6543** due to network restrictions (firewall/VPN/ISP blocking).

### What Works
- ✅ Supabase REST API (HTTPS port 443)
- ✅ Production deployment on Railway (connects to Supabase fine)
- ✅ Frontend development server
- ✅ API server (runs in degraded mode without direct DB access)

### What Doesn't Work
- ❌ Direct PostgreSQL connection to Supabase pooler (port 6543)
- ❌ Background job workers (need direct DB access)
- ❌ GitHub sync worker (needs direct DB access)

## Local Development Configuration

The `.env` file has been configured for local development:

```bash
NODE_ENV="development"
AUTO_START_GITHUB_WORKER="false"
AUTO_START_JOB_PROCESSOR="false"
```

This allows the API server to start without requiring a database connection, while still maintaining the Supabase configuration for when the network issue is resolved.

## Running Locally

### Start the development servers:

```bash
npm run launch
```

or

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- API: http://localhost:3002

### Expected Behavior

You will see database connection timeout errors in the logs:

```
[1] {"error":"Connection terminated due to connection timeout","level":"error",...}
[1] Database initialization failed, continuing without database: Failed to connect to PostgreSQL
```

**This is expected and OK!** The server will continue running without database features.

## Accessing Live Data

Since you need live data locally at all times, you have two options:

### Option 1: Use Production API (Recommended)

The frontend can be configured to use the production API which has full database access:

1. Update `packages/frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://api.openconductor.ai
   ```

2. Run only the frontend locally:
   ```bash
   cd packages/frontend && npm run dev
   ```

3. The frontend will fetch live data from the production API

### Option 2: Fix the Network Issue

To enable full local development with direct database access:

#### Check Windows Firewall

Open PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Supabase Pooler" -Direction Outbound -LocalPort 6543 -Protocol TCP -Action Allow
```

#### Check if Behind VPN/Corporate Firewall

- Try disabling VPN temporarily
- Test with mobile hotspot
- Contact IT to allow port 6543 outbound

#### Verify Connection After Fix

```bash
timeout 5 bash -c 'cat < /dev/null > /dev/tcp/aws-1-us-east-1.pooler.supabase.com/6543' && echo "Port 6543 open!" || echo "Still blocked"
```

If successful, update `.env` to re-enable workers:

```bash
AUTO_START_GITHUB_WORKER="true"
AUTO_START_JOB_PROCESSOR="true"
```

## Testing Database Features

To test database-dependent features:

1. **Deploy to Railway** - Push changes and test there (full DB access)
2. **Use Supabase Dashboard** - Direct SQL queries and data viewing
3. **Use REST API calls** - The Supabase REST API works from your local environment

Example REST API call:

```bash
curl "https://fjmzvcipimpctqnhhfrr.supabase.co/rest/v1/mcp_servers?limit=5" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbXp2Y2lwaW1wY3RxbmhoZnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjYzMTAsImV4cCI6MjA3NDk0MjMxMH0.zFLo3tHYMR9-ctFbGFNwquAfs6TWK0p1RzXICDXvj_E"
```

## Summary

Your local development setup is configured to work with live Supabase data, but due to the network restriction on port 6543:

- **Frontend development**: ✅ Works perfectly
- **API development**: ✅ Works (without database features)
- **Database features**: Use production deployment or Supabase Dashboard
- **Live data access**: Via production API or Supabase REST API

This is a viable development setup until the network issue is resolved!
