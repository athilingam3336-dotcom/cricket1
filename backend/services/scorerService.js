/**
 * services/scorerService.js
 * Scorer Dashboard, Assigned Matches & Scorecard Data Service
 */

const db = require('../config/db');

class ScorerService {
  /**
   * Calculates dashboard summary counts from MySQL
   */
  async getDashboardStats(scorerId = 'SCR-101') {
    // 1. Fetch all match IDs assigned to this scorer
    const [assignments] = await db.query(
      'SELECT match_id, status FROM scorer_assignments WHERE scorer_id = ?',
      [scorerId]
    );

    const matchIds = (assignments || []).map(a => a.match_id);

    let liveCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let assignedCount = matchIds.length;

    const [allMatches] = await db.query('SELECT * FROM matches');
    const assignedMatches = (allMatches || []).filter(m => matchIds.includes(m.id));

    assignedMatches.forEach(m => {
      if (m.status === 'LIVE') liveCount++;
      else if (m.status === 'SCHEDULED') upcomingCount++;
      else if (m.status === 'COMPLETED') completedCount++;
    });

    // Fetch team names to attach to assigned matches
    const [teams] = await db.query('SELECT * FROM teams');
    const teamMap = {};
    (teams || []).forEach(t => { teamMap[t.id] = t; });

    // Format match list
    const formattedMatches = await Promise.all(assignedMatches.map(async (m) => {
      const teamA = teamMap[m.team_a_id] || { name: 'Team A' };
      const teamB = teamMap[m.team_b_id] || { name: 'Team B' };

      // Fetch score if live or completed
      let scoreA = null;
      let scoreB = null;

      const [innRows] = await db.query('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number ASC', [m.id]);
      if (innRows && innRows.length > 0) {
        innRows.forEach(inn => {
          const scoreStr = `${inn.total_runs}/${inn.wickets} (${inn.overs}.${inn.balls} Ov)`;
          if (inn.batting_team_id === m.team_a_id) scoreA = scoreStr;
          else scoreB = scoreStr;
        });
      }

      return {
        id: m.id,
        tournament: 'VPL 2026',
        teamA: teamA.name,
        teamB: teamB.name,
        date: `${m.scheduled_date || '2026-10-15'} ${m.scheduled_time || '10:00 AM'}`,
        venue: m.venue_name || 'Kamarajar Stadium',
        format: 'T20',
        status: m.status === 'LIVE' ? 'Live' : (m.status === 'COMPLETED' ? 'Completed' : 'Upcoming'),
        scoreA,
        scoreB: scoreB || (m.status === 'LIVE' ? 'Yet to bat' : null),
        result: m.result_text
      };
    }));

    return {
      liveMatches: liveCount,
      upcomingMatches: upcomingCount,
      completedMatches: completedCount,
      assignedMatches: assignedCount,
      matches: formattedMatches
    };
  }

