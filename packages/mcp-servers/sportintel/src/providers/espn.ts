/**
 * ESPN API Provider
 * Uses ESPN's public API endpoints for sports data
 */

import fetch from 'node-fetch';
import { cache } from '../cache/simple-cache.js';

const ESPN_BASE_URL = 'http://site.api.espn.com/apis/site/v2/sports';

export interface ESPNGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
  };
  status: {
    type: {
      state: string;
      completed: boolean;
      description: string;
      detail: string;
    };
    period: number;
    clock: number;
    displayClock: string;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo: string;
      };
      score: string;
      homeAway: 'home' | 'away';
      winner?: boolean;
      record: string;
    }>;
    odds?: Array<{
      details: string;
      overUnder: number;
    }>;
  }>;
}

export interface ESPNScoreboard {
  leagues: Array<{
    id: string;
    name: string;
    abbreviation: string;
    season: {
      year: number;
      type: {
        name: string;
      };
    };
  }>;
  events: ESPNGame[];
}

export class ESPNProvider {
  /**
   * Get scoreboard for a specific sport and league
   */
  async getScoreboard(sport: string, league: string): Promise<ESPNScoreboard> {
    const cacheKey = `espn:scoreboard:${sport}:${league}`;
    const cached = cache.get<ESPNScoreboard>(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${ESPN_BASE_URL}/${sport}/${league}/scoreboard`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    const data = await response.json() as ESPNScoreboard;

    // Cache for 2 minutes (live scores change frequently)
    cache.set(cacheKey, data, 120);

    return data;
  }

  /**
   * Get team schedule
   */
  async getTeamSchedule(sport: string, league: string, teamId: string): Promise<any> {
    const cacheKey = `espn:schedule:${sport}:${league}:${teamId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache schedule for 30 minutes
    cache.set(cacheKey, data, 1800);

    return data;
  }

  /**
   * Get standings
   */
  async getStandings(sport: string, league: string): Promise<any> {
    const cacheKey = `espn:standings:${sport}:${league}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${ESPN_BASE_URL}/${sport}/${league}/standings`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache standings for 1 hour
    cache.set(cacheKey, data, 3600);

    return data;
  }

  /**
   * Get team details
   */
  async getTeam(sport: string, league: string, teamId: string): Promise<any> {
    const cacheKey = `espn:team:${sport}:${league}:${teamId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache team info for 24 hours
    cache.set(cacheKey, data, 86400);

    return data;
  }

  /**
   * Search for teams by name
   */
  async searchTeams(sport: string, league: string, query: string): Promise<any[]> {
    // Get all teams and filter locally
    const cacheKey = `espn:teams:${sport}:${league}`;
    let teams = cache.get<any[]>(cacheKey);

    if (!teams) {
      const url = `${ESPN_BASE_URL}/${sport}/${league}/teams`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      teams = data.sports?.[0]?.leagues?.[0]?.teams || [];

      // Cache teams list for 24 hours
      cache.set(cacheKey, teams, 86400);
    }

    // Filter by query
    const lowerQuery = query.toLowerCase();
    return (teams || []).filter((teamWrapper: any) => {
      const team = teamWrapper.team;
      return (
        team.displayName?.toLowerCase().includes(lowerQuery) ||
        team.name?.toLowerCase().includes(lowerQuery) ||
        team.abbreviation?.toLowerCase().includes(lowerQuery)
      );
    });
  }
}
