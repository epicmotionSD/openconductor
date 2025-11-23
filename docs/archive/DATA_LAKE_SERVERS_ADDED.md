# Data Lake & Warehouse MCP Servers Added

**Date**: November 21, 2025
**Status**: ✅ 4 new servers added to registry

---

## New Servers Added

### 1. Snowflake ⭐ Featured
**Slug**: `snowflake-mcp`
**Package**: `snowflake-labs-mcp` (Python/PyPI)
**Repository**: [Snowflake-Labs/mcp](https://github.com/Snowflake-Labs/mcp)

**Description**: Snowflake data warehouse with Cortex AI, object management, and SQL orchestration. Query structured and unstructured data.

**Key Features**:
- 🤖 Cortex AI integration (Search, Analyst, Agent)
- 📊 Object management (create, drop, update)
- 💾 SQL orchestration
- 🔐 Multiple authentication methods (OAuth, SSO, MFA)
- 🔍 Semantic view querying

**Installation**:
```bash
uvx snowflake-labs-mcp --service-config-file config.yaml
```

**Tags**: snowflake, data-warehouse, analytics, cortex-ai, python

---

### 2. BigQuery ⭐ Featured
**Slug**: `bigquery-mcp`
**Package**: `@ergut/mcp-bigquery-server` (npm)
**Repository**: [ergut/mcp-bigquery-server](https://github.com/ergut/mcp-bigquery-server)

**Description**: Google BigQuery MCP server for natural language queries. Secure, read-only access to datasets with schema inspection.

**Key Features**:
- 🗣️ Natural language to SQL queries
- 📋 Schema inspection and exploration
- 🔒 Read-only operations (1GB limit per query)
- 🔐 Google Cloud authentication
- 📊 Access tables and materialized views

**Installation**:
```bash
npx @smithery/cli install @ergut/mcp-bigquery-server --client claude
```

**Or manual**:
```json
{
  "mcpServers": {
    "bigquery": {
      "command": "npx",
      "args": ["-y", "@ergut/mcp-bigquery-server"]
    }
  }
}
```

**Tags**: bigquery, google-cloud, data-warehouse, analytics

---

### 3. BigQuery (Python Alternative)
**Slug**: `bigquery-python-mcp`
**Package**: `mcp-server-bigquery` (Python/PyPI)
**Repository**: [LucasHild/mcp-server-bigquery](https://github.com/LucasHild/mcp-server-bigquery)

**Description**: Python-based BigQuery MCP server with schema inspection and query execution. Alternative implementation for BigQuery access.

**Key Features**:
- 🔍 Schema inspection (`list-tables`, `describe-table`)
- ⚡ Query execution (`execute-query`)
- 🐍 Python-based implementation
- 🔐 Google Cloud authentication

**Installation**:
```bash
uvx mcp-server-bigquery
```

**Tags**: bigquery, google-cloud, data-warehouse, python

---

### 4. Data Product MCP
**Slug**: `dataproduct-mcp`
**Package**: `dataproduct-mcp` (Python/PyPI)
**Repository**: [entropy-data/dataproduct-mcp](https://github.com/entropy-data/dataproduct-mcp)

**Description**: Data mesh MCP server for discovering data products in Data Mesh Manager. Supports Snowflake, Databricks, and BigQuery.

**Key Features**:
- 🔍 Discover data products
- 🎫 Request access with governance
- 🗄️ Multi-platform support (Snowflake, Databricks, BigQuery)
- 🛡️ Governance and compliance enforcement
- 📊 SQL query execution

**Installation**:
```json
{
  "mcpServers": {
    "dataproduct": {
      "command": "uvx",
      "args": ["dataproduct_mcp"]
    }
  }
}
```

**Tags**: data-mesh, governance, snowflake, databricks, bigquery, python

---

## Updated Registry Statistics

**Total Servers in Seed**: 41 servers
**Database Category Servers**: 8 servers
- Neon Postgres
- Supabase
- ClickHouse
- Neo4j
- **Snowflake** ⭐ NEW
- **BigQuery (npm)** ⭐ NEW
- **BigQuery (Python)** NEW
- **Data Product MCP** NEW

---

## Installation Guide

### Python-based Servers (Snowflake, BigQuery-Python, Data Product)

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source $HOME/.local/bin/env
   ```

2. **Add to Claude Desktop config**:
   ```json
   {
     "mcpServers": {
       "snowflake": {
         "command": "uvx",
         "args": ["snowflake-labs-mcp", "--service-config-file", "config.yaml"]
       },
       "bigquery": {
         "command": "uvx",
         "args": ["mcp-server-bigquery"]
       },
       "dataproduct": {
         "command": "uvx",
         "args": ["dataproduct_mcp"]
       }
     }
   }
   ```

### NPM-based Servers (BigQuery by ergut)

1. **Add to Claude Desktop config**:
   ```json
   {
     "mcpServers": {
       "bigquery": {
         "command": "npx",
         "args": ["-y", "@ergut/mcp-bigquery-server"]
       }
     }
   }
   ```

---

## Use Cases

### Snowflake
- Enterprise data warehousing
- AI-powered analytics (Cortex AI)
- Structured and unstructured data queries
- RAG applications with Cortex Search

### BigQuery
- Google Cloud data analytics
- Natural language to SQL
- Ad-hoc data exploration
- Business intelligence queries

### Data Product MCP
- Data mesh architectures
- Multi-cloud data governance
- Self-service data access
- Compliance and access control

---

## Comparison Matrix

| Server | Platform | Package Type | Natural Language Queries | Governance | Multi-Platform |
|--------|----------|--------------|--------------------------|------------|----------------|
| Snowflake | Snowflake | Python | ✅ (Cortex AI) | ✅ | ❌ |
| BigQuery (npm) | BigQuery | npm | ✅ | ❌ | ❌ |
| BigQuery (Python) | BigQuery | Python | ✅ | ❌ | ❌ |
| Data Product MCP | Multi | Python | ✅ | ✅ | ✅ (Snowflake, Databricks, BigQuery) |

---

## Testing Commands

### Test via OpenConductor CLI (once deployed)

```bash
# Search for data warehouse servers
openconductor discover "data warehouse"

# Get details
openconductor details snowflake-mcp
openconductor details bigquery-mcp

# Install
openconductor install snowflake-mcp
openconductor install bigquery-mcp
```

### Test via Claude Desktop

After configuration, try these queries in Claude:

**Snowflake**:
```
"Show me the top 10 customers by revenue"
"Search for documents about Q4 earnings in Cortex Search"
"Create a table called analytics_events"
```

**BigQuery**:
```
"List all tables in the analytics dataset"
"Describe the schema of the users table"
"What are the top 10 most active users this month?"
```

**Data Product MCP**:
```
"Search for customer data products"
"Show me details about the sales analytics data product"
"Request access to the marketing_campaigns dataset"
```

---

## File Locations

**Seed File**: [packages/api/src/db/seed-new-servers-2025.ts](packages/api/src/db/seed-new-servers-2025.ts#L357-L416)

**Lines Added**: 357-416 (60 lines for 4 servers + section comment)

---

## Next Steps

1. ✅ Servers added to seed data
2. 🔄 Deploy updated seed to database
3. 📝 Update documentation
4. 🧪 Test via API
5. 📢 Announce new servers to community

---

## Community Impact

These additions make OpenConductor the **first MCP registry** to include comprehensive data warehouse and data lake integrations, supporting:

- Enterprise data teams
- Data analysts and scientists
- Business intelligence developers
- Modern data stack users

**Key Differentiator**: Multi-platform support including Snowflake, BigQuery, and data mesh architectures.

---

## Resources

- **Snowflake Blog**: [MCP Servers on Snowflake](https://www.snowflake.com/en/blog/mcp-servers-unify-extend-data-agents/)
- **BigQuery Tutorial**: [BigQuery without SQL](https://seresa.io/blog/harness-bigquery-without-sql-expertise-from-wordpress-event-data-using-mcp-server)
- **Data Product MCP**: [dataproduct-mcp.com](https://dataproduct-mcp.com/)
- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

## Summary

✅ **4 new data warehouse/lake MCP servers** added to OpenConductor registry
✅ **3 Python packages**, **1 npm package**
✅ **2 featured servers** (Snowflake, BigQuery by ergut)
✅ **Multi-platform support** via Data Product MCP
✅ **Enterprise-ready** with governance and authentication

OpenConductor now supports the complete modern data stack! 🚀
