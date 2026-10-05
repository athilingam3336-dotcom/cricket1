const express = require('express');
const router = express.Router();
const playerService = require('../services/playerService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_team_jwt_secret_2025';

// Middleware to protect player routes
function authPlayerMiddleware(req, res, next) {
  const token = req.cookies?.playerAuthToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'PLAYER') {
      return res.status(403).json({ success: false, error: 'Forbidden: Access restricted to players.' });
    }
    req.player = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token.' });
  }
}

// POST /api/players/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { playerName, playerEmail } = req.body;
    const result = await playerService.sendOtp({ playerName, playerEmail });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/players/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { playerEmail, otp } = req.body;
    const result = await playerService.verifyOtp({ playerEmail, otp });
    
    // Set HttpOnly cookie for production session management
    res.cookie('playerAuthToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ success: true, message: result.message, player: result.player });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/players/me
router.get('/me', authPlayerMiddleware, async (req, res) => {
  try {
    const profile = await playerService.getPlayerProfile(req.player.playerId);
    res.json({ success: true, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/players/logout
router.post('/logout', (req, res) => {
  res.clearCookie('playerAuthToken');
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
