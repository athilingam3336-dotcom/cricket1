-- Cricket Federation Full-Stack Scorer Database Schema
-- Compatible with MySQL 8.0+

CREATE DATABASE IF NOT EXISTS cricket_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cricket_db;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(50),
  password_hash VARCHAR(255),
  role ENUM('ADMIN', 'SCORER', 'PLAYER', 'USER') NOT NULL DEFAULT 'USER',
  status ENUM('ACTIVE', 'INACTIVE', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
  otp_hash VARCHAR(255) DEFAULT NULL,
  otp_expires_at DATETIME DEFAULT NULL,
  otp_verified_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_email (email),
  INDEX idx_user_role (role)
);

-- 2. Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  season VARCHAR(50),
  format ENUM('T20', 'ODI', 'TEST', 'T10', 'CUSTOM') DEFAULT 'T20',
  overs INT DEFAULT 20,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Teams
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  logo_url TEXT,
  city VARCHAR(100),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Players
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(64) PRIMARY KEY,
  team_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  jersey_number INT,
  role ENUM('BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER') DEFAULT 'BATTER',
  batting_style VARCHAR(50) DEFAULT 'RIGHT_HAND',
  bowling_style VARCHAR(50) DEFAULT 'RIGHT_ARM_MEDIUM',
  photo_url TEXT,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_player_team (team_id),
  CONSTRAINT fk_players_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 5. Matches
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(64) PRIMARY KEY,
  tournament_id VARCHAR(64),
  venue_id VARCHAR(64),
  venue_name VARCHAR(255),
  team_a_id VARCHAR(64) NOT NULL,
  team_b_id VARCHAR(64) NOT NULL,
  scheduled_date DATE,
  scheduled_time VARCHAR(50),
  overs INT DEFAULT 20,
  status ENUM('SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED', 'CANCELLED') DEFAULT 'SCHEDULED',
  toss_winner VARCHAR(64),
  toss_decision ENUM('BAT', 'BOWL'),
  current_innings INT DEFAULT 1,
  current_over INT DEFAULT 0,
  current_ball INT DEFAULT 0,
  winner_team_id VARCHAR(64),
  result_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_match_tournament (tournament_id),
  INDEX idx_match_teams (team_a_id, team_b_id),
  INDEX idx_match_status (status),
  CONSTRAINT fk_match_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL,
  CONSTRAINT fk_match_team_a FOREIGN KEY (team_a_id) REFERENCES teams(id) ON DELETE RESTRICT,
  CONSTRAINT fk_match_team_b FOREIGN KEY (team_b_id) REFERENCES teams(id) ON DELETE RESTRICT
);

