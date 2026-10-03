/**
 * models/userModel.js
 * MySQL User Model for Authentication, Profiles, and OTP persistence
 */

const db = require('../config/db');

class UserModel {
  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async findById(id) {
    if (!id) return null;
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async create({ id, name, email, mobile, role = 'USER', password_hash = null, status = 'ACTIVE' }) {
    const userId = id || `USR-${Date.now()}`;
    const cleanEmail = email.trim().toLowerCase();
    await db.query(
      `INSERT INTO users (id, name, email, mobile, role, password_hash, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, name, cleanEmail, mobile || null, role, password_hash, status]
    );
    return this.findById(userId);
  }

  async updateStatus(userId, status) {
    await db.query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, userId]
    );
    return this.findById(userId);
  }

  async updateStatusByEmail(email, status) {
    const cleanEmail = email.trim().toLowerCase();
    await db.query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE LOWER(email) = ?`,
      [status, cleanEmail]
    );
    return this.findByEmail(cleanEmail);
  }

  async getScorers(status = null) {
    if (status) {
      const [rows] = await db.query(
        `SELECT id, name, email, mobile, role, status, created_at, updated_at FROM users WHERE role = 'SCORER' AND status = ?`,
        [status]
      );
      return rows;
    }
    const [rows] = await db.query(
      `SELECT id, name, email, mobile, role, status, created_at, updated_at FROM users WHERE role = 'SCORER'`
    );
    return rows;
  }

  async updateOtp(userId, { otp_hash, otp_expires_at, otp_attempts = 0 }) {
    await db.query(
      `UPDATE users SET otp_hash = ?, otp_expires_at = ?, otp_attempts = ?, otp_verified_at = NULL, updated_at = NOW() WHERE id = ?`,
      [otp_hash, otp_expires_at, otp_attempts, userId]
    );
    return this.findById(userId);
  }

  async incrementOtpAttempts(userId) {
    const user = await this.findById(userId);
    const newCount = (user?.otp_attempts || 0) + 1;
    await db.query(
      `UPDATE users SET otp_attempts = ?, updated_at = NOW() WHERE id = ?`,
      [newCount, userId]
    );
    return this.findById(userId);
  }

  async markOtpVerified(userId) {
    await db.query(
      `UPDATE users SET otp_verified_at = NOW(), otp_hash = NULL, otp_expires_at = NULL, otp_attempts = 0, updated_at = NOW() WHERE id = ?`,
      [userId]
    );
    return this.findById(userId);
  }

  async clearOtp(userId) {
    await db.query(
      `UPDATE users SET otp_hash = NULL, otp_expires_at = NULL, otp_attempts = 0, updated_at = NOW() WHERE id = ?`,
      [userId]
    );
    return this.findById(userId);
  }

  // Audit table support for otp_verifications
  async recordOtpVerification({ email, role, otp_hash, expires_at }) {
    try {
      const id = `OTP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await db.query(
        `INSERT INTO otp_verifications (id, email, role, otp_hash, expires_at, attempt_count, created_at)
         VALUES (?, ?, ?, ?, ?, 0, NOW())`,
        [id, email.toLowerCase(), role, otp_hash, expires_at]
      );
    } catch (e) {
      // Non-fatal logging for audit table
      console.warn('[UserModel] Audit log to otp_verifications skipped:', e.message);
    }
  }
}

module.exports = new UserModel();
