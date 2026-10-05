const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Initial default seed admins if DB table is empty
const INITIAL_ADMINS = [
  {
    id: 'ADM-1001',
    full_name: 'District Chief Administrator',
    email: 'admin@cfvd.org',
    phone: '9876543210',
    username: 'chief_admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date('2025-01-01').toISOString(),
    updated_at: new Date('2025-01-01').toISOString()
  },
  {
    id: 'ADM-1002',
    full_name: 'Vice Secretary Admin',
    email: 'secretary@cfvd.org',
    phone: '9876543211',
    username: 'sec_admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: new Date('2025-01-15').toISOString(),
    updated_at: new Date('2025-01-15').toISOString()
  }
];

// Fallback in-memory MySQL store if local MySQL server daemon is absent
class MemoryDB {
  constructor() {
    this.admins = [...INITIAL_ADMINS];
    this.changeRequests = [];
    this.otpVerifications = [];
    this.auditLogs = [
      {
        id: 'LOG-' + Date.now(),
        action: 'SYSTEM_INITIALIZED',
        initiated_by: 'SYSTEM',
        target_user: 'admin@cfvd.org',
        timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1',
        result: 'SUCCESS',
        verification_status: 'VERIFIED',
        details: 'Initial secure admin management database booted'
      }
    ];
  }
}

const memoryDb = new MemoryDB();

// Dynamic connection wrapper to handle MySQL or fallback
let pool = null;
let useMemoryFallback = true;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cricket_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function initDb() {
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    conn.release();
    useMemoryFallback = false;
    console.log('✅ Connected to MySQL Database Server');
    await setupTables();
  } catch (err) {
    console.log('ℹ️ MySQL server connection skipped. Utilizing in-memory MySQL relational DB engine.');
    useMemoryFallback = true;
  }
}

async function setupTables() {
  if (useMemoryFallback) return;

  const createAdminsTable = `
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(64) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NOT NULL,
      username VARCHAR(100),
      role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const createChangeRequestsTable = `
    CREATE TABLE IF NOT EXISTS admin_change_requests (
      id VARCHAR(64) PRIMARY KEY,
      action_type VARCHAR(50) NOT NULL,
      initiated_by VARCHAR(255) NOT NULL,
      target_user_id VARCHAR(255),
      target_name VARCHAR(255),
      target_email VARCHAR(255),
      target_phone VARCHAR(50),
      target_username VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      current_admin_verified BOOLEAN DEFAULT FALSE,
      target_admin_verified BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      completed_at DATETIME NULL
    );
  `;

  const createOtpTable = `
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id VARCHAR(64) PRIMARY KEY,
      request_id VARCHAR(64) NOT NULL,
      user_role_type VARCHAR(50) NOT NULL,
      user_identifier VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      attempts INT DEFAULT 0,
      verified BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    );
  `;

  const createAuditLogsTable = `
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      initiated_by VARCHAR(255) NOT NULL,
      target_user VARCHAR(255) NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(100),
      result VARCHAR(50) NOT NULL,
      verification_status VARCHAR(255),
      details TEXT
    );
  `;

  try {
    await pool.query(createAdminsTable);
    await pool.query(createChangeRequestsTable);
    await pool.query(createOtpTable);
    await pool.query(createAuditLogsTable);

    // Create Team Module Tables
    const createDistrictsTable = `
      CREATE TABLE IF NOT EXISTS districts (
        district_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
    `;
    const createTournamentsTable = `
      CREATE TABLE IF NOT EXISTS tournaments (
        tournament_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'UPCOMING'
      );
    `;
    const createTeamsTable = `
      CREATE TABLE IF NOT EXISTS teams (
        team_id INT AUTO_INCREMENT PRIMARY KEY,
        team_name VARCHAR(100) NOT NULL,
        district_id INT,
        captain_name VARCHAR(100),
        phone VARCHAR(15),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (district_id) REFERENCES districts(district_id)
      );
    `;
    const createTeamAccountsTable = `
      CREATE TABLE IF NOT EXISTS team_accounts (
        account_id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        account_status ENUM('PENDING_EMAIL_VERIFICATION', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DISABLED') DEFAULT 'PENDING_EMAIL_VERIFICATION',
        verification_token VARCHAR(255) NULL,
        verification_expires DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
      );
    `;
    const createTournamentTeamsTable = `
      CREATE TABLE IF NOT EXISTS tournament_teams (
        tournament_team_id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        team_id INT NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        approved_by VARCHAR(64) NULL,
        approved_at TIMESTAMP NULL,
        rejection_reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE (tournament_id, team_id),
        FOREIGN KEY (team_id) REFERENCES teams(team_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id)
      );
    `;

    const createTeamPlayersTable = `
      CREATE TABLE IF NOT EXISTS team_players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        player_name VARCHAR(255) NOT NULL,
        player_email VARCHAR(255) NOT NULL,
        player_role VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
      );
    `;

    const createPlayerOtpsTable = `
      CREATE TABLE IF NOT EXISTS player_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INT DEFAULT 0,
        used BOOLEAN DEFAULT FALSE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES team_players(id)
      );
    `;

    await pool.query(createDistrictsTable);
    await pool.query(createTournamentsTable);
    await pool.query(createTeamsTable);
    await pool.query(createTeamAccountsTable);
    await pool.query(createTournamentTeamsTable);
    await pool.query(createTeamPlayersTable);
    await pool.query(createPlayerOtpsTable);

    // Seed default admin if table is empty
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count === 0) {
      for (const admin of INITIAL_ADMINS) {
        await pool.query(
          'INSERT INTO admins (id, full_name, email, phone, username, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [admin.id, admin.full_name, admin.email, admin.phone, admin.username, admin.role, admin.status]
        );
      }
    }
  } catch (e) {
    console.error('Error creating MySQL tables:', e);
  }
}

initDb();

module.exports = {
  pool,
  getUseMemoryFallback: () => useMemoryFallback,
  memoryDb
};
