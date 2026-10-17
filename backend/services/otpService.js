/**
 * services/otpService.js
 * Cryptographically secure OTP generation, hashing, rate limiting, and verification.
 */

const crypto = require('crypto');

// In-memory rate limiting map: email -> { timestamps: [], lastRequestTime: number }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS_PER_WINDOW = 5;            // Max 5 OTP requests per 15 minutes
const MIN_COOLDOWN_MS = 10 * 1000;            // 10 seconds minimum between requests
const OTP_EXPIRATION_MS = 5 * 60 * 1000;      // 5 minutes expiry

/**
 * Generate a 6-digit cryptographically secure random OTP
 */
function generateOtpCode() {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Generate SHA-256 hash of plain text OTP
 */
function hashOtp(otp) {
  if (!otp) return '';
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Verify OTP code against hash
 */
function verifyOtpCode(plainOtp, storedHash) {
  if (!plainOtp || !storedHash) return false;
  return hashOtp(plainOtp) === storedHash;
}

/**
 * Check rate limit for an email
 * @param {string} email
 * @returns {{ allowed: boolean, message?: string }}
 */
function checkRateLimit(email) {
  // Rate limiting disabled as requested (allows immediate OTP requests)
  return { allowed: true };
}

/**
 * Reset rate limit for an email (e.g. for testing)
 */
function resetRateLimit(email) {
  if (email) {
    rateLimitMap.delete(email.trim().toLowerCase());
  } else {
    rateLimitMap.clear();
  }
}

module.exports = {
  generateOtpCode,
  hashOtp,
  verifyOtpCode,
  checkRateLimit,
  resetRateLimit,
  OTP_EXPIRATION_MS
};
