/**
 * controllers/authController.js
 * HTTP Controller for Authentication, Scorer Registration & Admin Approvals
 */

const authService = require('../services/authService');

class AuthController {
  /**
   * POST /api/auth/request-otp
   */
  async requestOtp(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.requestOtp(email);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to request OTP'
      });
    }
  }

  /**
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyOtp(email, otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'OTP verification failed'
      });
    }
  }

  /**
   * POST /api/auth/register-scorer
   */
  async registerScorer(req, res) {
    try {
      const { name, email, mobile } = req.body;
      const result = await authService.registerScorer({ name, email, mobile });
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Scorer registration failed'
      });
    }
  }

  /**
   * PATCH or POST /api/admin/scorers/:id/status
   * Admin approves or rejects a scorer registration
   */
  async updateScorerStatus(req, res) {
    try {
      const idOrEmail = req.params.id || req.body.id || req.body.email;
      const { status, reason } = req.body;
      const result = await authService.updateScorerStatus(idOrEmail, status, reason);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to update scorer status'
      });
    }
  }

  /**
   * GET /api/admin/scorers
   * List all scorers from database with their status
   */
  async getScorers(req, res) {
    try {
      const statusFilter = req.query.status || null;
      const scorers = await authService.getScorers(statusFilter);
      res.status(200).json({
        success: true,
        scorers
      });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to fetch scorers'
      });
    }
  }

  /**
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Registration failed'
      });
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req, res) {
    try {
      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        user: profile
      });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to fetch user profile'
      });
    }
  }
}

module.exports = new AuthController();