  /**
   * Returns live match scoring state
   */
  async getLiveMatchState(matchId) {
    const [matchRows] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    const match = matchRows && matchRows[0];
    if (!match) throw { status: 404, message: 'Match not found' };

    // Fetch Teams
    const [teams] = await db.query('SELECT * FROM teams');
    const teamMap = {};
    (teams || []).forEach(t => { teamMap[t.id] = t; });

    const teamA = teamMap[match.team_a_id] || { id: match.team_a_id, name: 'Team A' };
    const teamB = teamMap[match.team_b_id] || { id: match.team_b_id, name: 'Team B' };

    // Active Innings
    const [innRows] = await db.query('SELECT * FROM innings WHERE match_id = ? AND status = ?', [matchId, 'LIVE']);
    let currentInnings = innRows && innRows[0];

    // Fallback if innings is not yet marked LIVE (e.g. initial setup)
    if (!currentInnings) {
      const [allInns] = await db.query('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number DESC LIMIT 1', [matchId]);
      currentInnings = allInns && allInns[0];
    }

    if (!currentInnings) {
      // Create initial innings 1 if absent
      currentInnings = {
        id: `INN-${matchId}-1`,
        match_id: matchId,
        innings_number: 1,
        batting_team_id: match.toss_decision === 'BAT' ? (match.toss_winner || match.team_a_id) : (match.toss_winner === match.team_a_id ? match.team_b_id : match.team_a_id),
        bowling_team_id: match.toss_decision === 'BAT' ? (match.toss_winner === match.team_a_id ? match.team_b_id : match.team_a_id) : (match.toss_winner || match.team_a_id),
        total_runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        status: 'LIVE'
      };
      await db.query(
        'INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, total_runs, wickets, overs, balls, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [currentInnings.id, matchId, 1, currentInnings.batting_team_id, currentInnings.bowling_team_id, 0, 0, 0, 0, 'LIVE']
      );
    }

    const battingTeam = teamMap[currentInnings.batting_team_id] || teamA;
    const bowlingTeam = teamMap[currentInnings.bowling_team_id] || teamB;

    // Batters in this innings
    const [batters] = await db.query('SELECT * FROM innings_batters WHERE innings_id = ?', [currentInnings.id]);
    const [players] = await db.query('SELECT * FROM players');
    const playerMap = {};
    (players || []).forEach(p => { playerMap[p.id] = p; });

    // Identify current striker & non-striker
    const notOutBatters = (batters || []).filter(b => !b.is_out);
    let striker = notOutBatters.find(b => b.is_striker) || notOutBatters[0];
    let nonStriker = notOutBatters.find(b => b.id !== (striker && striker.id)) || notOutBatters[1];

    // If no batters present yet, pick from batting team squad
    if (!striker) {
      const battingSquad = (players || []).filter(p => p.team_id === currentInnings.batting_team_id);
      striker = {
        player_id: battingSquad[0] ? battingSquad[0].id : 'P301',
        runs: 0, balls: 0, fours: 0, sixes: 0, strike_rate: 0
      };
      nonStriker = {
        player_id: battingSquad[1] ? battingSquad[1].id : 'P302',
        runs: 0, balls: 0, fours: 0, sixes: 0, strike_rate: 0
      };
    }

    // Bowlers in this innings
    const [bowlers] = await db.query('SELECT * FROM innings_bowlers WHERE innings_id = ?', [currentInnings.id]);
    let currentBowler = bowlers && bowlers[0];
    if (!currentBowler) {
      const bowlingSquad = (players || []).filter(p => p.team_id === currentInnings.bowling_team_id && p.role === 'BOWLER');
      currentBowler = {
        player_id: bowlingSquad[0] ? bowlingSquad[0].id : 'P401',
        overs: 0, balls: 0, maidens: 0, runs_conceded: 0, wickets: 0, economy: 0
      };
    }

    // Deliveries
    const [deliveries] = await db.query('SELECT * FROM deliveries WHERE innings_id = ? ORDER BY id DESC LIMIT 12', [currentInnings.id]);

    // Current over deliveries
    const currentOverNumber = currentInnings.overs + 1;
    const overDeliveries = (deliveries || [])
      .filter(d => d.over_number === currentOverNumber || (currentInnings.balls === 0 && d.over_number === currentInnings.overs))
      .reverse();

    // Squads available for selection
    const battingSquad = (players || []).filter(p => p.team_id === currentInnings.batting_team_id);
    const bowlingSquad = (players || []).filter(p => p.team_id === currentInnings.bowling_team_id);

    // Compute Run Rate
    const totalBallsBowled = (currentInnings.overs * 6) + currentInnings.balls;
    const runRate = totalBallsBowled > 0 ? parseFloat(((currentInnings.total_runs / totalBallsBowled) * 6).toFixed(2)) : 0.00;

    return {
      match: {
        id: match.id,
        tournament: 'VPL 2026',
        venue: match.venue_name || 'Kamarajar Stadium',
        overs: match.overs || 20,
        status: match.status,
        result: match.result_text
      },
      innings: {
        id: currentInnings.id,
        inningsNumber: currentInnings.innings_number,
        battingTeam: battingTeam.name,
        bowlingTeam: bowlingTeam.name,
        score: `${currentInnings.total_runs}/${currentInnings.wickets}`,
        totalRuns: currentInnings.total_runs,
        wickets: currentInnings.wickets,
        overs: `${currentInnings.overs}.${currentInnings.balls}`,
        runRate,
        target: currentInnings.target
      },
      striker: {
        id: striker.player_id,
        name: (playerMap[striker.player_id] && playerMap[striker.player_id].name) || 'Striker',
        runs: striker.runs || 0,
        balls: striker.balls || 0,
        fours: striker.fours || 0,
        sixes: striker.sixes || 0,
        strikeRate: striker.strike_rate || 0
      },
      nonStriker: {
        id: nonStriker ? nonStriker.player_id : null,
        name: nonStriker && playerMap[nonStriker.player_id] ? playerMap[nonStriker.player_id].name : 'Non-Striker',
        runs: nonStriker ? nonStriker.runs || 0 : 0,
        balls: nonStriker ? nonStriker.balls || 0 : 0,
        fours: nonStriker ? nonStriker.fours || 0 : 0,
        sixes: nonStriker ? nonStriker.sixes || 0 : 0,
        strikeRate: nonStriker ? nonStriker.strike_rate || 0 : 0
      },
      bowler: {
        id: currentBowler.player_id,
        name: (playerMap[currentBowler.player_id] && playerMap[currentBowler.player_id].name) || 'Bowler',
        overs: `${currentBowler.overs}.${currentBowler.balls}`,
        maidens: currentBowler.maidens || 0,
        runs: currentBowler.runs_conceded || 0,
        wickets: currentBowler.wickets || 0,
        economy: currentBowler.economy || 0
      },
      recentDeliveries: (deliveries || []).slice(0, 6).map(d => ({
        id: d.id,
        ball: `${d.over_number}.${d.ball_number}`,
        runs: d.runs_batter,
        extra: d.extra_type !== 'NONE' ? d.extra_type : null,
        wicket: d.wicket,
        text: d.wicket ? 'W' : (d.extra_type === 'WIDE' ? 'WD' : (d.extra_type === 'NO_BALL' ? 'NB' : d.runs_batter)),
        commentary: d.commentary
      })),
      battingSquad: battingSquad.map(p => ({ id: p.id, name: p.name, role: p.role })),
      bowlingSquad: bowlingSquad.map(p => ({ id: p.id, name: p.name, role: p.role }))
    };
  }

