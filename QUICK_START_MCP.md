# Quick Start: MCP Configuration for OpenConductor

Your MCP configuration has been **validated and refactored**. All credentials are now secure!

## ✅ What Was Done

1. **Fixed path issues** - Corrected Windows paths to Linux paths
2. **Secured credentials** - Moved all secrets to environment variables
3. **Generated config** - Created working Claude Desktop configuration
4. **Added documentation** - Complete setup and troubleshooting guides
5. **Fixed security issues** - Removed hardcoded credentials from source code

## 🚀 Your Configuration is Ready!

The MCP configuration has been installed to:
```
~/.config/claude/claude_desktop_config.json
```

### Configured MCP Servers:

✅ **openconductor-filesystem** - Access to all package directories
✅ **openconductor-database-local** - Local PostgreSQL database
✅ **openconductor-supabase** - Production Supabase database  
✅ **github** - GitHub API with your token
✅ **openconductor-redis** - Redis cache and sessions

## 📋 Next Steps

### 1. Restart Claude Desktop
Close and reopen Claude Desktop to load the new configuration.

### 2. Test Your Setup
Open a new conversation and try:

```
Can you list the files in the OpenConductor packages/api directory?
```

```
Can you query the mcp_servers table from the database?
```

```
Can you check what's in Redis?
```

### 3. Start Developing
Your MCP servers are ready! Claude can now:
- Read and edit your OpenConductor code
- Query your databases (local and Supabase)
- Access GitHub API for issues/PRs
- Interact with Redis cache

## 🔄 Updating Configuration

When you change environment variables in `.env`:

```bash
./generate-mcp-config.sh
```

Then restart Claude Desktop.

## 📚 Documentation

- **[MCP_SETUP.md](./MCP_SETUP.md)** - Complete setup guide with troubleshooting
- **[MCP_VALIDATION_SUMMARY.md](./MCP_VALIDATION_SUMMARY.md)** - Details of what was fixed

## 🔒 Security Notes

✅ **Secured:**
- `.env` file is in `.gitignore` (not committed)
- `claude_desktop_config.json` is in `.gitignore`
- `deploy-to-supabase.ts` now uses environment variables

⚠️ **Consider Rotating:**
Your GitHub token was previously exposed. You may want to:
1. Go to https://github.com/settings/tokens
2. Delete the old token
3. Create a new token with `repo` and `read:org` permissions
4. Update `GITHUB_TOKEN` in `.env`
5. Run `./generate-mcp-config.sh` again

## 🆘 Troubleshooting

### MCP Servers Not Working?

1. **Check services are running:**
   ```bash
   systemctl status postgresql
   systemctl status redis
   ```

2. **Check Claude Desktop logs:**
   ```bash
   tail -f ~/.config/claude/logs/mcp*.log
   ```

3. **Verify configuration:**
   ```bash
   cat ~/.config/claude/claude_desktop_config.json
   ```

4. **Test database connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Need Help?

- Check [MCP_SETUP.md](./MCP_SETUP.md) for detailed troubleshooting
- Review Claude Desktop logs
- Ensure all required services are running

## 📁 Files Created

| File | Purpose |
|------|---------|
| `claude_desktop_config.template.json` | Template (safe to commit) |
| `generate-mcp-config.sh` | Config generator script |
| `.env.example` | Example environment variables |
| `MCP_SETUP.md` | Complete setup documentation |
| `MCP_VALIDATION_SUMMARY.md` | Validation report |
| `QUICK_START_MCP.md` | This quick start guide |

---

**You're all set!** Restart Claude Desktop and start coding with MCP! 🎉
