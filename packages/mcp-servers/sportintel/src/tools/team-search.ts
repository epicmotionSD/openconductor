/**
 * Team Search Tool
 */

import { z } from 'zod';
import { ESPNProvider } from '../providers/espn.js';

export const searchTeamsSchema = z.object({
  query: z.string().describe('Team name or city to search for (e.g., "Lakers", "Boston", "Cowboys")'),
  sport: z.enum(['basketball', 'football', 'baseball', 'hockey', 'soccer']).optional().describe('Filter by sport type'),
  league: z.string().optional().describe('Filter by league (NBA, NFL, MLB, NHL, MLS)'),
});

const DEFAULT_LEAGUES: Record<string, string> = {
  basketball: 'nba',
  football: 'nfl',
  baseball: 'mlb',
  hockey: 'nhl',
  soccer: 'mls',
};

export async function searchTeams(
  args: z.infer<typeof searchTeamsSchema>,
  espn: ESPNProvider
) {
  const { query, sport, league: inputLeague } = args;

  // If sport is specified, search that sport/league
  if (sport) {
    const league = inputLeague || DEFAULT_LEAGUES[sport];

    try {
      const results = await espn.searchTeams(sport, league.toLowerCase(), query);

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No teams found matching "${query}" in ${league.toUpperCase()}.`,
            },
          ],
        };
      }

      let summary = `🔍 **Found ${results.length} team(s) matching "${query}"** in ${league.toUpperCase()}\n\n`;

      results.forEach((teamWrapper: any) => {
        const team = teamWrapper.team;
        summary += `**${team.displayName}**\n`;
        summary += `- Abbreviation: ${team.abbreviation}\n`;
        summary += `- Location: ${team.location}\n`;
        if (team.record) {
          summary += `- Record: ${team.record}\n`;
        }
        summary += `- Team ID: ${team.id}\n`;
        summary += `\n`;
      });

      summary += `💡 **Next steps**: Use \`get_team_schedule\` with the team name to see their upcoming games.`;

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching teams: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  // If no sport specified, suggest searching with sport filter
  return {
    content: [
      {
        type: 'text',
        text: `Please specify a sport to search for teams. Example:\n\n` +
             `- Basketball: \`search_teams\` with sport="basketball"\n` +
             `- Football: \`search_teams\` with sport="football"\n` +
             `- Baseball: \`search_teams\` with sport="baseball"\n` +
             `- Hockey: \`search_teams\` with sport="hockey"\n` +
             `- Soccer: \`search_teams\` with sport="soccer"`,
      },
    ],
  };
}
