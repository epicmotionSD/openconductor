# Upgrading MCP Registry Actor to Monetization

## Current State Assessment

**Good News:** You've already built 30% of Phase 1! Your existing `mcp-registry-discovery` actor has:
- ✅ Clean architecture with OpenConductorClient
- ✅ Multiple operation modes (search, details, trending, categories, popular)
- ✅ Proper input/output schemas
- ✅ Error handling and API fallbacks
- ✅ Production deployment (9 successful runs)

**Gap:** Missing monetization features (PPE, caching, deployment)

---

## Upgrade Path: 3 Options

### Option A: Upgrade Existing Actor ⭐ RECOMMENDED
**Approach:** Add PPE + caching to your existing `mcp-registry-discovery` actor

**Pros:**
- Preserve 9 runs of usage history
- Keep existing users
- Faster to market (2-3 days)

**Cons:**
- Need to carefully add PPE without breaking existing functionality
- Must migrate `mode` → `event` terminology

**Time:** 8-12 hours

---

### Option B: Create New "OpenConductor Deployer" Actor
**Approach:** Build new actor from scratch with full monetization features

**Pros:**
- Clean slate, no legacy code
- Can follow 30-day plan exactly
- Test PPE pricing without affecting current actor

**Cons:**
- Lose existing usage history
- More duplication of code

**Time:** 20-30 hours

---

### Option C: Hybrid Approach
**Approach:** Keep `mcp-registry-discovery` as free tier, create premium `openconductor-deployer`

**Pros:**
- Freemium model (free search, paid deployment)
- A/B test pricing
- Build brand with free actor

**Cons:**
- Maintain two actors
- Split user base

**Time:** 25-35 hours

---

## Recommended: Option A - Upgrade Existing Actor

Let's upgrade your existing actor to be monetization-ready. Here's the checklist:

### Phase 1A: Add PPE Billing (4 hours)

**Changes to `src/main.js`:**

1. **Add PPE event definitions** (top of file):
```javascript
const PPE_EVENTS = {
  search_basic: 0.02,
  get_details: 0.01,
  get_trending: 0.02,
  get_categories: 0.00,  // Free (marketing)
  get_popular: 0.02
};
```

2. **Add charging function**:
```javascript
async function chargeEvent(eventName) {
  if (PPE_EVENTS[eventName] > 0) {
    await Actor.addPayPerEvent({
      eventName,
      eventValue: PPE_EVENTS[eventName]
    });
    console.log(`[PPE] Charged $${PPE_EVENTS[eventName]} for ${eventName}`);
  }
}
```

3. **Add charging to each mode**:
```javascript
switch (mode) {
  case 'search':
    await chargeEvent('search_basic');  // ADD THIS
    // ... existing search code
    break;

  case 'details':
    await chargeEvent('get_details');  // ADD THIS
    // ... existing details code
    break;

  // etc for other modes
}
```

4. **Add cost to output**:
```javascript
results = {
  mode: 'search',
  cost: PPE_EVENTS['search_basic'],  // ADD THIS
  query,
  category,
  // ... rest of results
};
```

**Testing:**
```bash
cd mcp-registry-discovery
apify run --input '{"mode":"search","query":"memory"}'

# Check logs for: [PPE] Charged $0.02 for search_basic
```

---

### Phase 1B: Add Caching (3 hours)

**Create `src/lib/cache.js`:**
```javascript
import { Actor } from 'apify';

export class CacheManager {
  constructor(ttl = 3600000) { // 1 hour default
    this.ttl = ttl;
  }

  generateKey(prefix, params) {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  async get(key) {
    const cached = await Actor.getValue(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`[CACHE] Hit: ${key}`);
      return cached.data;
    }

    console.log(`[CACHE] Miss: ${key}`);
    return null;
  }

  async set(key, data) {
    await Actor.setValue(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`[CACHE] Set: ${key}`);
  }
}
```

**Update `src/main.js`:**
```javascript
import { CacheManager } from './lib/cache.js';

await Actor.main(async () => {
  const input = await Actor.getInput();
  const cache = new CacheManager(3600000); // 1 hour TTL

  // ... existing code

  switch (mode) {
    case 'search':
      await chargeEvent('search_basic');

      const cacheKey = cache.generateKey('search', { query, category, tags, limit });
      let searchData = await cache.get(cacheKey);

      if (!searchData) {
        searchData = await api.searchServers(searchParams);
        await cache.set(cacheKey, searchData);
      }

      results = {
        mode: 'search',
        cost: PPE_EVENTS['search_basic'],
        cached: !!searchData.fromCache,  // Track cache hits
        query,
        // ...
      };
      break;
  }
});
```

**Expected Impact:**
- 70%+ cache hit rate after warm-up
- Execution time: 2s → 0.3s (cached)
- Platform costs: $0.005 → $0.001

---

### Phase 1C: Configure PPE in Apify Console (1 hour)

1. Open https://console.apify.com/actors/epicmotionsd~mcp-registry-discovery
2. Go to **Settings** → **Monetization**
3. Select **Pay-Per-Event** pricing model
4. Configure events:
   - `search_basic`: $0.02
   - `get_details`: $0.01
   - `get_trending`: $0.02
   - `get_categories`: $0.00
   - `get_popular`: $0.02
5. Set visibility to **Public**
6. Save changes

---

### Phase 1D: Update README for Store (2 hours)

**Add to README.md:**

