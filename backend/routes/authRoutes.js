/**
 * routes/authRoutes.js
 * Public and Authenticated Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// --- 1. DEDICATED SCORER OTP & VERIFICATION ENDPOINTS ---
// Send Scorer OTP (POST /api/auth/scorer/send-otp)
router.post('/scorer/send-otp', (req, res) => authController.requestScorerOtp(req, res));

// Verify Scorer OTP (POST /api/auth/scorer/verify-otp)
router.post('/scorer/verify-otp', (req, res) => authController.verifyScorerOtp(req, res));

// Check Scorer (GET /api/auth/scorers/check?email=)
router.get('/scorers/check', (req, res) => authController.checkScorer(req, res));

// Dev / Diagnostic SMTP Status (GET /api/auth/smtp-status)
router.get('/smtp-status', (req, res) => authController.getSmtpStatus(req, res));

// --- 2. GENERAL AUTH & BACKWARDS COMPATIBLE OTP ENDPOINTS ---
router.post('/request-otp', (req, res) => authController.requestOtp(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

// --- 3. SCORER REGISTRATION & ADMIN MANAGEMENT ---
router.post('/scorers/register', (req, res) => authController.registerScorer(req, res));
router.post('/register-scorer', (req, res) => authController.registerScorer(req, res));
router.get('/scorers', (req, res) => authController.getScorers(req, res));

router.get('/admin/scorers/pending', (req, res) => authController.getPendingScorers(req, res));
router.get('/admin/scorers', (req, res) => authController.getScorers(req, res));
router.patch('/admin/scorers/:id/approve', (req, res) => authController.approveScorer(req, res));
router.post('/admin/scorers/:id/approve', (req, res) => authController.approveScorer(req, res));
router.patch('/admin/scorers/:id/reject', (req, res) => authController.rejectScorer(req, res));
router.post('/admin/scorers/:id/reject', (req, res) => authController.rejectScorer(req, res));
router.post('/admin/scorer-status', (req, res) => authController.updateScorerStatus(req, res));
router.patch('/admin/scorers/:id/status', (req, res) => authController.updateScorerStatus(req, res));

// --- 4. GENERAL USERS & TEAMS ---
router.post('/register', (req, res) => authController.register(req, res));
router.post('/register-team', (req, res) => authController.registerTeam(req, res));

// --- 5. CURRENT USER PROFILE ---
router.get('/me', verifyToken, (req, res) => authController.getMe(req, res));

module.exports = router;
