# API Endpoints Fix - Trending Servers 404 Error

## Problem
The `openconductor discover` CLI command was failing with a 404 error when users tried to view trending servers. The error was:
```
✖ Failed to fetch trending servers: Request failed with status code 404
```

## Root Cause
The OpenConductor frontend (Next.js) is deployed on Vercel, but it was missing API route handlers for:
- `/api/v1/servers/stats/trending`
- `/api/v1/servers/stats/popular`
- `/api/v1/servers/categories`

The CLI was calling these endpoints, but they didn't exist in the Next.js API routes, causing 404 errors.

## Solution
Created three new Next.js API route handlers in the frontend package:

### 1. Trending Servers Endpoint
**File:** `packages/frontend/src/app/api/v1/servers/stats/trending/route.ts`
- Returns servers sorted by installation count (recent activity indicator)
- Supports optional `period`, `category`, and `limit` query parameters
- Default limit: 10 servers

### 2. Popular Servers Endpoint
**File:** `packages/frontend/src/app/api/v1/servers/stats/popular/route.ts`
- Returns servers sorted by GitHub star count (overall popularity)
- Supports optional `category` and `limit` query parameters
- Default limit: 10 servers

### 3. Categories Endpoint
**File:** `packages/frontend/src/app/api/v1/servers/categories/route.ts`
- Returns all MCP server categories with server counts
- Includes category emoji mappings
- Sorted alphabetically

## Implementation Details
All endpoints:
- Use the existing database service (`db.getServers()`)
- Return consistent API response format with `success`, `data`, and `meta` fields
- Include proper CORS headers for cross-origin requests
- Implement caching headers (`Cache-Control: public, s-maxage=600, stale-while-revalidate=1200`)
- Support OPTIONS requests for CORS preflight

## Deployment
- **Commit:** `54b73948` - "fix(api): add missing trending, popular, and categories endpoints"
- **Deployed to:** Production (Vercel)
- **Status:** ✅ Working

## Testing
All endpoints are now accessible and working:
```bash
# Trending servers
curl https://openconductor.ai/api/v1/servers/stats/trending

# Popular servers
curl https://openconductor.ai/api/v1/servers/stats/popular

# Categories
curl https://openconductor.ai/api/v1/servers/categories
```

## CLI Fix
Users can now successfully use:
```bash
openconductor discover
# Then select: "📈 Show trending servers"
```

The trending servers feature will now work without 404 errors.

## Note on www subdomain
The `www.openconductor.ai` subdomain may still show cached 404 responses for a short period due to Vercel's CDN caching. The main `openconductor.ai` domain works immediately.

## Files Changed
- ✅ `packages/frontend/src/app/api/v1/servers/stats/trending/route.ts` (new)
- ✅ `packages/frontend/src/app/api/v1/servers/stats/popular/route.ts` (new)
- ✅ `packages/frontend/src/app/api/v1/servers/categories/route.ts` (new)
