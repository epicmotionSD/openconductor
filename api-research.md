# Sports Data API Research for SportIntel MVP

## Free and Low-Cost Sports Data APIs

### 1. ESPN API (Free)
- **URL**: `https://site.api.espn.com/apis/site/v2/sports/`
- **Coverage**: NFL, NBA, MLB, NHL
- **Rate Limits**: No official limits documented, but reasonable usage expected
- **Data Available**:
  - Team information
  - Player rosters
  - Game schedules and scores  
  - Basic statistics
- **Cost**: Free
- **Example Endpoint**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

### 2. The Odds API (Paid - $10/month)
- **URL**: `https://api.the-odds-api.com`
- **Coverage**: NFL, NBA, MLB, NHL betting lines
- **Rate Limits**: 500 requests/month on $10 plan
- **Data Available**:
  - Live betting odds
  - Point spreads
  - Over/under totals
  - Moneylines
- **Cost**: $10/month for basic plan
- **Value**: High - betting lines are premium data

### 3. OpenWeatherMap (Free Tier)
- **URL**: `https://api.openweathermap.org`
- **Coverage**: Global weather data
- **Rate Limits**: 1,000 calls/day free
- **Data Available**:
  - Current weather conditions
  - Temperature, wind, precipitation
  - Stadium-specific weather
- **Cost**: Free up to 1k calls/day
- **Use Case**: Outdoor NFL games weather impact

### 4. Ball Don't Lie API (Free)
- **URL**: `https://www.balldontlie.io/api`
- **Coverage**: NBA only
- **Rate Limits**: No official limits
- **Data Available**:
  - Player information
  - Team data
  - Game statistics
  - Season stats
- **Cost**: Free
- **Note**: Good for NBA data when season starts

### 5. NFL API (Unofficial - Free)
- **URL**: Various scraped endpoints
- **Coverage**: NFL schedules, scores, basic stats
- **Rate Limits**: Varies by source
- **Reliability**: Lower (unofficial)
- **Cost**: Free

## Recommended Integration Strategy

### Phase 1: Core Data (Week 1)
1. **ESPN API** for basic NFL player/team data
2. **The Odds API** for betting lines ($10/month)
3. **OpenWeatherMap** for weather data (free)

### Phase 2: Enhanced Data (Week 2)
1. **Ball Don't Lie** for NBA when season starts
2. **Additional free sources** for historical data
3. **Caching layer** to maximize free tier usage

### Total Estimated Monthly Cost: ~$10-15
- The Odds API: $10/month
- OpenWeatherMap: Free (under 1k calls/day)
- ESPN API: Free
- Ball Don't Lie: Free

## Next Steps
1. Set up API keys for paid services
2. Test API endpoints and data quality
3. Implement MCP server integration
4. Build caching layer for cost optimization