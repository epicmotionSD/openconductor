# Empire MCP Configuration Update Required

## Issue
The `openconductor-empire-mcp` server has the old Vercel project name hardcoded.

## Location
Check for Vercel project ID or name in:
- `src/devops/vercel.ts` or similar
- Environment variables: `VERCEL_PROJECT_ID` or `VERCEL_PROJECT_NAME`

## Required Change
```
OLD: openconductor (or project ID for bricked project)
NEW: openconductor-next
```

## After Update
Run `empire_devops_deployments` to verify it pulls from the correct project.
