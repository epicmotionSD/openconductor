# MCP Manifest Specification

**Version**: 1.0
**Status**: Draft
**Last Updated**: 2025-11-21

## Overview

The MCP Manifest is a standardized metadata file (`mcp-manifest.json`) that MCP server authors can include in their repositories to provide rich metadata, installation instructions, and compatibility information.

This specification aims to become the de facto standard for MCP server metadata, similar to how `package.json` standardized Node.js packages.

## Goals

1. **Simplified Discovery**: Enable registries and tools to automatically discover and index MCP servers
2. **Installation Automation**: Provide structured installation instructions for different platforms
3. **Version Compatibility**: Declare supported MCP protocol versions and dependencies
4. **Rich Metadata**: Include descriptions, categories, tags, and usage examples
5. **Forward Compatibility**: Support schema evolution through versioning

## File Location

The manifest file MUST be located at the root of the repository:

```
your-mcp-server/
├── mcp-manifest.json
├── README.md
├── package.json (for Node.js servers)
└── ... other files
```

## Manifest Structure

### Required Fields

```json
{
  "schemaVersion": "1.0",
  "name": "server-name",
  "version": "1.0.0",
  "description": "Short description of what this server does",
  "repository": "https://github.com/owner/repo"
}
```

#### Field Descriptions

- **`schemaVersion`** (string, required): The version of this manifest specification. Currently `"1.0"`. This field is CRITICAL for forward compatibility.
- **`name`** (string, required): The canonical name of the MCP server. Should be lowercase, kebab-case (e.g., `"github-mcp"`).
- **`version`** (string, required): Semantic version of the server (e.g., `"1.2.3"`).
- **`description`** (string, required): A brief description (1-2 sentences) of what the server does.
- **`repository`** (string, required): Full URL to the source code repository.

### Recommended Fields

```json
{
  "author": "Author Name <email@example.com>",
  "license": "MIT",
  "homepage": "https://example.com/docs",
  "categories": ["Development", "Database"],
  "tags": ["postgresql", "sql", "database"],
  "icon": "https://example.com/icon.png",
  "screenshots": [
    "https://example.com/screenshot1.png"
  ]
}
```

#### Field Descriptions

