# OpenConductor MCP Configuration Guide

This guide explains how to set up Model Context Protocol (MCP) servers for OpenConductor development with Claude Desktop.

## Overview

OpenConductor uses multiple MCP servers to provide Claude with access to:
- **Filesystem**: Read/write access to all package directories
- **PostgreSQL**: Local development database
- **Supabase**: Production database (optional)
- **GitHub**: Repository operations and API access
- **Redis**: Cache and session store operations

## Quick Setup

### 1. Environment Variables

Ensure your `.env` file in the project root contains all required variables:

```bash
# GitHub API Token
GITHUB_TOKEN=your_github_token_here

# Local Development Database
DATABASE_URL=postgresql://localhost:5432/openconductor

# Supabase Production Database (optional)
SUPABASE_DATABASE_URL=postgres://user:pass@host:port/database

# Redis Cache
REDIS_URL=redis://localhost:6379

# Node Environment
NODE_ENV=development
```

### 2. Generate Claude Desktop Config

Run the setup script to generate your personalized configuration:

```bash
./generate-mcp-config.sh
```

This will:
1. Read your `.env` file
2. Substitute environment variables
3. Create `~/.config/claude/claude_desktop_config.json`
4. Backup any existing configuration

### 3. Manual Setup (Alternative)

If you prefer manual setup, copy the template and substitute variables manually:

```bash
cp claude_desktop_config.template.json ~/.config/claude/claude_desktop_config.json
```

Then edit `~/.config/claude/claude_desktop_config.json` and replace:
- `${DATABASE_URL}` with your local database URL
- `${SUPABASE_DATABASE_URL}` with your Supabase URL (if using)
- `${GITHUB_TOKEN}` with your GitHub personal access token
- `${REDIS_URL}` with your Redis URL

### 4. Restart Claude Desktop

After configuration, restart Claude Desktop for changes to take effect.

## MCP Server Descriptions

### openconductor-filesystem
**Purpose**: Provides file system access to all OpenConductor packages
**Tools**: read_file, write_file, list_directory, search_files
**Access**:
- `/packages/api` - Backend API server code
- `/packages/cli` - Command-line interface
- `/packages/frontend` - Next.js frontend application
- `/packages/shared` - Shared types and utilities

### openconductor-database-local
**Purpose**: Local PostgreSQL database for development
**Tools**: query, list_tables, describe_table
**Use cases**: Schema exploration, data queries, migrations testing

### openconductor-supabase
**Purpose**: Production Supabase PostgreSQL database
**Tools**: query, list_tables, describe_table
**Security**: Use with caution - this is production data!
**Use cases**: Production debugging, data analysis, schema verification

### github
**Purpose**: GitHub repository operations
**Tools**: create_issue, create_pull_request, list_issues, get_file_contents
**Scope**: Access to your OpenConductor repository
**Use cases**: Issue management, PR creation, code review

### openconductor-redis
**Purpose**: Redis cache and session store
**Tools**: get, set, delete, keys, expire
**Use cases**: Cache debugging, session management, rate limit testing

## Security Considerations

### Critical Security Notes

1. **Never commit credentials**: The `.env` file contains sensitive tokens and passwords
2. **GitHub Token Scope**: Limit your token to only required permissions (repo, read:org)
3. **Production Database**: Consider using a read-only replica for the Supabase MCP server
4. **Redis Access**: Be careful with cache invalidation in production
5. **File System Access**: MCP has full read/write access to specified directories

### Recommended Token Permissions

For GitHub token, enable:
- `repo` (full control of private repositories)
- `read:org` (read organization data)
- Optional: `workflow` (if you need workflow access)

Create token at: https://github.com/settings/tokens

### Environment Isolation

The configuration template uses environment variables to separate concerns:
- Development uses `DATABASE_URL` (local PostgreSQL)
- Production uses `SUPABASE_DATABASE_URL` (Supabase)
- Both can be configured simultaneously

## Troubleshooting

### MCP Server Not Found

**Error**: "MCP server 'openconductor-filesystem' not found"

**Solution**:
1. Ensure `@modelcontextprotocol/server-filesystem` is installed globally or via npx
2. Check that paths in config are absolute (not relative)
3. Verify npx is in your PATH

### Connection Refused

**Error**: "Connection refused" when accessing database/redis

**Solution**:
1. Ensure PostgreSQL is running: `systemctl status postgresql`
2. Ensure Redis is running: `systemctl status redis`
3. Check connection strings in `.env` file
4. Test connection manually: `psql $DATABASE_URL`

### Permission Denied

**Error**: "Permission denied" when accessing files

**Solution**:
1. Check file permissions on project directories
2. Ensure Claude Desktop has access to the file system
3. Verify paths in config match your actual project location

### GitHub Authentication Failed

**Error**: "Bad credentials" or "401 Unauthorized"

**Solution**:
1. Regenerate your GitHub personal access token
2. Update `GITHUB_TOKEN` in `.env` file
3. Regenerate MCP config with new token
4. Restart Claude Desktop

## Updating Configuration

When you change environment variables:

1. Update `.env` file
2. Regenerate config: `./generate-mcp-config.sh`
3. Restart Claude Desktop

## Testing Your Setup

To verify MCP servers are working:

1. Open Claude Desktop
2. Start a new conversation
3. Ask: "Can you list the files in the OpenConductor packages directory?"
4. Ask: "Can you query the mcp_servers table in the database?"
5. Ask: "Can you check the Redis connection?"

If all queries work, your MCP setup is complete!

## Advanced Configuration

### Adding Custom MCP Servers

To add your own MCP server:

1. Create the server (see [MCP Documentation](https://modelcontextprotocol.io))
2. Add entry to `claude_desktop_config.template.json`
3. Regenerate configuration
4. Restart Claude Desktop

### Using Docker Databases

If running PostgreSQL/Redis in Docker:

```bash
# PostgreSQL in Docker
DATABASE_URL=postgresql://postgres:password@localhost:5432/openconductor

# Redis in Docker
REDIS_URL=redis://localhost:6379
```

Ensure Docker ports are mapped correctly.

### Read-Only Database Access

For safer production access, create a read-only user:

```sql
CREATE USER readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE openconductor TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
```

Then use: `SUPABASE_DATABASE_URL=postgresql://readonly:secure_password@host:port/db`

## Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
- [OpenConductor Documentation](./README.md)
- [Supabase Documentation](https://supabase.com/docs)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Claude Desktop logs: `~/.config/claude/logs/`
3. Open an issue in the OpenConductor repository
4. Check MCP server logs for specific errors
