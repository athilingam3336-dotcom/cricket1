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
      throw { status: 404, message: 'Email not registered. Please register or contact an administrator.' };
    }

    // 2. Rate limiting check
    const rateCheck = otpService.checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      throw { status: 429, message: rateCheck.message };
    }

    // 3. Generate secure OTP and store hash in MySQL
    const rawOtp = otpService.generateOtpCode();
    const otpHash = otpService.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + otpService.OTP_EXPIRATION_MS);

    await userModel.updateOtp(user.id, {
      otp_hash: otpHash,
      otp_expires_at: expiresAt
    });

    // 4. Send OTP email via Nodemailer
    await sendOtpEmail({
      toEmail: user.email,
      userName: user.name,
      otp: rawOtp
    });

    // Return success without revealing OTP
    return {
      success: true,
      message: 'OTP sent successfully to your registered email address.'
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

    // ==================================================
    // SPECIAL DEVELOPMENT ADMIN LOGIN (Isolated & Configurable)
    // ==================================================
    const isDevBypass = process.env.DEV_ADMIN_BYPASS !== 'false';
    const devAdminEmail = (process.env.DEV_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
    const devAdminOtp = (process.env.DEV_ADMIN_OTP || '1234').trim();

    if (isDevBypass && cleanEmail === devAdminEmail && cleanOtp === devAdminOtp) {
      let adminUser = await userModel.findByEmail(cleanEmail);
      if (!adminUser) {
        adminUser = await userModel.create({
          id: 'ADM-1001',
          name: 'System Administrator',
          email: cleanEmail,
          role: 'ADMIN',
          status: 'ACTIVE'
        });
      }

      const token = jwt.sign(
        {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'ADMIN'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'OTP verified successfully (Development Admin Bypass)',
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'ADMIN'
        },
        token
      };
    }

    // ==================================================
    // REAL MYSQL DATABASE VALIDATION
    // ==================================================
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      throw { status: 404, message: 'User not found with this email.' };
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
        role: user.role
      },
      token
    };
  }

  /**
   * Compatibility wrapper for existing scorer login calls
   */
  async login(email, otpOrPassword) {
    return this.verifyOtp(email, otpOrPassword);
  }

  /**
   * Register a new user
   */
  async register({ name, email, mobile, password, role = 'SCORER' }) {
    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      throw { status: 409, message: 'User with this email already exists.' };
    }

    const id = (role === 'ADMIN' ? 'ADM-' : role === 'PLAYER' ? 'PLY-' : role === 'SCORER' ? 'SCR-' : 'USR-') + Math.floor(100 + Math.random() * 900);
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
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
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
}

module.exports = new AuthService();
