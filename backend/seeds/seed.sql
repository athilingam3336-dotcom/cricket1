-- Cricket Federation Seed Data

-- 1. Users
INSERT INTO users (id, name, email, mobile, password_hash, role, status) VALUES
('SCR-101', 'S. Ramesh', 'scorer@cfvd.org', '9876543212', '1234', 'SCORER', 'ACTIVE'),
('SCR-102', 'K. Murugan', 'murugan@cfvd.org', '9876543213', '1234', 'SCORER', 'ACTIVE'),
('ADM-1001', 'Chief Administrator', 'admin@cfvd.org', '9876543210', 'admin123', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Tournament
INSERT INTO tournaments (id, name, short_name, season, format, overs, start_date, end_date, status) VALUES
('TOUR-2026', 'Virudhunagar Premier League (VPL) 2026', 'VPL 2026', '2026', 'T20', 20, '2026-10-01', '2026-10-30', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Teams
INSERT INTO teams (id, name, short_name, logo_url, city, status) VALUES
('T005', 'Sattur Spartans', 'SSP', '/assets/teams/ssp.png', 'Sattur', 'ACTIVE'),
('T001', 'Virudhunagar Strikers', 'VST', '/assets/teams/vst.png', 'Virudhunagar', 'ACTIVE'),
('T002', 'Sivakasi Super Kings', 'SSK', '/assets/teams/ssk.png', 'Sivakasi', 'ACTIVE'),
('T003', 'Aruppukottai Avengers', 'AKA', '/assets/teams/aka.png', 'Aruppukottai', 'ACTIVE'),
('T004', 'Rajapalayam Royals', 'RPR', '/assets/teams/rpr.png', 'Rajapalayam', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Players (Team Aruppukottai Avengers - T003)
INSERT INTO players (id, team_id, name, jersey_number, role, batting_style, bowling_style, status) VALUES
('P301', 'T003', 'Suresh Kumar', 7, 'BATTER', 'RIGHT_HAND', 'RIGHT_ARM_OFF_BREAK', 'ACTIVE'),
('P302', 'T003', 'Muthu Raj', 18, 'BATTER', 'RIGHT_HAND', 'RIGHT_ARM_MEDIUM', 'ACTIVE'),
('P303', 'T003', 'Vijay', 45, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P304', 'T003', 'R. Anbarasan', 10, 'ALL_ROUNDER', 'LEFT_HAND', 'LEFT_ARM_ORTHODOX', 'ACTIVE'),
('P305', 'T003', 'G. Balaji', 99, 'ALL_ROUNDER', 'RIGHT_HAND', 'RIGHT_ARM_FAST', 'ACTIVE'),
('P306', 'T003', 'K. Deepan', 23, 'WICKET_KEEPER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P307', 'T003', 'M. Elango', 11, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_FAST', 'ACTIVE'),
('P308', 'T003', 'S. Francis', 8, 'BOWLER', 'LEFT_HAND', 'LEFT_ARM_FAST', 'ACTIVE'),
('P309', 'T003', 'T. Ganesan', 3, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_LEG_BREAK', 'ACTIVE'),
('P310', 'T003', 'V. Hari', 17, 'BATTER', 'LEFT_HAND', 'NONE', 'ACTIVE'),
('P311', 'T003', 'N. Iniyan', 33, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_OFF_BREAK', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Players (Team Rajapalayam Royals - T004)
INSERT INTO players (id, team_id, name, jersey_number, role, batting_style, bowling_style, status) VALUES
('P401', 'T004', 'Karthik N', 12, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_FAST_MEDIUM', 'ACTIVE'),
('P402', 'T004', 'Saravanan', 25, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_OFF_BREAK', 'ACTIVE'),
('P403', 'T004', 'Praveen K', 9, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P404', 'T004', 'Dinesh M', 14, 'ALL_ROUNDER', 'LEFT_HAND', 'LEFT_ARM_FAST', 'ACTIVE'),
('P405', 'T004', 'Ashok Kumar', 21, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P406', 'T004', 'Rajesh S', 55, 'WICKET_KEEPER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P407', 'T004', 'Vignesh P', 88, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_LEG_BREAK', 'ACTIVE'),
('P408', 'T004', 'Manikandan', 30, 'ALL_ROUNDER', 'RIGHT_HAND', 'RIGHT_ARM_MEDIUM', 'ACTIVE'),
('P409', 'T004', 'Selvam R', 16, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P410', 'T004', 'Gokul V', 5, 'BOWLER', 'LEFT_HAND', 'LEFT_ARM_ORTHODOX', 'ACTIVE'),
('P411', 'T004', 'Aravind B', 2, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Players (Team Virudhunagar Strikers - T001)
INSERT INTO players (id, team_id, name, jersey_number, role, batting_style, bowling_style, status) VALUES
('P101', 'T001', 'Arun Pandian', 1, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P102', 'T001', 'Bala Subramanian', 19, 'BATTER', 'LEFT_HAND', 'NONE', 'ACTIVE'),
('P103', 'T001', 'Chandran S', 77, 'ALL_ROUNDER', 'RIGHT_HAND', 'RIGHT_ARM_FAST', 'ACTIVE'),
('P104', 'T001', 'Dhanush K', 22, 'WICKET_KEEPER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P105', 'T001', 'Eswaran M', 44, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_MEDIUM', 'ACTIVE'),
('P106', 'T001', 'Giri Prasad', 13, 'BOWLER', 'LEFT_HAND', 'LEFT_ARM_SPIN', 'ACTIVE'),
('P107', 'T001', 'Hari Haran', 31, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P108', 'T001', 'Jeeva N', 6, 'ALL_ROUNDER', 'RIGHT_HAND', 'RIGHT_ARM_OFF_SPIN', 'ACTIVE'),
('P109', 'T001', 'Kabilan R', 27, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_FAST', 'ACTIVE'),
('P110', 'T001', 'Loganathan', 90, 'BATTER', 'LEFT_HAND', 'NONE', 'ACTIVE'),
('P111', 'T001', 'Manoj Kumar', 15, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_MEDIUM', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Players (Team Sivakasi Super Kings - T002)
INSERT INTO players (id, team_id, name, jersey_number, role, batting_style, bowling_style, status) VALUES
('P201', 'T002', 'Ravi Chandran', 11, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P202', 'T002', 'Senthil Nathan', 28, 'ALL_ROUNDER', 'LEFT_HAND', 'LEFT_ARM_FAST', 'ACTIVE'),
('P203', 'T002', 'Thirumalai', 34, 'WICKET_KEEPER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P204', 'T002', 'Udhaya Kumar', 52, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_LEG_SPIN', 'ACTIVE'),
('P205', 'T002', 'Vel Murugan', 61, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_FAST', 'ACTIVE'),
('P206', 'T002', 'Yuvaraj S', 4, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P207', 'T002', 'Boopalan', 18, 'BATTER', 'LEFT_HAND', 'NONE', 'ACTIVE'),
('P208', 'T002', 'Deva Raj', 72, 'BOWLER', 'LEFT_HAND', 'LEFT_ARM_ORTHODOX', 'ACTIVE'),
('P209', 'T002', 'Elumalai', 81, 'ALL_ROUNDER', 'RIGHT_HAND', 'RIGHT_ARM_MEDIUM', 'ACTIVE'),
('P210', 'T002', 'Gnanam V', 95, 'BATTER', 'RIGHT_HAND', 'NONE', 'ACTIVE'),
('P211', 'T002', 'Inbaraj K', 29, 'BOWLER', 'RIGHT_HAND', 'RIGHT_ARM_OFF_SPIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Matches
INSERT INTO matches (id, tournament_id, venue_id, venue_name, team_a_id, team_b_id, scheduled_date, scheduled_time, overs, status, toss_winner, toss_decision, current_innings, current_over, current_ball, winner_team_id, result_text) VALUES
('M001', 'TOUR-2026', 'VEN-01', 'Kamarajar Stadium, Virudhunagar', 'T001', 'T002', '2026-10-15', '10:00 AM', 20, 'SCHEDULED', NULL, NULL, 1, 0, 0, NULL, NULL),
('M002', 'TOUR-2026', 'VEN-02', 'Srivilliputhur Ground', 'T003', 'T004', '2026-10-16', '02:00 PM', 20, 'LIVE', 'T003', 'BAT', 1, 15, 2, NULL, 'Match in Progress - Innings 1'),
('M003', 'TOUR-2026', 'VEN-01', 'Kamarajar Stadium, Virudhunagar', 'T005', 'T001', '2026-10-10', '10:00 AM', 20, 'COMPLETED', 'T004', 'BAT', 2, 18, 4, 'T001', 'Virudhunagar Strikers won by 7 wickets')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 6. Scorer Assignments (All assigned to S. Ramesh SCR-101)
INSERT INTO scorer_assignments (id, match_id, scorer_id, assigned_by, status, assigned_at) VALUES
('SA-001', 'M001', 'SCR-101', 'ADM-1001', 'ASSIGNED', '2026-10-01 09:00:00'),
('SA-002', 'M002', 'SCR-101', 'ADM-1001', 'ACTIVE', '2026-10-01 09:00:00'),
('SA-003', 'M003', 'SCR-101', 'ADM-1001', 'COMPLETED', '2026-10-01 09:00:00')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 7. Innings for Live Match M002
INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, total_runs, wickets, overs, balls, target, status, started_at) VALUES
('INN-M002-1', 'M002', 1, 'T003', 'T004', 145, 4, 15, 2, NULL, 'LIVE', '2026-10-16 14:05:00')
ON DUPLICATE KEY UPDATE total_runs=VALUES(total_runs);

-- Innings Batters for M002
INSERT INTO innings_batters (id, innings_id, player_id, batting_position, runs, balls, fours, sixes, strike_rate, is_striker, is_out, dismissal_type, dismissed_by, dismissal_ball) VALUES
('IB-01', 'INN-M002-1', 'P301', 1, 45, 31, 5, 1, 145.16, TRUE, FALSE, NULL, NULL, NULL),
('IB-02', 'INN-M002-1', 'P302', 2, 12, 10, 1, 0, 120.00, FALSE, TRUE, 'BOWLED', 'P401', '3.4'),
('IB-03', 'INN-M002-1', 'P303', 3, 18, 12, 2, 0, 150.00, FALSE, FALSE, NULL, NULL, NULL),
('IB-04', 'INN-M002-1', 'P304', 4, 25, 18, 3, 0, 138.89, FALSE, TRUE, 'CAUGHT', 'P402', '8.2'),
('IB-05', 'INN-M002-1', 'P305', 5, 34, 21, 2, 2, 161.90, FALSE, TRUE, 'LBW', 'P401', '12.5')
ON DUPLICATE KEY UPDATE runs=VALUES(runs);

-- Innings Bowlers for M002
INSERT INTO innings_bowlers (id, innings_id, player_id, overs, balls, maidens, runs_conceded, wickets, no_balls, wides, economy) VALUES
('IBW-01', 'INN-M002-1', 'P401', 3, 2, 0, 28, 2, 1, 2, 8.40),
('IBW-02', 'INN-M002-1', 'P402', 4, 0, 0, 32, 1, 0, 1, 8.00),
('IBW-03', 'INN-M002-1', 'P407', 3, 0, 0, 26, 0, 0, 1, 8.67),
('IBW-04', 'INN-M002-1', 'P404', 3, 0, 0, 29, 0, 0, 0, 9.67),
('IBW-05', 'INN-M002-1', 'P408', 2, 0, 0, 19, 0, 0, 1, 9.50)
ON DUPLICATE KEY UPDATE runs_conceded=VALUES(runs_conceded);

-- Deliveries for current over 16 (15.1, 15.2)
INSERT INTO deliveries (id, innings_id, over_number, ball_number, striker_id, non_striker_id, bowler_id, runs_batter, runs_extras, total_runs, extra_type, wicket, wicket_type, dismissed_player_id, boundary_type, is_legal_delivery, commentary) VALUES
('DEL-01', 'INN-M002-1', 16, 1, 'P301', 'P303', 'P401', 1, 0, 1, 'NONE', FALSE, NULL, NULL, NULL, TRUE, 'Suresh Kumar pushes to mid-off for 1 run.'),
('DEL-02', 'INN-M002-1', 16, 2, 'P303', 'P301', 'P401', 0, 0, 0, 'NONE', FALSE, NULL, NULL, NULL, TRUE, 'Vijay defends solidly on the front foot, dot ball.')
ON DUPLICATE KEY UPDATE total_runs=VALUES(total_runs);

-- 8. Innings for Completed Match M003
INSERT INTO innings (id, match_id, innings_number, batting_team_id, bowling_team_id, total_runs, wickets, overs, balls, target, status, started_at, ended_at) VALUES
('INN-M003-1', 'M003', 1, 'T005', 'T001', 160, 8, 20, 0, NULL, 'COMPLETED', '2026-10-10 10:00:00', '2026-10-10 11:35:00'),
('INN-M003-2', 'M003', 2, 'T001', 'T005', 162, 3, 18, 4, 161, 'COMPLETED', '2026-10-10 11:50:00', '2026-10-10 13:15:00')
ON DUPLICATE KEY UPDATE total_runs=VALUES(total_runs);
