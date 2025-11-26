/**
 * Live Scores Tool
 */

import { z } from 'zod';
import { ESPNProvider } from '../providers/espn.js';

export const getLiveScoresSchema = z.object({
  sport: z.enum(['basketball', 'football', 'baseball', 'hockey', 'soccer']).describe('Sport type'),
  league: z.string().optional().describe('League abbreviation (NBA, NFL, MLB, NHL, MLS). Defaults to main league for sport'),
});

const DEFAULT_LEAGUES: Record<string, string> = {
  basketball: 'nba',
  football: 'nfl',
  baseball: 'mlb',
  hockey: 'nhl',
  soccer: 'mls',
};

export async function getLiveScores(
  args: z.infer<typeof getLiveScoresSchema>,
  espn: ESPNProvider
) {
  const { sport, league: inputLeague } = args;
  const league = inputLeague || DEFAULT_LEAGUES[sport];

  try {
    const scoreboard = await espn.getScoreboard(sport, league.toLowerCase());

    if (!scoreboard.events || scoreboard.events.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No games scheduled today for ${league.toUpperCase()}. Check back later for upcoming games!`,
          },
        ],
      };
    }

    const leagueInfo = scoreboard.leagues[0];
    const season = leagueInfo?.season;

    let summary = `📊 **${league.toUpperCase()} ${season?.type?.name || 'Games'}**\n`;
    summary += `Season: ${season?.year || 'Current'}\n\n`;

    const games = scoreboard.events.map((game, index) => {
      const competition = game.competitions[0];
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

      if (!homeTeam || !awayTeam) {
        return null;
      }

      const status = game.status.type;
      const isLive = status.state === 'in';
      const isCompleted = status.completed;

      let gameStatus = '';
      if (isLive) {
        gameStatus = `🔴 LIVE - ${status.detail}`;
      } else if (isCompleted) {
        gameStatus = `✅ FINAL`;
      } else {
        gameStatus = `📅 ${status.detail}`;
      }

      let gameInfo = `**${index + 1}. ${game.shortName}**\n`;
      gameInfo += `${gameStatus}\n\n`;

      gameInfo += `${awayTeam.team.displayName} (${awayTeam.record})\n`;
      gameInfo += `**Score: ${awayTeam.score}**\n`;
      if (awayTeam.winner) gameInfo += `👑 Winner\n`;
      gameInfo += `\n`;

      gameInfo += `${homeTeam.team.displayName} (${homeTeam.record})\n`;
      gameInfo += `**Score: ${homeTeam.score}**\n`;
      if (homeTeam.winner) gameInfo += `👑 Winner\n`;

      // Add betting odds if available
      if (competition.odds && competition.odds.length > 0) {
        const odds = competition.odds[0];
        gameInfo += `\n📈 O/U: ${odds.overUnder}`;
        if (odds.details) {
          gameInfo += ` | ${odds.details}`;
        }
      }

      return gameInfo;
    }).filter(Boolean);

    summary += games.join('\n\n---\n\n');

    summary += `\n\n💡 **Tip**: Use \`get_team_schedule\` to see upcoming games for a specific team.`;

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
          text: `Error fetching live scores: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
