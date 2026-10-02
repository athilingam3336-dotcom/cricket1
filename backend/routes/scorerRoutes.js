/**
 * routes/scorerRoutes.js
 * Scorer Portal REST APIs
 */

const express = require('express');
const router = express.Router();

const authService = require('../services/authService');
const scorerService = require('../services/scorerService');
const scoringEngine = require('../services/scoringEngine');
const matchService = require('../services/matchService');
const { requireScorerAuth } = require('../middleware/authMiddleware');
const { acquireMatchLock } = require('../middleware/concurrencyLock');

// --- PUBLIC AUTH ROUTES ---
router.post('/login', async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const result = await authService.login(email, otp || password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// --- PROTECTED SCORER ROUTES ---
router.use(requireScorerAuth);

// Scorer Profile
router.get('/me', async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Scorer Dashboard Stats
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await scorerService.getDashboardStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Assigned Matches List
router.get('/matches', async (req, res) => {
  try {
    const { filter } = req.query;
    const stats = await scorerService.getDashboardStats(req.user.id);
    let list = stats.matches || [];
    if (filter) {
      list = list.filter(m => m.status.toLowerCase() === filter.toLowerCase());
    }
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Match Setup before match starts
router.get('/matches/:matchId/setup', async (req, res) => {
  try {
    const setup = await matchService.getMatchSetup(req.params.matchId);
    res.json({ success: true, data: setup });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Start Match (Toss, Playing XI)
router.post('/matches/:matchId/start', async (req, res) => {
  try {
    const result = await matchService.startMatch(req.params.matchId, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Live Scoring Screen State
router.get('/matches/:matchId/live', async (req, res) => {
  try {
    const liveState = await scorerService.getLiveMatchState(req.params.matchId);
    res.json({ success: true, data: liveState });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Record Delivery (Ball-by-Ball) with Concurrency Locking & Duplicate Protection
router.post('/matches/:matchId/deliveries', acquireMatchLock, async (req, res) => {
  try {
    const result = await scoringEngine.recordDelivery(req.params.matchId, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Full Scorecard
router.get('/matches/:matchId/scorecard', async (req, res) => {
  try {
    const scorecard = await scorerService.getFullScorecard(req.params.matchId);
    res.json({ success: true, data: scorecard });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// End Over
router.post('/matches/:matchId/end-over', async (req, res) => {
  try {
    const result = await scoringEngine.endOver(req.params.matchId, req.body.nextBowlerId);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// End Innings
router.post('/matches/:matchId/end-innings', async (req, res) => {
  try {
    const result = await scoringEngine.endInnings(req.params.matchId);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Undo Last Delivery
router.post('/matches/:matchId/undo', async (req, res) => {
  try {
    const result = await scoringEngine.undoLastDelivery(req.params.matchId);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});


// Edit Delivery with Recalculation
router.patch('/matches/:matchId/deliveries/:deliveryId', acquireMatchLock, async (req, res) => {
  try {
    const result = await scoringEngine.editDelivery(req.params.matchId, req.params.deliveryId, req.body, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

// Conclude / End Match
router.post('/matches/:matchId/end', async (req, res) => {
  try {
    const result = await scoringEngine.endMatch(req.params.matchId, req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

module.exports = router;
