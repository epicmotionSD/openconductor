# Deployment Investigation Plan for openconductor.ai

## Problem Statement
Preview deployments work correctly, but production deployments fail to auto-deploy when merging to main branch. Need to investigate and fix the "direct connection to ecosystem" deployment pipeline.

## Investigation Findings

### Critical Issues Identified
1. **Multiple Conflicting Vercel Configurations**
   - Root `/vercel.json` 
   - Frontend `/packages/frontend/vercel.json`
   - API `/packages/api/vercel.json`
   - Each has different build commands, environment variables, and output directories

2. **Monorepo Deployment Strategy Unclear**
   - No defined strategy for deploying monorepo to production vs preview
   - Different configurations may be used for different environments

3. **Environment Variable Mismatches**
   - Root config includes `POSTGRES_URL`, frontend doesn't
   - Production vs preview environment differences not standardized

4. **Build Path Inconsistencies**
   - Different relative path references in build commands
   - Could cause production builds to fail while preview succeeds

## Investigation Actions Required

### Phase 1: Current State Analysis
- [ ] **Check Vercel dashboard project settings** for openconductor.ai
- [ ] **Verify GitHub integration status** and auto-deploy configurations
- [ ] **Identify which vercel.json file** is actually being used for production
- [ ] **Compare environment variables** between preview and production environments

### Phase 2: Build Process Investigation  
- [ ] **Test build commands locally** from each configuration
- [ ] **Verify monorepo dependencies** and workspace setup
- [ ] **Check pnpm workspace configuration** and build order
- [ ] **Validate Supabase and ecosystem integrations** in production environment

### Phase 3: Solution Implementation
- [ ] **Create unified Vercel configuration** strategy
- [ ] **Implement proper environment variable** management
- [ ] **Set up production deployment validation** testing
- [ ] **Establish deployment monitoring** and verification systems

## Expected Outcomes
- Production deployments auto-deploy successfully on main branch merges
- Consistent environment handling between preview and production
- Clear deployment strategy for the monorepo architecture
- Proper ecosystem service integrations in production

## Risk Assessment
- **High**: Configuration conflicts causing complete deployment failures
- **Medium**: Environment variable issues causing runtime errors
- **Low**: Build performance impacts during transition

## Success Criteria
- ✅ Production auto-deploys work consistently
- ✅ Preview deployments continue to work
- ✅ Environment variables properly configured
- ✅ Ecosystem services (Supabase, etc.) connect correctly
- ✅ Build process is reliable and fast