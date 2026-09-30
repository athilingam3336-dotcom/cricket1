/**
 * otpService.js
 * 
 * Secure OTP Service implementing:
 * - 6-digit cryptographically secure random generation (crypto.randomInt)
 * - SHA-256 hashing for storage (never plain text)
 * - 5-minute expiration
 * - Max 3 verification attempts limit
 * - Rate limiting per identifier
 * - Immediate invalidation on verification / reuse prevention
 */

const crypto = require('crypto');
const { getUseMemoryFallback, memoryDb, pool } = require('../config/db');

// In-memory rate limiting map: identifier -> array of timestamps
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 mins
const MAX_REQUESTS_PER_WINDOW = 5;
const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 mins
const MAX_ATTEMPTS = 3;

/**
 * Generates a 6-digit cryptographically secure random OTP
 */
function generateOtpCode() {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Creates SHA-256 hash of plain text OTP
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp.trim()).digest('hex');
}

/**
 * Checks rate limiting for an identifier
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  return true;
}

/**
 * Creates an OTP verification record for a given request and user
 */
async function createOtpRecord({ requestId, userRoleType, userIdentifier }) {
  if (!checkRateLimit(userIdentifier)) {
    throw new Error('Rate limit exceeded for OTP requests. Please wait a few minutes before trying again.');
  }

  const rawOtp = generateOtpCode();
  const otpHash = hashOtp(rawOtp);
  const id = 'OTP-' + crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + OTP_EXPIRATION_MS);

  if (getUseMemoryFallback()) {
    // Invalidate existing active OTPs for this request and user role
    memoryDb.otpVerifications = memoryDb.otpVerifications.filter(
      o => !(o.request_id === requestId && o.user_role_type === userRoleType)
    );
    memoryDb.otpVerifications.push({
      id,
      request_id: requestId,
      user_role_type: userRoleType,
      user_identifier: userIdentifier,
      otp_hash: otpHash,
      attempts: 0,
      verified: false,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString()
    });
  } else {
    await pool.query(
      `DELETE FROM otp_verifications WHERE request_id = ? AND user_role_type = ?`,
      [requestId, userRoleType]
    );
    await pool.query(
      `INSERT INTO otp_verifications (id, request_id, user_role_type, user_identifier, otp_hash, attempts, verified, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 0, FALSE, ?, ?)`,
      [id, requestId, userRoleType, userIdentifier, otpHash, createdAt, expiresAt]
    );
  }

  // Return rawOtp strictly to be passed to internal emailService for dispatch, never exposed in API response!
  return { rawOtp, expiresAt, requestId, userRoleType, userIdentifier };
}

/**
 * Verifies an submitted OTP for a request and user role
 */
async function verifyOtp({ requestId, userRoleType, submittedOtp, expectedIdentifier }) {
  const submittedHash = hashOtp(submittedOtp);
  const now = new Date();

  let record = null;

  if (getUseMemoryFallback()) {
    record = memoryDb.otpVerifications.find(
      o => o.request_id === requestId && o.user_role_type === userRoleType
    );
  } else {
    const [rows] = await pool.query(
      `SELECT * FROM otp_verifications WHERE request_id = ? AND user_role_type = ?`,
      [requestId, userRoleType]
    );
    record = rows[0] || null;
  }

  if (!record) {
    return { valid: false, reason: 'INVALID_REQUEST', message: 'No active OTP request found.' };
  }

  if (record.verified) {
    return { valid: false, reason: 'REUSED', message: 'OTP has already been verified and cannot be reused.' };
  }

  const expiresAt = new Date(record.expires_at);
  if (now > expiresAt) {
    return { valid: false, reason: 'EXPIRED', message: 'OTP expired. Request a new OTP.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { valid: false, reason: 'MAX_ATTEMPTS', message: 'Too many attempts. Please request a new OTP.' };
  }

  // Increment attempts counter
  record.attempts += 1;
  if (!getUseMemoryFallback()) {
    await pool.query(`UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?`, [record.id]);
  }

  // Verify match & identity
  if (record.user_identifier.trim().toLowerCase() !== expectedIdentifier.trim().toLowerCase()) {
    return { valid: false, reason: 'IDENTITY_MISMATCH', message: 'OTP identity verification failed.' };
  }

  if (record.otp_hash !== submittedHash) {
    if (record.attempts >= MAX_ATTEMPTS) {
      return { valid: false, reason: 'MAX_ATTEMPTS', message: 'Too many attempts. Please request a new OTP.' };
    }
    return { valid: false, reason: 'INCORRECT', message: `Incorrect OTP. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining.` };
  }

  // OTP is valid! Mark as verified / invalidated for reuse
  record.verified = true;
  if (!getUseMemoryFallback()) {
    await pool.query(`UPDATE otp_verifications SET verified = TRUE WHERE id = ?`, [record.id]);
  }

  return { valid: true, message: 'OTP verified successfully.' };
}

module.exports = {
  createOtpRecord,
  verifyOtp,
  hashOtp,
  OTP_EXPIRATION_MS,
  MAX_ATTEMPTS
};
