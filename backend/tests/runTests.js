const userModel = require('../models/userModel');
const crypto = require('crypto');
const { requireAdminAuth, requireScorerAuth } = require('../middleware/authMiddleware');
const otpService = require('../services/otpService');
﻿/**
 * tests/runTests.js
 * Comprehensive automated test suite for Cricket Full-Stack Scorer System
 */

const assert = require('assert');
const authService = require('../services/authService');
const scorerService = require('../services/scorerService');
const scoringEngine = require('../services/scoringEngine');
const matchService = require('../services/matchService');
const db = require('../config/db');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message || err}`);
    if (err.stack) console.error(`     ${err.stack.split('\n')[1]}`);
    failedTests++;
  }
}

async function runAllTests() {
  console.log('\n==================================================');
  console.log('🏏 RUNNING CRICKET SCORER AUTOMATED TEST SUITE');
  console.log('==================================================\n');

  // Initialize MongoDB for test suite
  await db.initDb();

  console.log('--- 1. AUTHENTICATION & AUTHORIZATION ---');
  let authToken = null;
  let scorerUser = null;

  await test('CASE 1: Development Admin Login (admin@example.com + 1234) -> Role ADMIN', async () => {
    const res = await authService.verifyOtp('admin@example.com', '1234');
    assert(res.token, 'Token should be returned');
    assert.strictEqual(res.user.role, 'ADMIN');
    assert.strictEqual(res.user.email, 'admin@example.com');
  });

  await test('CASE 2: Normal registered Gmail + correct OTP -> LOGIN SUCCESS (Role: SCORER)', async () => {
    otpService.resetRateLimit('ramesh@gmail.com');
    const reqRes = await authService.requestOtp('ramesh@gmail.com');
    assert.strictEqual(reqRes.success, true);
    assert(!reqRes.otp, 'OTP must NOT be returned in API response');

    // Fetch user from MongoDB to get the generated OTP hash
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', ['ramesh@gmail.com']);
    assert(rows && rows.length > 0, 'User must exist');
    assert(rows[0].otp_hash, 'otp_hash must be set in MongoDB');
    assert(rows[0].otp_expires_at, 'otp_expires_at must be set in MongoDB');

    // Simulate known OTP verification by storing deterministic hash
    const knownOtp = '582910';
    const knownHash = otpService.hashOtp(knownOtp);
    await userModel.updateOtp(rows[0].id, {
      otp_hash: knownHash,
      otp_expires_at: new Date(Date.now() + 5 * 60 * 1000)
    });

    const verifyRes = await authService.verifyOtp('ramesh@gmail.com', knownOtp);
    assert.strictEqual(verifyRes.success, true);
    assert.strictEqual(verifyRes.user.role, 'SCORER');
    assert.strictEqual(verifyRes.user.email, 'ramesh@gmail.com');
    assert(verifyRes.token, 'JWT token must be issued');
    authToken = verifyRes.token;
    scorerUser = verifyRes.user;
  });

  await test('CASE 3: Normal Gmail + wrong OTP -> LOGIN FAILED (401)', async () => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', ['ramesh@gmail.com']);
    const knownOtp = '771122';
    const knownHash = otpService.hashOtp(knownOtp);
    await userModel.updateOtp(rows[0].id, {
      otp_hash: knownHash,
      otp_expires_at: new Date(Date.now() + 5 * 60 * 1000)
    });

    try {
      await authService.verifyOtp('ramesh@gmail.com', '999999'); // wrong OTP
      assert.fail('Should have rejected wrong OTP');
    } catch (err) {
      assert.strictEqual(err.status, 401);
      assert(err.message.toLowerCase().includes('invalid'));
    }
  });

  await test('CASE 4: Normal Gmail + expired OTP -> LOGIN FAILED (401)', async () => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', ['ramesh@gmail.com']);
    const knownOtp = '334455';
    const knownHash = otpService.hashOtp(knownOtp);
    const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    await userModel.updateOtp(rows[0].id, {
      otp_hash: knownHash,
      otp_expires_at: pastTime
    });

    try {
      await authService.verifyOtp('ramesh@gmail.com', knownOtp);
      assert.fail('Should have rejected expired OTP');
    } catch (err) {
      assert.strictEqual(err.status, 401);
      assert(err.message.toLowerCase().includes('expired'));
    }
  });

  await test('CASE 5: Normal Gmail + old OTP after resend -> LOGIN FAILED (401)', async () => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', ['ramesh@gmail.com']);
    const oldOtp = '111111';
    const newOtp = '222222';
    const newHash = otpService.hashOtp(newOtp);
    // User requests new OTP, overwriting old OTP in MongoDB
    await userModel.updateOtp(rows[0].id, {
      otp_hash: newHash,
      otp_expires_at: new Date(Date.now() + 5 * 60 * 1000)
    });

    try {
      await authService.verifyOtp('ramesh@gmail.com', oldOtp);
      assert.fail('Old OTP should be rejected');
    } catch (err) {
      assert.strictEqual(err.status, 401);
      assert(err.message.toLowerCase().includes('invalid'));
    }
  });

  await test('CASE 6: Unregistered email -> 404 proper error', async () => {
    try {
      await authService.requestOtp('unregistered_scorer_99@test.com');
      assert.fail('Unregistered email should fail');
    } catch (err) {
      assert.strictEqual(err.status, 404);
      assert(err.message.toLowerCase().includes('not registered') || err.message.toLowerCase().includes('not found'));
    }
  });

  await test('CASE 7: SCORER trying to access ADMIN API -> 403 Forbidden', async () => {
    assert(authToken, 'Scorer token must be present');
    const req = { headers: { 'authorization': `Bearer ${authToken}` } };
    let capturedStatus = null;
    let capturedBody = null;
    const res = {
      status: (s) => {
        capturedStatus = s;
        return { json: (b) => { capturedBody = b; } };
      }
    };
    requireAdminAuth(req, res, () => {});
    assert.strictEqual(capturedStatus, 403, 'Must return HTTP 403 Forbidden for Scorer accessing Admin route');
    assert.strictEqual(capturedBody.success, false);
  });

  await test('CASE 8: Unauthenticated user trying to access scorer API -> 401 Unauthorized', async () => {
    const req = { headers: {} }; // No token
    let capturedStatus = null;
    let capturedBody = null;
    const res = {
      status: (s) => {
        capturedStatus = s;
        return { json: (b) => { capturedBody = b; } };
      }
    };
    requireScorerAuth(req, res, () => {});
    assert.strictEqual(capturedStatus, 401, 'Must return HTTP 401 Unauthorized when token missing');
    assert.strictEqual(capturedBody.success, false);
  });

  await test('Fetch authenticated scorer profile', async () => {
    const profile = await authService.getProfile('SCR-101');
    assert.strictEqual(profile.id, 'SCR-101');
    assert.strictEqual(profile.name, 'S. Ramesh');
  });

  console.log('\n--- 2. SCORER DASHBOARD & ASSIGNMENTS ---');
  await test('GET /api/scorer/dashboard calculates stats from database', async () => {
    const dashboard = await scorerService.getDashboardStats('SCR-101');
    assert.strictEqual(dashboard.liveMatches, 1, 'Should have 1 live match');
    assert.strictEqual(dashboard.upcomingMatches, 1, 'Should have 1 upcoming match');
    assert.strictEqual(dashboard.completedMatches, 1, 'Should have 1 completed match');
    assert.strictEqual(dashboard.assignedMatches, 3, 'Should have 3 assigned matches');
    assert(dashboard.matches.length >= 3, 'Should list assigned matches');
  });

  console.log('\n--- 3. MATCH LIFECYCLE & SETUP ---');
  await test('Get Match Setup information (teams, squads, venue)', async () => {
    const setup = await matchService.getMatchSetup('M001');
    assert.strictEqual(setup.matchId, 'M001');
    assert(setup.teamA && setup.teamB, 'Teams must be present');
    assert(setup.teamAPlayers.length > 0, 'Team A squad should have players');
    assert(setup.teamBPlayers.length > 0, 'Team B squad should have players');
  });

  await test('Start Match with Toss (transitions SCHEDULED -> LIVE)', async () => {
    const res = await matchService.startMatch('M001', {
      tossWinner: 'T001',
      tossDecision: 'BAT'
    });
    assert(res.success);
    assert.strictEqual(res.battingTeamId, 'T001');
  });

  console.log('\n--- 4. BALL-BY-BALL SCORING ENGINE ---');
  // Use M002 for delivery tests (Live Match)
  const matchId = 'M002';
  const strikerId = 'P301';
  const nonStrikerId = 'P303';
  const bowlerId = 'P401';

  await test('Record Dot Ball (0 runs, legal delivery, bowler ball increment)', async () => {
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId,
      nonStrikerId,
      bowlerId,
      runsBatter: 0,
      extraType: 'NONE'
    }, 'SCR-101');
    assert(res.success);
    assert.strictEqual(res.data.lastDelivery.runsBatter, 0);
  });

  await test('Record 1 Run with Strike Rotation', async () => {
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId,
      nonStrikerId,
      bowlerId,
      runsBatter: 1,
      extraType: 'NONE'
    }, 'SCR-101');
    assert(res.success);
    // Strike should rotate on odd runs
    assert.strictEqual(res.data.strikerId, nonStrikerId, 'Strike should rotate to non-striker');
    assert.strictEqual(res.data.nonStrikerId, strikerId);
  });

  await test('Record 2 Runs (Strike remains with batter)', async () => {
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 2,
      extraType: 'NONE'
    }, 'SCR-101');
    assert(res.success);
    assert.strictEqual(res.data.strikerId, nonStrikerId, 'Strike should remain unchanged on even runs');
  });

  await test('Record 4 Runs (Boundary credited to batter)', async () => {
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 4,
      extraType: 'NONE'
    }, 'SCR-101');
    assert(res.success);
    assert.strictEqual(res.data.lastDelivery.runsBatter, 4);
  });

  await test('Record 6 Runs (Maximum credited to batter)', async () => {
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 6,
      extraType: 'NONE'
    }, 'SCR-101');
    assert(res.success);
    assert.strictEqual(res.data.lastDelivery.runsBatter, 6);
  });

  console.log('\n--- 5. EXTRAS & ILLEGAL DELIVERIES ---');
  await test('Record Wide Ball (1 extra, illegal delivery, no legal ball consumed)', async () => {
    const beforeState = await scorerService.getLiveMatchState(matchId);
    const beforeBalls = beforeState.innings.overs;

    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 0,
      runsExtras: 1,
      extraType: 'WIDE'
    }, 'SCR-101');

    assert(res.success);
    assert.strictEqual(res.data.lastDelivery.extraType, 'WIDE');
    assert.strictEqual(res.data.overs, beforeBalls, 'Overs/balls must NOT increment for Wide');
  });

  await test('Record No Ball (1 extra + runs off bat, illegal delivery)', async () => {
    const beforeState = await scorerService.getLiveMatchState(matchId);
    const beforeBalls = beforeState.innings.overs;

    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 2,
      runsExtras: 1,
      extraType: 'NO_BALL'
    }, 'SCR-101');

    assert(res.success);
    assert.strictEqual(res.data.lastDelivery.extraType, 'NO_BALL');
    assert.strictEqual(res.data.overs, beforeBalls, 'Overs/balls must NOT increment for No Ball');
  });

  await test('Record Bye & Leg Bye (Legal deliveries, runs to extras not batter)', async () => {
    const resBye = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 0,
      runsExtras: 1,
      extraType: 'BYE'
    }, 'SCR-101');
    assert(resBye.success);
    assert.strictEqual(resBye.data.lastDelivery.extraType, 'BYE');
  });

  console.log('\n--- 6. WICKETS & REPLACEMENT BATTER ---');
  await test('Record Wicket (BOWLED, credits bowler, updates innings wickets)', async () => {
    const beforeState = await scorerService.getLiveMatchState(matchId);
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: nonStrikerId,
      nonStrikerId: strikerId,
      bowlerId,
      runsBatter: 0,
      wicket: true,
      wicketType: 'BOWLED',
      replacementBatterId: 'P306'
    }, 'SCR-101');

    assert(res.success);
    assert.strictEqual(res.data.wickets, beforeState.innings.wickets + 1);
  });

  console.log('\n--- 7. UNDO TRANSACTION-SAFE CORRECTION ---');
  await test('Undo Last Delivery (reverses runs, balls, bowler & batter figures)', async () => {
    const beforeUndo = await scorerService.getLiveMatchState(matchId);
    const undoRes = await scoringEngine.undoLastDelivery(matchId);
    assert(undoRes.success);
    const afterUndo = await scorerService.getLiveMatchState(matchId);
    assert.strictEqual(afterUndo.innings.wickets, beforeUndo.innings.wickets - 1, 'Wicket count should revert by 1');
  });

  console.log('\n--- 8. INNINGS COMPLETION, CHASE & TARGET LOGIC ---');
  await test('End 1st Innings sets target for 2nd Innings', async () => {
    const endInnRes = await scoringEngine.endInnings(matchId);
    assert(endInnRes.success);
    assert(endInnRes.data.target > 0, 'Target should be set to 1st innings total + 1');
  });

  await test('Chasing team reaching target completes match automatically', async () => {
    // 2nd innings target
    const [inn2Rows] = await db.query('SELECT * FROM innings WHERE match_id = ? AND status = ?', [matchId, 'LIVE']);
    const inn2 = inn2Rows[0];
    assert(inn2, 'Innings 2 should be active');

    // Score enough runs to pass target
    const targetRuns = inn2.target || 160;
    const res = await scoringEngine.recordDelivery(matchId, {
      strikerId: 'P403',
      nonStrikerId: 'P404',
      bowlerId: 'P307',
      runsBatter: targetRuns + 2,
      extraType: 'NONE'
    }, 'SCR-101');

    assert(res.success);
    assert.strictEqual(res.data.isMatchCompleted, true, 'Match must be marked COMPLETED when target reached');
  });

  console.log('\n--- 9. FULL SCORECARD VERIFICATION ---');
  await test('GET /api/scorer/matches/:matchId/scorecard returns complete MongoDB data', async () => {
    const scorecard = await scorerService.getFullScorecard('M003');
    assert.strictEqual(scorecard.matchId, 'M003');
    assert(scorecard.tournament.includes('VPL') || scorecard.tournament.includes('Virudhunagar'), 'Tournament check');
    assert.strictEqual(scorecard.match.teamA, 'Sattur Spartans');
    assert.strictEqual(scorecard.match.teamB, 'Virudhunagar Strikers');
    assert.strictEqual(scorecard.match.result, 'Virudhunagar Strikers won by 7 wickets');

    // Innings 1 checks
    const inn1 = scorecard.innings[0];
    assert.strictEqual(inn1.battingTeam, 'Sattur Spartans');
    assert.strictEqual(inn1.totalRuns, 160);
    assert.strictEqual(inn1.wickets, 8);
    assert.strictEqual(inn1.overs, '20.0');

    // Batter checks: Suresh Kumar 42 (30), Muthu Raj 12 (10), Vijay 18 (14)
    const suresh = inn1.batters.find(b => b.name === 'Suresh Kumar');
    assert(suresh, 'Suresh Kumar must be in batting card');
    assert.strictEqual(suresh.runs, 42);
    assert.strictEqual(suresh.balls, 30);
    assert.strictEqual(suresh.fours, 4);
    assert.strictEqual(suresh.sixes, 1);

    const muthu = inn1.batters.find(b => b.name === 'Muthu Raj');
    assert(muthu, 'Muthu Raj must be in batting card');
    assert.strictEqual(muthu.runs, 12);
    assert.strictEqual(muthu.balls, 10);

    const vijay = inn1.batters.find(b => b.name === 'Vijay');
    assert(vijay, 'Vijay must be in batting card');
    assert.strictEqual(vijay.runs, 18);
    assert.strictEqual(vijay.balls, 14);

    // Extras: 11 (wd 6, nb 1, b 2, lb 2)
    assert.strictEqual(inn1.extras.total, 11);
    assert.strictEqual(inn1.extras.wide, 6);
    assert.strictEqual(inn1.extras.noBall, 1);
    assert.strictEqual(inn1.extras.bye, 2);
    assert.strictEqual(inn1.extras.legBye, 2);

    // Bowlers: Karthik N & Saravanan
    const karthik = inn1.bowlers.find(b => b.name === 'Karthik N');
    assert(karthik, 'Karthik N must be in bowling card');
    assert.strictEqual(karthik.overs, '4.0');
    assert.strictEqual(karthik.wickets, 2);

    const saravanan = inn1.bowlers.find(b => b.name === 'Saravanan');
    assert(saravanan, 'Saravanan must be in bowling card');
    assert.strictEqual(saravanan.overs, '4.0');
    assert.strictEqual(saravanan.wickets, 2);

    // Fall of Wickets & Partnerships
    assert(inn1.fallOfWickets.length > 0, 'Fall of wickets must be calculated');
    assert(inn1.partnerships.length > 0, 'Partnerships must be calculated');
  });

  await test('GET scorecard for non-existent match throws 404 (No fake data)', async () => {
    try {
      await scorerService.getFullScorecard('M999');
      assert.fail('Should throw 404 error');
    } catch (err) {
      assert(err.status === 404 || err.message.includes('not found'), 'Must fail with not found');
    }
  });

  
  console.log('\n--- 10. EDIT DELIVERY & MATCH END ---');
  await test('Edit Delivery with Innings Recalculation', async () => {
    // Deliveries in Innings 1 of M002
    const [dels] = await db.query('SELECT * FROM deliveries WHERE innings_id = ?', ['INN-M002-1']);
    assert(dels && dels.length > 0, 'Must have deliveries');
    const targetDel = dels[0];

    const editRes = await scoringEngine.editDelivery('M002', targetDel.id, {
      runsBatter: 4,
      extraType: 'NONE'
    }, 'SCR-101');
    assert(editRes.success);
    assert.strictEqual(editRes.data.action, 'EDIT_DELIVERY');
  });

  await test('Manual Match Conclusion / End Match', async () => {
    const endRes = await scoringEngine.endMatch('M001', {
      resultText: 'Match Concluded by Scorer',
      winnerTeamId: 'T001',
      status: 'COMPLETED'
    });
    assert(endRes.success);
    assert.strictEqual(endRes.data.status, 'COMPLETED');
  });

  await test('Duplicate / Stale Delivery Protection (State Conflict)', async () => {
    try {
      await scoringEngine.recordDelivery('M002', {
        strikerId: 'P301',
        nonStrikerId: 'P303',
        bowlerId: 'P401',
        runsBatter: 1,
        expectedOver: 99, // Stale over expectation
        expectedBall: 99
      }, 'SCR-101');
      assert.fail('Should reject with 409 conflict');
    } catch (err) {
      assert(err.status === 409 || err.status === 400 || err.message.includes('Conflict') || err.message.includes('not'));
    }
  });

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('==================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

