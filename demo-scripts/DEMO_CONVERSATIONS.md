# Demo Conversation Examples

Complete conversation scripts for both Registry MCP and SportIntel MCP demos. Use these exact queries during recording for consistent results.

---

## Registry MCP Demo Conversations

### Scene 4: Discovery Demo

**USER:**
```
Show me database-related MCP servers
```

**EXPECTED CLAUDE RESPONSE:**
```
I'll search the OpenConductor Registry for database-related MCP servers.

Here are the database MCP servers I found:

1. **postgres**
   - Description: PostgreSQL database integration with query execution
   - Category: Database
   - Installation: `npm install -g @modelcontextprotocol/server-postgres`

2. **sqlite**
   - Description: SQLite database queries and management
   - Category: Database
   - Installation: `npm install -g @modelcontextprotocol/server-sqlite`

3. **mongodb**
   - Description: MongoDB database operations and queries
   - Category: Database
   - Tools: Query execution, collection management, aggregation

4. **supabase**
   - Description: Supabase integration for database and authentication
   - Category: Database, Cloud
   - Installation: `npm install -g supabase-mcp-server`

5. **mysql**
   - Description: MySQL database integration
   - Category: Database
   - Features: Query execution, table management

These servers allow you to interact with various databases directly through Claude. Would you like more details about any specific server?
```

---

### Scene 5: Trending Demo

**USER:**
```
What are the trending MCP servers right now?
```

**EXPECTED CLAUDE RESPONSE:**
```
Let me check the trending MCP servers from the OpenConductor Registry.

🔥 **Top Trending MCP Servers:**

1. **filesystem**
   - Description: File system operations and navigation
   - Why trending: Essential tool for file management
   - Category: System

2. **fetch**
   - Description: Web scraping and HTTP requests
   - Why trending: Enables web data retrieval
   - Category: Web

3. **github**
   - Description: GitHub API integration
   - Why trending: Popular for repo management and code analysis
   - Category: Version Control

4. **brave-search**
   - Description: Web search using Brave Search API
   - Why trending: Privacy-focused search integration
   - Category: Search

5. **postgres**
   - Description: PostgreSQL database integration
   - Why trending: Essential for database operations
   - Category: Database

These servers represent the most widely adopted tools in the MCP ecosystem. Would you like installation instructions for any of these?
```

---

### Scene 6: Details Demo

**USER:**
```
Get me the installation details for the github server
```

**EXPECTED CLAUDE RESPONSE:**
```
Here are the complete installation details for the GitHub MCP server:

**📦 Package: @modelcontextprotocol/server-github**

**Installation:**
```bash
npm install -g @modelcontextprotocol/server-github
```

**Configuration:**
Add to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

**Available Tools:**
- `create_issue` - Create GitHub issues
- `search_repositories` - Search for repositories
- `get_repository` - Get repository details
- `list_commits` - List repository commits
- `create_pull_request` - Create pull requests
- `get_issue` - Get issue details

**Category:** Version Control, Development Tools

**Documentation:** https://github.com/modelcontextprotocol/servers/tree/main/src/github

**Requirements:**
- GitHub personal access token
- Node.js 18+ installed

Would you like help setting up your GitHub token or configuring this server?
```

---

### Alternative Queries (for variations)

#### Query 1: Category Search
**USER:**
```
List all MCP servers in the Web category
```

#### Query 2: Specific Server
**USER:**
```
Tell me about the filesystem MCP server
```

#### Query 3: Development Tools
**USER:**
```
Show me MCP servers for development and debugging
```

#### Query 4: Search Tools
**USER:**
```
What search-related MCP servers are available?
```

---

## SportIntel MCP Demo Conversations

### Scene 4: Live Scores Demo

**USER:**
```
What are today's NBA scores?
```

**EXPECTED CLAUDE RESPONSE (during game day):**
```
🏀 **NBA Scores - December 20, 2024**

**COMPLETED GAMES:**

**Los Angeles Lakers 118, Boston Celtics 112** (FINAL)
- Lakers leaders: LeBron James 28pts, Anthony Davis 22pts, 11reb
- Celtics leaders: Jayson Tatum 31pts, Jaylen Brown 19pts
- Game notes: Lakers extend win streak to 3 games

**Golden State Warriors 105, Phoenix Suns 98** (FINAL)
- Warriors leaders: Stephen Curry 32pts, Klay Thompson 18pts
- Suns leaders: Kevin Durant 27pts, Devin Booker 21pts

**IN PROGRESS:**

**Milwaukee Bucks 87, Miami Heat 82** (Q3, 5:42 remaining)
- Bucks leading by 5
- Giannis Antetokounmpo: 24pts, 9reb so far
- Series: Bucks lead season series 2-1

**UPCOMING:**

**Denver Nuggets @ LA Clippers** - 10:30 PM ET
**Dallas Mavericks @ Sacramento Kings** - 10:00 PM ET

All times Eastern. Data updated live from ESPN.
```

