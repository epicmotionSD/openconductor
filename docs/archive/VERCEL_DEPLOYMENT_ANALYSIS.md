# Vercel Deployment Analysis for openconductor.ai

## Configuration Conflicts Identified

### 1. Multiple Conflicting vercel.json Files

**Root Configuration** (`/vercel.json`):
```json
{
  "buildCommand": "cd packages/shared && pnpm run build && cd ../frontend && pnpm run build",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": "packages/frontend/.next",
  "env": {
    "NEXT_PUBLIC_API_URL": "/api/v1",
    "POSTGRES_URL": "postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
  }
}
```

**Frontend Configuration** (`/packages/frontend/vercel.json`):
```json
{
  "buildCommand": "cd ../shared && pnpm run build && cd ../frontend && pnpm run build",
  "installCommand": "cd ../.. && pnpm install --no-frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "/api/v1"
  }
}
```

**API Configuration** (`/packages/api/vercel.json`):
```json
{
  "version": 2,
  "installCommand": "cd ../.. && pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../../packages/shared && pnpm run build",
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3001",
    "CORS_ORIGIN": "https://openconductor.ai",
    "POSTGRES_URL": "postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
  }
}
```

### 2. Key Issues

1. **Configuration Priority Conflict**: Multiple vercel.json files create ambiguity about which config Vercel uses
2. **Environment Variable Inconsistency**: Root config includes POSTGRES_URL, frontend doesn't
3. **Build Path Differences**: Different relative paths for build commands
4. **Missing API Integration**: No clear connection between frontend and API deployments
5. **Monorepo Strategy Unclear**: No defined strategy for deploying monorepo to production vs preview

### 3. Root Causes for Preview vs Production Failure

- **Preview deployments** likely use branch-specific or PR-specific configurations
- **Production deployments** may be hitting configuration conflicts when merging to main
- **Environment variable mismatches** between preview and production environments
- **Build command inconsistencies** causing production builds to fail

## Recommended Solutions

1. **Consolidate to single root vercel.json** for main deployment
2. **Separate Vercel projects** for API and Frontend with proper environment handling
3. **Implement proper monorepo deployment strategy** using Vercel's monorepo features
4. **Standardize environment variables** across all configurations
5. **Add production-specific build and deployment validation**