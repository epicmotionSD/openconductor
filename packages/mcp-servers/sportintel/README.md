# SportIntel MCP Server

AI-powered sports intelligence directly in Claude. Get live scores, standings, team info, and insights for NBA, NFL, MLB, NHL, and MLS.

> Powered by ESPN's public APIs with intelligent caching and AI-friendly data formatting

## Features

- **🏀 Live Scores** - Real-time game scores and status for all major sports
- **📊 Standings** - Current league standings with wins, losses, and rankings
- **🔍 Team Search** - Find teams across all leagues and sports
- **⚡ Smart Caching** - Automatic caching to respect API rate limits
- **🎯 AI-Optimized** - Data formatted perfectly for Claude's analysis

## Supported Sports & Leagues

- **Basketball**: NBA
- **Football**: NFL
- **Baseball**: MLB
- **Hockey**: NHL
- **Soccer**: MLS

## Installation

### Using OpenConductor CLI (Recommended)

```bash
npm install -g @openconductor/cli
openconductor install sportintel
```

### Manual Installation

```bash
npm install -g @openconductor/sportintel
```

Then add to Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sportintel": {
      "command": "node",
      "args": [
        "/usr/local/lib/node_modules/@openconductor/sportintel/dist/index.js"
      ]
    }
  }
}
```

## Available Tools

### `get_live_scores`
Get live scores and game results with real-time updates.

**Parameters:**
- `sport` (required): "basketball", "football", "baseball", "hockey", or "soccer"
- `league` (optional): Specific league (defaults to main league for sport)

**Example:**
```
Show me today's NBA scores
```

**Returns:**
- Game status (live, final, scheduled)
- Team names and records
- Current scores
- Betting lines (when available)

### `get_standings`
Get current league standings organized by division/conference.

**Parameters:**
- `sport` (required): Sport type
- `league` (optional): Specific league

**Example:**
```
What are the current NBA standings?
```

**Returns:**
- Division/conference breakdowns
- Wins, losses, win percentage
- Games behind leader
- Top 10 teams per division

### `search_teams`
Search for teams by name or city.

**Parameters:**
- `query` (required): Team name or city
- `sport` (optional): Filter by sport
- `league` (optional): Filter by league

**Example:**
```
Find the Lakers team information
```

**Returns:**
- Team names and abbreviations
- Location
- Current record
- Team ID for other queries

## Usage Examples

Once installed, ask Claude:

**Live Scores:**
- "What are today's NBA scores?"
- "Show me live NFL games"
- "How did the Lakers do today?"

**Standings:**
- "Show me the NBA Eastern Conference standings"
- "What's the NFL playoff picture?"
- "Who's leading the AL East in baseball?"

**Team Search:**
- "Find the Boston Celtics"
- "Search for NFL teams in California"
- "What teams are called the Rangers?"

**Fantasy & Analysis:**
- "Compare the Lakers and Celtics recent performance"
- "Which teams are on winning streaks?"
- "Analyze the playoff race in the Western Conference"

## Technical Details

### Data Sources
- **ESPN API**: Public endpoints for scores, standings, and team data
- **Caching**: 2-minute cache for live scores, 1-hour for standings
- **No API Keys Required**: Uses public ESPN endpoints

### Caching Strategy
```
Live Scores:   2 minutes  (frequent updates)
Standings:     1 hour     (daily changes)
Team Data:     24 hours   (rarely changes)
```

### Rate Limiting
Built-in caching ensures respectful API usage:
- Automatic deduplication
- Configurable TTLs per data type
- Memory-efficient cache cleanup

## Architecture

```
Claude Desktop
    ↓ (MCP Protocol)
SportIntel MCP Server
    ↓ (HTTP with caching)
ESPN Public APIs
```

### Code Structure
```
src/
├── index.ts              # Main MCP server
├── providers/
│   └── espn.ts          # ESPN API client
├── tools/
│   ├── live-scores.ts   # Live scores tool
│   ├── standings.ts     # Standings tool
│   └── team-search.ts   # Team search tool
└── cache/
    └── simple-cache.ts  # In-memory cache
```

## Development

### Build from source

```bash
git clone https://github.com/epicmotionSD/openconductor.git
cd openconductor/packages/mcp-servers/sportintel
npm install
npm run build
```

### Testing

```bash
# Build the server
npm run build

# Test with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Test ESPN API directly
curl "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
```

## Use Cases

### For Sports Fans
- Check live scores without leaving Claude
- Get instant standings updates
- Find team schedules and results

### For Fantasy Sports Players
- Track player team performance
- Monitor standings and playoff races
- Compare team matchups

### For Bettors (Educational)
- View betting lines and spreads
- Analyze team performance trends
- Track over/under trends

### For AI Analysis
- Statistical analysis of teams
- Trend identification
- Predictive insights based on data

## Roadmap

### v1.1 (Coming Soon)
- [ ] Player statistics and profiles
- [ ] Team schedules and calendars
- [ ] Injury reports
- [ ] Game summaries and highlights

### v1.2 (Future)
- [ ] Advanced analytics and predictions
- [ ] Fantasy points projections
- [ ] Historical data and trends
- [ ] More sports (NCAA, international leagues)

### v2.0 (Vision)
- [ ] Real-time play-by-play
- [ ] Premium data sources (SportRadar partnership)
- [ ] Custom alerts and notifications
- [ ] Freemium tier with advanced features

## API Compatibility

SportIntel uses ESPN's public API endpoints:
- `http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard`
- `http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/standings`
- `http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams`

These are publicly accessible and don't require API keys.

## Limitations

**Current Version:**
- No player-level statistics (team-level only)
- Limited historical data
- Dependent on ESPN API availability
- No real-time play-by-play

**Data Freshness:**
- Live scores: Updated every 2 minutes
- Standings: Updated every hour
- Schedule data: Cached 24 hours

## Contributing

Contributions welcome! Please see the main [OpenConductor repository](https://github.com/epicmotionSD/openconductor) for guidelines.

## Related Projects

- **[OpenConductor Registry MCP](https://www.npmjs.com/package/@openconductor/mcp-registry)** - Discover MCP servers
- **[OpenConductor CLI](https://www.npmjs.com/package/@openconductor/cli)** - Manage MCP servers
- **[OpenConductor Web](https://openconductor.ai)** - Browse the ecosystem

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- **Issues**: [GitHub Issues](https://github.com/epicmotionSD/openconductor/issues)
- **Discord**: [Join our community](https://discord.gg/Ya5TPWeS)
- **Email**: hello@openconductor.ai

## Disclaimer

This tool is for informational and educational purposes. Sports data provided by ESPN. Betting information (when shown) is for educational purposes only. Please gamble responsibly.

---

Built for the [Anthropic Model Context Protocol Challenge](https://www.anthropic.com/mcp)

Made with ❤️ by the OpenConductor team