- **`author`** (string): Name and optional email of the primary author.
- **`license`** (string): SPDX license identifier (e.g., `"MIT"`, `"Apache-2.0"`).
- **`homepage`** (string): URL to documentation or homepage.
- **`categories`** (array of strings): Primary categories (max 2). See [Categories](#categories) below.
- **`tags`** (array of strings): Searchable keywords (max 10).
- **`icon`** (string): URL to square icon image (PNG/SVG, min 512x512px).
- **`screenshots`** (array of strings): URLs to screenshot images.

### Installation Configuration

The `installation` object describes how to install and run the server on different platforms.

```json
{
  "installation": {
    "npm": {
      "package": "@modelcontextprotocol/server-github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": {
          "description": "GitHub Personal Access Token",
          "required": true,
          "link": "https://github.com/settings/tokens"
        }
      }
    },
    "docker": {
      "image": "modelcontextprotocol/server-github:latest",
      "command": "docker",
      "args": ["run", "-i", "modelcontextprotocol/server-github:latest"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": {
          "description": "GitHub Personal Access Token",
          "required": true,
          "link": "https://github.com/settings/tokens"
        }
      }
    },
    "python": {
      "package": "mcp-server-github",
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {}
    }
  }
}
```

#### Installation Method Fields

Each installation method (e.g., `npm`, `docker`, `python`) can include:

- **`package`** (string): Package identifier (e.g., npm package name, PyPI package, Docker image)
- **`command`** (string): The executable command to run
- **`args`** (array of strings): Arguments to pass to the command
- **`env`** (object): Environment variables required or supported

#### Environment Variable Schema

Each environment variable can be:

**Simple (string)**: For backward compatibility
```json
{
  "API_KEY": "Your API key"
}
```

**Detailed (object)**:
```json
{
  "API_KEY": {
    "description": "Your API key for authentication",
    "required": true,
    "default": "",
    "link": "https://example.com/get-api-key",
    "validation": "^[a-zA-Z0-9]{32}$"
  }
}
```

- **`description`** (string): Human-readable description
- **`required`** (boolean): Whether this env var is required
- **`default`** (string): Default value if not provided
- **`link`** (string): URL to obtain/create the credential
- **`validation`** (string): Regex pattern for validation

### MCP Protocol Information

```json
{
  "mcp": {
    "protocolVersion": "2024-11-05",
    "capabilities": ["tools", "resources", "prompts"],
    "tools": [
      {
        "name": "create_issue",
        "description": "Create a new GitHub issue"
      }
    ],
    "resources": [
      {
        "name": "repository",
        "description": "Access repository information"
      }
    ],
    "prompts": [
      {
        "name": "review_pr",
        "description": "Review a pull request"
      }
    ]
  }
}
```

#### MCP Fields

- **`protocolVersion`** (string): The MCP protocol version supported (e.g., `"2024-11-05"`)
- **`capabilities`** (array): List of MCP capabilities: `"tools"`, `"resources"`, `"prompts"`, `"sampling"`
- **`tools`** (array): List of tools provided by this server
- **`resources`** (array): List of resources exposed
- **`prompts`** (array): List of prompts available

### Usage Examples

```json
{
  "examples": [
    {
      "title": "Create an issue",
      "description": "How to create a GitHub issue",
      "code": "Can you create an issue in my repo called 'Fix login bug'?"
    },
    {
      "title": "Search code",
      "description": "Search for specific code patterns",
      "code": "Search my repo for all files that import 'axios'"
    }
  ]
}
```

### Additional Metadata

```json
{
  "support": {
    "email": "support@example.com",
    "url": "https://github.com/owner/repo/issues",
    "discord": "https://discord.gg/xyz"
  },
  "badges": {
    "openconductor": "https://openconductor.ai/badge/server-name.svg",
    "custom": [
      "https://img.shields.io/npm/v/package.svg",
      "https://img.shields.io/github/stars/owner/repo.svg"
    ]
  },
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/username"
  }
}
```

## Categories

Standard categories for MCP servers:

- **Development**: Code tools, Git, CI/CD
- **Data & Analytics**: Databases, BI, data processing
- **Communication**: Slack, email, messaging
- **Productivity**: Note-taking, task management
- **Content & Media**: Images, video, documents
- **Cloud & Infrastructure**: AWS, Docker, Kubernetes
- **Security**: Authentication, secrets management
- **Finance**: Payment processing, accounting
- **Marketing**: Social media, analytics
- **Other**: Servers that don't fit standard categories

## Complete Example

```json
{
  "schemaVersion": "1.0",
  "name": "github-mcp",
  "version": "2.1.0",
  "description": "MCP server for GitHub API integration with tools for issues, PRs, and repositories",
  "author": "Anthropic <support@anthropic.com>",
  "license": "MIT",
  "repository": "https://github.com/anthropic/github-mcp-server",
  "homepage": "https://github.com/anthropic/github-mcp-server#readme",
  "categories": ["Development", "Productivity"],
  "tags": ["github", "git", "issues", "pull-requests", "code-review"],
  "icon": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  "screenshots": [
    "https://example.com/screenshot1.png"
  ],
  "installation": {
    "npm": {
      "package": "@modelcontextprotocol/server-github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": {
          "description": "GitHub Personal Access Token with repo scope",
          "required": true,
          "link": "https://github.com/settings/tokens/new?description=MCP%20Server&scopes=repo"
        }
      }
    }
  },
  "mcp": {
    "protocolVersion": "2024-11-05",
    "capabilities": ["tools", "resources"],
    "tools": [
      {
        "name": "create_issue",
        "description": "Create a new GitHub issue"
      },
      {
        "name": "create_pull_request",
        "description": "Create a new pull request"
      },
      {
        "name": "search_repositories",
        "description": "Search for GitHub repositories"
      }
    ],
    "resources": [
      {
        "name": "repository",
        "description": "Access repository information and metadata"
      }
    ]
  },
  "examples": [
    {
      "title": "Create an issue",
      "description": "How to create a GitHub issue",
      "code": "Can you create an issue in my repo called 'Fix login bug' with a description of the problem?"
    },
    {
      "title": "Review PR",
      "description": "Review a pull request",
      "code": "Review PR #123 in my repository and provide feedback on the code quality"
    }
  ],
  "support": {
    "url": "https://github.com/anthropic/github-mcp-server/issues",
    "email": "support@anthropic.com"
  },
  "badges": {
    "openconductor": "https://openconductor.ai/badge/github-mcp.svg"
  }
}
```

## Schema Versioning Strategy

The `schemaVersion` field enables forward compatibility as this specification evolves.

### Version Format

- Use semantic versioning: `"major.minor"` (e.g., `"1.0"`, `"1.1"`, `"2.0"`)
- **Major version**: Breaking changes (tools must update to support new schema)
- **Minor version**: Backward-compatible additions (tools can safely ignore new fields)

### Version History

- **1.0** (Current): Initial specification with all fields defined above

### Future Versions

When this specification evolves:

- **1.1**: Might add optional fields like `"dependencies"`, `"changelog"`, etc.
- **2.0**: Might change required fields or restructure the schema

Tools MUST:
1. Check `schemaVersion` before parsing
2. Support at minimum version `1.0`
3. Gracefully handle unknown fields in newer versions
4. Warn users when encountering unsupported major versions

## Validation

Tools consuming this manifest SHOULD validate it against the schema. A JSON Schema definition is available at:

```
https://openconductor.ai/schemas/mcp-manifest-v1.0.json
```

## Adoption

### For Server Authors

1. Create `mcp-manifest.json` in your repository root
2. Include at minimum all required fields
3. Add installation instructions for your target platforms
4. Submit a PR to add the OpenConductor badge to your README

### For Tool Builders

1. Support reading `mcp-manifest.json` from repositories
2. Use manifest data to auto-configure installations
3. Display rich metadata in your UI
4. Respect the `schemaVersion` field for compatibility

### For Registries

1. Crawl repositories for `mcp-manifest.json` files
2. Index servers based on manifest metadata
3. Validate manifests and report errors to authors
4. Display installation instructions from the manifest

## References

- [MCP Protocol Specification](https://github.com/modelcontextprotocol/specification)
- [OpenConductor Registry](https://openconductor.ai)
- [JSON Schema](https://json-schema.org/)

## License

This specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) - dedicated to the public domain.

---

**Feedback**: Please submit issues and suggestions to [OpenConductor GitHub](https://github.com/openconductor/openconductor/issues)
