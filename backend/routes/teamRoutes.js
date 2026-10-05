/**
 * teamRoutes.js
 *
 * Express routes for Team Registration, Login, Email Verification, and Profile.
 */

const express = require('express');
const router = express.Router();
const teamService = require('../services/teamService');
const { requireTeamAuth } = require('../middleware/teamAuthMiddleware');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// ──────────────────────────────────────────────
// PUBLIC ROUTES (no auth required)
// ──────────────────────────────────────────────

/**
 * GET /api/team/districts
 * Fetch all available districts for the registration form
 */
router.get('/districts', async (req, res) => {
  try {
    const districts = await teamService.getDistricts();
    res.json({ success: true, districts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/team/register
 * Register a new team account
 * Body: { teamName, districtId, captainName, phone, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { teamName, districtId, captainName, phone, email, password, players } = req.body;
    const result = await teamService.registerTeam({ teamName, districtId, captainName, phone, email, password, players });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/team/verify-email
 * Verify email using the token received after registration
 * Body: { token }
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await teamService.verifyEmail(token);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/team/login
 * Team login endpoint
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await teamService.loginTeam({ email, password });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// PROTECTED TEAM ROUTES (JWT required)
// ──────────────────────────────────────────────

/**
 * GET /api/team/profile
 * Get the logged-in team's profile
 */
router.get('/profile', requireTeamAuth, async (req, res) => {
  try {
    const profile = await teamService.getTeamProfile(req.teamUser.teamId);
    res.json({ success: true, team: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// ADMIN-ONLY TEAM MANAGEMENT ROUTES
// ──────────────────────────────────────────────

/**
 * GET /api/team/admin/teams
 * Admin: list all teams and their registration status
 */
router.get('/admin/teams', requireAdminAuth, async (req, res) => {
  try {
    const teams = await teamService.getAllTeams();
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/team/admin/teams/:teamId/status
 * Admin: approve, reject, or disable a team account
 * Body: { status: 'APPROVED' | 'REJECTED' | 'DISABLED' }
 */
router.put('/admin/teams/:teamId/status', requireAdminAuth, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { status } = req.body;
    const result = await teamService.updateTeamAccountStatus({ teamId, status });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
