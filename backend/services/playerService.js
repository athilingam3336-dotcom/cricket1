const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool, getUseMemoryFallback } = require('../config/db');
const { sendOtpNotification } = require('./emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_team_jwt_secret_2025';

// Helper: Generate 6 digit numeric OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtp({ playerName, playerEmail }) {
  if (getUseMemoryFallback()) {
    throw new Error('Memory fallback not supported for player OTP');
  }

  if (!playerName || !playerEmail) {
    throw new Error('Player Name and Email are required.');
  }

  const [players] = await pool.query(
    `SELECT tp.id, tp.player_name, tp.player_email, tp.status, t.team_name, t.status as team_status 
     FROM team_players tp
     JOIN teams t ON tp.team_id = t.team_id
     WHERE tp.player_name = ? AND tp.player_email = ?`,
    [playerName.trim(), playerEmail.toLowerCase().trim()]
  );

  if (players.length === 0) {
    throw new Error('Player not found. Please make sure you are using the name and email registered by your team.');
  }

  const player = players[0];

  if (player.status !== 'ACTIVE') {
    throw new Error('Player account is not active.');
  }

  const otpCode = generateOTP();
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Invalidate previous OTPs
  await pool.query('UPDATE player_otps SET used = true WHERE player_id = ? AND used = false', [player.id]);

  await pool.query(
    'INSERT INTO player_otps (player_id, otp_hash, expires_at) VALUES (?, ?, ?)',
    [player.id, otpHash, expiresAt]
  );

  // Send OTP
  if (process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@cfvd.org',
      to: playerEmail.toLowerCase().trim(),
      subject: 'CFVD Player Portal - OTP Verification',
      text: `Cricket Federation of Virudhunagar District\n\nYour Player Portal verification OTP is:\n\n${otpCode}\n\nThis OTP expires in 5 minutes.\n\nDo not share this OTP with anyone.`
    });
  } else {
    // Console log for local dev if no SMTP
    console.log(`[DEV ONLY] OTP for ${playerEmail}: ${otpCode}`);
    await sendOtpNotification({ toEmail: playerEmail, recipientRole: 'PLAYER', otpCode, requestId: player.id });
  }

  return { message: 'OTP sent successfully.' };
}

async function verifyOtp({ playerEmail, otp }) {
  if (getUseMemoryFallback()) {
    throw new Error('Memory fallback not supported for player OTP');
  }

  if (!playerEmail || !otp) {
    throw new Error('Email and OTP are required.');
  }

  const [players] = await pool.query(
    'SELECT id, player_name FROM team_players WHERE player_email = ? AND status = "ACTIVE"',
    [playerEmail.toLowerCase().trim()]
  );

  if (players.length === 0) {
    throw new Error('Player not found or inactive.');
  }

  const playerId = players[0].id;

  const [otps] = await pool.query(
    'SELECT id, otp_hash, expires_at, attempts, used FROM player_otps WHERE player_id = ? ORDER BY created_at DESC LIMIT 1',
    [playerId]
  );

  if (otps.length === 0) {
    throw new Error('No OTP requested. Please request a new OTP.');
  }

  const latestOtp = otps[0];

  if (latestOtp.used) {
    throw new Error('OTP has already been used. Please request a new OTP.');
  }

  if (new Date() > new Date(latestOtp.expires_at)) {
    throw new Error('OTP expired. Please request a new OTP.');
  }

  if (latestOtp.attempts >= 3) {
    throw new Error('Maximum attempts reached. Please request a new OTP.');
  }

  const inputHash = crypto.createHash('sha256').update(otp).digest('hex');

  if (inputHash !== latestOtp.otp_hash) {
    await pool.query('UPDATE player_otps SET attempts = attempts + 1 WHERE id = ?', [latestOtp.id]);
    throw new Error('Invalid OTP.');
  }

  // Mark used
  await pool.query('UPDATE player_otps SET used = true WHERE id = ?', [latestOtp.id]);

  const payload = {
    playerId: playerId,
    email: playerEmail.toLowerCase().trim(),
    role: 'PLAYER',
    playerName: players[0].player_name
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  return {
    message: 'Login successful.',
    token,
    player: {
      playerId,
      playerName: players[0].player_name,
      email: playerEmail.toLowerCase().trim()
    }
  };
}

async function getPlayerProfile(playerId) {
  if (getUseMemoryFallback()) throw new Error('Not supported');

  const [rows] = await pool.query(
    `SELECT tp.id, tp.player_name, tp.player_email, tp.player_role, tp.status, tp.created_at,
            t.team_id, t.team_name, t.captain_name as coach_name, ta.email as coach_email
     FROM team_players tp
     JOIN teams t ON tp.team_id = t.team_id
     LEFT JOIN team_accounts ta ON t.team_id = ta.team_id
     WHERE tp.id = ?`,
    [playerId]
  );

  if (rows.length === 0) throw new Error('Player not found.');

  const r = rows[0];
  return {
    id: r.id,
    name: r.player_name,
    email: r.player_email,
    role: r.player_role,
    status: r.status,
    registrationDate: r.created_at,
    team: {
      teamId: `TEAM-${r.team_id}`,
      teamName: r.team_name,
      coachName: r.coach_name,
      coachEmail: r.coach_email
    }
  };
}

module.exports = {
  sendOtp,
  verifyOtp,
  getPlayerProfile
};