**EXPECTED RESPONSE (no games today):**
```
🏀 **NBA Scores - December 20, 2024**

No NBA games scheduled for today.

**Recent Results (December 19, 2024):**
- Lakers 118, Celtics 112
- Warriors 105, Suns 98
- Bucks 110, Heat 102

**Upcoming Games (December 21, 2024):**
- 76ers @ Knicks - 7:30 PM ET
- Nuggets @ Clippers - 10:00 PM ET

Would you like standings or specific team information?
```

---

### Scene 5: Standings Demo

**USER:**
```
Show me the NBA Eastern Conference standings
```

**EXPECTED CLAUDE RESPONSE:**
```
🏀 **NBA Eastern Conference Standings**

**ATLANTIC DIVISION:**
1. Boston Celtics - 45-12 (.789)
2. Philadelphia 76ers - 38-19 (.667) [7.0 GB]
3. Brooklyn Nets - 32-25 (.561) [13.0 GB]
4. New York Knicks - 30-27 (.526) [15.0 GB]
5. Toronto Raptors - 28-29 (.491) [17.0 GB]

**CENTRAL DIVISION:**
1. Milwaukee Bucks - 43-14 (.754)
2. Cleveland Cavaliers - 35-22 (.614) [8.0 GB]
3. Indiana Pacers - 30-27 (.526) [13.0 GB]
4. Chicago Bulls - 27-30 (.474) [16.0 GB]
5. Detroit Pistons - 15-42 (.263) [28.0 GB]

**SOUTHEAST DIVISION:**
1. Miami Heat - 36-21 (.632)
2. Atlanta Hawks - 29-28 (.509) [7.0 GB]
3. Orlando Magic - 27-30 (.474) [9.0 GB]
4. Charlotte Hornets - 18-39 (.316) [18.0 GB]
5. Washington Wizards - 10-47 (.175) [26.0 GB]

**PLAYOFF PICTURE:**
Current playoff seeds (Top 6 + Play-in 7-10):
1. Celtics
2. Bucks
3. 76ers
4. Heat
5. Cavaliers
6. Nets
7-10: Pacers, Knicks, Hawks, Magic

Last updated: December 20, 2024, 3:45 PM ET
Data provided by ESPN
```

---

### Scene 6: AI Analysis Demo

**USER:**
```
Based on tonight's scores, which teams are trending for playoffs?
```

**EXPECTED CLAUDE RESPONSE:**
```
Based on tonight's NBA results, here's my playoff trending analysis:

🔥 **HEATING UP (Playoff Stock Rising):**

**Los Angeles Lakers** ⬆️⬆️⬆️
- 3-game win streak after tonight's win over Boston
- LeBron averaging 27.5 PPG in this stretch
- Anthony Davis dominant (22pts, 11reb tonight)
- Currently 6th seed, but trending toward top-4
- **Analysis:** If they maintain this form, Lakers could be dangerous in playoffs. Tonight's win over the #1 seed Celtics is a statement.

**Golden State Warriors** ⬆️⬆️
- Won 7 of last 10 games
- Curry in MVP form (32pts tonight)
- Strong road performance (beat Phoenix away)
- Climbing to 5th seed
- **Analysis:** Experience matters in playoffs, and this core knows how to win. If Klay finds consistency, they're a threat.

**Milwaukee Bucks** ⬆️
- Leading Miami in Q3 (currently winning)
- Giannis playing at MVP level
- Home court advantage likely locked (#2 seed)
- **Analysis:** Perennial contenders, healthy Giannis = championship threat.

⚠️ **CONCERNS (Playoff Stock Falling):**

**Phoenix Suns** ⬇️⬇️
- Lost 2 straight, tonight to Warriors
- Dropped to 7th seed (play-in territory)
- Defense struggling (gave up 105 to Warriors)
- **Analysis:** Still dangerous with KD and Booker, but inconsistency is worrying. Could face tough first-round matchup.

**Miami Heat** ⬇️
- Currently losing to Bucks (Q3)
- Lost 4 of last 5 games
- Injury concerns affecting depth
- **Analysis:** Butler-led teams are playoff proven, but current form is concerning.

**Boston Celtics** ⚠️
- Lost to Lakers despite Tatum's 31pts
- Still #1 seed by 7 games (not in danger)
- **Analysis:** One loss doesn't change much, but shows they're not invincible. Lakers exposed some defensive weaknesses.

**📊 KEY TAKEAWAY:**
The Lakers-Celtics result is particularly significant. If playoffs started today, this could be an NBA Finals preview. Lakers showing they can beat elite teams, which is crucial for postseason success.

**DARK HORSE:**
Golden State. Never count out a team with championship experience and Curry in his prime.
```

