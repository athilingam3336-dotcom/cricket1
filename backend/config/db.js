/**
 * config/db.js
 * 
 * MySQL Database Access Layer with connection pooling, parameterized queries,
 * transactional support, and transparent in-memory relational fallback engine.
 */

const mysql = require('mysql2/promise');

let pool = null;
let useMemoryFallback = true; // Start in fallback mode until verified connected

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cricket_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 1000 // Fast fail if MySQL daemon is absent
};

// In-Memory Relational Store
class RelationalMemoryStore {
  constructor() {
    this.tables = {
      users: [],
      tournaments: [],
      teams: [],
      team_players: [],
      players: [],
      matches: [],
      match_players: [],
      match_officials: [],
      scorer_assignments: [],
      innings: [],
      innings_batters: [],
      innings_bowlers: [],
      deliveries: [],
      otp_verifications: [],
      scorers: []
    };
    this.initDefaultSeed();
  }

  initDefaultSeed() {
    // 1. Users
    this.tables.users = [
      { id: 'ADM-1001', name: 'System Administrator', email: 'admin@example.com', mobile: '9876543210', password_hash: '1234', role: 'ADMIN', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() },
      { id: 'ADM-1002', name: 'Chief Administrator', email: 'admin@cfvd.org', mobile: '9876543210', password_hash: 'admin123', role: 'ADMIN', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() },
      { id: 'SCR-101', name: 'S. Ramesh', email: 'ramesh@gmail.com', mobile: '9876543212', password_hash: '1234', role: 'SCORER', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() },
      { id: 'SCR-102', name: 'S. Ramesh', email: 'scorer@cfvd.org', mobile: '9876543212', password_hash: '1234', role: 'SCORER', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() },
      { id: 'SCR-103', name: 'K. Murugan', email: 'murugan@cfvd.org', mobile: '9876543213', password_hash: '1234', role: 'SCORER', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() },
      { id: 'PLY-201', name: 'Arun Pandian', email: 'player@example.com', mobile: '9876543214', password_hash: 'player123', role: 'PLAYER', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() },
      { id: 'USR-301', name: 'General User', email: 'user@example.com', mobile: '9876543215', password_hash: 'user123', role: 'USER', status: 'ACTIVE', otp_hash: null, otp_expires_at: null, otp_verified_at: null, otp_attempts: 0, created_at: new Date(), updated_at: new Date() }
    ];

        // 1b. Official Scorers
    this.tables.scorers = [
      { id: 'SCR-101', full_name: 'S. Ramesh', email: 'ramesh@gmail.com', mobile: '9876543212', association: 'Virudhunagar District Cricket Association', status: 'APPROVED', otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_verified_at: null, created_at: new Date(), approved_at: new Date(), rejected_at: null, rejection_reason: null },
      { id: 'SCR-102', full_name: 'S. Ramesh', email: 'scorer@cfvd.org', mobile: '9876543212', association: 'Tamil Nadu Cricket Association (TNCA)', status: 'APPROVED', otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_verified_at: null, created_at: new Date(), approved_at: new Date(), rejected_at: null, rejection_reason: null },
      { id: 'SCR-103', full_name: 'K. Murugan', email: 'murugan@cfvd.org', mobile: '9876543213', association: 'Virudhunagar District Cricket Association', status: 'APPROVED', otp_hash: null, otp_expires_at: null, otp_attempts: 0, otp_verified_at: null, created_at: new Date(), approved_at: new Date(), rejected_at: null, rejection_reason: null }
    ];

    // 2. Tournament
    this.tables.tournaments = [
      { id: 'TOUR-2026', name: 'Virudhunagar Premier League (VPL) 2026', short_name: 'VPL 2026', season: '2026', format: 'T20', overs: 20, start_date: '2026-10-01', end_date: '2026-10-30', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() }
    ];

        // 3. Teams & Team Players (Initialized Empty for Real Data Only)
    this.tables.teams = [];
    this.tables.team_players = [];

    // 4. Players
    this.tables.players = [
      // AKA Players (T003)
      { id: 'P301', team_id: 'T003', name: 'Suresh Kumar', jersey_number: 7, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_OFF_BREAK', status: 'ACTIVE' },
      { id: 'P302', team_id: 'T003', name: 'Muthu Raj', jersey_number: 18, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_MEDIUM', status: 'ACTIVE' },
      { id: 'P303', team_id: 'T003', name: 'Vijay', jersey_number: 45, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P304', team_id: 'T003', name: 'R. Anbarasan', jersey_number: 10, role: 'ALL_ROUNDER', batting_style: 'LEFT_HAND', bowling_style: 'LEFT_ARM_ORTHODOX', status: 'ACTIVE' },
      { id: 'P305', team_id: 'T003', name: 'G. Balaji', jersey_number: 99, role: 'ALL_ROUNDER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_FAST', status: 'ACTIVE' },
      { id: 'P306', team_id: 'T003', name: 'K. Deepan', jersey_number: 23, role: 'WICKET_KEEPER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P307', team_id: 'T003', name: 'M. Elango', jersey_number: 11, role: 'BOWLER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_FAST', status: 'ACTIVE' },
      { id: 'P308', team_id: 'T003', name: 'S. Francis', jersey_number: 8, role: 'BOWLER', batting_style: 'LEFT_HAND', bowling_style: 'LEFT_ARM_FAST', status: 'ACTIVE' },
      { id: 'P309', team_id: 'T003', name: 'T. Ganesan', jersey_number: 3, role: 'BOWLER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_LEG_BREAK', status: 'ACTIVE' },
      { id: 'P310', team_id: 'T003', name: 'V. Hari', jersey_number: 17, role: 'BATTER', batting_style: 'LEFT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P311', team_id: 'T003', name: 'N. Iniyan', jersey_number: 33, role: 'BOWLER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_OFF_BREAK', status: 'ACTIVE' },
      // RPR Players (T004)
      { id: 'P401', team_id: 'T004', name: 'Karthik N', jersey_number: 12, role: 'BOWLER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_FAST_MEDIUM', status: 'ACTIVE' },
      { id: 'P402', team_id: 'T004', name: 'Saravanan', jersey_number: 25, role: 'BOWLER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_OFF_BREAK', status: 'ACTIVE' },
      { id: 'P403', team_id: 'T004', name: 'Praveen K', jersey_number: 9, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P404', team_id: 'T004', name: 'Dinesh M', jersey_number: 14, role: 'ALL_ROUNDER', batting_style: 'LEFT_HAND', bowling_style: 'LEFT_ARM_FAST', status: 'ACTIVE' },
      { id: 'P405', team_id: 'T004', name: 'Ashok Kumar', jersey_number: 21, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P406', team_id: 'T004', name: 'Rajesh S', jersey_number: 55, role: 'WICKET_KEEPER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P407', team_id: 'T004', name: 'Vignesh P', jersey_number: 88, role: 'BOWLER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_LEG_BREAK', status: 'ACTIVE' },
      { id: 'P408', team_id: 'T004', name: 'Manikandan', jersey_number: 30, role: 'ALL_ROUNDER', batting_style: 'RIGHT_HAND', bowling_style: 'RIGHT_ARM_MEDIUM', status: 'ACTIVE' },
      { id: 'P409', team_id: 'T004', name: 'Selvam R', jersey_number: 16, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P410', team_id: 'T004', name: 'Gokul V', jersey_number: 5, role: 'BOWLER', batting_style: 'LEFT_HAND', bowling_style: 'LEFT_ARM_ORTHODOX', status: 'ACTIVE' },
      { id: 'P411', team_id: 'T004', name: 'Aravind B', jersey_number: 2, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      // VST Players (T001)
      { id: 'P101', team_id: 'T001', name: 'Arun Pandian', jersey_number: 1, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P102', team_id: 'T001', name: 'Bala Subramanian', jersey_number: 19, role: 'BATTER', batting_style: 'LEFT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      // SSK Players (T002)
      { id: 'P201', team_id: 'T002', name: 'Ravi Chandran', jersey_number: 11, role: 'BATTER', batting_style: 'RIGHT_HAND', bowling_style: 'NONE', status: 'ACTIVE' },
      { id: 'P202', team_id: 'T002', name: 'Senthil Nathan', jersey_number: 28, role: 'ALL_ROUNDER', batting_style: 'LEFT_HAND', bowling_style: 'LEFT_ARM_FAST', status: 'ACTIVE' }
    ];

    // 5. Matches
    this.tables.matches = [
      {
        id: 'M001',
        tournament_id: 'TOUR-2026',
        venue_id: 'VEN-01',
        venue_name: 'Kamarajar Stadium, Virudhunagar',
        team_a_id: 'T001',
        team_b_id: 'T002',
        scheduled_date: '2026-10-15',
        scheduled_time: '10:00 AM',
        overs: 20,
        status: 'SCHEDULED',
        toss_winner: null,
        toss_decision: null,
        current_innings: 1,
        current_over: 0,
        current_ball: 0,
        winner_team_id: null,
        result_text: null
      },
      {
        id: 'M002',
        tournament_id: 'TOUR-2026',
        venue_id: 'VEN-02',
        venue_name: 'Srivilliputhur Ground',
        team_a_id: 'T003',
        team_b_id: 'T004',
        scheduled_date: '2026-10-16',
        scheduled_time: '02:00 PM',
        overs: 20,
        status: 'LIVE',
        toss_winner: 'T003',
        toss_decision: 'BAT',
        current_innings: 1,
        current_over: 15,
        current_ball: 2,
        winner_team_id: null,
        result_text: 'Match in Progress - Innings 1'
      },
      {
        id: 'M003',
        tournament_id: 'TOUR-2026',
        venue_id: 'VEN-01',
        venue_name: 'Kamarajar Stadium, Virudhunagar',
        team_a_id: 'T005',
        team_b_id: 'T001',
        scheduled_date: '2026-10-10',
        scheduled_time: '10:00 AM',
        overs: 20,
        status: 'COMPLETED',
        toss_winner: 'T004',
        toss_decision: 'BAT',
        current_innings: 2,
        current_over: 18,
        current_ball: 4,
        winner_team_id: 'T001',
        result_text: 'Virudhunagar Strikers won by 7 wickets'
      }
    ];

    // 6. Scorer assignments
    this.tables.scorer_assignments = [
      { id: 'SA-001', match_id: 'M001', scorer_id: 'SCR-101', assigned_by: 'ADM-1001', status: 'ASSIGNED', assigned_at: new Date('2026-10-01') },
      { id: 'SA-002', match_id: 'M002', scorer_id: 'SCR-101', assigned_by: 'ADM-1001', status: 'ACTIVE', assigned_at: new Date('2026-10-01') },
      { id: 'SA-003', match_id: 'M003', scorer_id: 'SCR-101', assigned_by: 'ADM-1001', status: 'COMPLETED', assigned_at: new Date('2026-10-01') }
    ];

    // 7. Innings
    this.tables.innings = [
      {
        id: 'INN-M002-1',
        match_id: 'M002',
        innings_number: 1,
        batting_team_id: 'T003',
        bowling_team_id: 'T004',
        total_runs: 145,
        wickets: 4,
        overs: 15,
        balls: 2,
        target: null,
        status: 'LIVE',
        started_at: new Date('2026-10-16 14:05:00')
      },
      {
        id: 'INN-M003-1',
        match_id: 'M003',
        innings_number: 1,
        batting_team_id: 'T005',
        bowling_team_id: 'T001',
        total_runs: 160,
        wickets: 8,
        overs: 20,
        balls: 0,
        target: null,
        status: 'COMPLETED',
        started_at: new Date('2026-10-10 10:00:00'),
        ended_at: new Date('2026-10-10 11:35:00')
      },
      {
        id: 'INN-M003-2',
        match_id: 'M003',
        innings_number: 2,
        batting_team_id: 'T001',
        bowling_team_id: 'T005',
        total_runs: 162,
        wickets: 3,
        overs: 18,
        balls: 4,
        target: 161,
        status: 'COMPLETED',
        started_at: new Date('2026-10-10 11:50:00'),
        ended_at: new Date('2026-10-10 13:15:00')
      }
    ];

    // 8. Innings Batters
    this.tables.innings_batters = [
      { id: 'IB-01', innings_id: 'INN-M002-1', player_id: 'P301', batting_position: 1, runs: 45, balls: 31, fours: 5, sixes: 1, strike_rate: 145.16, is_striker: true, is_out: false, dismissal_type: null, dismissed_by: null, dismissal_ball: null },
      { id: 'IB-02', innings_id: 'INN-M002-1', player_id: 'P302', batting_position: 2, runs: 12, balls: 10, fours: 1, sixes: 0, strike_rate: 120.00, is_striker: false, is_out: true, dismissal_type: 'BOWLED', dismissed_by: 'P401', dismissal_ball: '3.4' },
      { id: 'IB-03', innings_id: 'INN-M002-1', player_id: 'P303', batting_position: 3, runs: 18, balls: 12, fours: 2, sixes: 0, strike_rate: 150.00, is_striker: false, is_out: false, dismissal_type: null, dismissed_by: null, dismissal_ball: null },
      { id: 'IB-04', innings_id: 'INN-M002-1', player_id: 'P304', batting_position: 4, runs: 25, balls: 18, fours: 3, sixes: 0, strike_rate: 138.89, is_striker: false, is_out: true, dismissal_type: 'CAUGHT', dismissed_by: 'P402', dismissal_ball: '8.2' },
      { id: 'IB-05', innings_id: 'INN-M002-1', player_id: 'P305', batting_position: 5, runs: 34, balls: 21, fours: 2, sixes: 2, strike_rate: 161.90, is_striker: false, is_out: true, dismissal_type: 'LBW', dismissed_by: 'P401', dismissal_ball: '12.5' },
      // Batters for M003 Innings 1 (T005 Sattur Spartans batting)
      { id: 'IB-M003-1-1', innings_id: 'INN-M003-1', player_id: 'P301', batting_position: 1, runs: 42, balls: 30, fours: 4, sixes: 1, strike_rate: 140.00, is_striker: false, is_out: true, dismissal_type: 'CAUGHT', dismissed_by: 'P402', dismissal_ball: '8.4' },
      { id: 'IB-M003-1-2', innings_id: 'INN-M003-1', player_id: 'P302', batting_position: 2, runs: 12, balls: 10, fours: 1, sixes: 0, strike_rate: 120.00, is_striker: false, is_out: true, dismissal_type: 'BOWLED', dismissed_by: 'P401', dismissal_ball: '3.2' },
      { id: 'IB-M003-1-3', innings_id: 'INN-M003-1', player_id: 'P303', batting_position: 3, runs: 18, balls: 14, fours: 2, sixes: 0, strike_rate: 128.57, is_striker: false, is_out: true, dismissal_type: 'LBW', dismissed_by: 'P401', dismissal_ball: '6.1' },
      { id: 'IB-M003-1-4', innings_id: 'INN-M003-1', player_id: 'P304', batting_position: 4, runs: 26, balls: 19, fours: 2, sixes: 1, strike_rate: 136.84, is_striker: false, is_out: true, dismissal_type: 'CAUGHT', dismissed_by: 'P402', dismissal_ball: '13.2' },
      { id: 'IB-M003-1-5', innings_id: 'INN-M003-1', player_id: 'P305', batting_position: 5, runs: 32, balls: 22, fours: 3, sixes: 1, strike_rate: 145.45, is_striker: false, is_out: false, dismissal_type: null, dismissed_by: null, dismissal_ball: null },
      { id: 'IB-M003-1-6', innings_id: 'INN-M003-1', player_id: 'P306', batting_position: 6, runs: 11, balls: 8, fours: 1, sixes: 0, strike_rate: 137.50, is_striker: false, is_out: true, dismissal_type: 'RUN_OUT', dismissed_by: null, dismissal_ball: '16.1' },
      { id: 'IB-M003-1-7', innings_id: 'INN-M003-1', player_id: 'P307', batting_position: 7, runs: 8, balls: 9, fours: 0, sixes: 0, strike_rate: 88.89, is_striker: false, is_out: true, dismissal_type: 'BOWLED', dismissed_by: 'P402', dismissal_ball: '18.2' },
      { id: 'IB-M003-1-8', innings_id: 'INN-M003-1', player_id: 'P308', batting_position: 8, runs: 0, balls: 2, fours: 0, sixes: 0, strike_rate: 0.00, is_striker: false, is_out: true, dismissal_type: 'CAUGHT_AND_BOWLED', dismissed_by: 'P401', dismissal_ball: '18.5' },
      { id: 'IB-M003-1-9', innings_id: 'INN-M003-1', player_id: 'P309', batting_position: 9, runs: 0, balls: 1, fours: 0, sixes: 0, strike_rate: 0.00, is_striker: false, is_out: false, dismissal_type: null, dismissed_by: null, dismissal_ball: null },

      // Batters for M003 Innings 2 (T001 batting)
      { id: 'IB-M003-2-1', innings_id: 'INN-M003-2', player_id: 'P101', batting_position: 1, runs: 58, balls: 38, fours: 6, sixes: 2, strike_rate: 152.63, is_striker: false, is_out: false, dismissal_type: null, dismissed_by: null, dismissal_ball: null },
      { id: 'IB-M003-2-2', innings_id: 'INN-M003-2', player_id: 'P102', batting_position: 2, runs: 34, balls: 26, fours: 4, sixes: 0, strike_rate: 130.77, is_striker: false, is_out: true, dismissal_type: 'CAUGHT', dismissed_by: 'P401', dismissal_ball: '9.3' },
      { id: 'IB-M003-2-3', innings_id: 'INN-M003-2', player_id: 'P107', batting_position: 3, runs: 46, balls: 32, fours: 5, sixes: 1, strike_rate: 143.75, is_striker: false, is_out: false, dismissal_type: null, dismissed_by: null, dismissal_ball: null }
    ];

    // 9. Innings Bowlers
    this.tables.innings_bowlers = [
      { id: 'IBW-01', innings_id: 'INN-M002-1', player_id: 'P401', overs: 3, balls: 2, maidens: 0, runs_conceded: 28, wickets: 2, no_balls: 1, wides: 2, economy: 8.40 },
      { id: 'IBW-02', innings_id: 'INN-M002-1', player_id: 'P402', overs: 4, balls: 0, maidens: 0, runs_conceded: 32, wickets: 1, no_balls: 0, wides: 1, economy: 8.00 },
      { id: 'IBW-03', innings_id: 'INN-M002-1', player_id: 'P407', overs: 3, balls: 0, maidens: 0, runs_conceded: 26, wickets: 0, no_balls: 0, wides: 1, economy: 8.67 },
      // Bowlers for M003 Innings 1
      { id: 'IBW-M003-1-1', innings_id: 'INN-M003-1', player_id: 'P401', overs: 4, balls: 0, maidens: 0, runs_conceded: 28, wickets: 2, no_balls: 0, wides: 2, economy: 7.00 },
      { id: 'IBW-M003-1-2', innings_id: 'INN-M003-1', player_id: 'P402', overs: 4, balls: 0, maidens: 0, runs_conceded: 32, wickets: 2, no_balls: 1, wides: 2, economy: 8.00 },
      { id: 'IBW-M003-1-3', innings_id: 'INN-M003-1', player_id: 'P102', overs: 4, balls: 0, maidens: 0, runs_conceded: 30, wickets: 1, no_balls: 0, wides: 1, economy: 7.50 },
      { id: 'IBW-M003-1-4', innings_id: 'INN-M003-1', player_id: 'P101', overs: 4, balls: 0, maidens: 0, runs_conceded: 34, wickets: 1, no_balls: 0, wides: 1, economy: 8.50 },
      { id: 'IBW-M003-1-5', innings_id: 'INN-M003-1', player_id: 'P202', overs: 4, balls: 0, maidens: 0, runs_conceded: 25, wickets: 1, no_balls: 0, wides: 0, economy: 6.25 },

      // Bowlers for M003 Innings 2
      { id: 'IBW-M003-2-1', innings_id: 'INN-M003-2', player_id: 'P401', overs: 4, balls: 0, maidens: 0, runs_conceded: 35, wickets: 1, no_balls: 1, wides: 2, economy: 8.75 },
      { id: 'IBW-M003-2-2', innings_id: 'INN-M003-2', player_id: 'P402', overs: 4, balls: 0, maidens: 0, runs_conceded: 30, wickets: 1, no_balls: 0, wides: 1, economy: 7.50 }
    ];

    // 10. Deliveries
    this.tables.deliveries = [
      // Extras deliveries for M003 Innings 1 (6 Wides, 1 No Ball, 2 Byes, 2 Leg Byes = 11 Extras)
      { id: 'DEL-M003-WD1', innings_id: 'INN-M003-1', over_number: 2, ball_number: 1, striker_id: 'P301', bowler_id: 'P401', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'WIDE', wicket: false, is_legal_delivery: false, commentary: 'Wide ball.', created_at: new Date() },
      { id: 'DEL-M003-WD2', innings_id: 'INN-M003-1', over_number: 4, ball_number: 3, striker_id: 'P303', bowler_id: 'P402', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'WIDE', wicket: false, is_legal_delivery: false, commentary: 'Wide ball.', created_at: new Date() },
      { id: 'DEL-M003-WD3', innings_id: 'INN-M003-1', over_number: 7, ball_number: 2, striker_id: 'P301', bowler_id: 'P401', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'WIDE', wicket: false, is_legal_delivery: false, commentary: 'Wide ball down the leg side.', created_at: new Date() },
      { id: 'DEL-M003-WD4', innings_id: 'INN-M003-1', over_number: 11, ball_number: 4, striker_id: 'P304', bowler_id: 'P402', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'WIDE', wicket: false, is_legal_delivery: false, commentary: 'Wide ball outside off.', created_at: new Date() },
      { id: 'DEL-M003-WD5', innings_id: 'INN-M003-1', over_number: 15, ball_number: 1, striker_id: 'P305', bowler_id: 'P102', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'WIDE', wicket: false, is_legal_delivery: false, commentary: 'Wide ball.', created_at: new Date() },
      { id: 'DEL-M003-WD6', innings_id: 'INN-M003-1', over_number: 17, ball_number: 5, striker_id: 'P305', bowler_id: 'P101', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'WIDE', wicket: false, is_legal_delivery: false, commentary: 'Wide ball over the batter head.', created_at: new Date() },
      { id: 'DEL-M003-NB1', innings_id: 'INN-M003-1', over_number: 5, ball_number: 2, striker_id: 'P303', bowler_id: 'P402', runs_batter: 0, runs_extras: 1, total_runs: 1, extra_type: 'NO_BALL', wicket: false, is_legal_delivery: false, commentary: 'No ball, overstepping.', created_at: new Date() },
      { id: 'DEL-M003-BY1', innings_id: 'INN-M003-1', over_number: 9, ball_number: 1, striker_id: 'P304', bowler_id: 'P401', runs_batter: 0, runs_extras: 2, total_runs: 2, extra_type: 'BYE', wicket: false, is_legal_delivery: true, commentary: '2 byes.', created_at: new Date() },
      { id: 'DEL-M003-LB1', innings_id: 'INN-M003-1', over_number: 13, ball_number: 3, striker_id: 'P305', bowler_id: 'P102', runs_batter: 0, runs_extras: 2, total_runs: 2, extra_type: 'LEG_BYE', wicket: false, is_legal_delivery: true, commentary: '2 leg byes off the pad.', created_at: new Date() },

      { id: 'DEL-01', innings_id: 'INN-M002-1', over_number: 16, ball_number: 1, striker_id: 'P301', non_striker_id: 'P303', bowler_id: 'P401', runs_batter: 1, runs_extras: 0, total_runs: 1, extra_type: 'NONE', wicket: false, wicket_type: null, dismissed_player_id: null, boundary_type: null, is_legal_delivery: true, commentary: 'Suresh Kumar pushes to mid-off for 1 run.', created_by: 'SCR-101', created_at: new Date() },
      { id: 'DEL-02', innings_id: 'INN-M002-1', over_number: 16, ball_number: 2, striker_id: 'P303', non_striker_id: 'P301', bowler_id: 'P401', runs_batter: 0, runs_extras: 0, total_runs: 0, extra_type: 'NONE', wicket: false, wicket_type: null, dismissed_player_id: null, boundary_type: null, is_legal_delivery: true, commentary: 'Vijay defends solidly on the front foot, dot ball.', created_by: 'SCR-101', created_at: new Date() }
    ];
  }
}

const memoryStore = new RelationalMemoryStore();

// Attempt async connection
async function initDb() {
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    conn.release();
    useMemoryFallback = false;
    console.log('✅ Connected to MySQL Database Server');
  } catch (err) {
    useMemoryFallback = true;
    // console.log('⚠️ MySQL connection skipped. Running with active In-Memory Relational Engine.');
  }
}

// Transactional Connection Interface
class MemoryConnection {
  constructor(store) {
    this.store = store;
    this.snapshot = null;
  }

  async beginTransaction() {
    this.snapshot = JSON.parse(JSON.stringify(this.store.tables));
  }

  async commit() {
    this.snapshot = null;
  }

  async rollback() {
    if (this.snapshot) {
      this.store.tables = this.snapshot;
      this.snapshot = null;
    }
  }

  async release() {
    this.snapshot = null;
  }

  async query(sql, params = []) {
    return executeMemoryQuery(this.store, sql, params);
  }
}

// SQL Executor for in-memory fallback
function executeMemoryQuery(store, sql, params = []) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upper = cleanSql.toUpperCase();

  // SELECT queries
  if (upper.startsWith('SELECT')) {
    const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) return [[]];
    const tableName = fromMatch[1].toLowerCase();
    const rows = store.tables[tableName] || [];

    let filtered = [...rows];
    const whereMatch = cleanSql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+|\s+GROUP\s+|\s+LIMIT\s+|$)/i);
    if (whereMatch) {
      filtered = applyWhere(filtered, whereMatch[1], params);
    }

    // ORDER BY
    const orderMatch = cleanSql.match(/ORDER BY\s+([a-zA-Z0-9_]+)\s*(ASC|DESC)?/i);
    if (orderMatch) {
      const col = orderMatch[1].toLowerCase();
      const isDesc = (orderMatch[2] || 'ASC').toUpperCase() === 'DESC';
      filtered.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    // LIMIT
    const limitMatch = cleanSql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      filtered = filtered.slice(0, parseInt(limitMatch[1], 10));
    }

    return [filtered];
  }

  // INSERT INTO queries
  if (upper.startsWith('INSERT INTO')) {
    const tableMatch = cleanSql.match(/INSERT INTO\s+([a-zA-Z0-9_]+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      if (!store.tables[tableName]) store.tables[tableName] = [];

      const colsMatch = cleanSql.match(/\((.*?)\)\s*VALUES/i);
      if (colsMatch) {
        const cols = colsMatch[1].split(',').map(c => c.trim().toLowerCase());
        const row = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx] !== undefined ? params[idx] : null;
        });
        if (!row.id) row.id = 'ID-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        store.tables[tableName].push(row);
        return [{ insertId: row.id, affectedRows: 1 }];
      }
    }
    return [{ affectedRows: 1 }];
  }

  // UPDATE queries
  if (upper.startsWith('UPDATE')) {
    const tableMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      const rows = store.tables[tableName] || [];

      const setMatch = cleanSql.match(/SET\s+(.+?)\s+WHERE\s+(.+)$/i);
      if (setMatch) {
        const setClause = setMatch[1];
        const whereClause = setMatch[2];

        // Number of ? in SET clause
        const setPlaceholders = (setClause.match(/\?/g) || []).length;
        const setParams = params.slice(0, setPlaceholders);
        const whereParams = params.slice(setPlaceholders);

        const assignments = setClause.split(',').map(s => s.trim());
        const targetRows = applyWhere(rows, whereClause, whereParams);

        targetRows.forEach(r => {
          let pIdx = 0;
          assignments.forEach(assign => {
            const parts = assign.split('=');
            const colName = parts[0].trim().toLowerCase();
            const valPart = parts[1] ? parts[1].trim() : '';
            if (valPart.includes('?')) {
              r[colName] = setParams[pIdx++];
            } else if (valPart.toUpperCase() === 'NULL') {
              r[colName] = null;
            } else if (valPart.toUpperCase() === 'NOW()') {
              r[colName] = new Date();
            } else {
              r[colName] = valPart.replace(/^['"]|['"]$/g, '');
            }
          });
        });

        return [{ affectedRows: targetRows.length }];
      }
    }
  }

  // DELETE queries
  if (upper.startsWith('DELETE FROM')) {
    const tableMatch = cleanSql.match(/DELETE FROM\s+([a-zA-Z0-9_]+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      const whereMatch = cleanSql.match(/WHERE\s+(.+)$/i);
      if (whereMatch && store.tables[tableName]) {
        const toKeep = [];
        store.tables[tableName].forEach(r => {
          const match = applyWhere([r], whereMatch[1], params);
          if (match.length === 0) toKeep.push(r);
        });
        const deletedCount = store.tables[tableName].length - toKeep.length;
        store.tables[tableName] = toKeep;
        return [{ affectedRows: deletedCount }];
      }
    }
  }

  return [[]];
}

function applyWhere(rows, condition, params) {
  const cleanCond = (condition || '').trim();
  if (!cleanCond) return rows;

  // Support OR clauses (e.g. LOWER(team_id) = ? OR LOWER(coach_email) = ?)
  if (/\s+OR\s+/i.test(cleanCond)) {
    const parts = cleanCond.split(/\s+OR\s+/i);
    let paramIdx = 0;
    const resultSets = parts.map(part => {
      const pCount = (part.match(/\?/g) || []).length;
      const subParams = params.slice(paramIdx, paramIdx + pCount);
      paramIdx += pCount;
      return applyWhere(rows, part, subParams);
    });

    const resMap = new Map();
    resultSets.forEach(subRows => {
      subRows.forEach(r => resMap.set(r.id || JSON.stringify(r), r));
    });
    return Array.from(resMap.values());
  }

  // Split condition by AND (case-insensitive)
  const subConditions = cleanCond.split(/\s+AND\s+/i);
  let paramIdx = 0;

  const parsedConditions = subConditions.map(sub => {
    const trimmed = sub.trim();
    const eqMatch = trimmed.match(/^(?:LOWER\s*\(\s*)?([a-zA-Z0-9_]+)(?:\s*\))?\s*=\s*\?$/i);
    if (eqMatch) {
      const col = eqMatch[1].toLowerCase();
      const val = params[paramIdx++];
      return { col, val };
    }
    const literalMatch = trimmed.match(/^(?:LOWER\s*\(\s*)?([a-zA-Z0-9_]+)(?:\s*\))?\s*=\s*['"]?([^'"]+)['"]?$/i);
    if (literalMatch) {
      const col = literalMatch[1].toLowerCase();
      const val = literalMatch[2].trim();
      return { col, val };
    }
    return null;
  });

  return rows.filter(row => {
    for (const cond of parsedConditions) {
      if (!cond) continue;
      const rowVal = row[cond.col];
      const targetVal = cond.val;

      if (rowVal === undefined || rowVal === null) return false;

      if (typeof targetVal === 'string' || typeof rowVal === 'string') {
        if (String(rowVal).toLowerCase() !== String(targetVal).toLowerCase()) return false;
      } else {
        if (rowVal != targetVal) return false;
      }
    }
    return true;
  });
}

async function query(sql, params = []) {
  if (useMemoryFallback || !pool) {
    return executeMemoryQuery(memoryStore, sql, params);
  }
  return pool.query(sql, params);
}

async function getConnection() {
  if (useMemoryFallback || !pool) {
    return new MemoryConnection(memoryStore);
  }
  return pool.getConnection();
}

initDb();

module.exports = {
  query,
  getConnection,
  getUseMemoryFallback: () => useMemoryFallback,
  memoryStore,
  pool
};

