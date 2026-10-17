/**
 * viewDb.js
 * Quick utility to inspect MongoDB records from the terminal.
 * Usage: node scripts/viewDb.js [matches|innings|deliveries|teams|all]
 */

const db = require('../config/db');

async function view() {
  await db.initDb();
  const target = (process.argv[2] || 'summary').toLowerCase();

  console.log('\n========================================================');
  console.log('🍃 CRICKET FEDERATION MONGODB VIEWER (cricket_db)');
  console.log('========================================================\n');

  if (target === 'summary' || target === 'all' || target === 'matches') {
    const matches = await db.models.Match.find({}).lean();
    console.log(`📌 MATCHES (${matches.length} found):`);
    console.table(
      matches.map((m) => ({
        ID: m.id,
        Tournament: m.tournament,
        Status: m.status,
        Venue: m.venue,
        Result: m.result_summary || 'In Progress'
      }))
    );
  }

  if (target === 'summary' || target === 'all' || target === 'innings') {
    const innings = await db.models.Innings.find({}).lean();
    console.log(`\n📌 INNINGS (${innings.length} found):`);
    console.table(
      innings.map((i) => ({
        ID: i.id,
        Match: i.match_id,
        InnNum: i.innings_number,
        Score: `${i.total_runs}/${i.wickets}`,
        Overs: `${i.overs}.${i.balls}`,
        OverComplete: i.is_over_complete,
        Bowler: i.current_bowler_id,
        PrevBowler: i.previous_bowler_id
      }))
    );
  }

  if (target === 'deliveries' || target === 'all') {
    const deliveries = await db.models.Delivery.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    console.log(`\n📌 RECENT DELIVERIES (Last 10):`);
    console.table(
      deliveries.map((d) => ({
        Ball: `${d.over_number}.${d.ball_number}`,
        Match: d.match_id,
        Bowler: d.bowler_id,
        Runs: d.runs_batter,
        Extras: `${d.runs_extras} (${d.extra_type})`,
        Wicket: d.wicket ? d.wicket_type : 'No',
        Commentary: (d.commentary || '').slice(0, 40) + '...'
      }))
    );
  }

  if (target === 'teams' || target === 'all') {
    const teams = await db.models.Team.find({}).lean();
    console.log(`\n📌 TEAMS (${teams.length} found):`);
    console.table(teams.map((t) => ({ ID: t.id, Name: t.name, Short: t.short_name })));
  }

  console.log('\n========================================================');
  console.log('💡 Tip: Try passing arguments:');
  console.log('   node scripts/viewDb.js deliveries');
  console.log('   node scripts/viewDb.js matches');
  console.log('   node scripts/viewDb.js all');
  console.log('========================================================\n');
  process.exit(0);
}

view().catch((err) => {
  console.error('Error viewing MongoDB:', err);
  process.exit(1);
});
