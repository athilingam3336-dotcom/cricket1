/**
 * controllers/authController.js
 * HTTP Controller for Authentication, Scorer Registration & Admin Approvals
 */

const authService = require('../services/authService');
const { verifySmtpConnection } = require('../config/mailer');

class AuthController {
  /**
   * GET /api/scorers/check?email=
   */
  async checkScorer(req, res) {
    try {
      const email = req.query.email || req.body.email;
      const result = await authService.checkScorer(email);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to check scorer status'
      });
    }
  }

  /**
   * POST /api/scorers/register
   * (Also supports /api/auth/register-scorer)
   */
  async registerScorer(req, res) {
    try {
      const { full_name, name, email, mobile, association } = req.body;
      const result = await authService.registerScorer({
        full_name: full_name || name,
        email,
        mobile,
        association
      });
      const statusCode = result.existing ? 200 : 201;
      res.status(statusCode).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        scorerStatus: err.scorerStatus || null,
        message: err.message || 'Scorer registration failed'
      });
    }
  }

  /**
   * GET /api/admin/scorers/pending
   */
  async getPendingScorers(req, res) {
    try {
      const scorers = await authService.getPendingScorers();
      res.status(200).json({
        success: true,
        scorers
      });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to fetch pending scorers'
      });
    }
  }

  /**
   * PATCH or POST /api/admin/scorers/:id/approve
   */
  async approveScorer(req, res) {
    try {
      const id = req.params.id || req.body.id || req.body.email;
      const result = await authService.approveScorer(id);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to approve scorer'
      });
    }
  }

  /**
   * PATCH or POST /api/admin/scorers/:id/reject
   */
  async rejectScorer(req, res) {
    try {
      const id = req.params.id || req.body.id || req.body.email;
      const { reason } = req.body;
      const result = await authService.rejectScorer(id, reason);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to reject scorer'
      });
    }
  }

  /**
   * GET /api/admin/scorers
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
   * POST /api/scorer/send-otp (or /api/auth/scorer/send-otp)
   */
  async requestScorerOtp(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.requestScorerOtp(email);
      return res.status(200).json(result);
    } catch (err) {
      console.error('OTP EMAIL ERROR:', err.message || err);
      const status = err.status || 500;
      return res.status(status).json({
        success: false,
        notFound: err.notFound || false,
        scorerStatus: err.scorerStatus || null,
        message: err.message || 'Unable to send OTP email'
      });
    }
  }

  /**
   * POST /api/scorer/verify-otp (or /api/auth/scorer/verify-otp)
   */
  async verifyScorerOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyScorerOtp(email, otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        notFound: err.notFound || false,
        scorerStatus: err.scorerStatus || null,
        message: err.message || 'OTP verification failed'
      });
    }
  }

  /**
   * GET /api/auth/smtp-status (Development / Diagnostic check)
   */
  async getSmtpStatus(req, res) {
    try {
      const result = await verifySmtpConnection();
      res.status(result.ok ? 200 : 503).json(result);
    } catch (err) {
      res.status(500).json({
        ok: false,
        status: 'SMTP configuration error',
        message: err.message || 'Failed to check SMTP connection'
      });
    }
  }

  /**
   * POST /api/auth/request-otp (General / Backwards compatible)
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
        notFound: err.notFound || false,
        scorerStatus: err.scorerStatus || null,
        message: err.message || 'Failed to request OTP'
      });
    }
  }

  /**
   * POST /api/auth/verify-otp (General / Backwards compatible)
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
        notFound: err.notFound || false,
        scorerStatus: err.scorerStatus || null,
        message: err.message || 'OTP verification failed'
      });
    }
  }

  /**
   * Legacy wrapper for updateScorerStatus
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
   * POST /api/auth/register-team
   */
  async registerTeam(req, res) {
    try {
      const result = await authService.registerTeam(req.body);
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Team registration failed'
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