```markdown
## Pricing

This Actor uses **Pay-Per-Event** pricing. You only pay for what you use:

| Event | Cost | Description |
|-------|------|-------------|
| Search Servers | $0.02 | Search by keyword, category, or tags |
| Get Details | $0.01 | Get full server details by slug |
| Get Trending | $0.02 | Get trending servers |
| Get Categories | FREE | List all categories |
| Get Popular | $0.02 | Get popular servers by category |

**Example Cost:**
- 100 searches = $2.00
- 50 detail lookups = $0.50
- 1 category list = $0.00
- **Total = $2.50**

### Why PPE?
- No monthly subscription
- Pay only when your AI agent uses it
- Transparent, predictable costs
- Perfect for automated workflows

## Usage with AI Agents

This Actor is designed to be called by AI agents (Claude, LangChain, AutoGPT).

### Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openconductor": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-apify",
        "--actor-id",
        "epicmotionsd/mcp-registry-discovery"
      ],
      "env": {
        "APIFY_API_TOKEN": "your-apify-token"
      }
    }
  }
}
```

Now Claude can search for MCP servers autonomously!
```

---

### Phase 1E: Submit to Apify Store (2 hours)

**Pre-submission checklist:**
- [ ] PPE events configured in Console
- [ ] README updated with pricing table
- [ ] Test run with PPE charging (verify in transaction log)
- [ ] No console.log of sensitive data
- [ ] Error handling tested

**Store listing:**
1. Go to Actor settings
2. Click "Publish to Store"
3. Fill out form:
   - **Title:** "OpenConductor MCP Registry - Discover AI Agent Tools"
   - **Description:** "Discover 70+ Model Context Protocol servers. Search by keyword, get GitHub stats, installation commands. Perfect for AI agents. Pay-per-use pricing."
   - **Category:** AI & Machine Learning
   - **Tags:** mcp, ai-agents, claude, discovery, registry, anthropic, llm
4. Upload logo (use OpenConductor logo)
5. Submit for review

**Expected approval:** 3-5 business days

---

## Phase 2: Add Validation Feature (Later)

Once Phase 1 is live and generating revenue ($25+/month), add validation:

**New mode: `validate`**
- Charges: $0.10 per validation
- Runs health check on MCP server
- Returns: `{status: 'verified', tools: [...], responseTime: 234}`

**Implementation:** See IMPLEMENTATION_ROADMAP.md Phase 2

---

## Phase 3: Add Deployment Feature (Later)

Once Phase 2 is validated, add deployment:

**New mode: `deploy`**
- Charges: $2.00 per deployment
- Creates Actor in user's Apify account
- Configures MCP wrapper
- Returns: Connection details

**Implementation:** See IMPLEMENTATION_ROADMAP.md Phase 3

---

## Quick Start: Upgrade in 1 Day

**Morning (4 hours):**
1. Add PPE event definitions ✅
2. Add `chargeEvent()` calls to each mode ✅
3. Add caching with Key-Value Store ✅
4. Test locally ✅

**Afternoon (3 hours):**
5. Configure PPE in Apify Console ✅
6. Update README with pricing ✅
7. Deploy: `apify push` ✅
8. Test in Console (verify charges) ✅

**Evening (1 hour):**
9. Submit to Apify Store ✅
10. Share on Twitter/Discord ✅

**Total: 8 hours → Monetization-ready actor**

---

## Success Metrics (Week 1)

After launching monetized version:

**Minimum Viable Success:**
- 20+ runs (existing users + new)
- $1+ revenue (proof PPE works)
- 0 errors (stable pricing)

**Stretch Goals:**
- 50+ runs
- $5+ revenue
- First user testimonial
- Featured in Apify newsletter

---

## Code Diff Preview

Here's what changes in `src/main.js`:

```diff
  import { Actor } from 'apify';
  import axios from 'axios';
+ import { CacheManager } from './lib/cache.js';

+ const PPE_EVENTS = {
+   search_basic: 0.02,
+   get_details: 0.01,
+   get_trending: 0.02,
+   get_categories: 0.00,
+   get_popular: 0.02
+ };

+ async function chargeEvent(eventName) {
+   if (PPE_EVENTS[eventName] > 0) {
+     await Actor.addPayPerEvent({
+       eventName,
+       eventValue: PPE_EVENTS[eventName]
+     });
+   }
+ }

  await Actor.main(async () => {
    const input = await Actor.getInput();
+   const cache = new CacheManager();

    switch (mode) {
      case 'search':
+       await chargeEvent('search_basic');
+       const cacheKey = cache.generateKey('search', searchParams);
+       let searchData = await cache.get(cacheKey);
+
+       if (!searchData) {
          searchData = await api.searchServers(searchParams);
+         await cache.set(cacheKey, searchData);
+       }

        results = {
          mode: 'search',
+         cost: PPE_EVENTS['search_basic'],
+         cached: !!searchData.fromCache,
          query,
          // ...
        };
        break;
    }
  });
```

**Lines changed:** ~50
**New files:** 1 (`src/lib/cache.js`)
**Breaking changes:** None (backward compatible)

---

## Next Steps

**Decision:** Which option do you want to pursue?

1. **Option A (Recommended):** Upgrade existing actor → 8 hours, launch tomorrow
2. **Option B:** Build new actor from scratch → 30 hours, launch in 1 week
3. **Option C:** Hybrid (free + paid) → 35 hours, launch in 10 days

**My recommendation:** Start with **Option A**. Get to revenue in 1 day, then iterate. The deployment feature (Phase 3) is where the real money is, but you need the foundation first.

**Ready to code?** Let me know and I'll help you implement Option A step-by-step!