  /**
   * Returns complete scorecard for a match
   */
  async getFullScorecard(matchId) {
    const [matchRows] = await db.query('SELECT * FROM matches WHERE id = ?', [matchId]);
    const match = matchRows && matchRows[0];
    if (!match) throw { status: 404, message: 'Match not found' };

    const [tournRows] = await db.query('SELECT * FROM tournaments WHERE id = ?', [match.tournament_id]);
    const tournament = (tournRows && tournRows[0]) || { name: 'VPL 2026' };

    const [teams] = await db.query('SELECT * FROM teams');
    const teamMap = {};
    (teams || []).forEach(t => { teamMap[t.id] = t; });

    const [players] = await db.query('SELECT * FROM players');
    const playerMap = {};
    (players || []).forEach(p => { playerMap[p.id] = p; });

    const [inningsList] = await db.query('SELECT * FROM innings WHERE match_id = ? ORDER BY innings_number ASC', [matchId]);

    const formattedInnings = await Promise.all((inningsList || []).map(async (inn) => {
      const batTeam = teamMap[inn.batting_team_id] || { name: 'Batting Team' };
      const bowlTeam = teamMap[inn.bowling_team_id] || { name: 'Bowling Team' };

      // Batters from MySQL table innings_batters
      const [batters] = await db.query('SELECT * FROM innings_batters WHERE innings_id = ? ORDER BY batting_position ASC', [inn.id]);
      const battingCard = (batters || []).map(b => {
        let dismissalText = 'not out';
        if (b.is_out) {
          const bowlerName = (playerMap[b.dismissed_by] && playerMap[b.dismissed_by].name) || '';
          if (b.dismissal_type === 'BOWLED') {
            dismissalText = bowlerName ? `b ${bowlerName}` : 'bowled';
          } else if (b.dismissal_type === 'CAUGHT') {
            dismissalText = bowlerName ? `c ${bowlerName}` : 'caught';
          } else if (b.dismissal_type === 'LBW') {
            dismissalText = bowlerName ? `lbw b ${bowlerName}` : 'lbw';
          } else if (b.dismissal_type === 'RUN_OUT') {
            dismissalText = 'run out';
          } else if (b.dismissal_type === 'STUMPED') {
            dismissalText = bowlerName ? `st b ${bowlerName}` : 'stumped';
          } else {
            dismissalText = b.dismissal_type ? b.dismissal_type.toLowerCase() : 'out';
          }
        }
        return {
          id: b.id,
          playerId: b.player_id,
          name: (playerMap[b.player_id] && playerMap[b.player_id].name) || 'Batter',
          runs: b.runs,
          balls: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strikeRate: b.strike_rate,
          isOut: b.is_out,
          dismissal: dismissalText
        };
      });

      // Bowlers from MySQL table innings_bowlers
      const [bowlers] = await db.query('SELECT * FROM innings_bowlers WHERE innings_id = ?', [inn.id]);
      const bowlingCard = (bowlers || []).map(bw => ({
        id: bw.id,
        playerId: bw.player_id,
        name: (playerMap[bw.player_id] && playerMap[bw.player_id].name) || 'Bowler',
        overs: `${bw.overs}.${bw.balls}`,
        maidens: bw.maidens,
        runs: bw.runs_conceded,
        wickets: bw.wickets,
        economy: bw.economy
      }));

      // Calculate extras directly from deliveries table
      const [delRows] = await db.query('SELECT * FROM deliveries WHERE innings_id = ? ORDER BY id ASC', [inn.id]);
      let wides = 0, noBalls = 0, byes = 0, legByes = 0;
      const fallOfWickets = [];
      let runningScore = 0;
      let wicketCount = 0;

      (delRows || []).forEach(d => {
        runningScore += (d.total_runs || 0);
        if (d.extra_type === 'WIDE') wides += d.runs_extras;
        if (d.extra_type === 'NO_BALL') noBalls += d.runs_extras;
        if (d.extra_type === 'BYE') byes += d.runs_extras;
        if (d.extra_type === 'LEG_BYE') legByes += d.runs_extras;
        if (d.wicket) {
          wicketCount += 1;
          const dismissedName = (playerMap[d.dismissed_player_id] && playerMap[d.dismissed_player_id].name) || 'Batter';
          fallOfWickets.push(`${wicketCount}-${runningScore} (${dismissedName}, ${d.over_number}.${d.ball_number} ov)`);
        }
      });
      const totalExtras = wides + noBalls + byes + legByes;

      // Fall of wickets calculation from dismissed batters if delivery rows were aggregated
      if (fallOfWickets.length === 0 && (batters || []).some(b => b.is_out)) {
        let fWkt = 0;
        let cumScore = 0;
        (batters || []).filter(b => b.is_out).forEach((b) => {
          fWkt++;
          cumScore += b.runs;
          const pName = (playerMap[b.player_id] && playerMap[b.player_id].name) || 'Batter';
          fallOfWickets.push(`${fWkt}-${cumScore} (${pName}, ${b.dismissal_ball || 'Ov'})`);
        });
      }

      // Partnerships calculation
      const partnerships = [];
      if (battingCard.length >= 2) {
        partnerships.push({
          wicket: '1st Wicket',
          runs: (battingCard[0]?.runs || 0) + (battingCard[1]?.runs || 0),
          balls: (battingCard[0]?.balls || 0) + (battingCard[1]?.balls || 0),
          batters: `${battingCard[0]?.name} & ${battingCard[1]?.name}`
        });
      }
      if (battingCard.length >= 3) {
        partnerships.push({
          wicket: '2nd Wicket',
          runs: (battingCard[1]?.runs || 0) + (battingCard[2]?.runs || 0),
          balls: (battingCard[1]?.balls || 0) + (battingCard[2]?.balls || 0),
          batters: `${battingCard[1]?.name} & ${battingCard[2]?.name}`
        });
      }

      return {
        id: inn.id,
        inningsNumber: inn.innings_number,
        battingTeam: batTeam.name,
        bowlingTeam: bowlTeam.name,
        score: `${inn.total_runs}/${inn.wickets} (${inn.overs}.${inn.balls} Ov)`,
        totalRuns: inn.total_runs,
        wickets: inn.wickets,
        overs: `${inn.overs}.${inn.balls}`,
        extras: {
          total: totalExtras,
          wide: wides,
          noBall: noBalls,
          bye: byes,
          legBye: legByes,
          breakdown: `wd ${wides}, nb ${noBalls}, b ${byes}, lb ${legByes}`
        },
        batters: battingCard,
        bowlers: bowlingCard,
        fallOfWickets,
        partnerships
      };
    }));

    const matchData = {
      id: match.id,
      tournament: tournament.name || 'VPL 2026',
      teamA: (teamMap[match.team_a_id] && teamMap[match.team_a_id].name) || 'Team A',
      teamB: (teamMap[match.team_b_id] && teamMap[match.team_b_id].name) || 'Team B',
      venue: match.venue_name || 'Kamarajar Stadium, Virudhunagar',
      date: match.scheduled_date || '2026-10-10',
      time: match.scheduled_time || '10:00 AM',
      overs: match.overs || 20,
      status: match.status === 'LIVE' ? 'Live' : (match.status === 'COMPLETED' ? 'Completed' : 'Upcoming'),
      result: match.result_text || 'Match Concluded'
    };

    return {
      matchId: match.id,
      match: matchData,
      tournament: matchData.tournament,
      teamA: matchData.teamA,
      teamB: matchData.teamB,
      venue: matchData.venue,
      date: matchData.date,
      status: matchData.status,
      result: matchData.result,
      innings: formattedInnings
    };
  }
}

module.exports = new ScorerService();
