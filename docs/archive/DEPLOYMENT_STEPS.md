# Ecosystem Analytics - Quick Deployment Steps

## 🚀 Ready to Deploy!

You have everything needed. Here are the exact commands to run:

### Step 1: Set Database URL

```bash
cd /home/roizen/projects/openconductor

# Use your Supabase database URL
export DATABASE_URL="postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
```

### Step 2: Run Database Migration

```bash
# This creates the 4 analytics tables, triggers, and views
psql "$DATABASE_URL" -f packages/api/src/db/migrations/002_ecosystem_analytics.sql
```

**Expected output:**
```
CREATE TABLE
CREATE INDEX
...
NOTICE: Ecosystem analytics migration completed successfully
```

### Step 3: Add FlexaSports to Registry

```bash
# This adds the first proprietary MCP server
psql "$DATABASE_URL" -f packages/api/scripts/add-flexasports-server.sql
```

**Expected output:**
```
INSERT 0 1
NOTICE: ✅ FlexaSports MCP Server added to registry
```

### Step 4: Verify Database Setup

```bash
# Check that tables were created
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('ecosystem_events', 'user_journeys', 'discovery_matrix', 'install_velocity');"
```

**Expected output:**
```
      table_name
-----------------------
 ecosystem_events
 user_journeys
 discovery_matrix
 install_velocity
(4 rows)
```

### Step 5: Build Packages

```bash
# Build shared package (with new types)
cd packages/shared
npm run build

# Build API (with new routes)
cd ../api
npm run build

cd ../..
```

### Step 6: Deploy API to Production

```bash
# This deploys the updated API with analytics endpoints
vercel deploy --prod
```

**Expected result:**
- API deployed with `/v1/analytics/*` endpoints
- Frontend updated with latest design system

### Step 7: Test Analytics Endpoints

```bash
# Test health check
curl https://openconductor.ai/v1/analytics/health

# Expected response:
# {"success":true,"healthy":true,"tables_found":4}

# Test summary
curl https://openconductor.ai/v1/analytics/summary

# Test velocity
curl "https://openconductor.ai/v1/analytics/velocity/realtime?product=openconductor&hours=24"
```

### Step 8: Start Real-Time Monitoring

```bash
# Monitor install velocity in real-time
DATABASE_URL="$DATABASE_URL" node scripts/real-time-monitor.js
```

**Shows:**
- Hourly install counts
- Growth rates
- Top servers (24h)
- Cross-product discoveries
- Refreshes every 5 seconds

### Step 9: Publish Updated CLI (Optional)

```bash
# Build and publish CLI with analytics tracking
cd packages/cli
npm version patch  # Increment version
npm run build
npm publish  # Or npm publish --access public
```

---

## 🔍 Quick Verification Checklist

After deployment, verify:

- [ ] **Database Migration:**
  ```bash
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM ecosystem_events;"
  # Should work (even if count is 0)
  ```

- [ ] **FlexaSports Server:**
  ```bash
  psql "$DATABASE_URL" -c "SELECT slug, name, verified, featured, proprietary FROM mcp_servers WHERE slug = 'flexasports-mcp';"
  # Should show: flexasports-mcp | FlexaSports MCP Server | t | t | t
  ```

- [ ] **API Health:**
  ```bash
  curl https://openconductor.ai/v1/analytics/health | jq
  # Should return: {"success":true,"healthy":true,"tables_found":4}
  ```

- [ ] **Real-Time Monitor:**
  ```bash
  DATABASE_URL="$DATABASE_URL" node scripts/real-time-monitor.js
  # Should display dashboard (may show 0 installs initially)
  ```

---

## 🎯 What Happens Next

Once deployed:

1. **CLI Users** (when you publish updated CLI):
   - Every `openconductor install` tracks anonymously
   - Every `openconductor discover` shows ecosystem suggestions
   - Failed requests queue offline and sync later

2. **Database**:
   - Events flow into `ecosystem_events` table
   - Triggers automatically update velocity, journeys, discovery matrix
   - No manual intervention needed

3. **Analytics**:
   - Real-time install velocity by hour
   - User journey tracking across products
   - Network effects measurement
   - Cross-product discovery funnel

4. **FlexaSports**:
   - Shows up in discover results
   - Featured badge (first proprietary server!)
   - Memory/sports searches suggest FlexaSports
   - Discovery tracked in analytics

---

## 🚨 Troubleshooting

**Database migration fails:**
```bash
# Check if tables already exist
psql "$DATABASE_URL" -c "\dt"

# If needed, drop and recreate
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS ecosystem_events CASCADE;"
# Then re-run migration
```

**API endpoints return 404:**
- Verify deployment succeeded
- Check Vercel logs: `vercel logs --follow`
- Ensure `/v1/analytics` route is registered

**Monitor can't connect:**
```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check if pg module installed
npm list pg
```

---

## 📊 Expected Timeline

- **Step 1-4** (Database): 5 minutes
- **Step 5** (Build): 2 minutes
- **Step 6** (Deploy): 5 minutes
- **Step 7** (Test): 2 minutes
- **Total**: ~15 minutes to fully deployed

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ Database migration completes with no errors
2. ✅ FlexaSports shows in `SELECT * FROM mcp_servers WHERE slug = 'flexasports-mcp';`
3. ✅ Health endpoint returns `"healthy": true`
4. ✅ Real-time monitor shows dashboard (even with 0 installs)
5. ✅ Vercel deployment succeeds

---

**Ready to deploy? Start with Step 1!** 🚀
