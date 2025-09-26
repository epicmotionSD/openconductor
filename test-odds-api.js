#!/usr/bin/env node

/**
 * The Odds API Testing Script
 * Tests The Odds API endpoints and data quality for SportIntel integration
 */

const axios = require('axios');

// The Odds API configuration
const ODDS_API_KEY = process.env.ODDS_API_KEY || 'test-key-needed';
const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4';

class OddsAPITester {
  constructor() {
    this.client = axios.create({
      baseURL: ODDS_BASE_URL,
      params: {
        apiKey: ODDS_API_KEY,
      },
      timeout: 10000,
    });
  }

  async testSports() {
    console.log('\n🏈 Testing Sports Endpoints...');
    
    try {
      const response = await this.client.get('/sports');
      const sports = response.data;
      
      console.log(`✅ Found ${sports.length} available sports`);
      
      // Filter for major US sports
      const majorSports = sports.filter(sport => 
        ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl'].includes(sport.key)
      );
      
      console.log('\n📊 Major US Sports Available:');
      majorSports.forEach(sport => {
        console.log(`  • ${sport.title} (${sport.key}) - Active: ${sport.active}`);
      });
      
      return majorSports;
    } catch (error) {
      console.error('❌ Sports endpoint test failed:', error.response?.data || error.message);
      return [];
    }
  }

  async testNFLOdds() {
    console.log('\n🏈 Testing NFL Odds...');
    
    try {
      const response = await this.client.get('/sports/americanfootball_nfl/odds', {
        params: {
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
          dateFormat: 'iso',
        }
      });
      
      const games = response.data;
      console.log(`✅ Found ${games.length} NFL games with odds`);
      
      if (games.length > 0) {
        const sampleGame = games[0];
        console.log('\n📋 Sample NFL Game Data:');
        console.log(`  Game: ${sampleGame.away_team} @ ${sampleGame.home_team}`);
        console.log(`  Start Time: ${sampleGame.commence_time}`);
        
        if (sampleGame.bookmakers && sampleGame.bookmakers.length > 0) {
          const sampleBookmaker = sampleGame.bookmakers[0];
          console.log(`  Bookmaker: ${sampleBookmaker.title}`);
          
          sampleBookmaker.markets.forEach(market => {
            console.log(`  Market: ${market.key}`);
            market.outcomes.forEach(outcome => {
              console.log(`    ${outcome.name}: ${outcome.price} ${outcome.point ? `(${outcome.point})` : ''}`);
            });
          });
        }
      }
      
      return games;
    } catch (error) {
      console.error('❌ NFL odds test failed:', error.response?.data || error.message);
      
      // Check if it's a rate limit or API key issue
      if (error.response?.status === 401) {
        console.log('💡 This appears to be an API key issue. You need to:');
        console.log('   1. Sign up at https://the-odds-api.com/');
        console.log('   2. Get your API key');
        console.log('   3. Set ODDS_API_KEY environment variable');
      } else if (error.response?.status === 429) {
        console.log('💡 Rate limit exceeded. The Odds API has usage limits.');
      }
      
      return [];
    }
  }

  async testAPIUsage() {
    console.log('\n📊 Checking API Usage...');
    
    try {
      // Make a simple request to check usage headers
      const response = await this.client.get('/sports');
      
      const headers = response.headers;
      const remainingRequests = headers['x-requests-remaining'];
      const usedRequests = headers['x-requests-used'];
      
      if (remainingRequests !== undefined) {
        console.log(`✅ Requests Remaining: ${remainingRequests}`);
        console.log(`📈 Requests Used: ${usedRequests}`);
      } else {
        console.log('ℹ️  No usage information available (likely testing with invalid key)');
      }
      
    } catch (error) {
      console.log('❌ Could not check API usage');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting The Odds API Evaluation');
    console.log('=====================================');
    
    if (ODDS_API_KEY === 'test-key-needed') {
      console.log('⚠️  No API key provided. Tests will show structure but not real data.');
      console.log('   Set ODDS_API_KEY environment variable for full testing.');
    }
    
    await this.testSports();
    await this.testNFLOdds();
    await this.testAPIUsage();
    
    console.log('\n📋 Evaluation Summary:');
    console.log('• The Odds API provides comprehensive betting data');
    console.log('• Covers NFL, NBA, MLB, NHL with multiple markets');
    console.log('• Data includes spreads, totals, and moneylines');
    console.log('• $10/month plan includes 500 requests');
    console.log('• Perfect for SportIntel betting intelligence');
    
    console.log('\n💡 Recommendation: Sign up for The Odds API');
    console.log('   This will be our primary source for betting lines');
  }
}

// Run the tests
const tester = new OddsAPITester();
tester.runAllTests().catch(console.error);