-- 6. Match Squads / Playing XI
CREATE TABLE IF NOT EXISTS match_players (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  team_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  is_playing_xi BOOLEAN DEFAULT TRUE,
  batting_order INT DEFAULT 0,
  is_captain BOOLEAN DEFAULT FALSE,
  is_wicketkeeper BOOLEAN DEFAULT FALSE,
  INDEX idx_mp_match (match_id),
  INDEX idx_mp_team (team_id),
  INDEX idx_mp_player (player_id),
  CONSTRAINT fk_mp_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT fk_mp_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_mp_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- 7. Match Officials
CREATE TABLE IF NOT EXISTS match_officials (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  official_role ENUM('ON_FIELD_UMPIRE', 'THIRD_UMPIRE', 'FOURTH_UMPIRE', 'MATCH_REFEREE', 'SCORER') NOT NULL,
  INDEX idx_mo_match (match_id),
  INDEX idx_mo_user (user_id),
  CONSTRAINT fk_mo_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- 8. Scorer Assignment
CREATE TABLE IF NOT EXISTS scorer_assignments (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  scorer_id VARCHAR(64) NOT NULL,
  assigned_by VARCHAR(64),
  status ENUM('ASSIGNED', 'ACTIVE', 'COMPLETED', 'REVOKED') DEFAULT 'ASSIGNED',
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sa_match (match_id),
  INDEX idx_sa_scorer (scorer_id),
  CONSTRAINT fk_sa_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- 9. Innings
CREATE TABLE IF NOT EXISTS innings (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) NOT NULL,
  innings_number INT NOT NULL,
  batting_team_id VARCHAR(64) NOT NULL,
  bowling_team_id VARCHAR(64) NOT NULL,
  total_runs INT DEFAULT 0,
  wickets INT DEFAULT 0,
  overs INT DEFAULT 0,
  balls INT DEFAULT 0,
  target INT NULL,
  status ENUM('NOT_STARTED', 'LIVE', 'COMPLETED', 'DECLARED') DEFAULT 'NOT_STARTED',
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  INDEX idx_inn_match (match_id),
  CONSTRAINT fk_inn_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  CONSTRAINT fk_inn_bat_team FOREIGN KEY (batting_team_id) REFERENCES teams(id),
  CONSTRAINT fk_inn_bowl_team FOREIGN KEY (bowling_team_id) REFERENCES teams(id)
);

-- 10. Innings Batters
CREATE TABLE IF NOT EXISTS innings_batters (
  id VARCHAR(64) PRIMARY KEY,
  innings_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  batting_position INT DEFAULT 0,
  runs INT DEFAULT 0,
  balls INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  strike_rate DECIMAL(6,2) DEFAULT 0.00,
  is_striker BOOLEAN DEFAULT FALSE,
  is_out BOOLEAN DEFAULT FALSE,
  dismissal_type VARCHAR(50) NULL,
  dismissed_by VARCHAR(64) NULL,
  dismissal_ball VARCHAR(50) NULL,
  INDEX idx_ib_innings (innings_id),
  INDEX idx_ib_player (player_id),
  CONSTRAINT fk_ib_innings FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
  CONSTRAINT fk_ib_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- 11. Innings Bowlers
CREATE TABLE IF NOT EXISTS innings_bowlers (
  id VARCHAR(64) PRIMARY KEY,
  innings_id VARCHAR(64) NOT NULL,
  player_id VARCHAR(64) NOT NULL,
  overs INT DEFAULT 0,
  balls INT DEFAULT 0,
  maidens INT DEFAULT 0,
  runs_conceded INT DEFAULT 0,
  wickets INT DEFAULT 0,
  no_balls INT DEFAULT 0,
  wides INT DEFAULT 0,
  economy DECIMAL(6,2) DEFAULT 0.00,
  INDEX idx_ibw_innings (innings_id),
  INDEX idx_ibw_player (player_id),
  CONSTRAINT fk_ibw_innings FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE,
  CONSTRAINT fk_ibw_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- 12. Deliveries (Ball-by-Ball)
CREATE TABLE IF NOT EXISTS deliveries (
  id VARCHAR(64) PRIMARY KEY,
  innings_id VARCHAR(64) NOT NULL,
  over_number INT NOT NULL,
  ball_number INT NOT NULL,
  striker_id VARCHAR(64) NOT NULL,
  non_striker_id VARCHAR(64) NOT NULL,
  bowler_id VARCHAR(64) NOT NULL,
  runs_batter INT DEFAULT 0,
  runs_extras INT DEFAULT 0,
  total_runs INT DEFAULT 0,
  extra_type ENUM('NONE', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY') DEFAULT 'NONE',
  wicket BOOLEAN DEFAULT FALSE,
  wicket_type VARCHAR(50) NULL,
  dismissed_player_id VARCHAR(64) NULL,
  boundary_type VARCHAR(20) NULL,
  is_legal_delivery BOOLEAN DEFAULT TRUE,
  commentary TEXT,
  created_by VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_del_innings (innings_id),
  INDEX idx_del_over (over_number),
  INDEX idx_del_striker (striker_id),
  INDEX idx_del_bowler (bowler_id),
  CONSTRAINT fk_del_innings FOREIGN KEY (innings_id) REFERENCES innings(id) ON DELETE CASCADE
);
