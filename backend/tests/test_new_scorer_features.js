const assert = require('assert');
const db = require('../config/db');
const scoringEngine = require('../services/scoringEngine');
const scorerService = require('../services/scorerService');

async function testFeatures() {
  await db.initDb();
  console.log('🧪 Running Comprehensive Live Scoring Verification Test...');

  const matchId = 'M002';
  // Ensure match is LIVE with overs remaining
  await db.models.Match.updateOne({ id: matchId }, { status: 'LIVE', overs_per_side: 50 });
  await db.models.Innings.updateOne({ match_id: matchId, innings_number: 1 }, { is_completed: false, overs: 10, balls: 0, wickets: 2 });

  // Get live match state
  const liveState = await scorerService.getLiveMatchState(matchId);
  assert(liveState, 'liveState must be returned');
  assert(liveState.battingSquad.length >= 2, 'battingSquad must have players');
  assert(liveState.bowlingSquad.length >= 2, 'bowlingSquad must have players');
  console.log('✅ Bowling Squad count:', liveState.bowlingSquad.length, 'Sample:', liveState.bowlingSquad.slice(0, 3).map(b => b.name));

  const currentBowler = liveState.bowler;
  const striker = liveState.striker;
  const nonStriker = liveState.nonStriker;
  const fielder = liveState.bowlingSquad.find(p => p.id !== currentBowler.id) || liveState.bowlingSquad[0];
  const nextBatter = liveState.battingSquad.find(p => p.id !== striker.id && p.id !== nonStriker.id);

  // 1. Test Custom Runs: 5 Runs off Bat
  console.log('--- Test 1: Record 5 Runs off Bat ---');
  const res5 = await scoringEngine.recordDelivery(matchId, {
    strikerId: striker.id,
    nonStrikerId: nonStriker.id,
    bowlerId: currentBowler.id,
    runsBatter: 5,
    runsExtras: 0,
    extraType: 'NONE'
  }, 'SCR-101');
  assert(res5.success, '5 runs delivery must succeed');
  console.log('✅ 5 runs off bat recorded. Score:', res5.score);

  // 2. Test Wicket: CAUGHT with Fielder
  console.log('--- Test 2: Record Wicket (CAUGHT with Fielder) ---');
  const resCaught = await scoringEngine.recordDelivery(matchId, {
    strikerId: res5.strikerId,
    nonStrikerId: res5.nonStrikerId,
    bowlerId: currentBowler.id,
    runsBatter: 0,
    runsExtras: 0,
    extraType: 'NONE',
    wicket: true,
    wicketType: 'CAUGHT',
    dismissedPlayerId: res5.strikerId,
    fielderId: fielder.id,
    fielderName: fielder.name,
    replacementBatterId: nextBatter?.id
  }, 'SCR-101');
  assert(resCaught.success, 'Caught delivery must succeed');
  console.log('✅ Caught wicket recorded:', resCaught.commentary);

  // Check InningsBatter for dismissal_text
  const outBatter = await db.models.InningsBatter.findOne({ player_id: res5.strikerId, innings_id: liveState.innings.id }).lean();
  console.log('✅ Out Batter Dismissal Text in DB:', outBatter.dismissal_text);
  assert(outBatter.dismissal_text.includes(`c ${fielder.name}`), 'Dismissal text must include fielder name');
  assert(outBatter.dismissal_text.includes(`b ${currentBowler.name}`), 'Dismissal text must include bowler name');

  // 3. Test Bowler Selection from Fielding Team
  console.log('--- Test 3: Bowler Selection from Fielding Team ---');
  const eligibleBowler = liveState.bowlingSquad.find(b => b.id !== currentBowler.id && !b.isPreviousBowler && b.id !== liveState.innings.previousBowlerId);
  assert(eligibleBowler, 'Must find eligible bowler in bowlingSquad');
  const resBowler = await scoringEngine.endOver(matchId, eligibleBowler.id);
  assert(resBowler.success, 'endOver with bowling team player must succeed');
  console.log('✅ New bowler assigned successfully:', resBowler.currentBowlerName);

  // 4. Test Full Scorecard Verification
  console.log('--- Test 4: Full Scorecard Dismissal Text ---');
  const scorecard = await scorerService.getFullScorecard(matchId);
  const inn1 = scorecard.innings[0];
  const cardBatter = inn1.batters.find(b => b.playerId === res5.strikerId);
  assert(cardBatter, 'Batter must be in scorecard');
  console.log('✅ Scorecard Batter:', cardBatter.name, '| Dismissal:', cardBatter.dismissal);
  assert(cardBatter.dismissal.includes(fielder.name), 'Scorecard dismissal must include fielder');

  console.log('🎉 ALL BACKEND WICKET, RUNS & BOWLER TESTS PASSED 100%!');
  process.exit(0);
}

testFeatures().catch(e => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
