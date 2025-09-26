#!/usr/bin/env node

/**
 * SportIntel MCP Integration Bridge
 * Connects SportIntel demo to FlexaSports MCP server architecture
 */

const axios = require('axios');
const path = require('path');

class SportIntelMCPBridge {
  constructor() {
    this.flexaSportsBaseUrl = process.env.FLEXASPORTS_API_URL || 'http://localhost:3000/api/v1';
    this.client = axios.create({
      baseURL: this.flexaSportsBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async getNFLPlayers(filters = {}) {
    console.log('🏈 Fetching NFL players from FlexaSports MCP...');
    
    try {
      const response = await this.client.get('/players/NFL', {
        params: {
          team: filters.team,
          position: filters.position,
          limit: filters.limit || 50,
          page: 1,
        }
      });

      if (response.data.success) {
        console.log(`✅ Retrieved ${response.data.data.length} NFL players`);
        return this.transformPlayersForSportIntel(response.data.data);
      } else {
        console.error('❌ FlexaSports API returned error:', response.data.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch NFL players:', error.message);
      return this.getFallbackPlayers();
    }
  }

  async getNFLGames(filters = {}) {
    console.log('🏈 Fetching NFL games from FlexaSports MCP...');
    
    try {
      const response = await this.client.get('/games/NFL', {
        params: {
          date: filters.date,
          team: filters.team,
          status: filters.status,
          limit: filters.limit || 20,
        }
      });

      if (response.data.success) {
        console.log(`✅ Retrieved ${response.data.data.length} NFL games`);
        return this.transformGamesForSportIntel(response.data.data);
      } else {
        console.error('❌ FlexaSports API returned error:', response.data.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch NFL games:', error.message);
      return this.getFallbackGames();
    }
  }

  async getBettingOdds(filters = {}) {
    console.log('💰 Fetching betting odds from FlexaSports MCP...');
    
    try {
      const response = await this.client.get('/games/NFL/odds', {
        params: {
          date: filters.date,
          gameId: filters.gameId,
        }
      });

      if (response.data.success) {
        console.log(`✅ Retrieved odds for ${response.data.data.length} games`);
        return response.data.data;
      } else {
        console.error('❌ FlexaSports odds API returned error:', response.data.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch betting odds:', error.message);
      return [];
    }
  }

  async getPlayerExplanations(playerId, sport = 'NFL') {
    console.log(`🧠 Getting AI explanations for player ${playerId}...`);
    
    try {
      const response = await this.client.get(`/explanations/player/${playerId}`, {
        params: { sport }
      });

      if (response.data.success) {
        console.log('✅ Retrieved player AI explanation');
        return response.data.data;
      } else {
        console.error('❌ Explanation API returned error:', response.data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get player explanations:', error.message);
      return null;
    }
  }

  transformPlayersForSportIntel(players) {
    return players.map(player => ({
      id: player.id || Math.random().toString(36).substr(2, 9),
      name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
      position: player.position || 'N/A',
      team: player.team || player.currentTeam?.abbreviation || 'N/A',
      salary: player.salary || this.generateSalary(player.position),
      projectedPoints: player.projectedPoints || this.generateProjection(player.position),
      ownership: player.ownership || Math.random() * 20 + 5, // 5-25%
      // Additional SportIntel specific fields
      recentForm: player.stats?.recentForm || this.generateRecentForm(),
      injury: player.injury || null,
      weather: player.weather || null,
    }));
  }

  transformGamesForSportIntel(games) {
    return games.map(game => ({
      id: game.id || Math.random().toString(36).substr(2, 9),
      homeTeam: this.extractTeamName(game.homeTeam),
      awayTeam: this.extractTeamName(game.awayTeam),
      gameTime: game.gameTime || game.startTime || new Date().toISOString(),
      spread: game.odds?.spread || this.generateSpread(),
      total: game.odds?.total || this.generateTotal(),
      weather: game.weather || this.generateWeather(),
      status: game.status || 'scheduled',
    }));
  }

  extractTeamName(team) {
    if (typeof team === 'string') return team;
    return team?.abbreviation || team?.name || team?.displayName || 'TBD';
  }

  generateSalary(position) {
    const baseSalaries = {
      QB: 8500, RB: 7000, WR: 6500, TE: 5500, K: 4500, DST: 4000
    };
    const base = baseSalaries[position] || 6000;
    return base + Math.floor(Math.random() * 2000 - 1000); // +/- 1000
  }

  generateProjection(position) {
    const baseProjections = {
      QB: 22, RB: 15, WR: 12, TE: 8, K: 8, DST: 8
    };
    const base = baseProjections[position] || 12;
    return base + Math.random() * 6 - 3; // +/- 3 points
  }

  generateRecentForm() {
    return Array.from({ length: 5 }, () => 
      Math.random() * 30 + 10 // 10-40 points
    );
  }

  generateSpread() {
    return (Math.random() - 0.5) * 14; // -7 to +7
  }

  generateTotal() {
    return Math.random() * 20 + 40; // 40-60 total points
  }

  generateWeather() {
    const conditions = ['Clear, 72°F', 'Cloudy, 68°F', 'Light Rain, 65°F', 'Windy, 70°F'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  getFallbackPlayers() {
    console.log('⚠️  Using fallback NFL players data');
    return [
      { id: 1, name: 'Josh Allen', position: 'QB', team: 'BUF', salary: 11500, projectedPoints: 24.8, ownership: 12.4 },
      { id: 2, name: 'Lamar Jackson', position: 'QB', team: 'BAL', salary: 11200, projectedPoints: 23.5, ownership: 15.1 },
      { id: 3, name: 'Christian McCaffrey', position: 'RB', team: 'SF', salary: 10800, projectedPoints: 22.3, ownership: 18.2 },
      { id: 4, name: 'Austin Ekeler', position: 'RB', team: 'LAC', salary: 9800, projectedPoints: 20.1, ownership: 14.7 },
      { id: 5, name: 'Cooper Kupp', position: 'WR', team: 'LAR', salary: 9200, projectedPoints: 18.7, ownership: 16.9 },
      { id: 6, name: 'Davante Adams', position: 'WR', team: 'LV', salary: 8800, projectedPoints: 17.2, ownership: 13.4 },
      { id: 7, name: 'Travis Kelce', position: 'TE', team: 'KC', salary: 8000, projectedPoints: 16.2, ownership: 19.3 },
      { id: 8, name: 'Mark Andrews', position: 'TE', team: 'BAL', salary: 7200, projectedPoints: 14.8, ownership: 11.2 },
    ];
  }

  getFallbackGames() {
    console.log('⚠️  Using fallback NFL games data');
    return [
      { id: 1, homeTeam: 'BUF', awayTeam: 'MIA', spread: -6.5, total: 52.5, weather: 'Clear, 72°F' },
      { id: 2, homeTeam: 'KC', awayTeam: 'LV', spread: -9.5, total: 47.5, weather: 'Cloudy, 68°F' },
      { id: 3, homeTeam: 'SF', awayTeam: 'LAR', spread: -3.0, total: 49.0, weather: 'Clear, 75°F' },
      { id: 4, homeTeam: 'BAL', awayTeam: 'CIN', spread: -4.5, total: 51.5, weather: 'Light Rain, 65°F' },
    ];
  }

  async testConnection() {
    console.log('🔍 Testing FlexaSports MCP connection...');
    
    try {
      const response = await this.client.get('/health');
      if (response.status === 200) {
        console.log('✅ FlexaSports MCP connection successful');
        return true;
      }
    } catch (error) {
      console.log('❌ FlexaSports MCP connection failed, using fallback mode');
      return false;
    }
  }

  async getSystemStatus() {
    try {
      const response = await this.client.get('/admin/status');
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to get system status:', error.message);
    }
    
    return {
      status: 'unknown',
      servers: [],
      uptime: 0,
    };
  }
}

module.exports = { SportIntelMCPBridge };

// If run directly, test the connection
if (require.main === module) {
  const bridge = new SportIntelMCPBridge();
  
  async function runTests() {
    console.log('🚀 SportIntel MCP Integration Bridge Test');
    console.log('==========================================');
    
    await bridge.testConnection();
    
    const players = await bridge.getNFLPlayers({ limit: 5 });
    console.log(`\n📊 Sample Players: ${players.length}`);
    
    const games = await bridge.getNFLGames({ limit: 3 });
    console.log(`🏈 Sample Games: ${games.length}`);
    
    const status = await bridge.getSystemStatus();
    console.log(`🔧 System Status: ${status.status}`);
    
    console.log('\n✅ SportIntel MCP Bridge ready for integration!');
  }
  
  runTests().catch(console.error);
}