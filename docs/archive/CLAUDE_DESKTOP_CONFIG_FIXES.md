# Claude Desktop Configuration Fixes

**Date**: November 21, 2025
**Status**: ✅ All package names corrected

---

## Issues Found and Fixed

### 1. ✅ Git MCP Server - Wrong Package Type
**Issue**: Template referenced non-existent npm package `@modelcontextprotocol/server-git`
**Fix**: Git MCP server is a **Python package**, not npm

**Correct package**: `mcp-server-git` (via PyPI/uv)

**Files Updated**:
- [packages/api/src/db/seed-new-servers-2025.ts](packages/api/src/db/seed-new-servers-2025.ts#L73-L74)
- [packages/api/src/db/mcp-servers-full-list.json](packages/api/src/db/mcp-servers-full-list.json#L52-L53)

### 2. ✅ PostgreSQL MCP Server - Wrong Package Name
**Issue**: Template used `@modelcontextprotocol/server-postgresql` (extra "ql")
**Fix**: Correct package is `@modelcontextprotocol/server-postgres`

**Files Updated**:
- [claude_desktop_config.template.json](claude_desktop_config.template.json#L21-L32)

### 3. ✅ Filesystem MCP Server - Wrong Path Format
**Issue**: Windows config using Linux path `/home/roizen/projects/openconductor`
**Fix**: Need to use Windows or WSL path format

---

## Windows Machine Configuration Fixes

### File Location
`C:\Users\shawn\AppData\Roaming\Claude\claude_desktop_config.json`

### Option 1: Use WSL Path (If WSL is installed)

```json
{
  "mcpServers": {
    "openconductor-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "\\\\wsl$\\Ubuntu\\home\\roizen\\projects\\openconductor"
      ]
    },
    "openconductor-database": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:pass@localhost/openconductor"
      ]
    }
  }
}
```

### Option 2: Use Windows Native Paths

```json
{
  "mcpServers": {
    "openconductor-filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\shawn\\projects\\openconductor"
      ]
    },
    "openconductor-database": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:pass@localhost/openconductor"
      ]
    }
  }
}
```

### Option 3: Remove Problematic Servers (Simplest)

If you don't need these servers on Windows, simply remove them:

```json
{
  "mcpServers": {
    "openconductor-registry": {
      "command": "npx",
      "args": [
        "-y",
        "@openconductor/mcp-registry"
      ]
    }
  }
}
```

---

## Correct Package Names Reference

### NPM Packages (JavaScript/TypeScript)
- ✅ `@modelcontextprotocol/server-filesystem`
- ✅ `@modelcontextprotocol/server-postgres` (NOT postgresql)
- ✅ `@modelcontextprotocol/server-github` (DEPRECATED)
- ✅ `@modelcontextprotocol/server-memory`
- ✅ `@openconductor/mcp-registry`
- ✅ `@openconductor/sportintel`

### Python Packages (via uv/pip)
- ✅ `mcp-server-git` (NOT @modelcontextprotocol/server-git)

---

## Testing Package Names

### Test NPM Package
```bash
npm view @modelcontextprotocol/server-postgres version
```

### Test Python Package
```bash
uvx mcp-server-git --help
```

---

## Path Format Examples

### Linux/WSL
```
/home/roizen/projects/openconductor
```

### Windows (from Windows)
```
C:\\Users\\shawn\\projects\\openconductor
```

### WSL (from Windows)
```
\\\\wsl$\\Ubuntu\\home\\roizen\\projects\\openconductor
```

---

## Common Errors and Solutions

### Error: "404 Not Found - @modelcontextprotocol/server-postgresql"
**Solution**: Change to `@modelcontextprotocol/server-postgres` (remove "ql")

### Error: "404 Not Found - @modelcontextprotocol/server-git"
**Solution**: This is a Python package. Use `uvx mcp-server-git` instead

### Error: "ENOENT: no such file or directory, stat 'C:\\home\\roizen...'"
**Solution**: Windows doesn't have `/home` directory. Use proper Windows path or WSL path

### Error: "Server disconnected"
**Solution**: Check package name spelling and path format for your OS

---

## Installation Steps for New Setup

### 1. Install Node.js Tools (NPM packages)
```bash
# Install globally
npm install -g @openconductor/mcp-registry
npm install -g @openconductor/sportintel

# Or use npx in config (downloads on-demand)
```

### 2. Install Python Tools (Python packages)
```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Test it works
uvx mcp-server-git --help
```

### 3. Create Claude Desktop Config

**Linux/Mac**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `C:\Users\<username>\AppData\Roaming\Claude\claude_desktop_config.json`

### 4. Restart Claude Desktop

Completely quit and restart (not just reload)

---

## Verification Checklist

After making changes:

- [ ] JSON syntax is valid (use `python3 -m json.tool < config.json`)
- [ ] All package names are correct (no typos)
- [ ] Paths use correct format for your OS
- [ ] Environment variables are set (if used)
- [ ] Claude Desktop restarted completely
- [ ] No errors in Claude Desktop logs

---

## Resources

- **MCP Server Registry**: https://github.com/modelcontextprotocol/servers
- **OpenConductor Docs**: https://openconductor.ai/docs
- **Debugging Guide**: https://modelcontextprotocol.io/docs/tools/debugging

---

## Summary

Three main issues were corrected:

1. ✅ **Git server**: Changed from non-existent npm package to correct Python package `mcp-server-git`
2. ✅ **Postgres server**: Fixed typo `server-postgresql` → `server-postgres`
3. ✅ **Filesystem paths**: Need OS-appropriate path format (Linux vs Windows vs WSL)

All template files and seed data have been updated with correct package names.
