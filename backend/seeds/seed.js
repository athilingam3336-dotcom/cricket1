/**
 * seeds/seed.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runSeeds() {
  console.log('🌱 Seeding database...');
  const seedPath = path.join(__dirname, 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  if (!db.getUseMemoryFallback() && db.pool) {
    try {
      const statements = seedSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      const conn = await db.pool.getConnection();
      for (const statement of statements) {
        await conn.query(statement);
      }
      conn.release();
      console.log('✅ MySQL seed data inserted successfully.');
    } catch (err) {
      console.error('❌ Seeding failed:', err.message);
    }
  } else {
    db.memoryStore.initDefaultSeed();
    console.log('✅ In-memory database seeded with realistic data: 1 tournament, 4 teams, 44 players, 3 matches (Live, Upcoming, Completed), and assigned scorer S. Ramesh (SCR-101).');
  }
}

if (require.main === module) {
  runSeeds().then(() => process.exit(0));
}

module.exports = runSeeds;
