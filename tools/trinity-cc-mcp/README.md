# Trinity Command Center MCP Server

Three-namespace MCP server that gives Claude direct read/write access to the OpenConductor Command Center intel store.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Claude Desktop                  │
│         (stdio MCP transport)                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│          Trinity MCP Server                  │
│                                              │
│  Oracle (3)  │ Sentinel (3) │ Sage (5)       │
│  read-only   │ monitoring   │ write/synth    │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────▼─────────┐
     │   content.json     │  ← shared atomic store
     └─────────▲─────────┘
               │
     ┌─────────┴─────────┐
     │  Command Center    │  (HTTP :3333)
     │  Dashboard UI      │
     └───────────────────┘
```

Both Trinity and the Command Center dashboard read/write the same `content.json` file using atomic save (tmp + rename).

## Tools (11 total)

### Oracle — Read-only Intelligence

| Tool | Description |
|------|-------------|
| `oracle_query_intel` | Search and filter items by keyword, type, status, sentiment, tag, priority, source, date range |
| `oracle_get_launch_status` | Full dashboard snapshot: stats, P1 urgent items, unread count, recent activity |
| `oracle_analyze_sentiment` | Sentiment breakdown with percentages and top negative items |

### Sentinel — Monitoring & Anomaly Detection

| Tool | Description |
|------|-------------|
| `sentinel_scan_anomalies` | Detect negative spikes, P1 clusters, stale unread items, metric gaps |
| `sentinel_unread_urgent` | List unread items at P1/P2 priority needing immediate action |
| `sentinel_metric_trend` | Trend analysis on metric-snapshot items grouped by tag |

### Sage — Write Operations & Synthesis

| Tool | Description |
|------|-------------|
| `sage_add_content` | Add a new intel item (any type) |
| `sage_update_content` | Update status, sentiment, priority, notes, tags, body on an existing item |
| `sage_log_metric` | Quick-add a metric-snapshot with tags |
| `sage_summarize_thread` | Retrieve a thread by parentId or tag for summarization |
| `sage_synthesize_feed` | Generate a structured briefing from recent intel |

## Setup

```bash
cd tools/trinity-cc-mcp
npm install
npm run build
```

## Claude Desktop Configuration

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "trinity-cc": {
      "command": "node",
      "args": ["C:/Users/shawn/apps/openconductor/tools/trinity-cc-mcp/dist/index.js"],
      "env": {
        "TRINITY_DATA_DIR": "C:/Users/shawn/apps/openconductor/tools/command-center/data"
      }
    }
  }
}
```

## REST Bridge

The `content-api.js` module can be mounted into the Command Center HTTP server to expose Trinity's store via `/api/trinity/*` routes:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/trinity/stats` | GET | Store stats |
| `/api/trinity/query` | GET | Query with search params |
| `/api/trinity/items` | GET | List all items |
| `/api/trinity/items` | POST | Add item |
| `/api/trinity/items/:id` | GET | Get item |
| `/api/trinity/items/:id` | PUT | Update item |
| `/api/trinity/items/:id` | DELETE | Archive item |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `TRINITY_DATA_DIR` | `../../command-center/data` (relative to `dist/`) | Path to the directory containing `content.json` |

## Development

```bash
npm run dev    # tsc --watch
npm run build  # one-shot compile
npm start      # run the MCP server (stdio)
```
