/**
 * services/authService.js
 * Scorer, Admin, and User Authentication Service using MySQL and Nodemailer OTP verification.
 */

const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const otpService = require('./otpService');
const { sendOtpEmail } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_super_secret_jwt_2026';

class AuthService {
  /**
   * Request OTP for login
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async requestOtp(email) {
    if (!email || typeof email !== 'string') {
      throw { status: 400, message: 'Please provide a valid email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw { status: 400, message: 'Invalid email address format.' };
    }

    // 1. Verify user exists in MySQL
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      throw { status: 404, message: 'Email not registered. Please register as a scorer first.' };
    }

    // 2. ENFORCE ADMIN APPROVAL STATUS
    if (user.role === 'SCORER') {
      if (user.status === 'PENDING') {
        throw {
          status: 403,
          message: 'Your scorer registration is PENDING admin approval. You can only log in once an administrator approves your account.'
        };
      }
      if (user.status === 'REJECTED' || user.status === 'CANCELLED') {
        throw {
          status: 403,
          message: 'Your scorer registration has been REJECTED / CANCELLED by the administrator.'
        };
      }
      if (user.status !== 'ACTIVE') {
        throw {
          status: 403,
          message: 'Your scorer account is inactive. Please contact the administrator.'
        };
      }
    }

    // 3. Rate limiting check
    const rateCheck = otpService.checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      throw { status: 429, message: rateCheck.message };
    }

    // 4. Generate secure OTP and store hash in MySQL
    const rawOtp = otpService.generateOtpCode();
    const otpHash = otpService.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + otpService.OTP_EXPIRATION_MS);

    await userModel.updateOtp(user.id, {
      otp_hash: otpHash,
      otp_expires_at: expiresAt
    });

    // 5. Send OTP email via Nodemailer
    await sendOtpEmail({
      toEmail: user.email,
      userName: user.name,
      otp: rawOtp
    });

    return {
      success: true,
      message: process.env.SMTP_USER 
        ? 'OTP sent successfully to your registered email address.' 
        : `OTP sent! (Dev Code: ${rawOtp})`,
      devOtp: !process.env.SMTP_USER ? rawOtp : undefined
    };
  }

  /**
   * Verify OTP and return authenticated session token
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<{ success: boolean, message: string, user: Object, token: string }>}
   */
  async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw { status: 400, message: 'Email address and OTP are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // SPECIAL DEVELOPMENT ADMIN LOGIN (Isolated & Configurable)
    const isDevBypass = process.env.DEV_ADMIN_BYPASS !== 'false';
    const devAdminEmail = (process.env.DEV_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
    const devAdminOtp = (process.env.DEV_ADMIN_OTP || '1234').trim();

    if (isDevBypass && cleanEmail === devAdminEmail && cleanOtp === devAdminOtp) {
      let adminUser = await userModel.findByEmail(cleanEmail);
      if (!adminUser) {
        adminUser = await userModel.create({
          id: 'ADM-1001',
          name: 'Chief Administrator',
          email: devAdminEmail,
          role: 'ADMIN',
          status: 'ACTIVE'
        });
      }

      const token = jwt.sign(
        { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'Dev Admin Authenticated Successfully',
        user: { id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'ADMIN' },
        token
      };
    }

    // REAL MYSQL DATABASE VALIDATION
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      throw { status: 404, message: 'User not found with this email.' };
    }

    // ENFORCE ADMIN APPROVAL STATUS
    if (user.role === 'SCORER') {
      if (user.status === 'PENDING') {
        throw {
          status: 403,
          message: 'Your scorer registration is PENDING admin approval. You can only log in once an administrator approves your account.'
        };
      }
      if (user.status === 'REJECTED' || user.status === 'CANCELLED') {
        throw {
          status: 403,
          message: 'Your scorer registration has been REJECTED / CANCELLED by the administrator.'
        };
      }
      if (user.status !== 'ACTIVE') {
        throw {
          status: 403,
          message: 'Your scorer account is inactive. Please contact the administrator.'
        };
      }
    }

    // Check if OTP was requested
    if (!user.otp_hash || !user.otp_expires_at) {
      throw { status: 401, message: 'No active OTP found. Please request an OTP first.' };
    }

    // Check OTP expiry (5 minutes)
    const now = new Date();
    const expiresAt = new Date(user.otp_expires_at);
    if (now > expiresAt) {
      throw { status: 401, message: 'OTP has expired. Please request a new OTP.' };
    }

    // Verify OTP hash
    const submittedHash = otpService.hashOtp(cleanOtp);
    if (submittedHash !== user.otp_hash) {
      throw { status: 401, message: 'Invalid OTP. Please check and try again.' };
    }

    // Mark OTP verified & invalidate for reuse in MySQL
    await userModel.markOtpVerified(user.id);

    // Issue JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    };
  }

  /**
   * Register a new Match Scorer with PENDING status requiring Admin approval
   */
  async registerScorer({ name, email, mobile }) {
    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      if (existing.status === 'PENDING') {
        return {
          success: true,
          status: 'PENDING',
          message: 'Your scorer registration has already been submitted and is PENDING admin approval.',
          scorer: { id: existing.id, name: existing.name, email: existing.email, status: 'PENDING' }
        };
      }
      if (existing.status === 'ACTIVE') {
        return {
          success: true,
          status: 'ACTIVE',
          message: 'Your account is already active. You can log in with OTP.',
          scorer: { id: existing.id, name: existing.name, email: existing.email, status: 'ACTIVE' }
        };
      }
      if (existing.status === 'REJECTED') {
        throw { status: 403, message: 'This registration was previously rejected by the administrator.' };
      }
      throw { status: 409, message: 'User with this email already exists.' };
    }

    const id = `SCR-${Math.floor(400 + Math.random() * 500)}`;
    const user = await userModel.create({
      id,
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile || null,
      role: 'SCORER',
      status: 'PENDING'
    });

    console.log(`\n📋 [NEW SCORER REGISTRATION] ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Status: PENDING (Awaiting Admin Approval)\n`);

    return {
      success: true,
      status: 'PENDING',
      message: 'Scorer registration submitted! Your account is PENDING admin verification and approval.',
      scorer: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        status: 'PENDING'
      }
    };
  }

  /**
   * Admin: Approve or Reject a Scorer Registration
   */
  async updateScorerStatus(idOrEmail, newStatus, reason = null) {
    const validStatuses = ['ACTIVE', 'REJECTED', 'PENDING'];
    const normalizedStatus = String(newStatus).toUpperCase();
    if (!validStatuses.includes(normalizedStatus)) {
      throw { status: 400, message: `Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}` };
    }

    let user = await userModel.findById(idOrEmail);
    if (!user) {
      user = await userModel.findByEmail(idOrEmail);
    }

    if (!user) {
      throw { status: 404, message: `Scorer '${idOrEmail}' not found.` };
    }

    await userModel.updateStatus(user.id, normalizedStatus);
    const updated = await userModel.findById(user.id);

    console.log(`\n⚖️ [ADMIN SCORER UPDATE] ${user.name} (${user.email}) -> Status set to: ${normalizedStatus}${reason ? ' (Reason: ' + reason + ')' : ''}\n`);

    return {
      success: true,
      message: `Scorer ${user.name} status updated to ${normalizedStatus}`,
      scorer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status
      }
    };
  }

  /**
   * Admin: Get all Scorer accounts from database
   */
  async getScorers(status = null) {
    return userModel.getScorers(status);
  }

  /**
   * Compatibility wrapper for register
   */
  async register(payload) {
    if (payload.role === 'SCORER') {
      return this.registerScorer(payload);
    }

    const { name, email, mobile, password, role = 'USER' } = payload;
    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      throw { status: 409, message: 'User with this email already exists.' };
    }

    const id = (role === 'ADMIN' ? 'ADM-' : role === 'PLAYER' ? 'PLY-' : 'USR-') + Math.floor(100 + Math.random() * 900);
    const user = await userModel.create({
      id,
      name,
      email: cleanEmail,
      mobile: mobile || null,
      role: role.toUpperCase(),
      password_hash: password || null,
      status: 'ACTIVE'
    });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      token
    };
  }

  /**
   * Fetch authenticated user profile
   */
  async getProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User profile not found.' };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    };
  }

  /**
   * Register a new Team with Coach and 15 Squad Players
   */
  async registerTeam(payload) {
    const { teamName, coachName, coachEmail, players, taluk } = payload;
    if (!teamName || !teamName.trim()) {
      throw { status: 400, message: 'Team Name is required.' };
    }
    if (!coachName || !coachName.trim()) {
      throw { status: 400, message: 'Coach Name is required.' };
    }
    if (!coachEmail || !coachEmail.trim() || !coachEmail.includes('@')) {
      throw { status: 400, message: 'Valid Coach Email ID is required.' };
    }
    if (!Array.isArray(players) || players.length !== 15) {
      throw {
        status: 400,
        message: `Exactly 15 squad players are required for team registration. Received: ${Array.isArray(players) ? players.length : 0}`
      };
    }

    const cleanCoachEmail = coachEmail.trim().toLowerCase();

    // Validate each of the 15 players
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.name || !p.name.trim()) {
        throw { status: 400, message: `Player #${i + 1} Name is required.` };
      }
      if (!p.email || !p.email.trim() || !p.email.includes('@')) {
        throw { status: 400, message: `Valid Email ID for Player #${i + 1} (${p.name || 'Unnamed'}) is required.` };
      }
      if (p.email.trim().toLowerCase() === cleanCoachEmail) {
        throw { status: 400, message: `Coach email cannot be identical to Player #${i + 1} email.` };
      }
    }

    // Check for duplicate player emails
    const playerEmails = players.map(p => p.email.trim().toLowerCase());
    const duplicateEmail = playerEmails.find((item, index) => playerEmails.indexOf(item) !== index);
    if (duplicateEmail) {
      throw { status: 400, message: `Duplicate player email found: "${duplicateEmail}". Each of the 15 players must have a unique email.` };
    }

    const teamId = 'TEAM-VRD-' + Math.floor(100000 + Math.random() * 900000);
    const passkey = 'PASS-' + Math.floor(1000 + Math.random() * 9000);

    const teamRecord = {
      teamId,
      passkey,
      teamName: teamName.trim(),
      coach: {
        name: coachName.trim(),
        email: cleanCoachEmail
      },
      taluk: taluk || 'Virudhunagar',
      players: players.map((p, idx) => ({
        jerseyNo: idx + 1,
        name: p.name.trim(),
        email: p.email.trim().toLowerCase()
      })),
      status: 'Pending',
      registrationDate: new Date().toISOString()
    };

    console.log(`\n🏏 [TEAM REGISTRATION] Team: "${teamRecord.teamName}" | Coach: ${teamRecord.coach.name} (${teamRecord.coach.email}) | Squad: 15 Players Registered\n`);

    return {
      success: true,
      message: 'Team registered successfully with 15 squad players pending administrative verification.',
      team: teamRecord
    };
  }
}

module.exports = new AuthService();