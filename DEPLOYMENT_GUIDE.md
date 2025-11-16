# OpenConductor Ecosystem Analytics - Deployment Guide

## 🎯 Overview

This guide walks through deploying the ecosystem analytics infrastructure that transforms your **150 installs/day** into a cross-product discovery engine.

## ✅ Pre-Deployment Checklist

### Phase 1: Database Setup

- [ ] **Run Database Migration**
  ```bash
  cd packages/api
  psql $DATABASE_URL -f src/db/migrations/002_ecosystem_analytics.sql
  ```

  **Verifies:**
  - ✅ 4 tables created (ecosystem_events, user_journeys, discovery_matrix, install_velocity)
  - ✅ 3 automated triggers working
  - ✅ 2 analytical views accessible
  - ✅ Indexes created for performance

- [ ] **Add FlexaSports to Registry**
  ```bash
  psql $DATABASE_URL -f packages/api/scripts/add-flexasports-server.sql
  ```

  **Creates:**
  - ✅ FlexaSports MCP server entry (first proprietary server)
  - ✅ Initial server stats
  - ✅ Discovery matrix path (OpenConductor → FlexaSports)

### Phase 2: Package Updates

- [ ] **Build and Publish Shared Package**
  ```bash
  cd packages/shared
  npm version patch  # Or minor/major as needed
  npm run build
  npm publish  # Or publish to private registry
  ```

- [ ] **Build and Publish CLI**
  ```bash
  cd packages/cli
  npm version patch
  npm run build
  npm publish -g  # Global install
  ```

- [ ] **Build and Deploy API**
  ```bash
  cd packages/api
  npm run build
  # Deploy to your hosting (Vercel, Railway, etc.)
  ```

### Phase 3: API Deployment

- [ ] **Update Environment Variables**

  Add these to your deployment platform:
  ```
  DATABASE_URL=your-supabase-postgres-url
  NODE_ENV=production
  ```

- [ ] **Verify API Endpoints**

  Test analytics endpoints are accessible:
  ```bash
  curl https://api.openconductor.ai/v1/analytics/health
  # Should return: { "success": true, "healthy": true, "tables_found": 4 }
  ```

### Phase 4: Testing

- [ ] **Test CLI Analytics Locally**

  ```bash
  # Install updated CLI
  npm install -g @openconductor/cli

  # Test discovery with ecosystem suggestions
  openconductor discover memory
  # Should show: "💡 You might also be interested in: FlexaBrain"

  # Test install tracking
  openconductor install openmemory
  # Analytics event should be sent silently
  ```

- [ ] **Verify Database Events**

  ```sql
  -- Check events are being tracked
  SELECT * FROM ecosystem_events ORDER BY created_at DESC LIMIT 10;

  -- Check user journeys
  SELECT * FROM user_journeys LIMIT 5;

  -- Check install velocity
  SELECT * FROM install_velocity WHERE product = 'openconductor' ORDER BY date DESC, hour DESC LIMIT 24;
  ```

- [ ] **Test API Endpoints**

  ```bash
  # Test event tracking
  curl -X POST https://api.openconductor.ai/v1/analytics/events \
    -H "Content-Type: application/json" \
    -d '{
      "event_id": "test-123",
      "user_hash": "test-hash",
      "session_id": "test-session",
      "product": "openconductor",
      "event_type": "install",
      "metadata": { "server_slug": "openmemory" }
    }'

  # Test velocity endpoint
  curl "https://api.openconductor.ai/v1/analytics/velocity/realtime?product=openconductor&hours=24"

  # Test funnel endpoint
  curl "https://api.openconductor.ai/v1/analytics/funnel/cross-product"

  # Test journey patterns
  curl "https://api.openconductor.ai/v1/analytics/journeys/patterns"
  ```

### Phase 5: Monitoring

