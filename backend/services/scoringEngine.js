/**
 * services/scoringEngine.js
 * Comprehensive Cricket Scoring Engine & Rules Service
 * Pure MongoDB Implementation using Mongoose Models
 */

const db = require('../config/db');
const socketService = require('./socketService');

let deliverySequence = 10000;

class ScoringEngine {
  /**
   * Generates realistic rule-based cricket commentary
   */
  generateCommentary(strikerName, bowlerName, runsBatter, runsExtras, extraType, wicket, wicketType, fieldingPosition, fielderName) {
    const posText = fieldingPosition ? ` towards ${fieldingPosition}` : '';
    const fielderText = fielderName ? ` (${fielderName})` : '';

    if (wicket) {
      switch (wicketType) {
        case 'BOWLED': return `OUT! Clean bowled! ${bowlerName} rattles the timber! ${strikerName} has to walk.`;
        case 'CAUGHT': return `OUT! Caught! ${strikerName} slices it in the air${posText} and taken cleanly by ${fielderName || 'the fielder'}! Breakthrough for ${bowlerName}!`;
        case 'LBW': return `OUT! Plumb in front! Huge appeal and the umpire raises the finger. LBW given! ${strikerName} departs.`;
        case 'RUN_OUT': return `OUT! RUN OUT! Direct hit${posText}${fielderText}! ${strikerName} is caught well short of the crease!`;
        case 'STUMPED': return `OUT! Stumped! ${strikerName} dances down the track, beaten in the flight by ${bowlerName}, keeper whips off the bails!`;
        default: return `OUT! ${strikerName} dismissed (${wicketType || 'Wicket'}).`;
      }
    }

    if (extraType === 'WIDE') {
      const extraRuns = runsExtras > 1 ? ` plus ${runsExtras - 1} extra runs` : '';
      return `Wide ball signaled by the umpire. 1 extra run${extraRuns}.`;
    }
    if (extraType === 'NO_BALL') {
      const batText = runsBatter > 0 ? ` and ${strikerName} scores ${runsBatter} runs` : '';
      return `No ball! Bowler oversteps. 1 extra${batText}. Free hit coming up.`;
    }
    if (extraType === 'BYE') {
      return `${runsExtras} bye${runsExtras > 1 ? 's' : ''} signaled as the ball beats batter and wicketkeeper.`;
    }
    if (extraType === 'LEG_BYE') {
      return `${runsExtras} leg bye${runsExtras > 1 ? 's' : ''} taken after deflecting off the pads${posText}.`;
    }

    if (runsBatter === 6) {
      return `SIX! Magnificent stroke by ${strikerName}! Clean connection over the boundary${posText}!`;
    }
    if (runsBatter === 4) {
      return `FOUR! Beautifully timed drive by ${strikerName}! Pierces the infield${posText} and races away to the fence!`;
    }
    if (runsBatter === 3) {
      return `3 runs. Excellent placement${posText} and great running between the wickets.`;
    }
    if (runsBatter === 2) {
      return `2 runs. Worked into the gap${posText}, easy double taken.`;
    }
    if (runsBatter === 1) {
      return `1 run. ${strikerName} rotates the strike with a push${posText}.`;
    }
    return `Dot ball. Good bowling by ${bowlerName}, solid defense${posText}.`;
  }

