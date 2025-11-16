const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic API endpoint with sample data
app.get('/v1/servers', (req, res) => {
  res.json({
    success: true,
    data: {
      servers: [
        {
          id: "1",
          slug: "openmemory",
          name: "OpenMemory",
          tagline: "Hierarchical memory for AI agents",
          description: "Advanced memory management for AI agents with semantic search capabilities",
          category: "memory",
          tags: ["memory", "ai", "agents", "semantic"],
          repository: {
            url: "https://github.com/openai/openmemory",
            owner: "openai", 
            name: "openmemory",
            stars: 1600
          },
          installation: {
            cli: "openconductor install openmemory"
          },
          stats: {
            installs: 847,
            pageViews: 1200
          },
          verified: true,
          featured: true
        },
        {
          id: "2",
          slug: "github-mcp",
          name: "GitHub MCP",
          tagline: "Repository management and automation",
          description: "Complete GitHub integration for AI agents with repository management",
          category: "api",
          tags: ["github", "api", "automation", "git"],
          repository: {
            url: "https://github.com/anthropic/github-mcp",
            owner: "anthropic",
            name: "github-mcp", 
            stars: 1100
          },
          installation: {
            cli: "openconductor install github-mcp"
          },
          stats: {
            installs: 672,
            pageViews: 890
          },
          verified: true,
          featured: true
        },
        {
          id: "3",
          slug: "postgresql-mcp",
          name: "PostgreSQL MCP",
          tagline: "Secure database queries and management",
          description: "Professional database integration for AI agents with PostgreSQL",
          category: "database",
          tags: ["database", "postgresql", "sql", "queries"],
          repository: {
            url: "https://github.com/anthropic/postgresql-mcp",
            owner: "anthropic",
            name: "postgresql-mcp",
            stars: 654
          },
          installation: {
            cli: "openconductor install postgresql-mcp"
          },
          stats: {
            installs: 456,
            pageViews: 620
          },
          verified: true,
          featured: false
        }
      ]
    }
  });
});

// Admin API endpoint
app.get('/v1/admin/servers', (req, res) => {
  // Check for admin auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer oc_admin_')) {
    return res.status(401).json({
      success: false,
      error: 'Admin API key required'
    });
  }

  // Return same data as public endpoint for admin view
  res.json({
    success: true,
    data: {
      servers: [
        {
          id: "1",
          slug: "openmemory",
          name: "OpenMemory",
          tagline: "Hierarchical memory for AI agents",
          description: "Advanced memory management for AI agents with semantic search capabilities",
          category: "memory",
          tags: ["memory", "ai", "agents", "semantic"],
          repository: {
            url: "https://github.com/openai/openmemory",
            owner: "openai",
            name: "openmemory",
            stars: 1600
          },
          installation: {
            cli: "openconductor install openmemory"
          },
          stats: {
            installs: 847,
            pageViews: 1200
          },
          verified: true,
          featured: true
        },
        {
          id: "2",
          slug: "github-mcp",
          name: "GitHub MCP",
          tagline: "Repository management and automation",
          description: "Complete GitHub integration for AI agents with repository management",
          category: "api",
          tags: ["github", "api", "automation", "git"],
          repository: {
            url: "https://github.com/anthropic/github-mcp",
            owner: "anthropic",
            name: "github-mcp",
            stars: 1100
          },
          installation: {
            cli: "openconductor install github-mcp"
          },
          stats: {
            installs: 672,
            pageViews: 890
          },
          verified: true,
          featured: true
        },
        {
          id: "3",
          slug: "postgresql-mcp",
          name: "PostgreSQL MCP",
          tagline: "Secure database queries and management",
          description: "Professional database integration for AI agents with PostgreSQL",
          category: "database",
          tags: ["database", "postgresql", "sql", "queries"],
          repository: {
            url: "https://github.com/anthropic/postgresql-mcp",
            owner: "anthropic",
            name: "postgresql-mcp",
            stars: 654
          },
          installation: {
            cli: "openconductor install postgresql-mcp"
          },
          stats: {
            installs: 456,
            pageViews: 620
          },
          verified: true,
          featured: false
        }
      ]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenConductor API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API endpoint: http://localhost:${PORT}/v1/servers`);
});

module.exports = app;