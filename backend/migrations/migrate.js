/**
 * migrations/migrate.js
 * MongoDB Indexes & Schema setup
 */
const db = require('../config/db');

async function runMigrations() {
  console.log('🔄 Initializing MongoDB indexes and collections...');
  await db.initDb();
  console.log('✅ MongoDB schema and indexes initialized.');
  process.exit(0);
}

if (require.main === module) {
  runMigrations().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}

module.exports = runMigrations;
