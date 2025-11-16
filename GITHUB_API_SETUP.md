# GitHub API Setup - Fix Credential Issues

> **Quick fix for the "Bad credentials" errors in terminal logs**

## 🔧 **Issue**
The terminal logs show `Bad credentials` errors when trying to sync GitHub repositories. This prevents server discovery and updates.

## ✅ **Solution**

### **Step 1: Create GitHub Personal Access Token**
1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set expiration to "No expiration" or 1 year
4. **Required scopes:**
   - `repo` (Full control of private repositories)
   - `read:org` (Read org and team membership, read org projects)

### **Step 2: Add Token to Environment**
Create or update `.env` file in the root directory:

```bash
# Copy from .env.example and fill in your token
GITHUB_TOKEN=github_pat_your_token_here_1234567890abcdef

# Your existing database config
POSTGRES_URL=postgres://postgres.fjmzvcipimpctqnhhfrr:29FHVZqmLEcx864X@aws-1-us-east-1.pooler.supabase.com:6543/postgres
NODE_ENV=development
```

### **Step 3: Restart API Server**
```bash
cd openconductor/packages/api
# Kill existing processes and restart with new env
GITHUB_TOKEN=your_token_here POSTGRES_URL="your_db_url" pnpm run dev
```

### **Step 4: Verify Fix**
Watch the terminal logs - you should see:
- ✅ `GitHub sync completed` instead of `Bad credentials`
- ✅ `Discovery completed` with `newServers > 0`

## 🚀 **Why This Matters for Launch**
- **Server Discovery**: Without this, new MCP servers won't be discovered automatically
- **Real-time Updates**: GitHub webhooks won't work without proper credentials
- **Launch Success**: A working discovery system shows the platform is fully functional

## 🔍 **Verification Commands**
```bash
# Test GitHub API access
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Check OpenConductor sync
curl http://localhost:3002/api/servers | jq '.servers | length'
```

## ⚠️ **Security Notes**
- Never commit tokens to GitHub
- Add `.env` to `.gitignore` 
- Use environment variables in production
- Rotate tokens regularly

---
*Once this is fixed, your GitHub sync will work perfectly for the Saturday launch! 🎯*