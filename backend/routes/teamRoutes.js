/**
 * routes/teamRoutes.js
 * 
 * Complete Team & Coach Module REST API Endpoints:
 * - Registration with 15 Squad Players -> Status = PENDING
 * - Coach OTP Login & Verification
 * - Team Profile (View & Update permitted fields)
 * - 15-Member Squad Management (with Team Isolation)
 * - Match Fixtures & Read-Only Scorecards
 * - Real Match-Derived Team & Player Statistics
 * - Team Notifications & Bulletins
 * Protected by requireTeamAuth middleware.
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const teamService = require('../services/teamService');
const { requireTeamAuth } = require('../middleware/authMiddleware');

// -------------------------------------------------------------
// 1. PUBLIC REGISTRATION & AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

/**
 * POST /api/team/register
 * Team registration with coach details and exactly 15 squad players
 */
router.post('/register', async (req, res) => {
  try {
    const result = await teamService.registerTeam(req.body);
    res.status(201).json({
      success: true,
      status: 'PENDING',
      message: `Team "${result.team_name}" and 15 squad players registered successfully! Awaiting administrative approval.`,
      team: result
    });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({
      success: false,
      message: err.message || 'Team registration failed'
    });
  }
});

/**
 * POST /api/team/login
 * Step 1: Request OTP by coach name & registered coach email
 * Checks approval status before sending OTP via NodeMailer.
 */
router.post('/login', async (req, res) => {
  try {
    const { coachName, coachEmail, name, email } = req.body;
    const finalCoachEmail = coachEmail || email;
    const finalCoachName = coachName || name;
    const result = await authService.requestTeamOtp(finalCoachName, finalCoachEmail);
    res.status(200).json(result);
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({
      success: false,
      message: err.message || 'Team login failed'
    });
  }
});

/**
 * POST /api/team/verify-otp
 * Step 2: Verify OTP and return authenticated coach JWT session token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { coachEmail, email, otp } = req.body;
    const finalCoachEmail = coachEmail || email;
    const result = await authService.verifyTeamOtp(finalCoachEmail, otp);
    res.status(200).json(result);
  } catch (err) {
    const status = err.status || 401;
    res.status(status).json({
      success: false,
      message: err.message || 'Team OTP verification failed'
    });
  }
});

// -------------------------------------------------------------
// 2. PROTECTED TEAM ENDPOINTS (Require Active Team/Coach Authentication)
// -------------------------------------------------------------

/**
 * GET /api/team/profile
 * View own team profile from MongoDB
 */
router.get('/profile', requireTeamAuth, async (req, res) => {
  try {
    const profile = await teamService.getProfile(req.user.email, req.team.id);
    res.status(200).json({ success: true, profile });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/team/profile
 * Update allowed team profile fields (captain, viceCaptain, coachPhone, certification, homeGround)
 * Changing approval status, coachEmail, or other teams' data is strictly forbidden.
 */
router.put('/profile', requireTeamAuth, async (req, res) => {
  try {
    const updated = await teamService.updateProfile(req.user.email, req.team.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Team profile updated successfully!',
      profile: updated
    });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/squad
 * Retrieve 15-player squad roster for this team (enforcing team isolation)
 */
router.get('/squad', requireTeamAuth, async (req, res) => {
  try {
    const squad = await teamService.getSquad(req.user.email, req.team.id);
    res.status(200).json({ success: true, count: squad.length, squad });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/matches
 * Retrieve upcoming, live, and completed matches for this team
 */
router.get('/matches', requireTeamAuth, async (req, res) => {
  try {
    const matches = await teamService.getMatches(req.user.email, req.team.id);
    res.status(200).json({ success: true, matches });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/matches/:id
 * Retrieve specific match information
 */
router.get('/matches/:id', requireTeamAuth, async (req, res) => {
  try {
    const match = await teamService.getMatchById(req.params.id);
    res.status(200).json({ success: true, match });
  } catch (err) {
    const status = err.status || 404;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/matches/:id/scorecard
 * Read-only match scorecard connected to scorer data in MongoDB
 */
router.get('/matches/:id/scorecard', requireTeamAuth, async (req, res) => {
  try {
    const scorecard = await teamService.getScorecard(req.params.id);
    res.status(200).json({ success: true, scorecard });
  } catch (err) {
    const status = err.status || 404;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/statistics
 * Real team statistics calculated from MongoDB matches
 */
router.get('/statistics', requireTeamAuth, async (req, res) => {
  try {
    const statistics = await teamService.getTeamStatistics(req.user.email, req.team.id);
    res.status(200).json({ success: true, statistics });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/players/statistics
 * Real statistics for all 15 players in this squad
 */
router.get('/players/statistics', requireTeamAuth, async (req, res) => {
  try {
    const playerStats = await teamService.getPlayerStatistics(req.user.email, req.team.id);
    res.status(200).json({ success: true, playerStats });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/team/notifications
 * Official bulletins and notices for this team
 */
router.get('/notifications', requireTeamAuth, async (req, res) => {
  try {
    const notifications = await teamService.getNotifications(req.user.email, req.team.id);
    res.status(200).json({ success: true, notifications });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/team/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', requireTeamAuth, async (req, res) => {
  try {
    const updated = await teamService.markNotificationRead(req.params.id);
    res.status(200).json({ success: true, notification: updated });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

module.exports = router;
