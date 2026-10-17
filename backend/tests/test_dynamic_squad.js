const assert = require('assert');
const db = require('../config/db');
const authService = require('../services/authService');

async function testDynamicSquad() {
  await db.initDb();
  console.log('🧪 Testing Dynamic Squad Sizes in Team Registration...');

  const ts = Date.now();

  // Test 1: Team with 3 squad players (less than 15)
  console.log('--- Test 1: Register Team with 3 Players ---');
  const team3 = await authService.registerTeam({
    teamName: `Dynamic Squad Team 3_${ts}`,
    coachName: 'Coach Dynamic Three',
    coachEmail: `coach.dynamic3_${ts}@test.org`,
    password: 'password123',
    city: 'Virudhunagar',
    taluk: 'Virudhunagar',
    players: [
      { name: 'Player A', email: `pA_${ts}@test.org`, role: 'BATTER' },
      { name: 'Player B', email: `pB_${ts}@test.org`, role: 'BOWLER' },
      { name: 'Player C', email: `pC_${ts}@test.org`, role: 'ALL_ROUNDER' }
    ]
  });
  assert(team3.success, 'Registration with 3 players must succeed');
  assert(team3.team.players.length === 3, 'Must save all 3 players');
  console.log('✅ Team with 3 players registered. ID:', team3.team.id);

  // Test 2: Team with 18 squad players (more than 15)
  console.log('--- Test 2: Register Team with 18 Players ---');
  const players18 = Array.from({ length: 18 }, (_, i) => ({
    name: `Player #${i + 1}`,
    email: `player18_${i + 1}_${ts}@test.org`,
    role: i < 6 ? 'BATTER' : (i < 12 ? 'BOWLER' : 'ALL_ROUNDER')
  }));

  const team18 = await authService.registerTeam({
    teamName: `Dynamic Squad Team 18_${ts}`,
    coachName: 'Coach Dynamic Eighteen',
    coachEmail: `coach.dynamic18_${ts}@test.org`,
    password: 'password123',
    city: 'Sivakasi',
    taluk: 'Sivakasi',
    players: players18
  });
  assert(team18.success, 'Registration with 18 players must succeed');
  assert(team18.team.players.length === 18, 'Must save all 18 players');
  console.log('✅ Team with 18 players registered. ID:', team18.team.id);

  // Test 3: Team with 0 players should fail
  console.log('--- Test 3: Register Team with 0 Players (Should Fail) ---');
  try {
    await authService.registerTeam({
      teamName: `Dynamic Squad Team 0_${ts}`,
      coachName: 'Coach Dynamic Zero',
      coachEmail: `coach.dynamic0_${ts}@test.org`,
      password: 'password123',
      city: 'Virudhunagar',
      taluk: 'Virudhunagar',
      players: []
    });
    assert.fail('Should have failed with 0 players');
  } catch (err) {
    assert(err.status === 400 || err.message.includes('required'), 'Must reject 0 players');
    console.log('✅ 0 players correctly rejected:', err.message);
  }

  // Test 4: Admin approval of dynamic squad team
  console.log('--- Test 4: Admin Approval of Team with 18 Players ---');
  const approveRes = await authService.approveTeam(team18.team.id);
  assert(approveRes.success, 'Approval must succeed');
  const approvedTeam = await db.models.TeamRegistration.findOne({ id: team18.team.id }).lean();
  assert(approvedTeam.status === 'APPROVED', 'Status must be APPROVED');
  const all18Players = approvedTeam.players.filter(p => p.status === 'APPROVED');
  assert(all18Players.length === 18, 'All 18 players must be approved');
  console.log('✅ All 18 squad players approved and converted successfully!');

  console.log('\n🎉 ALL DYNAMIC SQUAD TESTS PASSED 100%!');
  process.exit(0);
}

testDynamicSquad().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
