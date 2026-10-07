/**
 * tests/test_team_and_player_auth.js
 * End-to-end integration test for:
 * 1. Team registration with 15 squad players (PENDING admin approval)
 * 2. Admin notification created
 * 3. Player login blocked while team is PENDING
 * 4. Admin gives approval -> Team & players stored in database
 * 5. Player login by name -> OTP sent via Nodemailer to registered email
 * 6. Player OTP verification & login
 */

process.env.NODE_ENV = 'test';
const { app, server } = require('../server');
const authService = require('../services/authService');
const teamRegistrationModel = require('../models/teamRegistrationModel');
const notificationModel = require('../models/notificationModel');
const userModel = require('../models/userModel');

async function runTests() {
  console.log('🚀 Starting Team Registration & Player Login Test Suite...\n');

  try {
    // TEST 1: Register a new team with coach and 15 players
    console.log('--- TEST 1: Team Registration ---');
    const samplePlayers = [
      { name: 'Saravanan R', email: 'saravanan.test@virudhunagar.org', role: 'Captain' },
      { name: 'Karthik S', email: 'karthik.test@virudhunagar.org', role: 'Vice Captain' },
      { name: 'Murugan K', email: 'murugan.test@virudhunagar.org', role: 'Wicket Keeper' },
      { name: 'Vignesh V', email: 'vignesh.test@virudhunagar.org', role: 'Bowler' },
      { name: 'Ashwin Kumar', email: 'ashwin.test@virudhunagar.org', role: 'All-Rounder' },
      { name: 'Vijay Anand', email: 'vijay.test@virudhunagar.org', role: 'Batter' },
      { name: 'Dinesh Babu', email: 'dinesh.test@virudhunagar.org', role: 'Batter' },
      { name: 'Praveen Raj', email: 'praveen.test@virudhunagar.org', role: 'Bowler' },
      { name: 'Suresh Kumar', email: 'suresh.test@virudhunagar.org', role: 'Bowler' },
      { name: 'Bala Murugan', email: 'bala.test@virudhunagar.org', role: 'Bowler' },
      { name: 'Arun Pandian', email: 'arun.test@virudhunagar.org', role: 'Batter' },
      { name: 'Manikandan C', email: 'manikandan.test@virudhunagar.org', role: 'All-Rounder' },
      { name: 'Gokul Nath', email: 'gokul.test@virudhunagar.org', role: 'Bowler' },
      { name: 'Selva Ganesh', email: 'selva.test@virudhunagar.org', role: 'Batter' },
      { name: 'Rajesh D', email: 'rajesh.test@virudhunagar.org', role: 'Wicket Keeper' }
    ];

    const teamPayload = {
      teamName: 'Virudhunagar Super Strikers',
      coachName: 'Coach Ramanathan',
      coachEmail: 'coach.ramanathan@strikers.org',
      taluk: 'Virudhunagar',
      players: samplePlayers
    };

    const regResult = await authService.registerTeam(teamPayload);
    console.log('✅ Team Registration Result:', regResult.status, regResult.message);
    if (regResult.status !== 'PENDING') throw new Error('Expected status to be PENDING');
    const teamId = regResult.team.id;

    // TEST 2: Check Admin Notification created
    console.log('\n--- TEST 2: Admin Notification Verification ---');
    const notifs = await notificationModel.getAll();
    const teamNotif = notifs.find(n => n.reference_id === teamId);
    if (!teamNotif) throw new Error('Admin notification for team was not found!');
    console.log('✅ Admin Notification found:', teamNotif.title, '| Status:', teamNotif.status);

    // TEST 3: Player tries to log in while team is PENDING
    console.log('\n--- TEST 3: Player Login blocked while PENDING ---');
    let blocked = false;
    try {
      await authService.requestPlayerOtp('Saravanan R');
    } catch (err) {
      blocked = true;
      console.log('✅ Player login correctly blocked with message:', err.message);
    }
    if (!blocked) throw new Error('Player login should have been blocked while team is PENDING!');

    // TEST 4: Admin approves the team
    console.log('\n--- TEST 4: Admin Approves Team ---');
    const approveResult = await authService.approveTeam(teamId, 'ADM-1001');
    console.log('✅ Team Approved:', approveResult.message);
    if (approveResult.team.status !== 'APPROVED') throw new Error('Team status should be APPROVED');

    // Verify players stored in database
    const savedPlayerUser = await userModel.findByEmail('saravanan.test@virudhunagar.org');
    if (!savedPlayerUser) throw new Error('Player user was not stored in database after team approval!');
    console.log('✅ Player found in users table:', savedPlayerUser.name, savedPlayerUser.email, savedPlayerUser.status);

    // TEST 5: Player logs in by name -> OTP sent to email given at registration via Nodemailer
    console.log('\n--- TEST 5: Player Login by Name (Sends OTP to registered email) ---');
    const otpResult = await authService.requestPlayerOtp('Saravanan R');
    console.log('✅ Player OTP Request Result:');
    console.log('   Player Name:', otpResult.playerName);
    console.log('   Dispatched to Email:', otpResult.email);
    console.log('   Dev Code:', otpResult.devOtp);

    if (otpResult.email !== 'saravanan.test@virudhunagar.org') {
      throw new Error('OTP was not sent to the email provided at team registration!');
    }

    // TEST 6: Player verifies OTP and logs in
    console.log('\n--- TEST 6: Player Verifies OTP ---');
    const verifyResult = await authService.verifyPlayerOtp('Saravanan R', otpResult.devOtp);
    console.log('✅ Player Login Verified:', verifyResult.message);
    console.log('   JWT Token issued:', verifyResult.token ? 'YES (Valid)' : 'NO');
    console.log('   User Session:', verifyResult.user);

    console.log('\n🎉 ALL 6 INTEGRATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
