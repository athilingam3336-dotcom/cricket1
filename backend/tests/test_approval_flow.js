const db = require('../config/db');
const authService = require('../services/authService');

async function run() {
  await db.initDb();
  console.log('\n--- 1. Testing Login while PENDING ---');
  try {
    await authService.login('kohli@gmail.com', '1234', 'COACH', true);
    console.error('FAIL: Login should have been blocked!');
  } catch (err) {
    console.log('PASS: Login correctly blocked with HTTP', err.status, ':', err.message);
  }

  console.log('\n--- 2. Testing Admin Approval ---');
  const approveRes = await authService.approveTeam('TEAM-VRD-311192', 'ADMIN');
  console.log('PASS: approveTeam result:', approveRes.message);

  const coachUser = await db.models.User.findOne({ email: 'kohli@gmail.com' });
  console.log('PASS: Coach user status after approval:', coachUser.status);

  console.log('\n--- 3. Testing Login after Approval ---');
  const loginRes = await authService.login('kohli@gmail.com', '1234', 'COACH', true);
  console.log('PASS: Login succeeds! User role:', loginRes.user.role, '| Token issued:', !!loginRes.token);

  console.log('\n--- 4. Reverting to PENDING for Live Admin Dashboard Testing ---');
  await db.models.TeamRegistration.updateOne({ id: 'TEAM-VRD-311192' }, { status: 'PENDING' });
  await db.models.User.updateOne({ email: 'kohli@gmail.com' }, { status: 'PENDING' });
  console.log('PASS: Team & Coach reset to PENDING status.');

  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
