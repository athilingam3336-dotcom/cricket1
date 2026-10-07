/**
 * routes/authRoutes.js
 * Comprehensive Authentication Endpoints for all 5 roles
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// 1. General / Scorer / Admin / Content Staff OTP & Password Login
router.post('/request-otp', (req, res) => authController.requestOtp(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));
router.post('/admin/login', (req, res) => authController.adminLogin(req, res));
router.post('/login', (req, res) => authController.login(req, res));

// 2. Team / Coach OTP
router.post('/team/request-otp', (req, res) => authController.requestTeamOtp(req, res));
router.post('/team/verify-otp', (req, res) => authController.verifyTeamOtp(req, res));

// 3. Player OTP (by registered name or email in approved squad)
router.post('/player/request-otp', (req, res) => authController.requestPlayerOtp(req, res));
router.post('/player/verify-otp', (req, res) => authController.verifyPlayerOtp(req, res));

// 4. Registration Endpoints by Role (PDF Modules 2, 3, 5, 10)
router.post('/register', (req, res) => authController.registerScorer(req, res));
router.post('/register-player', (req, res) => authController.registerPlayer(req, res));
router.post('/register-scorer', (req, res) => authController.registerScorer(req, res));
router.post('/register-content', (req, res) => authController.registerContentStaff(req, res));
router.get('/scorers', (req, res) => authController.getScorers(req, res));
router.post('/admin/scorer-status', (req, res) => authController.updateScorerStatus(req, res));
router.patch('/admin/scorers/:id/status', (req, res) => authController.updateScorerStatus(req, res));

// 5. Team Registration with 15 Squad Players
router.post('/register-team', (req, res) => authController.registerTeam(req, res));
router.get('/teams', (req, res) => authController.getTeams(req, res));
router.get('/admin/teams', (req, res) => authController.getTeams(req, res));
router.post('/admin/teams/:id/approve', (req, res) => authController.approveTeam(req, res));
router.post('/admin/teams/:id/reject', (req, res) => authController.rejectTeam(req, res));

// 6. Unified Multi-Role Registrations (Teams, Players, Scorers, Content Staff)
router.get('/admin/all-registrations', (req, res) => authController.getAllRegistrations(req, res));
router.post('/admin/approve-registration', (req, res) => authController.approveRegistration(req, res));
router.post('/admin/reject-registration', (req, res) => authController.rejectRegistration(req, res));
router.post('/admin/registrations/:id/approve', (req, res) => authController.approveRegistration(req, res));
router.post('/admin/registrations/:id/reject', (req, res) => authController.rejectRegistration(req, res));

// 7. Admin Notifications
router.get('/admin/notifications', (req, res) => authController.getAdminNotifications(req, res));

// 7. Profile
router.get('/me', verifyToken, (req, res) => authController.getMe(req, res));

module.exports = router;