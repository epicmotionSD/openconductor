# OpenConductor Cleanup & Refactor Plan

## Phase 1: Repository Cleanup

### Files to Archive (move to /docs/archive/)
- ANTHROPIC_CHALLENGE_SUBMISSION.md
- API_ENDPOINTS_FIX.md
- CLAUDE_DESKTOP_CONFIG_FIXES.md
- DATA_LAKE_SERVERS_ADDED.md
- DEMO_SCRIPTS.md
- FINAL_STATUS.md
- HOTFIX_v1.0.5.md
- HOTFIX_v1.0.6.md
- LOCAL_DEV_SETUP.md
- MANUAL_PG_AUTH_FIX.md
- MCP_SERVERS_EXPANSION_SUMMARY.md
- MCP_SERVER_STATUS.md
- NPM_PUBLISH_SUCCESS.md
- OPENCONDUCTOR_REGISTRY_MCP_SUMMARY.md
- PUBLISH_INSTRUCTIONS.md
- PUBLISH_SUCCESS.md
- QUICK_TEST_GUIDE.md
- REFACTOR_SUMMARY.md
- SOCIAL_MEDIA_ANNOUNCEMENTS.md
- SPORTINTEL_MCP_COMPLETE.md
- TRINITY_AI_COMPLETE_CHECKLIST.md
- TRINITY_AI_IMPLEMENTATION.md
- TRINITY_AI_SUMMARY.txt

### Scripts to Archive (move to /scripts/archive/)
- fix-db-password.sh
- setup-db-with-password.sh
- setup-local-db-nosudo.sh
- setup-local-db.sh
- setup-openconductor-db.sh
- reset-db-password.sql
- test-and-fix-auth.sql
- create-local-db.sql

### Keep in Root
- README.md (update with 191 servers)
- CHANGELOG.md (update)
- CONTRIBUTING.md
- SERVICES.md
- CLAUDE_DESKTOP_SETUP.md (user-facing)
- launch-openconductor.sh
- import-seed-data.sh
- pull-supabase-data.sh

## Phase 2: Seed Script Consolidation

### Consolidate Seed Files
- Keep: seed-all-servers.ts (primary)
- Archive: seed.ts, seed-127-servers.ts, seed-new-servers-2025.ts
- Keep JSON: mcp-servers-full-list.json, seed-*.json

### Update package.json scripts
- db:seed -> db:seed:all
- Remove db:seed:127

## Phase 3: CLI Refactoring

### Code Quality
- Remove unused dependencies
- Consolidate utility functions
- Add JSDoc comments
- Clean up test files

### Version
- Bump to v1.1.0 (major seed update)

## Phase 4: API Refactoring

### Code Quality
- Remove experimental features
- Consolidate route handlers
- Update OpenAPI/Swagger docs
- Clean up middleware

### Database
- Verify all migrations
- Optimize queries
- Add indexes if needed

## Phase 5: Frontend Refactoring

### Code Quality
- Remove unused components
- Optimize images
- Update server count (191 servers)
- Clean up service worker files

### SEO
- Update meta tags
- Update sitemap

## Phase 6: Documentation

### Update
- README.md: 191 servers, latest features
- CHANGELOG.md: Document all changes
- SERVICES.md: Current architecture
- API docs: Latest endpoints

## Phase 7: Testing & Quality

### Tests
- Run CLI test suite
- Test API endpoints
- Test frontend builds
- Verify production configs

## Phase 8: Production Deploy

### Pre-Deploy Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Build succeeds

### Deploy Order
1. Database (run migrations if needed)
2. API (Vercel)
3. Frontend (Vercel)
4. CLI (npm publish)

### Post-Deploy
- [ ] Verify API endpoints
- [ ] Test CLI installation
- [ ] Check website loads
- [ ] Monitor errors
