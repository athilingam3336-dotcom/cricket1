/**
 * models/scorerModel.js
 * MySQL Scorer Model for Official Match Scorers
 */

const db = require('../config/db');

class ScorerModel {
  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM scorers WHERE LOWER(email) = ?', [cleanEmail]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async findById(id) {
    if (!id) return null;
    const [rows] = await db.query('SELECT * FROM scorers WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async create({ id, full_name, email, mobile, association, status = 'PENDING' }) {
    const scorerId = id || `SCR-${Math.floor(100 + Math.random() * 900)}`;
    const cleanEmail = email.trim().toLowerCase();
    await db.query(
      `INSERT INTO scorers (id, full_name, email, mobile, association, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [scorerId, (full_name || '').trim(), cleanEmail, (mobile || '').trim(), (association || '').trim(), status]
    );
    return this.findById(scorerId);
  }

  async getScorers(status = null) {
    if (status) {
      const [rows] = await db.query(
        `SELECT * FROM scorers WHERE status = ? ORDER BY created_at DESC`,
        [status.toUpperCase()]
      );
      return rows;
    }
    const [rows] = await db.query(
      `SELECT * FROM scorers ORDER BY created_at DESC`
    );
    return rows;
  }

  async getPendingScorers() {
    return this.getScorers('PENDING');
  }

  async approve(idOrEmail) {
    const scorer = (await this.findById(idOrEmail)) || (await this.findByEmail(idOrEmail));
    if (!scorer) return null;

    await db.query(
      `UPDATE scorers SET status = 'APPROVED', approved_at = NOW(), rejection_reason = NULL WHERE id = ?`,
      [scorer.id]
    );
    return this.findById(scorer.id);
  }

  async reject(idOrEmail, reason = null) {
    const scorer = (await this.findById(idOrEmail)) || (await this.findByEmail(idOrEmail));
    if (!scorer) return null;

    await db.query(
      `UPDATE scorers SET status = 'REJECTED', rejected_at = NOW(), rejection_reason = ? WHERE id = ?`,
      [reason || 'Rejected by administrator', scorer.id]
    );
    return this.findById(scorer.id);
  }

  async updateOtp(id, { otp_hash, otp_expires_at, otp_attempts = 0 }) {
    await db.query(
      `UPDATE scorers SET otp_hash = ?, otp_expires_at = ?, otp_attempts = ?, otp_verified_at = NULL WHERE id = ?`,
      [otp_hash, otp_expires_at, otp_attempts, id]
    );
    return this.findById(id);
  }

  async incrementOtpAttempts(id) {
    const scorer = await this.findById(id);
    const newCount = (scorer?.otp_attempts || 0) + 1;
    await db.query(
      `UPDATE scorers SET otp_attempts = ? WHERE id = ?`,
      [newCount, id]
    );
    return this.findById(id);
  }

  async markOtpVerified(id) {
    await db.query(
      `UPDATE scorers SET otp_verified_at = NOW(), otp_hash = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }

  async clearOtp(id) {
    await db.query(
      `UPDATE scorers SET otp_hash = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?`,
      [id]
    );
    return this.findById(id);
  }
}

module.exports = new ScorerModel();
