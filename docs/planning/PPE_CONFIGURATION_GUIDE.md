# Pay-Per-Event Configuration Guide

## Step-by-Step Instructions

Your Actor is now deployed! Follow these steps to configure PPE pricing:

### Step 1: Open Actor Settings
1. Go to: https://console.apify.com/actors/epicmotionsd~mcp-registry-discovery
2. Click on **"Settings"** tab in the left sidebar

### Step 2: Configure Monetization
1. Scroll down to **"Monetization"** section
2. Select **"Pay-per-event"** as the pricing model
3. Click **"Configure events"**

### Step 3: Add PPE Events
Configure the following events (click "+ Add event" for each):

| Event Name | Price (USD) | Description |
|------------|-------------|-------------|
| `search_basic` | `0.02` | Basic keyword search |
| `get_details` | `0.01` | Get server details by slug |
| `get_trending` | `0.02` | Get trending servers |
| `get_categories` | `0.00` | List all categories (FREE) |
| `get_popular` | `0.02` | Get popular servers by category |

**Important:** Event names must match exactly as shown above (they match the code).

### Step 4: Set Visibility
1. Still in Settings, scroll to **"Publication"** section
2. Set visibility to **"Public"**
3. (Optional) Check **"Show in Apify Store"** if you want it listed publicly

### Step 5: Save Changes
1. Click **"Save"** at the bottom of the page
2. Confirm the changes

### Step 6: Test PPE Charging
1. Go to **"Console"** tab
2. Click **"Start"** to run the Actor
3. Use input: `{"mode":"search","query":"memory","limit":5}`
4. After the run completes, check:
   - **"Usage"** tab → Should show platform usage
   - **"Billing"** → Transaction log should show $0.02 charge

Expected output:
```json
{
  "mode": "search",
  "cost": 0.02,
  "cached": false,
  "executionTime": "2341ms",
  "resultCount": 5,
  "servers": [...]
}
```

---

## Pricing Strategy Rationale

### Why These Prices?

**Search ($0.02):**
- Most common operation
- Competitive with other search APIs
- 100 searches = $2.00 (reasonable for agents)

**Details ($0.01):**
- Cheaper than search (encourages deep exploration)
- Often follows a search operation
- 100 detail lookups = $1.00

**Trending/Popular ($0.02):**
- Same as search (similar compute cost)
- Less frequent operations

**Categories (FREE):**
- Marketing strategy - drive adoption
- Static data that rarely changes
- Acts as entry point for new users

### Expected Revenue (Month 1)

**Conservative scenario:**
- 50 searches/month × $0.02 = $1.00
- 20 details/month × $0.01 = $0.20
- **Total: $1.20/month**

**With Store listing:**
- 200 searches/month × $0.02 = $4.00
- 80 details/month × $0.01 = $0.80
- 20 trending/month × $0.02 = $0.40
- **Total: $5.20/month**

**With marketing push:**
- 500 searches/month × $0.02 = $10.00
- 200 details/month × $0.01 = $2.00
- 50 trending/month × $0.02 = $1.00
- **Total: $13.00/month**

---

## Next Steps After PPE Configuration

### Immediate (Today):
1. ✅ Configure PPE (steps above)
2. ✅ Test one paid run to verify charging
3. Update README with pricing table

### This Week:
4. Submit to Apify Store
5. Post launch announcement on Twitter/Discord
6. Monitor first 10 runs

### Next 2 Weeks:
7. Analyze usage patterns (which modes are most popular?)
8. Optimize pricing based on data
9. Plan Phase 2 (Validation feature - $0.10/validation)

### Month 2:
10. Build validation feature (health checks)
11. Increase marketing efforts
12. Target: $50+ MRR

### Months 3-4:
13. Build deployment feature ($2.00/deployment) - THE BIG REVENUE DRIVER
14. Target: $500+ MRR

---

## Troubleshooting

### "Events not showing up in Configuration"
- Make sure you selected "Pay-per-event" model first
- Refresh the page
- Contact Apify support if issue persists

### "Charges not appearing in transaction log"
- Check that event names match exactly (case-sensitive)
- Verify Actor.addPayPerEvent() is called in production
- PPE only works in cloud runs, not local testing

### "Free trial user limit"
- New users get $5 free credit
- After that, real charges apply
- Monitor your Apify account balance

---

## Quick Reference Card

**Actor ID:** `epicmotionsd/mcp-registry-discovery`
**Version:** 1.1.0 (with PPE + caching)
**Console URL:** https://console.apify.com/actors/drgNkwUVbBlqjExnK

**PPE Events:**
- search_basic: $0.02
- get_details: $0.01
- get_trending: $0.02
- get_categories: $0.00
- get_popular: $0.02

**Test Input:**
```json
{
  "mode": "search",
  "query": "memory",
  "limit": 5
}
```

**Expected First Run Output:**
```json
{
  "mode": "search",
  "cost": 0.02,
  "cached": false,
  "totalResults": 5,
  "servers": [...]
}
```

---

## What We Built Today

### Code Changes:
- ✅ Added PPE event definitions ($0.00 - $0.02 per operation)
- ✅ Implemented chargeEvent() function with production/local handling
- ✅ Created CacheManager module with SHA256 key hashing
- ✅ Integrated caching into all 5 operation modes
- ✅ Added cost tracking to all results
- ✅ Added execution time metadata
- ✅ Deployed to Apify successfully

### Lines of Code:
- New: ~150 lines (PPE + caching)
- Modified: ~50 lines (results formatting)
- Total impact: ~200 lines

### Time Invested:
- Code changes: ~2 hours
- Testing: ~30 minutes
- Deployment: ~15 minutes
- **Total: ~2.75 hours** (vs. 8 hours estimated - you're ahead!)

---

**Next Action:** Open the Apify Console and configure PPE (10 minutes)
**After That:** Update README.md with pricing table (30 minutes)
**Tomorrow:** Submit to Apify Store!

🎉 Congratulations on completing Day 1 early!
