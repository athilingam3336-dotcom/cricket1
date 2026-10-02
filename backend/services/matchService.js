/**
 * services/matchService.js
 * Match Setup, Squads, Toss & Lifecycle
 */

const db = require('../config/db');

class MatchService {
  async getMatchSetup(matchId) {
    const [matches] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    const match = matches && matches[0];
    if (!match) throw { status: 404, message: 'Match not found' };

    const [teams] = await db.query('SELECT * FROM teams');
    const teamMap = {};
    (teams || []).forEach(t => { teamMap[t.id] = t; });

    const [players] = await db.query('SELECT * FROM players');
    const teamAPlayers = (players || []).filter(p => p.team_id === match.team_a_id);
    const teamBPlayers = (players || []).filter(p => p.team_id === match.team_b_id);

    return {
      matchId: match.id,
      tournament: 'VPL 2026',
      venue: match.venue_name,
      overs: match.overs,
      teamA: teamMap[match.team_a_id] || { id: match.team_a_id, name: 'Team A' },
      teamB: teamMap[match.team_b_id] || { id: match.team_b_id, name: 'Team B' },
      teamAPlayers,
      teamBPlayers,
      tossWinner: match.toss_winner,
      tossDecision: match.toss_decision,
      status: match.status
    };
  }

  async startMatch(matchId, { tossWinner, tossDecision, teamAPlayingXI, teamBPlayingXI }) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [matches] = await conn.query('SELECT * FROM matches WHERE id = ?', [matchId]);
      const match = matches && matches[0];
      if (!match) throw { status: 404, message: 'Match not found' };

      const winnerTeamId = tossWinner || match.team_a_id;
      const decision = tossDecision || 'BAT';

      // Determine batting & bowling teams for 1st innings
      const battingTeamId = decision === 'BAT' ? winnerTeamId : (winnerTeamId === match.team_a_id ? match.team_b_id : match.team_a_id);
      const bowlingTeamId = battingTeamId === match.team_a_id ? match.team_b_id : match.team_a_id;

      // Update match to LIVE
      await conn.query(
        'UPDATE matches SET status = ?, toss_winner = ?, toss_decision = ?, current_innings = 1, current_over = 0, current_ball = 0 WHERE id = ?',
        ['LIVE', winnerTeamId, decision, matchId]
      );

      // Create Innings 1
      const innId = `INN-${matchId}-1`;
      await conn.query(
        'INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, total_runs, wickets, overs, balls, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [innId, matchId, 1, battingTeamId, bowlingTeamId, 0, 0, 0, 0, 'LIVE']
      );

      // Update Scorer Assignment to ACTIVE
      await conn.query(
        'UPDATE scorer_assignments SET status = ? WHERE match_id = ?',
        ['ACTIVE', matchId]
      );

      await conn.commit();
      return {
        success: true,
        message: 'Match successfully started.',
        matchId,
        inningsId: innId,
        battingTeamId,
        bowlingTeamId
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new MatchService();
