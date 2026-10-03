/**
 * routes/authRoutes.js
 * Public and Authenticated Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. Request OTP (Nodemailer email dispatch + MySQL OTP update)
router.post('/request-otp', (req, res) => authController.requestOtp(req, res));

// 2. Verify OTP (MySQL validation + JWT issuance + Dev Admin Bypass)
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

// 3. Register Match Scorer (Initial status: PENDING Admin Approval)
router.post('/register-scorer', (req, res) => authController.registerScorer(req, res));

// 4. Scorer list & status check (Accessible for admin panel / public check)
router.get('/scorers', (req, res) => authController.getScorers(req, res));
router.post('/admin/scorer-status', (req, res) => authController.updateScorerStatus(req, res));
router.patch('/admin/scorers/:id/status', (req, res) => authController.updateScorerStatus(req, res));

// 5. Register General User
router.post('/register', (req, res) => authController.register(req, res));

// 6. Register Team with Coach and 15 Squad Players
router.post('/register-team', (req, res) => authController.registerTeam(req, res));

// 7. Current Authenticated User Profile
router.get('/me', verifyToken, (req, res) => authController.getMe(req, res));

module.exports = router;