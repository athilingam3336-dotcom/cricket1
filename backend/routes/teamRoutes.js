/**
 * routes/teamRoutes.js
 * Express routes for Team Registration, Team Login, and Team Dashboard APIs.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const teamController = require('../controllers/teamController');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_super_secret_jwt_2026';

// Middleware to authenticate Team Session via Cookie or Bearer Token
function requireTeamAuth(req, res, next) {
  let token = null;

  // 1. Check Cookies
  if (req.cookies && req.cookies.team_token) {
    token = req.cookies.team_token;
  }

  // 2. Check Authorization Header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1].trim();
  }

  // 3. Check custom header
  if (!token && req.headers['x-team-token']) {
    token = req.headers['x-team-token'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthenticated: Team login required.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'TEAM') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Team authentication required.'
      });
    }
    req.team = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired team session token.'
    });
  }
}

// --- PUBLIC ROUTES ---
// POST /api/teams/register - Register a new team with 15 squad players
router.post('/register', (req, res) => teamController.register(req, res));

// POST /api/teams/login - Team login using Team ID or Coach Email + Passkey
router.post('/login', (req, res) => teamController.login(req, res));

// --- PROTECTED ROUTES ---
// GET /api/teams/me - Fetch authenticated team info
router.get('/me', requireTeamAuth, (req, res) => teamController.getMe(req, res));

// GET /api/teams/me/players - Fetch 15 squad players for authenticated team
router.get('/me/players', requireTeamAuth, (req, res) => teamController.getMePlayers(req, res));

// POST /api/teams/logout - Clear team session
router.post('/logout', (req, res) => teamController.logout(req, res));

module.exports = {
  router,
  requireTeamAuth
};
