/**
 * services/scoringEngine.js
 * Comprehensive Cricket Scoring Engine & Rules Service
 */

const db = require('../config/db');
const socketService = require('./socketService');

class ScoringEngine {
  /**
   * Generates realistic rule-based cricket commentary
   */
  generateCommentary(strikerName, bowlerName, runsBatter, runsExtras, extraType, wicket, wicketType) {
    if (wicket) {
      switch (wicketType) {
        case 'BOWLED': return `OUT! Clean bowled! ${bowlerName} breaks the stumps, ${strikerName} departs!`;
        case 'CAUGHT': return `OUT! Caught! ${strikerName} hits it in the air and taken cleanly. ${bowlerName} gets the breakthrough!`;
        case 'LBW': return `OUT! Plumb in front! Huge appeal and given OUT LBW! ${strikerName} has to walk.`;
        case 'RUN_OUT': return `OUT! RUN OUT! Direct hit at the stumps, ${strikerName} is well short of the crease!`;
        case 'STUMPED': return `OUT! Stumped! ${strikerName} stepped down the track, missed it completely, and the keeper does the rest!`;
        default: return `OUT! ${strikerName} dismissed (${wicketType || 'Wicket'}).`;
      }
    }

    if (extraType === 'WIDE') {
      const extraRuns = runsExtras > 1 ? ` plus ${runsExtras - 1} additional runs` : '';
      return `Wide ball signaled by the umpire. 1 extra run${extraRuns}.`;
    }
    if (extraType === 'NO_BALL') {
      const batText = runsBatter > 0 ? ` and ${strikerName} scores ${runsBatter} runs` : '';
      return `No ball! Bowler oversteps. 1 extra${batText}. Free hit coming up.`;
    }
    if (extraType === 'BYE') {
      return `${runsExtras} bye${runsExtras > 1 ? 's' : ''} taken as the ball beats both batter and keeper.`;
    }
    if (extraType === 'LEG_BYE') {
      return `${runsExtras} leg bye${runsExtras > 1 ? 's' : ''} signaled by the umpire.`;
    }

    if (runsBatter === 6) {
      return `SIX! What a magnificent shot by ${strikerName}! Lofts it high and handsome over the boundary rope!`;
    }
    if (runsBatter === 4) {
      return `FOUR! Beautifully timed by ${strikerName}! Races away through the gap for a boundary!`;
    }
    if (runsBatter === 3) {
      return `3 runs. Excellent running between the wickets by ${strikerName} and partner.`;
    }
    if (runsBatter === 2) {
      return `2 runs. Placed into the deep, easy double taken.`;
    }
    if (runsBatter === 1) {
      return `1 run. ${strikerName} rotates the strike with a push to the outfield.`;
    }
    return `Dot ball. Good bowling by ${bowlerName}, defended solidly.`;
  }

  /**
   * Records a single delivery inside a transaction
   */
  async recordDelivery(matchId, deliveryData, scorerId) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Fetch Match
      const [matches] = await conn.query('SELECT * FROM matches WHERE id = ?', [matchId]);
      const match = matches && matches[0];
      if (!match) throw { status: 404, message: 'Match not found' };
      if (match.status !== 'LIVE') throw { status: 400, message: 'Match is not currently LIVE' };

