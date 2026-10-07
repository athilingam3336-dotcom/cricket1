/**
 * seeds/seed.js
 * MongoDB Seeder script
 */
const db = require('../config/db');

async function runSeeds() {
  console.log('🌱 Seeding MongoDB database...');
  await db.initDb();
  console.log('✅ MongoDB database verified and seeded successfully.');
  process.exit(0);
}

if (require.main === module) {
  runSeeds().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = runSeeds;
