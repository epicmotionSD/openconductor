/**
 * Standings Tool
 */

import { z } from 'zod';
import { ESPNProvider } from '../providers/espn.js';

export const getStandingsSchema = z.object({
  sport: z.enum(['basketball', 'football', 'baseball', 'hockey', 'soccer']).describe('Sport type'),
  league: z.string().optional().describe('League abbreviation (NBA, NFL, MLB, NHL, MLS)'),
});

const DEFAULT_LEAGUES: Record<string, string> = {
  basketball: 'nba',
  football: 'nfl',
  baseball: 'mlb',
  hockey: 'nhl',
  soccer: 'mls',
};

export async function getStandings(
  args: z.infer<typeof getStandingsSchema>,
  espn: ESPNProvider
) {
  const { sport, league: inputLeague } = args;
  const league = inputLeague || DEFAULT_LEAGUES[sport];

  try {
    const data = await espn.getStandings(sport, league.toLowerCase());

    if (!data.children || data.children.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No standings available for ${league.toUpperCase()} at this time.`,
          },
        ],
      };
    }

    let summary = `📊 **${league.toUpperCase()} Standings**\n\n`;

    // Process each division/conference
    for (const division of data.children) {
      summary += `**${division.name}**\n`;

      if (division.standings && division.standings.entries) {
        const entries = division.standings.entries.slice(0, 10); // Top 10 per division

        entries.forEach((entry: any, index: number) => {
          const team = entry.team;
          const stats = entry.stats;

          // Find wins, losses, win percentage
          const wins = stats.find((s: any) => s.name === 'wins')?.displayValue || '0';
          const losses = stats.find((s: any) => s.name === 'losses')?.displayValue || '0';
          const winPercent = stats.find((s: any) => s.name === 'winPercent')?.displayValue || '.000';
          const gamesBehind = stats.find((s: any) => s.name === 'gamesBehind')?.displayValue || '-';

          summary += `${index + 1}. ${team.displayName}: ${wins}-${losses} (${winPercent})`;

          if (gamesBehind !== '-' && gamesBehind !== '0') {
            summary += ` | GB: ${gamesBehind}`;
          }

          summary += `\n`;
        });

        summary += `\n`;
      }
    }

    summary += `💡 **Tip**: Use \`get_team_schedule\` to see upcoming games for any team.`;

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
          text: `Error fetching standings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