- [ ] **Start Real-Time Monitor**

  ```bash
  # From project root
  DATABASE_URL="your-postgres-url" node scripts/real-time-monitor.js
  ```

  **Displays:**
  - Last hour installs
  - Hourly growth rate
  - Top 5 servers (24h)
  - Cross-product discoveries
  - Total ecosystem users

- [ ] **Monitor Logs**

  Watch for analytics errors:
  ```bash
  # API logs
  tail -f /var/log/openconductor-api.log | grep analytics

  # Or use your hosting platform's log viewer
  vercel logs openconductor-api --follow
  ```

## 📊 Verification Steps

### 1. Database Health Check

```sql
-- Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('ecosystem_events', 'user_journeys', 'discovery_matrix', 'install_velocity');
-- Should return 4 rows

-- Check triggers are working
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%ecosystem%' OR trigger_name LIKE '%velocity%' OR trigger_name LIKE '%journey%';
-- Should return 3 triggers

-- Verify views exist
SELECT table_name
FROM information_schema.views
WHERE table_name IN ('ecosystem_analytics_summary', 'hourly_growth');
-- Should return 2 rows
```

### 2. CLI Analytics Test

```bash
# Enable verbose mode to see if analytics are being sent
VERBOSE=true openconductor install openmemory

# Check offline queue location
ls -la ~/.openconductor/analytics-queue.json
# Should exist if there were offline events
```

### 3. API Health Check

```bash
curl https://api.openconductor.ai/v1/analytics/health | jq
```

Expected response:
```json
{
  "success": true,
  "healthy": true,
  "tables_found": 4,
  "timestamp": "2025-11-15T..."
}
```

### 4. Real-Time Data Check

```bash
# Run monitoring script
DATABASE_URL=$SUPABASE_URL node scripts/real-time-monitor.js
```

Should display:
- Current hour metrics
- Growth rates
- Top servers
- Ecosystem referrals

## 🚨 Troubleshooting

### Issue: Database migration fails

**Solution:**
```sql
-- Check if tables already exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- If needed, drop and recreate
DROP TABLE IF EXISTS ecosystem_events CASCADE;
DROP TABLE IF EXISTS user_journeys CASCADE;
DROP TABLE IF EXISTS discovery_matrix CASCADE;
DROP TABLE IF EXISTS install_velocity CASCADE;

-- Then re-run migration
\i packages/api/src/db/migrations/002_ecosystem_analytics.sql
```

### Issue: CLI analytics not sending events

**Check:**
1. API endpoint accessible: `curl https://api.openconductor.ai/v1/analytics/health`
2. Network connectivity from CLI
3. Check offline queue: `cat ~/.openconductor/analytics-queue.json`

**Debug:**
```bash
# Test with verbose logging
DEBUG=* openconductor install openmemory
```

### Issue: No data in analytics tables

**Check:**
1. Did you publish the updated CLI?
2. Are users using the new CLI version?
3. Is the API receiving requests?

**Verify:**
```sql
-- Check if any events exist
SELECT COUNT(*) FROM ecosystem_events;

-- Check API logs for incoming requests
-- Check if triggers are firing
SELECT * FROM install_velocity ORDER BY date DESC, hour DESC LIMIT 5;
```

### Issue: Real-time monitor not connecting

**Solution:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"

