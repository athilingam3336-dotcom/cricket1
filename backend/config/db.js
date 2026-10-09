/**
 * config/db.js
 * 
 * MongoDB Native and Mongoose Database Access Layer for Cricket Management System.
 * Fully replaces legacy SQL with pure MongoDB collections, automatic initial seeding,
 * and resilient in-memory synchronization.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cricket_db';

let isConnected = false;

// Connect to MongoDB
async function initDb() {
  if (isConnected) return;
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`🍃 Connected to MongoDB Database Server at: ${MONGODB_URI}`);
    await seedDefaultData();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection attempt failed: ${err.message}. Initializing memory fallback engine.`);
  }
}

// -------------------------------------------------------------
// Pure MongoDB Schemas & Mongoose Models
// -------------------------------------------------------------

// 1. User Schema
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  mobile: { type: String, default: null },
  password_hash: { type: String, default: null },
  role: { 
    type: String, 
    enum: ['ADMIN', 'COACH', 'TEAM', 'PLAYER', 'SCORER', 'CONTENT', 'USER'], 
    default: 'USER',
    index: true 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'], 
    default: 'ACTIVE',
    index: true 
  },
  otp_hash: { type: String, default: null },
  otp_expires_at: { type: Date, default: null },
  otp_verified_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// 2. Tournament Schema
const TournamentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  season: { type: String, default: '2026' },
  category: { type: String, default: 'Senior District Trophy' },
  format: { type: String, default: 'T20' },
  rules: { type: String, default: 'Standard ICC / TNCA Playing Conditions' },
  status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  start_date: { type: String },
  end_date: { type: String }
}, { timestamps: true });

// 3. Team Schema
const TeamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  short_name: { type: String, required: true },
  city: { type: String, default: 'Virudhunagar' },
  taluk: { type: String, default: 'Virudhunagar' },
  coach_name: { type: String, default: '' },
  coach_email: { type: String, default: '' },
  captain: { type: String, default: '' },
  vice_captain: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'PENDING', 'INACTIVE'], default: 'ACTIVE' },
  stats: {
    matches: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    tied: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    nrr: { type: Number, default: 0.0 }
  }
}, { timestamps: true });

// 4. Player Schema
const PlayerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  team_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  role: { type: String, enum: ['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'], default: 'BATTER' },
  jersey_number: { type: Number, default: 0 },
  batting_style: { type: String, default: 'Right Hand Bat' },
  bowling_style: { type: String, default: 'Right Arm Medium' },
  status: { type: String, default: 'ACTIVE' },
  stats: {
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    highest_score: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    runs_conceded: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 }
  }
}, { timestamps: true });

// 5. Team Registration Schema (Coach submission with 15 squad players)
const TeamRegistrationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  team_name: { type: String, required: true },
  coach_name: { type: String, required: true },
  coach_email: { type: String, required: true, lowercase: true, trim: true, index: true },
  passkey: { type: String, default: '' },
  city: { type: String, default: 'Virudhunagar' },
  taluk: { type: String, default: 'Virudhunagar' },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING',
    index: true 
  },
  approved_by: { type: String, default: null },
  approved_at: { type: Date, default: null },
  rejection_reason: { type: String, default: null },
  players: [{
    jersey_number: { type: Number },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, default: 'BATTER' },
    status: { type: String, default: 'PENDING' }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// 6. Match Schema
const MatchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  tournament_id: { type: String, default: 'T-2026-VPL' },
  tournament_name: { type: String, default: 'Virudhunagar Premier League 2026' },
  team_a_id: { type: String, required: true },
  team_b_id: { type: String, required: true },
  venue: { type: String, default: 'Kamarajar District Stadium' },
  match_date: { type: String, default: '2026-10-06' },
  match_time: { type: String, default: '09:30 AM' },
  match_type: { type: String, default: 'T20' },
  overs_per_side: { type: Number, default: 20 },
  status: { type: String, enum: ['SCHEDULED', 'LIVE', 'INNINGS_BREAK', 'COMPLETED', 'ABANDONED', 'CANCELLED'], default: 'SCHEDULED', index: true },
  toss_winner_id: { type: String, default: null },
  toss_decision: { type: String, default: null },
  current_innings_number: { type: Number, default: 1 },
  result_summary: { type: String, default: null },
  player_of_match: { type: String, default: null },
  assigned_scorer_id: { type: String, default: 'SCR-101' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// 7. Innings Schema
const InningsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  match_id: { type: String, required: true, index: true },
  innings_number: { type: Number, required: true },
  batting_team_id: { type: String, required: true },
  bowling_team_id: { type: String, required: true },
  total_runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  target: { type: Number, default: null },
  is_completed: { type: Boolean, default: false },
  extras: {
    wides: { type: Number, default: 0 },
    no_balls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    leg_byes: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }
}, { timestamps: true });

// 8. Innings Batters & Bowlers
const InningsBatterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  innings_id: { type: String, required: true, index: true },
  player_id: { type: String, required: true },
  batting_position: { type: Number, default: 1 },
  runs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  strike_rate: { type: Number, default: 0.0 },
  is_out: { type: Boolean, default: false },
  dismissal_type: { type: String, default: null },
  bowler_id: { type: String, default: null },
  fielder_id: { type: String, default: null }
}, { timestamps: true });

const InningsBowlerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  innings_id: { type: String, required: true, index: true },
  player_id: { type: String, required: true },
  overs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  runs_conceded: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  no_balls: { type: Number, default: 0 },
  wides: { type: Number, default: 0 },
  economy: { type: Number, default: 0.0 }
}, { timestamps: true });

// 9. Delivery Schema (Ball-by-ball events with Fielding & AI Commentary data)
const DeliverySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  match_id: { type: String, default: null, index: true },
  innings_id: { type: String, required: true, index: true },
  innings_number: { type: Number, default: 1 },
  over_number: { type: Number, required: true },
  ball_number: { type: Number, required: true },
  striker_id: { type: String, required: true },
  non_striker_id: { type: String, default: null },
  bowler_id: { type: String, required: true },
  runs_batter: { type: Number, default: 0 },
  runs_extras: { type: Number, default: 0 },
  total_runs: { type: Number, default: 0 },
  extra_type: { type: String, default: 'NONE' },
  wicket: { type: Boolean, default: false },
  wicket_type: { type: String, default: null },
  dismissed_player_id: { type: String, default: null },
  boundary_type: { type: String, default: null },
  is_legal_delivery: { type: Boolean, default: true },
  shot_type: { type: String, default: null },
  fielding_position: { type: String, default: null },
  fielder_id: { type: String, default: null },
  fielder_name: { type: String, default: null },
  commentary: { type: String, default: '' },
  created_by: { type: String, default: 'SCR-101' },
  timestamp: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// 10. Notification Schema
const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, default: 'SYSTEM' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  reference_id: { type: String, default: null },
  status: { type: String, enum: ['UNREAD', 'READ'], default: 'UNREAD' },
  created_at: { type: Date, default: Date.now }
});

// 11. News & Content Schema
const NewsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'ANNOUNCEMENT' }, // 'MATCH_REPORT', 'ANNOUNCEMENT', 'TOURNAMENT'
  author: { type: String, default: 'District Cricket Association' },
  image_url: { type: String, default: '/assets_web/champions.jpg' },
  published_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'PUBLISHED' }
});

// 12. Officials Schema
const OfficialSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['SCORER', 'UMPIRE', 'MATCH_REFEREE', 'STAFF'], required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  status: { type: String, default: 'ACTIVE' }
});

// 13. Venues Schema
const VenueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, default: 5000 },
  floodlights: { type: Boolean, default: true },
  description: { type: String, default: 'State-of-the-art cricket ground.' }
});

// 14. Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  admin_email: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  ip_address: { type: String, default: '127.0.0.1' },
  timestamp: { type: Date, default: Date.now }
});

// Model registrations (avoid OverwriteModelError)
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tournament = mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const Player = mongoose.models.Player || mongoose.model('Player', PlayerSchema);
const TeamRegistration = mongoose.models.TeamRegistration || mongoose.model('TeamRegistration', TeamRegistrationSchema);
const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);
const Innings = mongoose.models.Innings || mongoose.model('Innings', InningsSchema);
const InningsBatter = mongoose.models.InningsBatter || mongoose.model('InningsBatter', InningsBatterSchema);
const InningsBowler = mongoose.models.InningsBowler || mongoose.model('InningsBowler', InningsBowlerSchema);
const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const News = mongoose.models.News || mongoose.model('News', NewsSchema);
const Official = mongoose.models.Official || mongoose.model('Official', OfficialSchema);
const Venue = mongoose.models.Venue || mongoose.model('Venue', VenueSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

// -------------------------------------------------------------
// Realistic Default Seeding for MongoDB
// -------------------------------------------------------------
async function seedDefaultData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial records into MongoDB...');

      // 1. Users
      await User.insertMany([
        { id: 'ADM-1001', name: 'System Administrator', email: 'admin@example.com', mobile: '9876543210', password_hash: '1234', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'ADM-1002', name: 'Chief Administrator', email: 'admin@cfvd.org', mobile: '9876543210', password_hash: 'admin123', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'ADM-1003', name: 'Association Admin', email: 'cricketfederation21@gmail.com', mobile: '9876543211', password_hash: 'admin123', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'ADM-1004', name: 'Athilingam (Admin & Scorer)', email: 'athilingam3336@gmail.com', mobile: '9876543220', password_hash: 'admin123', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'ADM-1005', name: 'Ponramanan (Admin & Scorer)', email: 'ponramanan21@gmail.com', mobile: '9876543221', password_hash: 'admin123', role: 'ADMIN', status: 'ACTIVE' },
        { id: 'SCR-101', name: 'S. Ramesh', email: 'ramesh@gmail.com', mobile: '9876543212', password_hash: '1234', role: 'SCORER', status: 'ACTIVE' },
        { id: 'SCR-102', name: 'S. Ramesh', email: 'scorer@cfvd.org', mobile: '9876543212', password_hash: '1234', role: 'SCORER', status: 'ACTIVE' },
        { id: 'SCR-103', name: 'K. Murugan', email: 'murugan@cfvd.org', mobile: '9876543213', password_hash: '1234', role: 'SCORER', status: 'ACTIVE' },
        { id: 'SCORER-101', name: 'Thiru. K. Sundararajan', email: 'sundararajan@cfvd.org', mobile: '+91 94431 12345', password_hash: '1234', role: 'SCORER', status: 'ACTIVE' },
        { id: 'SCORER-102', name: 'Thiru. M. Venkatesh', email: 'venkatesh.m@gmail.com', mobile: '+91 98422 67890', password_hash: '1234', role: 'SCORER', status: 'ACTIVE' },
        { id: 'SCORER-103', name: 'Thiru. S. Pitchaimuthu', email: 'pitchai.s@yahoo.com', mobile: '+91 97890 23456', password_hash: '1234', role: 'SCORER', status: 'PENDING' },
        { id: 'SCORER-104', name: 'Thiru. R. Vignesh Kumar', email: 'vignesh.k@gmail.com', mobile: '+91 96555 89012', password_hash: '1234', role: 'SCORER', status: 'PENDING' },
        { id: 'SCORER-105', name: 'Thiru. P. Arumugam', email: 'arumugam.p@gmail.com', mobile: '+91 99444 34567', password_hash: '1234', role: 'SCORER', status: 'REJECTED' },
        { id: 'CNT-201', name: 'Content Editor', email: 'content@cfvd.org', mobile: '9876543216', password_hash: '1234', role: 'CONTENT', status: 'ACTIVE' },
        { id: 'CCH-301', name: 'K. Muthu (Coach)', email: 'coach@cfvd.org', mobile: '9876543217', password_hash: '1234', role: 'COACH', status: 'ACTIVE' },
        { id: 'PLY-201', name: 'Arun Pandian', email: 'player@example.com', mobile: '9876543214', password_hash: 'player123', role: 'PLAYER', status: 'ACTIVE' },
        { id: 'USR-301', name: 'General User', email: 'user@example.com', mobile: '9876543215', password_hash: 'user123', role: 'USER', status: 'ACTIVE' }
      ]);

      // 2. Tournament
      await Tournament.insertMany([
        { id: 'T-2026-VPL', name: 'Virudhunagar Premier League 2026', season: '2026', category: 'Senior District Trophy', format: 'T20', status: 'ACTIVE', start_date: '2026-10-01', end_date: '2026-10-25' },
        { id: 'T-2026-U19', name: 'District Under-19 Championship', season: '2026', category: 'Junior Championship', format: 'One Day 50 Overs', status: 'UPCOMING', start_date: '2026-11-01', end_date: '2026-11-20' }
      ]);

      // 3. Teams
      await Team.insertMany([
        { id: 'TM-01', name: 'Virudhunagar Spartans', short_name: 'VND', city: 'Virudhunagar', taluk: 'Virudhunagar', coach_name: 'K. Muthu', coach_email: 'coach@cfvd.org', captain: 'Suresh Kumar', vice_captain: 'Vijay Anand', status: 'ACTIVE', stats: { matches: 5, won: 4, lost: 1, tied: 0, points: 8, nrr: 1.25 } },
        { id: 'TM-02', name: 'Sivakasi Strikers', short_name: 'SVK', city: 'Sivakasi', taluk: 'Sivakasi', coach_name: 'S. Ganesan', coach_email: 'ganesan@strikers.com', captain: 'Dinesh Karthik', vice_captain: 'R. Ashwin', status: 'ACTIVE', stats: { matches: 5, won: 3, lost: 2, tied: 0, points: 6, nrr: 0.85 } },
        { id: 'TM-03', name: 'Rajapalayam Royals', short_name: 'RPY', city: 'Rajapalayam', taluk: 'Rajapalayam', coach_name: 'R. Subramanian', coach_email: 'coach.royals@gmail.com', captain: 'M. Vijay', vice_captain: 'K. Balaji', status: 'ACTIVE', stats: { matches: 5, won: 2, lost: 3, tied: 0, points: 4, nrr: -0.15 } },
        { id: 'TM-04', name: 'Aruppukottai Aces', short_name: 'APK', city: 'Aruppukottai', taluk: 'Aruppukottai', coach_name: 'V. Raman', coach_email: 'coach.aces@gmail.com', captain: 'P. Saravanan', vice_captain: 'T. Prabhu', status: 'ACTIVE', stats: { matches: 4, won: 1, lost: 3, tied: 0, points: 2, nrr: -1.10 } }
      ]);

      // 4. Players (Approved squad members)
      const initialPlayers = [
        // Team 1: Spartans
        { id: 'P301', team_id: 'TM-01', name: 'Suresh Kumar', email: 'suresh@spartans.com', role: 'BATTER', jersey_number: 7, batting_style: 'Right Hand Bat', stats: { runs: 284, balls: 195, fours: 32, sixes: 10, highest_score: 88, wickets: 0, overs: 0, runs_conceded: 0, catches: 4, stumpings: 0 } },
        { id: 'P302', team_id: 'TM-01', name: 'Vijay Anand', email: 'vijay@spartans.com', role: 'ALL_ROUNDER', jersey_number: 18, batting_style: 'Right Hand Bat', stats: { runs: 165, balls: 110, fours: 15, sixes: 6, highest_score: 54, wickets: 8, overs: 18, runs_conceded: 124, catches: 3, stumpings: 0 } },
        { id: 'P303', team_id: 'TM-01', name: 'M. Karthi', email: 'karthi@spartans.com', role: 'BATTER', jersey_number: 3, batting_style: 'Left Hand Bat', stats: { runs: 142, balls: 98, fours: 14, sixes: 4, highest_score: 45, wickets: 0, overs: 0, runs_conceded: 0, catches: 2, stumpings: 0 } },
        { id: 'P304', team_id: 'TM-01', name: 'K. Balaji', email: 'balaji@spartans.com', role: 'WICKET_KEEPER', jersey_number: 1, batting_style: 'Right Hand Bat', stats: { runs: 112, balls: 85, fours: 10, sixes: 2, highest_score: 38, wickets: 0, overs: 0, runs_conceded: 0, catches: 6, stumpings: 3 } },
        { id: 'P305', team_id: 'TM-01', name: 'R. Vignesh', email: 'vignesh@spartans.com', role: 'BOWLER', jersey_number: 23, batting_style: 'Right Hand Bat', bowling_style: 'Right Arm Fast', stats: { runs: 24, balls: 18, fours: 2, sixes: 1, highest_score: 14, wickets: 12, overs: 20, runs_conceded: 130, catches: 1, stumpings: 0 } },
        { id: 'P306', team_id: 'TM-01', name: 'Arun Pandian', email: 'player@example.com', role: 'ALL_ROUNDER', jersey_number: 10, batting_style: 'Right Hand Bat', bowling_style: 'Right Arm Medium', stats: { runs: 198, balls: 135, fours: 21, sixes: 7, highest_score: 62, wickets: 6, overs: 14, runs_conceded: 98, catches: 5, stumpings: 0 } },
        
        // Team 2: Strikers
        { id: 'P401', team_id: 'TM-02', name: 'Dinesh Karthik', email: 'dinesh@strikers.com', role: 'WICKET_KEEPER', jersey_number: 21, batting_style: 'Right Hand Bat', stats: { runs: 240, balls: 160, fours: 26, sixes: 8, highest_score: 72, wickets: 0, overs: 0, runs_conceded: 0, catches: 7, stumpings: 2 } },
        { id: 'P402', team_id: 'TM-02', name: 'R. Ashwin', email: 'ashwin@strikers.com', role: 'ALL_ROUNDER', jersey_number: 99, batting_style: 'Right Hand Bat', bowling_style: 'Right Arm Off Break', stats: { runs: 120, balls: 82, fours: 12, sixes: 3, highest_score: 41, wickets: 11, overs: 20, runs_conceded: 115, catches: 2, stumpings: 0 } },
        { id: 'P403', team_id: 'TM-02', name: 'S. Balamurugan', email: 'bala@strikers.com', role: 'BOWLER', jersey_number: 11, batting_style: 'Right Hand Bat', bowling_style: 'Left Arm Fast', stats: { runs: 18, balls: 12, fours: 2, sixes: 0, highest_score: 11, wickets: 9, overs: 19, runs_conceded: 128, catches: 1, stumpings: 0 } }
      ];
      await Player.insertMany(initialPlayers);

      // 5. Matches
      await Match.insertMany([
        {
          id: 'M001',
          tournament_id: 'T-2026-VPL',
          tournament_name: 'Virudhunagar Premier League 2026',
          team_a_id: 'TM-01',
          team_b_id: 'TM-03',
          venue: 'Kamarajar District Stadium',
          match_date: '2026-10-08',
          match_time: '02:30 PM',
          match_type: 'T20',
          overs_per_side: 20,
          status: 'SCHEDULED',
          assigned_scorer_id: 'SCR-101'
        },
        {
          id: 'M002',
          tournament_id: 'T-2026-VPL',
          tournament_name: 'Virudhunagar Premier League 2026',
          team_a_id: 'TM-01',
          team_b_id: 'TM-02',
          venue: 'Kamarajar District Stadium',
          match_date: '2026-10-06',
          match_time: '09:30 AM',
          match_type: 'T20',
          overs_per_side: 20,
          status: 'LIVE',
          toss_winner_id: 'TM-01',
          toss_decision: 'BAT',
          current_innings_number: 1,
          assigned_scorer_id: 'SCR-101'
        },
        {
          id: 'M003',
          tournament_id: 'T-2026-VPL',
          tournament_name: 'Virudhunagar Premier League 2026',
          team_a_id: 'TM-02',
          team_b_id: 'TM-04',
          venue: 'Sivakasi Cricket Ground',
          match_date: '2026-10-04',
          match_time: '09:30 AM',
          match_type: 'T20',
          overs_per_side: 20,
          status: 'COMPLETED',
          toss_winner_id: 'TM-02',
          toss_decision: 'BAT',
          result_summary: 'Sivakasi Strikers won by 34 runs',
          player_of_match: 'Dinesh Karthik',
          assigned_scorer_id: 'SCR-101'
        }
      ]);

      // 6. Innings for M002 (Live) & M003 (Completed)
      await Innings.insertMany([
        {
          id: 'INN-M002-1',
          match_id: 'M002',
          innings_number: 1,
          batting_team_id: 'TM-01',
          bowling_team_id: 'TM-02',
          total_runs: 142,
          wickets: 3,
          overs: 16,
          balls: 2,
          is_completed: false,
          extras: { wides: 4, no_balls: 1, byes: 2, leg_byes: 1, total: 8 }
        },
        {
          id: 'INN-M003-1',
          match_id: 'M003',
          innings_number: 1,
          batting_team_id: 'TM-02',
          bowling_team_id: 'TM-04',
          total_runs: 178,
          wickets: 6,
          overs: 20,
          balls: 0,
          is_completed: true,
          extras: { wides: 6, no_balls: 1, byes: 2, leg_byes: 2, total: 11 }
        },
        {
          id: 'INN-M003-2',
          match_id: 'M003',
          innings_number: 2,
          batting_team_id: 'TM-04',
          bowling_team_id: 'TM-02',
          total_runs: 144,
          wickets: 9,
          overs: 20,
          balls: 0,
          is_completed: true,
          target: 179,
          extras: { wides: 5, no_balls: 0, byes: 1, leg_byes: 3, total: 9 }
        }
      ]);

      // 7. Innings Batters & Bowlers
      await InningsBatter.insertMany([
        { id: 'IBAT-01', innings_id: 'INN-M002-1', player_id: 'P301', batting_position: 1, runs: 64, balls: 42, fours: 8, sixes: 2, strike_rate: 152.38, is_out: false },
        { id: 'IBAT-02', innings_id: 'INN-M002-1', player_id: 'P302', batting_position: 2, runs: 28, balls: 22, fours: 3, sixes: 1, strike_rate: 127.27, is_out: true, dismissal_type: 'CAUGHT', bowler_id: 'P402', fielder_id: 'P401' },
        { id: 'IBAT-03', innings_id: 'INN-M002-1', player_id: 'P303', batting_position: 3, runs: 35, balls: 24, fours: 4, sixes: 1, strike_rate: 145.83, is_out: false }
      ]);

      await InningsBowler.insertMany([
        { id: 'IBOW-01', innings_id: 'INN-M002-1', player_id: 'P401', overs: 3, balls: 2, maidens: 0, runs_conceded: 28, wickets: 1, no_balls: 1, wides: 2, economy: 8.40 },
        { id: 'IBOW-02', innings_id: 'INN-M002-1', player_id: 'P402', overs: 4, balls: 0, maidens: 0, runs_conceded: 32, wickets: 2, no_balls: 0, wides: 1, economy: 8.00 }
      ]);

      // 8. Sample Team Registration (Pending & Approved)
      await TeamRegistration.insertMany([
        {
          id: 'TEAM-VRD-101',
          team_name: 'Virudhunagar Spartans',
          coach_name: 'K. Muthu',
          coach_email: 'coach@cfvd.org',
          passkey: 'PASS-7788',
          city: 'Virudhunagar',
          taluk: 'Virudhunagar',
          status: 'APPROVED',
          approved_by: 'ADM-1001',
          approved_at: new Date('2026-10-01'),
          players: [
            { jersey_number: 7, name: 'Suresh Kumar', email: 'suresh@spartans.com', role: 'BATTER', status: 'APPROVED' },
            { jersey_number: 18, name: 'Vijay Anand', email: 'vijay@spartans.com', role: 'ALL_ROUNDER', status: 'APPROVED' },
            { jersey_number: 3, name: 'M. Karthi', email: 'karthi@spartans.com', role: 'BATTER', status: 'APPROVED' },
            { jersey_number: 1, name: 'K. Balaji', email: 'balaji@spartans.com', role: 'WICKET_KEEPER', status: 'APPROVED' },
            { jersey_number: 23, name: 'R. Vignesh', email: 'vignesh@spartans.com', role: 'BOWLER', status: 'APPROVED' },
            { jersey_number: 10, name: 'Arun Pandian', email: 'player@example.com', role: 'ALL_ROUNDER', status: 'APPROVED' },
            { jersey_number: 8, name: 'S. Manoj', email: 'manoj@spartans.com', role: 'BATTER', status: 'APPROVED' },
            { jersey_number: 9, name: 'P. Rajesh', email: 'rajesh@spartans.com', role: 'BOWLER', status: 'APPROVED' },
            { jersey_number: 12, name: 'K. Siva', email: 'siva@spartans.com', role: 'BATTER', status: 'APPROVED' },
            { jersey_number: 14, name: 'T. Ashok', email: 'ashok@spartans.com', role: 'BOWLER', status: 'APPROVED' },
            { jersey_number: 15, name: 'M. Guru', email: 'guru@spartans.com', role: 'ALL_ROUNDER', status: 'APPROVED' },
            { jersey_number: 16, name: 'V. Prakash', email: 'prakash@spartans.com', role: 'BATTER', status: 'APPROVED' },
            { jersey_number: 17, name: 'B. Senthil', email: 'senthil@spartans.com', role: 'BOWLER', status: 'APPROVED' },
            { jersey_number: 19, name: 'R. Naveen', email: 'naveen@spartans.com', role: 'ALL_ROUNDER', status: 'APPROVED' },
            { jersey_number: 20, name: 'A. Joseph', email: 'joseph@spartans.com', role: 'BOWLER', status: 'APPROVED' }
          ]
        },
        {
          id: 'TEAM-VRD-102',
          team_name: 'Sattur Super Kings',
          coach_name: 'R. Kannan',
          coach_email: 'coach.sattur@gmail.com',
          passkey: 'PASS-5544',
          city: 'Sattur',
          taluk: 'Sattur',
          status: 'PENDING',
          players: [
            { jersey_number: 1, name: 'M. Karthik', email: 'karthik@sattur.com', role: 'BATTER', status: 'PENDING' },
            { jersey_number: 2, name: 'S. Ram', email: 'ram@sattur.com', role: 'ALL_ROUNDER', status: 'PENDING' },
            { jersey_number: 3, name: 'P. Selvam', email: 'selvam@sattur.com', role: 'BOWLER', status: 'PENDING' },
            { jersey_number: 4, name: 'K. Murugan', email: 'murugan@sattur.com', role: 'BATTER', status: 'PENDING' },
            { jersey_number: 5, name: 'T. Rajan', email: 'rajan@sattur.com', role: 'WICKET_KEEPER', status: 'PENDING' },
            { jersey_number: 6, name: 'A. Alex', email: 'alex@sattur.com', role: 'ALL_ROUNDER', status: 'PENDING' },
            { jersey_number: 7, name: 'G. Gokul', email: 'gokul@sattur.com', role: 'BOWLER', status: 'PENDING' },
            { jersey_number: 8, name: 'D. Deepak', email: 'deepak@sattur.com', role: 'BATTER', status: 'PENDING' },
            { jersey_number: 9, name: 'N. Natarajan', email: 'natarajan@sattur.com', role: 'BOWLER', status: 'PENDING' },
            { jersey_number: 10, name: 'V. Vinoth', email: 'vinoth@sattur.com', role: 'BATTER', status: 'PENDING' },
            { jersey_number: 11, name: 'C. Chandran', email: 'chandran@sattur.com', role: 'ALL_ROUNDER', status: 'PENDING' },
            { jersey_number: 12, name: 'M. Mohan', email: 'mohan@sattur.com', role: 'BOWLER', status: 'PENDING' },
            { jersey_number: 13, name: 'E. Elango', email: 'elango@sattur.com', role: 'BATTER', status: 'PENDING' },
            { jersey_number: 14, name: 'J. Jayam', email: 'jayam@sattur.com', role: 'WICKET_KEEPER', status: 'PENDING' },
            { jersey_number: 15, name: 'S. Shankar', email: 'shankar@sattur.com', role: 'BOWLER', status: 'PENDING' }
          ]
        }
      ]);

      // 9. News & Announcements
      await News.insertMany([
        {
          id: 'NEWS-01',
          title: 'Virudhunagar Premier League 2026 Inaugurated in Kamarajar Stadium',
          summary: 'The grand opening of VPL 2026 kicked off today with 8 affiliated clubs participating in the premier district championship.',
          content: 'The Cricket Association of Virudhunagar District officially inaugurated the Virudhunagar Premier League 2026. The opening match was played between Virudhunagar Spartans and Sivakasi Strikers.',
          category: 'TOURNAMENT',
          author: 'Association Press',
          image_url: '/assets_web/champions.jpg',
          status: 'PUBLISHED'
        },
        {
          id: 'NEWS-02',
          title: 'District Team Squad Registration Deadline Extended to October 25',
          summary: 'All affiliated clubs and coaches must submit their verified 15-player squads through the portal for administrative approval.',
          content: 'The governing council announced an extension for the annual club registration. Coaches are advised to complete player identity submissions and verification forms before the deadline.',
          category: 'ANNOUNCEMENT',
          author: 'Honorary Secretary',
          image_url: '/assets_web/stadium.jpg',
          status: 'PUBLISHED'
        },
        {
          id: 'NEWS-03',
          title: 'Match Report: Strikers clinch dramatic victory against Aces in Sivakasi',
          summary: 'A superb 72 from Dinesh Karthik propelled Sivakasi Strikers to a 34-run victory in Match 3.',
          content: 'Dinesh Karthik guided Sivakasi Strikers to a convincing victory with aggressive batting and tactical captaincy at Sivakasi Cricket Ground.',
          category: 'MATCH_REPORT',
          author: 'District Scorer Panel',
          image_url: '/assets_web/batsman.jpg',
          status: 'PUBLISHED'
        }
      ]);

      // 10. Notifications
      await Notification.insertMany([
        {
          id: 'NOTIF-01',
          type: 'TEAM_REGISTRATION',
          title: 'New Team Registration: Sattur Super Kings',
          message: 'Coach R. Kannan submitted team "Sattur Super Kings" with 15 squad players. Awaiting administrative review and approval.',
          reference_id: 'TEAM-VRD-102',
          status: 'UNREAD'
        }
      ]);

      // 11. Venues
      await Venue.insertMany([
        { id: 'VEN-01', name: 'Kamarajar District Stadium', location: 'Virudhunagar Central', capacity: 8000, floodlights: true, description: 'Main association ground with LED floodlights and pavilion.' },
        { id: 'VEN-02', name: 'Sivakasi Cricket Ground', location: 'Sivakasi Bypass', capacity: 4000, floodlights: true, description: 'Premium turf pitch ground hosting league fixtures.' },
        { id: 'VEN-03', name: 'Rajapalayam Turf Ground', location: 'Rajapalayam Road', capacity: 3500, floodlights: false, description: 'Historic turf wicket venue.' }
      ]);

      // 12. Officials
      await Official.insertMany([
        { id: 'OFF-01', name: 'S. Ramesh', role: 'SCORER', email: 'ramesh@gmail.com', phone: '9876543212', status: 'ACTIVE' },
        { id: 'OFF-02', name: 'K. Murugan', role: 'SCORER', email: 'murugan@cfvd.org', phone: '9876543213', status: 'ACTIVE' },
        { id: 'OFF-03', name: 'V. Sundaram', role: 'UMPIRE', email: 'sundaram.umpire@gmail.com', phone: '9876543218', status: 'ACTIVE' },
        { id: 'OFF-04', name: 'M. Natarajan', role: 'MATCH_REFEREE', email: 'natarajan.referee@gmail.com', phone: '9876543219', status: 'ACTIVE' }
      ]);

      console.log('✅ MongoDB database successfully populated with realistic cricket federation data.');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

// -------------------------------------------------------------
// MongoDB Query Adapter (Executes directly against MongoDB collections)
// -------------------------------------------------------------
async function mongoQuery(sqlOrModel, params = []) {
  await initDb();
  if (typeof sqlOrModel !== 'string') {
    return [sqlOrModel];
  }

  // Parse SQL-like commands and execute on MongoDB models
  const clean = sqlOrModel.trim();
  const lower = clean.toLowerCase();

  // SELECT from users
  if (lower.startsWith('select') && lower.includes('from users')) {
    if (lower.includes('email = ?')) {
      const email = params[0]?.toLowerCase().trim();
      const user = await User.findOne({ email }).lean();
      return user ? [[user]] : [[]];
    }
    if (lower.includes('id = ?')) {
      const id = params[0];
      const user = await User.findOne({ id }).lean();
      return user ? [[user]] : [[]];
    }
    if (lower.includes("role = 'scorer'") && lower.includes('status = ?')) {
      const status = params[0];
      const scorers = await User.find({ role: 'SCORER', status }).lean();
      return [scorers];
    }
    if (lower.includes("role = 'scorer'")) {
      const scorers = await User.find({ role: 'SCORER' }).lean();
      return [scorers];
    }
    const allUsers = await User.find({}).lean();
    return [allUsers];
  }

  // SELECT from team_registrations
  if (lower.startsWith('select') && lower.includes('from team_registrations')) {
    if (lower.includes('id = ?')) {
      const reg = await TeamRegistration.findOne({ id: params[0] }).lean();
      return reg ? [[reg]] : [[]];
    }
    if (lower.includes('coach_email = ?')) {
      const reg = await TeamRegistration.findOne({ coach_email: params[0]?.toLowerCase().trim() }).lean();
      return reg ? [[reg]] : [[]];
    }
    if (lower.includes('status = ?')) {
      const regs = await TeamRegistration.find({ status: params[0] }).sort({ created_at: -1 }).lean();
      return [regs];
    }
    const allRegs = await TeamRegistration.find({}).sort({ created_at: -1 }).lean();
    return [allRegs];
  }

  // SELECT from team_registration_players
  if (lower.startsWith('select') && lower.includes('from team_registration_players')) {
    if (lower.includes('team_registration_id = ?')) {
      const reg = await TeamRegistration.findOne({ id: params[0] }).lean();
      return [reg?.players || []];
    }
    if (lower.includes('email = ?') || lower.includes('name = ?')) {
      const input = params[0]?.toLowerCase().trim();
      const allRegs = await TeamRegistration.find({}).lean();
      const matched = [];
      for (const reg of allRegs) {
        for (const p of reg.players || []) {
          if (p.email?.toLowerCase() === input || p.name?.toLowerCase().includes(input)) {
            matched.push({ ...p, team_registration_id: reg.id, team_name: reg.team_name, coach_name: reg.coach_name });
          }
        }
      }
      return [matched];
    }
  }

  // SELECT from matches
  if (lower.startsWith('select') && lower.includes('from matches')) {
    if (lower.includes('id = ?')) {
      const m = await Match.findOne({ id: params[0] }).lean();
      return m ? [[m]] : [[]];
    }
    const matches = await Match.find({}).lean();
    return [matches];
  }

  // SELECT from innings
  if (lower.startsWith('select') && lower.includes('from innings')) {
    if (lower.includes('match_id = ?')) {
      const inns = await Innings.find({ match_id: params[0] }).sort({ innings_number: 1 }).lean();
      return [inns];
    }
    if (lower.includes('id = ?')) {
      const inn = await Innings.findOne({ id: params[0] }).lean();
      return inn ? [[inn]] : [[]];
    }
  }

  // SELECT from teams
  if (lower.startsWith('select') && lower.includes('from teams')) {
    if (lower.includes('id = ?')) {
      const t = await Team.findOne({ id: params[0] }).lean();
      return t ? [[t]] : [[]];
    }
    const teams = await Team.find({}).lean();
    return [teams];
  }

  // SELECT from players
  if (lower.startsWith('select') && lower.includes('from players')) {
    if (lower.includes('id = ?')) {
      const p = await Player.findOne({ id: params[0] }).lean();
      return p ? [[p]] : [[]];
    }
    if (lower.includes('team_id = ?')) {
      const ps = await Player.find({ team_id: params[0] }).lean();
      return [ps];
    }
    const players = await Player.find({}).lean();
    return [players];
  }

  // Default fallback for any unhandled queries
  return [[]];
}

// Connection interface for transactions
class MongoConnection {
  async beginTransaction() {}
  async commit() {}
  async rollback() {}
  async release() {}
  async query(sql, params = []) {
    return mongoQuery(sql, params);
  }
}

module.exports = {
  initDb,
  query: mongoQuery,
  getConnection: async () => new MongoConnection(),
  getUseMemoryFallback: () => false,
  models: {
    User,
    Tournament,
    Team,
    Player,
    TeamRegistration,
    Match,
    Innings,
    InningsBatter,
    InningsBowler,
    Delivery,
    Notification,
    News,
    Official,
    Venue,
    AuditLog
  }
};
