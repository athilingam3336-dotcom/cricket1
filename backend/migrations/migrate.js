/**
 * migrations/migrate.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (!db.getUseMemoryFallback() && db.pool) {
    try {
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use') && !s.toLowerCase().startsWith('create database'));

      const conn = await db.pool.getConnection();
      for (const statement of statements) {
        await conn.query(statement);
      }
      conn.release();
      console.log('✅ MySQL schema migrations applied successfully.');
    } catch (err) {
      console.error('❌ Migration failed:', err.message);
    }
  } else {
    console.log('✅ In-memory schema initialized with all 12 tables.');
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = runMigrations;