# Check pg module is installed
npm list pg
```

## 📈 Post-Deployment Monitoring (First 24 Hours)

### Hour 1-2: Initial Verification
- [ ] Check API logs for analytics requests
- [ ] Verify events appearing in `ecosystem_events` table
- [ ] Monitor for errors in server logs
- [ ] Test CLI install from different machines

### Hour 3-6: Data Validation
- [ ] Verify install_velocity incrementing correctly
- [ ] Check user_journeys being created
- [ ] Ensure triggers are firing
- [ ] Monitor database performance

### Hour 6-24: Growth Tracking
- [ ] Track hourly install rates
- [ ] Monitor ecosystem referrals
- [ ] Check for any anomalies
- [ ] Verify offline queue syncing

### Day 2-7: Optimization
- [ ] Analyze most common queries
- [ ] Add indexes if needed
- [ ] Monitor database size
- [ ] Review analytics insights

## 🎓 Success Metrics

### Week 1 Targets
- **Install Tracking:** >95% of installs tracked
- **Ecosystem Referrals:** >10% of users see suggestions
- **API Uptime:** >99.9%
- **Analytics Latency:** <2 seconds
- **Data Accuracy:** Zero duplicate events

### Month 1 Targets
- **Cross-Product Discovery:** >20% discover FlexaSports
- **User Journeys:** Track full conversion paths
- **Network Effects:** Measure product synergies
- **Revenue Attribution:** Track OpenConductor → Paid conversions

## 🔐 Security Checklist

- [ ] **Privacy:**
  - ✅ Only anonymous SHA-256 hashes stored
  - ✅ No PII collected
  - ✅ No API keys logged
  - ✅ GDPR compliant (anonymous data)

- [ ] **API Security:**
  - ✅ Rate limiting enabled
  - ✅ Input validation on all endpoints
  - ✅ CORS configured correctly
  - ✅ SQL injection prevention

- [ ] **Database:**
  - ✅ Secure connection (SSL)
  - ✅ Least privilege access
  - ✅ Regular backups
  - ✅ Monitoring enabled

## 📞 Support & Resources

### Documentation
- [ECOSYSTEM_ANALYTICS_PLAN.md](ECOSYSTEM_ANALYTICS_PLAN.md) - Complete implementation guide
- [ECOSYSTEM_ANALYTICS_SUMMARY.md](ECOSYSTEM_ANALYTICS_SUMMARY.md) - Strategic overview

### Database Scripts
- [002_ecosystem_analytics.sql](packages/api/src/db/migrations/002_ecosystem_analytics.sql) - Main migration
- [add-flexasports-server.sql](packages/api/scripts/add-flexasports-server.sql) - FlexaSports setup

### Code References
- [ecosystem-analytics.ts](packages/shared/src/ecosystem-analytics.ts) - Type definitions
- [EcosystemAnalytics class](packages/cli/src/lib/ecosystem-analytics.ts) - CLI tracking
- [Analytics API](packages/api/src/routes/ecosystem-analytics.ts) - API endpoints
- [Real-time monitor](scripts/real-time-monitor.js) - Monitoring dashboard

### Emergency Contacts
- API Issues: Check logs at your hosting platform
- Database Issues: Check Supabase dashboard
- CLI Issues: Check GitHub issues

## 🎯 Next Steps After Deployment

1. **Monitor First 24 Hours**
   - Run real-time monitor continuously
   - Watch for any errors
   - Verify data accuracy

2. **Analyze Initial Data**
   - Review install patterns
   - Check ecosystem referral rates
   - Identify top servers

3. **Optimize Performance**
   - Add indexes if needed
   - Tune database queries
   - Optimize API response times

4. **Launch Communication**
   - Prepare Twitter thread with growth data
   - Create data visualizations
   - Share insights with community

5. **Iterate and Improve**
   - Add new analytics endpoints
   - Implement A/B testing for suggestions
   - Build predictive models

---

## 🚀 Ready to Deploy?

**Final Checklist:**
- [ ] Database migration tested locally
- [ ] Shared package built and published
- [ ] CLI built and published
- [ ] API deployed with new routes
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] Real-time monitor running
- [ ] Team notified of deployment

**Deploy Command:**
```bash
# Run this from project root
./deploy-analytics.sh  # Or your deployment script
```

**Post-Deployment:**
```bash
# Start monitoring
DATABASE_URL=$SUPABASE_URL node scripts/real-time-monitor.js
```

---

**Status:** Ready for Production 🎉

**Impact:** Transform 150 daily installs into ecosystem-wide network effects!
