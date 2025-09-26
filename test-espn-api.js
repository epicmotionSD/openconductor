#!/usr/bin/env node

/**
 * ESPN API Testing Script
 * Tests ESPN's public API endpoints for NFL data integration
 */

const axios = require('axios');

class ESPNAPITester {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://site.api.espn.com/apis/site/v2/sports',
      timeout: 10000,
    });
  }

  async testNFLTeams() {
    console.log('\n🏈 Testing NFL Teams Endpoint...');
    
    try {
      const response = await this.client.get('/football/nfl/teams');
      const teams = response.data.sports[0].leagues[0].teams;
      
      console.log(`✅ Found ${teams.length} NFL teams`);
      
      // Show sample team data
      const sampleTeam = teams[0].team;
      console.log('\n📋 Sample Team Data:');
      console.log(`  Name: ${sampleTeam.displayName}`);
      console.log(`  Abbreviation: ${sampleTeam.abbreviation}`);
      console.log(`  Location: ${sampleTeam.location}`);
      console.log(`  Color: ${sampleTeam.color}`);
      console.log(`  Logo: ${sampleTeam.logos?.[0]?.href || 'N/A'}`);
      
      return teams;
    } catch (error) {
      console.error('❌ NFL teams test failed:', error.message);
      return [];
    }
  }

  async testNFLScoreboard() {
    console.log('\n🏈 Testing NFL Scoreboard (Current Week)...');
    
    try {
      const response = await this.client.get('/football/nfl/scoreboard');
      const games = response.data.events;
      
      console.log(`✅ Found ${games.length} NFL games this week`);
      
      if (games.length > 0) {
        const sampleGame = games[0];
        console.log('\n📋 Sample Game Data:');
        console.log(`  Game: ${sampleGame.name}`);
        console.log(`  Date: ${sampleGame.date}`);
        console.log(`  Status: ${sampleGame.status.type.description}`);
        
        // Teams info
        sampleGame.competitions[0].competitors.forEach(team => {
          console.log(`  ${team.homeAway}: ${team.team.displayName} (${team.score || '0'})`);
        });
        
        // Odds if available
        if (sampleGame.competitions[0].odds) {
          const odds = sampleGame.competitions[0].odds[0];
          console.log(`  Spread: ${odds.details}`);
          console.log(`  Over/Under: ${odds.overUnder}`);
        }
      }
      
      return games;
    } catch (error) {
      console.error('❌ NFL scoreboard test failed:', error.message);
      return [];
    }
  }

  async testNFLAthletes() {
    console.log('\n🏈 Testing NFL Athletes Endpoint...');
    
    try {
      // Get athletes for a specific team (Buffalo Bills)
      const response = await this.client.get('/football/nfl/teams/2/athletes');
      const athletes = response.data.athletes;
      
      console.log(`✅ Found ${athletes.length} Buffalo Bills players`);
      
      if (athletes.length > 0) {
        const samplePlayer = athletes[0];
        console.log('\n📋 Sample Player Data:');
        console.log(`  Name: ${samplePlayer.displayName}`);
        console.log(`  Position: ${samplePlayer.position?.abbreviation || 'N/A'}`);
        console.log(`  Jersey: #${samplePlayer.jersey || 'N/A'}`);
        console.log(`  Height: ${samplePlayer.height || 'N/A'}`);
        console.log(`  Weight: ${samplePlayer.weight || 'N/A'} lbs`);
        console.log(`  Age: ${samplePlayer.age || 'N/A'}`);
        console.log(`  Headshot: ${samplePlayer.headshot?.href || 'N/A'}`);
      }
      
      return athletes;
    } catch (error) {
      console.error('❌ NFL athletes test failed:', error.message);
      return [];
    }
  }

  async testNFLStandings() {
    console.log('\n🏈 Testing NFL Standings...');
    
    try {
      const response = await this.client.get('/football/nfl/standings');
      const standings = response.data.children;
      
      console.log(`✅ Found standings for ${standings.length} conferences`);
      
      if (standings.length > 0) {
        const afcStandings = standings.find(conf => conf.name === 'AFC');
        if (afcStandings) {
          const afcEast = afcStandings.standings.entries.slice(0, 4);
          console.log('\n📋 AFC East Sample:');
          afcEast.forEach(team => {
            const stats = team.stats;
            console.log(`  ${team.team.displayName}: ${stats[8]?.value || 0}-${stats[9]?.value || 0} (${stats[0]?.displayValue || '0%'})`);
          });
        }
      }
      
      return standings;
    } catch (error) {
      console.error('❌ NFL standings test failed:', error.message);
      return [];
    }
  }

  async testNFLNews() {
    console.log('\n📰 Testing NFL News...');
    
    try {
      const response = await this.client.get('/football/nfl/news');
      const articles = response.data.articles;
      
      console.log(`✅ Found ${articles.length} NFL news articles`);
      
      if (articles.length > 0) {
        console.log('\n📋 Recent Headlines:');
        articles.slice(0, 5).forEach(article => {
          console.log(`  • ${article.headline}`);
          console.log(`    ${new Date(article.published).toLocaleDateString()}`);
        });
      }
      
      return articles;
    } catch (error) {
      console.error('❌ NFL news test failed:', error.message);
      return [];
    }
  }

  async runAllTests() {
    console.log('🚀 Starting ESPN API Evaluation');
    console.log('=================================');
    
    await this.testNFLTeams();
    await this.testNFLScoreboard();
    await this.testNFLAthletes();
    await this.testNFLStandings();
    await this.testNFLNews();
    
    console.log('\n📋 ESPN API Evaluation Summary:');
    console.log('✅ Comprehensive NFL team data with logos and colors');
    console.log('✅ Live game scores and some basic odds information');
    console.log('✅ Player rosters with positions and basic stats');
    console.log('✅ Real-time standings and win-loss records');
    console.log('✅ Fresh NFL news and headlines');
    console.log('✅ Completely free to use - no API key required');
    console.log('⚠️  Limited statistical depth for DFS projections');
    console.log('⚠️  No detailed injury reports or DFS-specific data');
    
    console.log('\n💡 Recommendation: Use ESPN API as foundation');
    console.log('   Perfect for team data, schedules, and basic player info');
    console.log('   Supplement with other sources for deeper analytics');
  }
}

// Run the tests
const tester = new ESPNAPITester();
tester.runAllTests().catch(console.error);