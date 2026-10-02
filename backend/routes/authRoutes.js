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

// 3. Register User
router.post('/register', (req, res) => authController.register(req, res));

// 4. Current Authenticated User Profile
router.get('/me', verifyToken, (req, res) => authController.getMe(req, res));

module.exports = router;
