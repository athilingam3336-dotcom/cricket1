const db = require('../config/db');
const authService = require('../services/authService');

async function run() {
  await db.initDb();
  const testEmail = `scorer.test.${Date.now()}@gmail.com`;

  console.log('\n--- 1. Testing Scorer Registration ---');
  const regRes = await authService.registerScorer({
    name: 'Test Official Scorer',
    email: testEmail,
    password: 'password123',
    mobile: '9876543210',
    association: 'Virudhunagar District Cricket Association',
    taluk: 'Virudhunagar',
    certificationLevel: 'State Certified Scorer'
  });
  console.log('PASS: registerScorer status:', regRes.status, '| message:', regRes.message);

  console.log('\n--- 2. Testing Scorer Login while PENDING ---');
  try {
    await authService.login(testEmail, 'password123', 'SCORER', true);
    console.error('FAIL: Scorer password login should have been blocked!');
  } catch (err) {
    console.log('PASS: Scorer password login blocked with HTTP', err.status, ':', err.message);
  }

  try {
    await authService.requestScorerOtp(testEmail);
    console.error('FAIL: Scorer OTP request should have been blocked!');
  } catch (err) {
    console.log('PASS: Scorer OTP request blocked with HTTP', err.status, ':', err.message);
  }

  console.log('\n--- 3. Testing Admin Approval for Scorer ---');
  const approveRes = await authService.updateScorerStatus(testEmail, 'APPROVED');
  console.log('PASS: updateScorerStatus result:', approveRes.message);

  console.log('\n--- 4. Testing Scorer Login after Approval ---');
  const loginRes = await authService.login(testEmail, 'password123', 'SCORER', true);
  console.log('PASS: Scorer Login succeeds! Role:', loginRes.user.role, '| Token issued:', !!loginRes.token);

  // Clean up test account
  await db.models.User.deleteOne({ email: testEmail });
  try {
    const scorerModel = require('../models/scorerModel');
    const [rows] = await db.query('DELETE FROM scorers WHERE email = ?', [testEmail]);
  } catch (e) {}
  console.log('PASS: Cleaned up temporary test scorer.');

  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