  /**
   * Records a single delivery in MongoDB (Ball-by-Ball)
   */
  async recordDelivery(matchId, deliveryData, scorerId) {
    await db.initDb();

    // 1. Fetch Match
    const match = await db.models.Match.findOne({ id: matchId });
    if (!match) throw { status: 404, message: `Match '${matchId}' not found.` };
    
    // Status check (Requirement 7)
    if (match.status === 'SCHEDULED') {
      throw { status: 400, message: 'Match is SCHEDULED. Please perform toss and start match before recording deliveries.' };
    }
    if (match.status === 'COMPLETED') {
      throw { status: 400, message: 'Match is already COMPLETED. Live scoring is disabled.' };
    }
    if (match.status === 'ABANDONED') {
      throw { status: 400, message: 'Match has been ABANDONED. Scoring is disabled.' };
    }

    // 2. Fetch Active Innings
    let innings = await db.models.Innings.findOne({ match_id: matchId, is_completed: false }).sort({ innings_number: -1 });
    if (!innings) {
      innings = await db.models.Innings.findOne({ match_id: matchId }).sort({ innings_number: -1 });
    }
    if (!innings) {
      throw { status: 400, message: 'No active innings found for this match. Please start the match first.' };
    }

    // Input extraction
    const {
      strikerId,
      nonStrikerId,
      bowlerId,
      runsBatter = 0,
      runsExtras = 0,
      extraType = 'NONE',
      wicket = false,
      wicketType = null,
      dismissedPlayerId = null,
      shotType = null,
      fieldingPosition = null,
      fielderId = null,
      fielderName = null
    } = deliveryData;

    // Delivery legality: Wide & No Ball are illegal deliveries
    const isLegal = extraType === 'NONE' || extraType === 'BYE' || extraType === 'LEG_BYE';
    const totalRuns = Number(runsBatter) + Number(runsExtras);

    let overNumber = innings.overs;
    let ballNumber = innings.balls;

    if (isLegal) {
      ballNumber += 1;
      if (ballNumber === 6) {
        overNumber += 1;
        ballNumber = 0;
      }
    }

    let boundaryType = null;
    if (runsBatter === 4) boundaryType = 'FOUR';
    if (runsBatter === 6) boundaryType = 'SIX';

    // Player Names for Commentary
    const players = await db.models.Player.find({}).lean();
    const playerMap = {};
    (players || []).forEach(p => { playerMap[p.id] = p; });

    const strikerName = (strikerId && playerMap[strikerId]?.name) || 'Batter';
    const bowlerName = (bowlerId && playerMap[bowlerId]?.name) || 'Bowler';
    const actualFielderName = fielderName || (fielderId && playerMap[fielderId]?.name) || null;

    const commentary = this.generateCommentary(
      strikerName,
      bowlerName,
      Number(runsBatter),
      Number(runsExtras),
      extraType,
      Boolean(wicket),
      wicketType,
      fieldingPosition,
      actualFielderName
    );

    // 3. Create Delivery Document in MongoDB
    const deliveryId = 'DEL-' + Date.now() + '-' + String(++deliverySequence).padStart(6, '0');
    const deliveryDoc = await db.models.Delivery.create({
      id: deliveryId,
      match_id: matchId,
      innings_id: innings.id,
      innings_number: innings.innings_number,
      over_number: isLegal && ballNumber === 0 ? overNumber : overNumber + 1,
      ball_number: isLegal ? (ballNumber === 0 ? 6 : ballNumber) : ballNumber,
      striker_id: strikerId || 'P301',
      non_striker_id: nonStrikerId || 'P302',
      bowler_id: bowlerId || 'P403',
      runs_batter: Number(runsBatter),
      runs_extras: Number(runsExtras),
      total_runs: totalRuns,
      extra_type: extraType,
      wicket: Boolean(wicket),
      wicket_type: wicketType,
      dismissed_player_id: dismissedPlayerId || (wicket ? strikerId : null),
      boundary_type: boundaryType,
      is_legal_delivery: isLegal,
      shot_type: shotType,
      fielding_position: fieldingPosition,
      fielder_id: fielderId,
      fielder_name: actualFielderName,
      commentary,
      created_by: scorerId || 'SCR-101',
      timestamp: new Date()
    });

    // 4. Update Innings Document in MongoDB
    innings.total_runs += totalRuns;
    if (wicket) innings.wickets += 1;
    innings.overs = overNumber;
    innings.balls = ballNumber;

    if (!innings.extras) {
      innings.extras = { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, total: 0 };
    }
    if (extraType === 'WIDE') innings.extras.wides += Number(runsExtras);
    if (extraType === 'NO_BALL') innings.extras.no_balls += Number(runsExtras);
    if (extraType === 'BYE') innings.extras.byes += Number(runsExtras);
    if (extraType === 'LEG_BYE') innings.extras.leg_byes += Number(runsExtras);
    innings.extras.total += Number(runsExtras);

    await innings.save();

    // 5. Update or Create Batter record in MongoDB
    const activeStrikerId = strikerId || 'P301';
    let batter = await db.models.InningsBatter.findOne({ innings_id: innings.id, player_id: activeStrikerId });
    if (!batter) {
      batter = new db.models.InningsBatter({
        id: `BAT-${innings.id}-${activeStrikerId}`,
        innings_id: innings.id,
        player_id: activeStrikerId,
        batting_position: (await db.models.InningsBatter.countDocuments({ innings_id: innings.id })) + 1,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        is_out: false
      });
    }

    if (extraType === 'NONE' || extraType === 'NO_BALL') {
      batter.runs += Number(runsBatter);
      if (runsBatter === 4) batter.fours += 1;
      if (runsBatter === 6) batter.sixes += 1;
    }
    if (isLegal || extraType === 'NO_BALL') {
      batter.balls += 1;
    }
    batter.strike_rate = batter.balls > 0 ? parseFloat(((batter.runs / batter.balls) * 100).toFixed(2)) : 0.00;

    if (wicket && (!dismissedPlayerId || dismissedPlayerId === activeStrikerId)) {
      batter.is_out = true;
      batter.dismissal_type = wicketType || 'CAUGHT';
      batter.bowler_id = bowlerId;
      batter.fielder_id = fielderId;
    }
    await batter.save();

    // Ensure non-striker record also exists in InningsBatter
    const activeNonStrikerId = nonStrikerId || 'P302';
    if (activeNonStrikerId && activeNonStrikerId !== activeStrikerId) {
      let nonStrikerBatter = await db.models.InningsBatter.findOne({ innings_id: innings.id, player_id: activeNonStrikerId });
      if (!nonStrikerBatter) {
        nonStrikerBatter = new db.models.InningsBatter({
          id: `BAT-${innings.id}-${activeNonStrikerId}`,
          innings_id: innings.id,
          player_id: activeNonStrikerId,
          batting_position: (await db.models.InningsBatter.countDocuments({ innings_id: innings.id })) + 1,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          is_out: false
        });
        await nonStrikerBatter.save();
      }
    }

    // 6. Update or Create Bowler record in MongoDB
    const activeBowlerId = bowlerId || 'P403';
    let bowler = await db.models.InningsBowler.findOne({ innings_id: innings.id, player_id: activeBowlerId });
    if (!bowler) {
      bowler = new db.models.InningsBowler({
        id: `BWL-${innings.id}-${activeBowlerId}`,
        innings_id: innings.id,
        player_id: activeBowlerId,
        overs: 0,
        balls: 0,
        maidens: 0,
        runs_conceded: 0,
        wickets: 0,
        wides: 0,
        no_balls: 0
      });
    }

    if (isLegal) {
      bowler.balls += 1;
      if (bowler.balls === 6) {
        bowler.overs += 1;
        bowler.balls = 0;
      }
    }
    // Runs conceded by bowler includes bat runs + wides/no-balls (byes and leg byes don't count against bowler)
    const bowlerRuns = Number(runsBatter) + (extraType === 'WIDE' || extraType === 'NO_BALL' ? Number(runsExtras) : 0);
    bowler.runs_conceded += bowlerRuns;
    if (wicket && wicketType !== 'RUN_OUT') {
      bowler.wickets += 1;
    }
    if (extraType === 'WIDE') bowler.wides += Number(runsExtras);
    if (extraType === 'NO_BALL') bowler.no_balls += Number(runsExtras);

    const totalBowlerOvers = bowler.overs + (bowler.balls / 6);
    bowler.economy = totalBowlerOvers > 0 ? parseFloat((bowler.runs_conceded / totalBowlerOvers).toFixed(2)) : 0.00;
    await bowler.save();

    // 7. Check match completion / target chasing
    if (innings.innings_number === 2 && innings.target && innings.total_runs >= innings.target) {
      // Chasing team won!
      match.status = 'COMPLETED';
      const winnerTeam = await db.models.Team.findOne({ id: innings.batting_team_id }).lean();
      const wicketsRemaining = 10 - innings.wickets;
      match.result_summary = `${winnerTeam?.name || 'Chasing Team'} won by ${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}`;
      innings.is_completed = true;
      await match.save();
      await innings.save();
    } else if (innings.wickets >= 10 || (match.overs_per_side && overNumber >= match.overs_per_side)) {
      if (innings.innings_number === 1) {
        // 1st innings break
        innings.is_completed = true;
        match.status = 'INNINGS_BREAK';
        await innings.save();
        await match.save();
      } else {
        // 2nd innings complete
        innings.is_completed = true;
        match.status = 'COMPLETED';
        const inn1 = await db.models.Innings.findOne({ match_id: matchId, innings_number: 1 }).lean();
        const runsDiff = (inn1?.total_runs || 0) - innings.total_runs;
        if (runsDiff > 0) {
          const winnerTeam = await db.models.Team.findOne({ id: inn1.batting_team_id }).lean();
          match.result_summary = `${winnerTeam?.name || 'Defending Team'} won by ${runsDiff} runs`;
        } else if (runsDiff === 0) {
          match.result_summary = 'Match Tied';
        }
        await innings.save();
        await match.save();
      }
    }

    // 8. Real-time Socket.IO Broadcast
    try {
      socketService.emitScoreUpdate(matchId, {
        matchId,
        score: `${innings.total_runs}/${innings.wickets}`,
        overs: `${innings.overs}.${innings.balls}`,
        lastDelivery: {
          ball: `${overNumber}.${ballNumber}`,
          runs: Number(runsBatter),
          commentary
        }
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Delivery recorded successfully in MongoDB.',
      deliveryId,
      score: `${innings.total_runs}/${innings.wickets}`,
      overs: `${innings.overs}.${innings.balls}`,
      commentary,
      matchStatus: match.status
    };
  }

  /**
   * Undo Last Delivery
   */
  async undoLastDelivery(matchId) {
    await db.initDb();

    // 1. Find the latest delivery
    const lastDelivery = await db.models.Delivery.findOne({ match_id: matchId }).sort({ created_at: -1 });
    if (!lastDelivery) {
      throw { status: 400, message: 'No deliveries recorded yet to undo.' };
    }

    const innings = await db.models.Innings.findOne({ id: lastDelivery.innings_id });
    if (innings) {
      innings.total_runs = Math.max(0, innings.total_runs - lastDelivery.total_runs);
      if (lastDelivery.wicket) {
        innings.wickets = Math.max(0, innings.wickets - 1);
      }

      if (lastDelivery.is_legal_delivery) {
        if (innings.balls === 0) {
          innings.overs = Math.max(0, innings.overs - 1);
          innings.balls = 5;
        } else {
          innings.balls = Math.max(0, innings.balls - 1);
        }
      }

      if (lastDelivery.extra_type === 'WIDE' && innings.extras) {
        innings.extras.wides = Math.max(0, innings.extras.wides - lastDelivery.runs_extras);
        innings.extras.total = Math.max(0, innings.extras.total - lastDelivery.runs_extras);
      }
      if (lastDelivery.extra_type === 'NO_BALL' && innings.extras) {
        innings.extras.no_balls = Math.max(0, innings.extras.no_balls - lastDelivery.runs_extras);
        innings.extras.total = Math.max(0, innings.extras.total - lastDelivery.runs_extras);
      }
      await innings.save();
    }

    // Revert Batter
    const batter = await db.models.InningsBatter.findOne({ innings_id: lastDelivery.innings_id, player_id: lastDelivery.striker_id });
    if (batter) {
      if (lastDelivery.extra_type === 'NONE' || lastDelivery.extra_type === 'NO_BALL') {
        batter.runs = Math.max(0, batter.runs - lastDelivery.runs_batter);
        if (lastDelivery.runs_batter === 4) batter.fours = Math.max(0, batter.fours - 1);
        if (lastDelivery.runs_batter === 6) batter.sixes = Math.max(0, batter.sixes - 1);
      }
      if (lastDelivery.is_legal_delivery || lastDelivery.extra_type === 'NO_BALL') {
        batter.balls = Math.max(0, batter.balls - 1);
      }
      if (lastDelivery.wicket && lastDelivery.dismissed_player_id === batter.player_id) {
        batter.is_out = false;
        batter.dismissal_type = null;
      }
      batter.strike_rate = batter.balls > 0 ? parseFloat(((batter.runs / batter.balls) * 100).toFixed(2)) : 0.00;
      await batter.save();
    }

    // Revert Bowler
    const bowler = await db.models.InningsBowler.findOne({ innings_id: lastDelivery.innings_id, player_id: lastDelivery.bowler_id });
    if (bowler) {
      if (lastDelivery.is_legal_delivery) {
        if (bowler.balls === 0) {
          bowler.overs = Math.max(0, bowler.overs - 1);
          bowler.balls = 5;
        } else {
          bowler.balls = Math.max(0, bowler.balls - 1);
        }
      }
      const bowlerRuns = lastDelivery.runs_batter + (lastDelivery.extra_type === 'WIDE' || lastDelivery.extra_type === 'NO_BALL' ? lastDelivery.runs_extras : 0);
      bowler.runs_conceded = Math.max(0, bowler.runs_conceded - bowlerRuns);
      if (lastDelivery.wicket && lastDelivery.wicket_type !== 'RUN_OUT') {
        bowler.wickets = Math.max(0, bowler.wickets - 1);
      }
      await bowler.save();
    }

    // Delete the delivery
    await db.models.Delivery.deleteOne({ id: lastDelivery.id });

    // Emit Socket Update
    try {
      socketService.emitScoreUpdate(matchId, {
        matchId,
        score: `${innings ? innings.total_runs : 0}/${innings ? innings.wickets : 0}`,
        overs: `${innings ? innings.overs : 0}.${innings ? innings.balls : 0}`,
        undoneDeliveryId: lastDelivery.id
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Last delivery successfully undone.',
      undoneDeliveryId: lastDelivery.id,
      score: `${innings ? innings.total_runs : 0}/${innings ? innings.wickets : 0}`,
      overs: `${innings ? innings.overs : 0}.${innings ? innings.balls : 0}`
    };
  }

  /**
   * End Over
   */
  async endOver(matchId, nextBowlerId) {
    await db.initDb();
    const innings = await db.models.Innings.findOne({ match_id: matchId, is_completed: false });
    return {
      success: true,
      message: 'Over completed.',
      nextBowlerId,
      currentOvers: innings ? `${innings.overs}.${innings.balls}` : '0.0'
    };
  }

  /**
   * End Innings
   */
  async endInnings(matchId) {
    await db.initDb();
    const match = await db.models.Match.findOne({ id: matchId });
    if (!match) throw { status: 404, message: 'Match not found' };

    const currentInnings = await db.models.Innings.findOne({ match_id: matchId, is_completed: false }).sort({ innings_number: -1 });
    if (!currentInnings) throw { status: 400, message: 'No active innings to end.' };

    currentInnings.is_completed = true;
    await currentInnings.save();

    if (currentInnings.innings_number === 1) {
      // Prepare 2nd Innings
      const target = currentInnings.total_runs + 1;
      const inn2Id = `INN-${matchId}-2`;
      await db.models.Innings.create({
        id: inn2Id,
        match_id: matchId,
        innings_number: 2,
        batting_team_id: currentInnings.bowling_team_id,
        bowling_team_id: currentInnings.batting_team_id,
        total_runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        target,
        is_completed: false,
        extras: { wides: 0, no_balls: 0, byes: 0, leg_byes: 0, total: 0 }
      });

      match.current_innings_number = 2;
      match.status = 'INNINGS_BREAK';
      await match.save();

      return {
        success: true,
        message: '1st Innings ended. 2nd Innings target set.',
        target,
        matchStatus: 'INNINGS_BREAK'
      };
    } else {
      // 2nd innings ended -> Conclude Match
      match.status = 'COMPLETED';
      const inn1 = await db.models.Innings.findOne({ match_id: matchId, innings_number: 1 }).lean();
      const diff = (inn1?.total_runs || 0) - currentInnings.total_runs;
      if (diff > 0) {
        const team1 = await db.models.Team.findOne({ id: inn1.batting_team_id }).lean();
        match.result_summary = `${team1?.name || 'Team 1'} won by ${diff} runs`;
      } else if (diff < 0) {
        const team2 = await db.models.Team.findOne({ id: currentInnings.batting_team_id }).lean();
        match.result_summary = `${team2?.name || 'Team 2'} won by ${10 - currentInnings.wickets} wickets`;
      } else {
        match.result_summary = 'Match Tied';
      }
      await match.save();

      return {
        success: true,
        message: 'Match concluded.',
        result: match.result_summary,
        matchStatus: 'COMPLETED'
      };
    }
  }

  /**
   * Update Match Status (Requirement 7)
   * Scheduled, Live, Innings Break, Completed, Abandoned
   */
  async updateMatchStatus(matchId, status) {
    await db.initDb();
    const normalized = String(status).toUpperCase();
    const validStatuses = ['SCHEDULED', 'LIVE', 'INNINGS_BREAK', 'COMPLETED', 'ABANDONED'];
    if (!validStatuses.includes(normalized)) {
      throw { status: 400, message: `Invalid match status. Must be one of: ${validStatuses.join(', ')}` };
    }

    const match = await db.models.Match.findOne({ id: matchId });
    if (!match) throw { status: 404, message: 'Match not found.' };

    match.status = normalized;
    await match.save();

    return {
      success: true,
      message: `Match status updated to ${normalized}`,
      matchId,
      status: normalized
    };
  }

  /**
   * Conclude / End Match manually
   */
  async endMatch(matchId, payload = {}) {
    await db.initDb();
    const match = await db.models.Match.findOne({ id: matchId });
    if (!match) throw { status: 404, message: 'Match not found.' };

    match.status = 'COMPLETED';
    if (payload.result) match.result_summary = payload.result;
    if (payload.playerOfMatch) match.player_of_match = payload.playerOfMatch;
    await match.save();

    return {
      success: true,
      message: 'Match officially ended.',
      matchId,
      status: 'COMPLETED',
      result: match.result_summary
    };
  }
}

module.exports = new ScoringEngine();