---

### Scene 7: Multi-Sport Demo

**USER:**
```
What are today's NFL and MLB scores?
```

**EXPECTED CLAUDE RESPONSE (NFL season):**
```
🏈 **NFL Scores - Week 16**

**COMPLETED GAMES:**

**Kansas City Chiefs 27, Las Vegas Raiders 20** (FINAL)
- Chiefs: Mahomes 24/32, 298yds, 2TD
- Raiders: QB struggles continue
- Series: Chiefs sweep Raiders 2-0

**San Francisco 49ers 31, Seattle Seahawks 17** (FINAL)
- 49ers: Purdy 3 TD passes, McCaffrey 120 yards rushing
- Seahawks: Down to 4th in NFC West
- Playoff implications: 49ers clinch division with win

**IN PROGRESS:**

**Buffalo Bills 21, Miami Dolphins 17** (Q3, 8:24)
- Close AFC East battle
- Bills driving in Miami territory

---

⚾ **MLB**

MLB season has ended. World Series completed November 1, 2024.

**Offseason News:**
- Free agency ongoing
- Winter meetings scheduled
- Spring training starts February 2025

Would you like NBA, NHL, or MLS scores instead?
```

---

### Additional Query Examples

#### Query 1: Specific Team
**USER:**
```
Did the Lakers win last night?
```

#### Query 2: Full League
**USER:**
```
Show me all NBA games from yesterday
```

#### Query 3: Western Conference
**USER:**
```
What are the NBA Western Conference standings?
```

#### Query 4: Team Search
**USER:**
```
Find information about the Boston Celtics
```

#### Query 5: Multiple Sports
**USER:**
```
Give me scores for all sports today
```

#### Query 6: Fantasy Analysis
**USER:**
```
Should I start Stephen Curry or Damian Lillard tonight based on their recent performance?
```

---

## Testing Your Setup

### Quick Test Queries

Before recording, test these queries to ensure both servers are working:

#### Registry MCP Health Check
```
Search for github server in the MCP registry
```
✅ Should return github server details

#### SportIntel MCP Health Check
```
What sports data can you access?
```
✅ Should list NBA, NFL, MLB, NHL, MLS

---

## Recording Tips for Natural Conversation

### Do's:
- ✅ Type at normal speed
- ✅ Pause briefly before hitting Enter
- ✅ Let responses fully render
- ✅ Wait 2-3 seconds after response completes
- ✅ Use natural phrasing

### Don'ts:
- ❌ Don't type too fast (looks robotic)
- ❌ Don't interrupt responses mid-render
- ❌ Don't use overly technical queries (keep it accessible)
- ❌ Don't rush between queries

---

## Backup Queries (if primary query fails)

### Registry MCP Backups

If "database servers" returns unexpected results:
- "Show me trending MCP servers"
- "Search for file-related MCP servers"
- "List MCP servers in the Development category"

### SportIntel MCP Backups

If no NBA games today:
- "What were yesterday's NBA scores?"
- "Show me NBA standings"
- "Tell me about the Lakers season"

---

## Voice Script Pairing

When recording voiceover, sync these phrases with the queries:

### Registry Example
**Voice:** "Want database tools? Just ask."
**Screen:** Shows typing "Show me database-related MCP servers"
**Voice continues:** "Registry searches its catalog and presents formatted results with descriptions."
**Screen:** Response appears

### SportIntel Example
**Voice:** "Ask for today's scores and get real-time results."
**Screen:** Shows typing "What are today's NBA scores?"
**Voice continues:** "Completed games, live scores, and upcoming matchups, all formatted perfectly."
**Screen:** Scores appear

---

## Variation Ideas (for different social platforms)

### 15-Second TikTok Version
- Single query only
- Fast-paced
- Focus on "wow" factor

**Registry:**
```
Show me all available MCP servers
```
*Quick pan through massive list*

**SportIntel:**
```
What are today's NBA scores?
```
*Instant score display, emphasize speed*

### 30-Second Instagram Reel
- Two queries
- Visual effects friendly
- Music sync points

**Registry:**
```
1. "Show me trending servers"
2. "Install instructions for github server"
```

**SportIntel:**
```
1. "Today's NBA scores"
2. "Who are the playoff contenders?"
```

---

Ready to record! Use these exact queries during your screen captures for consistent, professional results. 🎬