      // 2. Fetch Active Innings
      const [inningsRows] = await conn.query(
        'SELECT * FROM innings WHERE match_id = ? AND status = ?',
        [matchId, 'LIVE']
      );
      const innings = inningsRows && inningsRows[0];
      if (!innings) throw { status: 400, message: 'No active LIVE innings found for this match' };

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
        replacementBatterId = null
      } = deliveryData;

      // Determine delivery legality
      // Normal ball, Bye, Leg Bye are legal deliveries. Wide, No Ball, Penalty are illegal deliveries.
      const isLegal = extraType === 'NONE' || extraType === 'BYE' || extraType === 'LEG_BYE';

      // Total runs for this delivery
      const totalRuns = runsBatter + runsExtras;

      // Current over and legal ball tracking
      let overNumber = innings.overs; // 0-indexed completed overs
      let ballNumber = innings.balls; // 0 to 5 legal balls in current over

      if (isLegal) {
        ballNumber += 1;
      }

      // Check boundary type
      let boundaryType = null;
      if (runsBatter === 4) boundaryType = 'FOUR';
      if (runsBatter === 6) boundaryType = 'SIX';

      // Fetch player names for commentary
      const [strikerRows] = await conn.query('SELECT name FROM players WHERE id = ?', [strikerId]);
      const [bowlerRows] = await conn.query('SELECT name FROM players WHERE id = ?', [bowlerId]);
      const strikerName = (strikerRows && strikerRows[0] && strikerRows[0].name) || 'Batter';
      const bowlerName = (bowlerRows && bowlerRows[0] && bowlerRows[0].name) || 'Bowler';

      const commentary = this.generateCommentary(
        strikerName,
        bowlerName,
        runsBatter,
        runsExtras,
        extraType,
        wicket,
        wicketType
      );

      // Insert delivery record
      const deliveryId = 'DEL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      await conn.query(
        `INSERT INTO deliveries (
          id, innings_id, over_number, ball_number, striker_id, non_striker_id, bowler_id,
          runs_batter, runs_extras, total_runs, extra_type, wicket, wicket_type,
          dismissed_player_id, boundary_type, is_legal_delivery, commentary, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deliveryId, innings.id, overNumber + 1, ballNumber, strikerId, nonStrikerId, bowlerId,
          runsBatter, runsExtras, totalRuns, extraType, wicket, wicketType,
          dismissedPlayerId || (wicket ? strikerId : null), boundaryType, isLegal, commentary, scorerId || 'SCR-101'
        ]
      );

      // Update Batter stats
      const [batterRows] = await conn.query(
        'SELECT * FROM innings_batters WHERE innings_id = ? AND player_id = ?',
        [innings.id, strikerId]
      );
      let batter = batterRows && batterRows[0];
      if (!batter) {
        // Initialize batter if first time
        batter = { runs: 0, balls: 0, fours: 0, sixes: 0, strike_rate: 0 };
        await conn.query(
          'INSERT INTO innings_batters (id, innings_id, player_id, batting_position, runs, balls, fours, sixes, strike_rate, is_striker, is_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['IB-' + Date.now(), innings.id, strikerId, 1, 0, 0, 0, 0, 0, true, false]
        );
      }

      // Wide does NOT count as a ball faced by batter. No ball / Legal balls do count.
      const incBatterBall = extraType !== 'WIDE' ? 1 : 0;
      const newBatterRuns = (batter.runs || 0) + runsBatter;
      const newBatterBalls = (batter.balls || 0) + incBatterBall;
      const newFours = (batter.fours || 0) + (runsBatter === 4 ? 1 : 0);
      const newSixes = (batter.sixes || 0) + (runsBatter === 6 ? 1 : 0);
      const newSR = newBatterBalls > 0 ? parseFloat(((newBatterRuns / newBatterBalls) * 100).toFixed(2)) : 0.00;

      let isStrikerOut = batter.is_out;
      let dismissalType = batter.dismissal_type;
      let dismissedBy = batter.dismissed_by;
      let dismissalBall = batter.dismissal_ball;

      if (wicket && (dismissedPlayerId === strikerId || !dismissedPlayerId)) {
        isStrikerOut = true;
        dismissalType = wicketType;
        dismissedBy = bowlerId;
        dismissalBall = `${overNumber}.${ballNumber}`;
      }

      await conn.query(
        `UPDATE innings_batters SET runs = ?, balls = ?, fours = ?, sixes = ?, strike_rate = ?, is_out = ?, dismissal_type = ?, dismissed_by = ?, dismissal_ball = ? WHERE innings_id = ? AND player_id = ?`,
        [newBatterRuns, newBatterBalls, newFours, newSixes, newSR, isStrikerOut, dismissalType, dismissedBy, dismissalBall, innings.id, strikerId]
      );

      // Handle non-striker if run out
      if (wicket && dismissedPlayerId === nonStrikerId) {
        await conn.query(
          `UPDATE innings_batters SET is_out = ?, dismissal_type = ?, dismissed_by = ?, dismissal_ball = ? WHERE innings_id = ? AND player_id = ?`,
          [true, wicketType, bowlerId, `${overNumber}.${ballNumber}`, innings.id, nonStrikerId]
        );
      }

      // Insert incoming replacement batter if provided
      if (wicket && replacementBatterId) {
        const [existingRep] = await conn.query('SELECT * FROM innings_batters WHERE innings_id = ? AND player_id = ?', [innings.id, replacementBatterId]);
        if (!existingRep || existingRep.length === 0) {
          await conn.query(
            'INSERT INTO innings_batters (id, innings_id, player_id, batting_position, runs, balls, fours, sixes, strike_rate, is_striker, is_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['IB-' + Date.now(), innings.id, replacementBatterId, (innings.wickets || 0) + 3, 0, 0, 0, 0, 0, true, false]
          );
        }
      }

      // Update Bowler stats
      const [bowlerRowsStats] = await conn.query(
        'SELECT * FROM innings_bowlers WHERE innings_id = ? AND player_id = ?',
        [innings.id, bowlerId]
      );
      let bowler = bowlerRowsStats && bowlerRowsStats[0];
      if (!bowler) {
        bowler = { overs: 0, balls: 0, maidens: 0, runs_conceded: 0, wickets: 0, no_balls: 0, wides: 0, economy: 0 };
        await conn.query(
          'INSERT INTO innings_bowlers (id, innings_id, player_id, overs, balls, maidens, runs_conceded, wickets, no_balls, wides, economy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          ['IBW-' + Date.now(), innings.id, bowlerId, 0, 0, 0, 0, 0, 0, 0, 0]
        );
      }

      // Byes and Leg Byes do not count against bowler's earned runs
      const bowlerRunsConceded = (extraType === 'BYE' || extraType === 'LEG_BYE') ? 0 : totalRuns;
      const newRunsConceded = (bowler.runs_conceded || 0) + bowlerRunsConceded;
      const newWides = (bowler.wides || 0) + (extraType === 'WIDE' ? 1 : 0);
      const newNoBalls = (bowler.no_balls || 0) + (extraType === 'NO_BALL' ? 1 : 0);
      // Run out does NOT count towards bowler's wickets
      const isBowlerWicket = wicket && wicketType !== 'RUN_OUT' && wicketType !== 'RETIRED_HURT';
      const newBowlerWickets = (bowler.wickets || 0) + (isBowlerWicket ? 1 : 0);

      let newBowlerBalls = (bowler.balls || 0) + (isLegal ? 1 : 0);
      let newBowlerOvers = bowler.overs || 0;
      if (newBowlerBalls >= 6) {
        newBowlerOvers += 1;
        newBowlerBalls = 0;
      }

      const totalBowlerLegalBalls = (newBowlerOvers * 6) + newBowlerBalls;
      const newEconomy = totalBowlerLegalBalls > 0 ? parseFloat(((newRunsConceded / totalBowlerLegalBalls) * 6).toFixed(2)) : 0.00;

      await conn.query(
        `UPDATE innings_bowlers SET overs = ?, balls = ?, runs_conceded = ?, wickets = ?, no_balls = ?, wides = ?, economy = ? WHERE innings_id = ? AND player_id = ?`,
        [newBowlerOvers, newBowlerBalls, newRunsConceded, newBowlerWickets, newNoBalls, newWides, newEconomy, innings.id, bowlerId]
      );

      // Update Innings Totals
      const newTotalRuns = (innings.total_runs || 0) + totalRuns;
      const newWickets = (innings.wickets || 0) + (wicket ? 1 : 0);

      let finalOvers = overNumber;
      let finalBalls = ballNumber;
      let isOverComplete = false;

      if (finalBalls >= 6) {
        finalOvers += 1;
        finalBalls = 0;
        isOverComplete = true;
      }

      // Strike Rotation logic:
      // Swap on odd runs scored off bat or odd byes/leg-byes
      let nextStrikerId = strikerId;
      let nextNonStrikerId = nonStrikerId;

      const runsToRotate = extraType === 'NONE' ? runsBatter : (extraType === 'BYE' || extraType === 'LEG_BYE' ? runsExtras : 0);
      if (runsToRotate % 2 !== 0) {
        // Swap ends
        nextStrikerId = nonStrikerId;
        nextNonStrikerId = strikerId;
      }

      // If wicket fell, incoming replacement batter comes in
      if (wicket) {
        if (replacementBatterId) {
          if (dismissedPlayerId === nonStrikerId) {
            nextNonStrikerId = replacementBatterId;
          } else {
            nextStrikerId = replacementBatterId;
          }
        }
      }

      // End of over strike rotation: swap ends so partner faces the next over
      if (isOverComplete) {
        const temp = nextStrikerId;
        nextStrikerId = nextNonStrikerId;
        nextNonStrikerId = temp;
      }

      // Update Innings
      let inningsStatus = 'LIVE';
      let matchStatus = 'LIVE';
      let winnerTeamId = match.winner_team_id;
      let resultText = match.result_text;

      // Auto-complete innings check:
      // 1. All out (10 wickets)
      // 2. Maximum overs reached (e.g. 20 overs)
      // 3. Target chased down in 2nd innings
      const isAllOut = newWickets >= 10;
      const isOversFinished = finalOvers >= match.overs && finalBalls === 0;

      if (innings.innings_number === 2 && innings.target) {
        if (newTotalRuns >= innings.target) {
          // Chasing team won!
          inningsStatus = 'COMPLETED';
          matchStatus = 'COMPLETED';
          winnerTeamId = innings.batting_team_id;
          const wicketsRemaining = 10 - newWickets;
          resultText = `Won by ${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}`;
        } else if (isAllOut || isOversFinished) {
          // 2nd innings finished without reaching target
          inningsStatus = 'COMPLETED';
          matchStatus = 'COMPLETED';
          const margin = (innings.target - 1) - newTotalRuns;
          if (margin > 0) {
            winnerTeamId = innings.bowling_team_id;
            resultText = `Won by ${margin} run${margin > 1 ? 's' : ''}`;
          } else {
            resultText = 'Match tied';
          }
        }
      } else if (innings.innings_number === 1 && (isAllOut || isOversFinished)) {
        // 1st innings completed
        inningsStatus = 'COMPLETED';
        resultText = `Innings Break (Target: ${newTotalRuns + 1})`;
      }

      await conn.query(
        `UPDATE innings SET total_runs = ?, wickets = ?, overs = ?, balls = ?, status = ? WHERE id = ?`,
        [newTotalRuns, newWickets, finalOvers, finalBalls, inningsStatus, innings.id]
      );

      // Update Match current status and over
      await conn.query(
        `UPDATE matches SET current_over = ?, current_ball = ?, status = ?, winner_team_id = ?, result_text = ? WHERE id = ?`,
        [finalOvers, finalBalls, matchStatus, winnerTeamId, resultText, matchId]
      );

      // Commit transaction
      await conn.commit();

      // Real-time broadcast payload
      const livePayload = {
        matchId,
        inningsId: innings.id,
        inningsNumber: innings.innings_number,
        score: `${newTotalRuns}/${newWickets}`,
        overs: `${finalOvers}.${finalBalls}`,
        totalRuns: newTotalRuns,
        wickets: newWickets,
        isOverComplete,
        isMatchCompleted: matchStatus === 'COMPLETED',
        strikerId: nextStrikerId,
        nonStrikerId: nextNonStrikerId,
        bowlerId,
        resultText,
        lastDelivery: {
          id: deliveryId,
          over: finalOvers + (isOverComplete ? 0 : 1),
          ball: isLegal ? ballNumber : 'WD/NB',
          runsBatter,
          runsExtras,
          extraType,
          wicket,
          commentary
        }
      };

      socketService.broadcastScoreUpdate(matchId, livePayload);

      return {
        success: true,
        data: livePayload
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Undo Last Delivery Transaction-safe
   */
  async undoLastDelivery(matchId) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // Find active innings
      const [inningsRows] = await conn.query('SELECT * FROM innings WHERE match_id = ? AND status = ?', [matchId, 'LIVE']);
      const innings = inningsRows && inningsRows[0];
      if (!innings) throw { status: 400, message: 'No live innings found to undo' };

      // Get last delivery
      const [delRows] = await conn.query('SELECT * FROM deliveries WHERE innings_id = ? ORDER BY id DESC LIMIT 1', [innings.id]);
      const lastDel = delRows && delRows[0];
      if (!lastDel) throw { status: 400, message: 'No deliveries to undo in this innings' };

      // Revert batter
      const [batRows] = await conn.query('SELECT * FROM innings_batters WHERE innings_id = ? AND player_id = ?', [innings.id, lastDel.striker_id]);
      const batter = batRows && batRows[0];
      if (batter) {
        const decBalls = lastDel.extra_type !== 'WIDE' ? 1 : 0;
        const revRuns = Math.max(0, (batter.runs || 0) - lastDel.runs_batter);
        const revBalls = Math.max(0, (batter.balls || 0) - decBalls);
        const revFours = Math.max(0, (batter.fours || 0) - (lastDel.runs_batter === 4 ? 1 : 0));
        const revSixes = Math.max(0, (batter.sixes || 0) - (lastDel.runs_batter === 6 ? 1 : 0));
        const revSR = revBalls > 0 ? parseFloat(((revRuns / revBalls) * 100).toFixed(2)) : 0.00;
        const revOut = lastDel.wicket && lastDel.dismissed_player_id === lastDel.striker_id ? false : batter.is_out;

        await conn.query(
          'UPDATE innings_batters SET runs = ?, balls = ?, fours = ?, sixes = ?, strike_rate = ?, is_out = ? WHERE id = ?',
          [revRuns, revBalls, revFours, revSixes, revSR, revOut, batter.id]
        );
      }

      // Revert bowler
      const [bowlRows] = await conn.query('SELECT * FROM innings_bowlers WHERE innings_id = ? AND player_id = ?', [innings.id, lastDel.bowler_id]);
      const bowler = bowlRows && bowlRows[0];
      if (bowler) {
        const decWides = lastDel.extra_type === 'WIDE' ? 1 : 0;
        const decNb = lastDel.extra_type === 'NO_BALL' ? 1 : 0;
        const decWkts = (lastDel.wicket && lastDel.wicket_type !== 'RUN_OUT') ? 1 : 0;
        const runsToSubtract = (lastDel.extra_type === 'BYE' || lastDel.extra_type === 'LEG_BYE') ? 0 : lastDel.total_runs;
        const revRunsConc = Math.max(0, (bowler.runs_conceded || 0) - runsToSubtract);
        const revWkts = Math.max(0, (bowler.wickets || 0) - decWkts);

        await conn.query(
          'UPDATE innings_bowlers SET runs_conceded = ?, wickets = ?, wides = ?, no_balls = ? WHERE id = ?',
          [revRunsConc, revWkts, Math.max(0, (bowler.wides || 0) - decWides), Math.max(0, (bowler.no_balls || 0) - decNb), bowler.id]
        );
      }

      // Revert Innings
      let revOvers = innings.overs;
      let revBalls = innings.balls;
      if (lastDel.is_legal_delivery) {
        if (revBalls === 0 && revOvers > 0) {
          revOvers -= 1;
          revBalls = 5;
        } else {
          revBalls = Math.max(0, revBalls - 1);
        }
      }

      const revTotalRuns = Math.max(0, (innings.total_runs || 0) - lastDel.total_runs);
      const revWickets = Math.max(0, (innings.wickets || 0) - (lastDel.wicket ? 1 : 0));

      await conn.query(
        'UPDATE innings SET total_runs = ?, wickets = ?, overs = ?, balls = ? WHERE id = ?',
        [revTotalRuns, revWickets, revOvers, revBalls, innings.id]
      );

      // Revert Match
      await conn.query('UPDATE matches SET current_over = ?, current_ball = ? WHERE id = ?', [revOvers, revBalls, matchId]);

      // Delete delivery record
      await conn.query('DELETE FROM deliveries WHERE id = ?', [lastDel.id]);

      await conn.commit();

      const updatePayload = {
        matchId,
        score: `${revTotalRuns}/${revWickets}`,
        overs: `${revOvers}.${revBalls}`,
        action: 'UNDO_DELIVERY',
        strikerId: lastDel.striker_id,
        nonStrikerId: lastDel.non_striker_id,
        bowlerId: lastDel.bowler_id
      };
      socketService.broadcastScoreUpdate(matchId, updatePayload);

      return {
        success: true,
        message: 'Last delivery successfully undone.',
        data: updatePayload
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Completes an over manually or begins next over
   */
  async endOver(matchId, nextBowlerId) {
    const [inningsRows] = await db.query('SELECT * FROM innings WHERE match_id = ? AND status = ?', [matchId, 'LIVE']);
    const innings = inningsRows && inningsRows[0];
    if (!innings) throw { status: 400, message: 'No live innings found' };

    // Update match current over and ball
    await db.query('UPDATE matches SET current_ball = 0 WHERE id = ?', [matchId]);

    const payload = {
      matchId,
      action: 'END_OVER',
      nextBowlerId,
      message: `Over ${innings.overs} completed.`
    };
    socketService.broadcastScoreUpdate(matchId, payload);
    return { success: true, data: payload };
  }

  /**
   * Completes current innings and sets up 2nd innings if applicable
   */
  async endInnings(matchId) {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [matchRows] = await conn.query('SELECT * FROM matches WHERE id = ?', [matchId]);
      const match = matchRows && matchRows[0];
      if (!match) throw { status: 404, message: 'Match not found' };

      const [inningsRows] = await conn.query('SELECT * FROM innings WHERE match_id = ? AND status = ?', [matchId, 'LIVE']);
      const currentInnings = inningsRows && inningsRows[0];
      if (!currentInnings) throw { status: 400, message: 'No live innings found to end' };

      // Mark current innings completed
      await conn.query('UPDATE innings SET status = ? WHERE id = ?', ['COMPLETED', currentInnings.id]);

      if (currentInnings.innings_number === 1) {
        // Prepare 2nd innings
        const target = currentInnings.total_runs + 1;
        const inn2Id = 'INN-' + matchId + '-2';

        // Check if inn 2 already created
        const [existingInn2] = await conn.query('SELECT * FROM innings WHERE id = ?', [inn2Id]);
        if (!existingInn2 || existingInn2.length === 0) {
          await conn.query(
            `INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, total_runs, wickets, overs, balls, target, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [inn2Id, matchId, 2, currentInnings.bowling_team_id, currentInnings.batting_team_id, 0, 0, 0, 0, target, 'LIVE']
          );
        } else {
          await conn.query('UPDATE innings SET status = ?, target = ? WHERE id = ?', ['LIVE', target, inn2Id]);
        }

        await conn.query('UPDATE matches SET current_innings = 2, current_over = 0, current_ball = 0 WHERE id = ?', [matchId]);

        await conn.commit();
        const payload = { matchId, action: 'INNINGS_1_COMPLETED', target, message: `Innings 1 complete. Target: ${target}` };
        socketService.broadcastScoreUpdate(matchId, payload);
        return { success: true, data: payload };
      } else {
        // Innings 2 ended -> Complete match
        await conn.query('UPDATE matches SET status = ? WHERE id = ?', ['COMPLETED', matchId]);
        await conn.commit();
        const payload = { matchId, action: 'MATCH_COMPLETED', message: 'Match successfully completed.' };
        socketService.broadcastScoreUpdate(matchId, payload);
        return { success: true, data: payload };
      }
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new ScoringEngine();
