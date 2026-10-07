/**
 * controllers/authController.js
 * HTTP Controller for Authentication, Scorer Registration & Admin Approvals
 */

const authService = require('../services/authService');

class AuthController {
  // General / Scorer / Admin / Content OTP Request
  async requestOtp(req, res) {
    try {
      const { email, role } = req.body;
      const result = await authService.requestOtp(email, role);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to request OTP'
      });
    }
  }

  // General / Scorer / Admin / Content OTP Verification
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

  // Admin Direct Login (Password or OTP)
  async adminLogin(req, res) {
    try {
      const { email, password, otp } = req.body;
      const result = await authService.adminLogin(email, password || otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Administrator login failed'
      });
    }
  }

  // General Login
  async login(req, res) {
    try {
      const { email, password, otp } = req.body;
      const result = await authService.login(email, password || otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Login failed'
      });
    }
  }

  // Team / Coach OTP Request
  async requestTeamOtp(req, res) {
    try {
      const { coachName, coachEmail, email } = req.body;
      const result = await authService.requestTeamOtp(coachName, coachEmail || email);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to request team OTP'
      });
    }
  }

  // Team / Coach OTP Verification
  async verifyTeamOtp(req, res) {
    try {
      const { coachEmail, email, otp } = req.body;
      const result = await authService.verifyTeamOtp(coachEmail || email, otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Team OTP verification failed'
      });
    }
  }

  // Player OTP Request
  async requestPlayerOtp(req, res) {
    try {
      const { name, email, playerName, nameOrEmail, emailOrPhone, input } = req.body;
      const identifier = playerName || nameOrEmail || emailOrPhone || input || name || email;
      const result = await authService.requestPlayerOtp(identifier);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to request player OTP'
      });
    }
  }

  // Player OTP Verification
  async verifyPlayerOtp(req, res) {
    try {
      const { name, email, playerName, nameOrEmail, emailOrPhone, input, otp } = req.body;
      const identifier = playerName || nameOrEmail || emailOrPhone || input || name || email;
      const result = await authService.verifyPlayerOtp(identifier, otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Player OTP verification failed'
      });
    }
  }

  // Register Scorer
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

  // Register Player (Module 2 in PDF)
  async registerPlayer(req, res) {
    try {
      const result = await authService.registerPlayer(req.body);
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Player registration failed'
      });
    }
  }

  // Register Content Staff
  async registerContentStaff(req, res) {
    try {
      const result = await authService.registerContentStaff(req.body);
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Content Staff registration failed'
      });
    }
  }

  // Register Team with Coach and 15 Squad Players
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

  // Get Teams
  async getTeams(req, res) {
    try {
      const statusFilter = req.query.status || null;
      const teams = await authService.getTeams(statusFilter);
      res.status(200).json({ success: true, teams });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Approve Team
  async approveTeam(req, res) {
    try {
      const teamId = req.params.id || req.body.teamId || req.body.id;
      const adminId = (req.user && req.user.id) || 'ADMIN';
      const result = await authService.approveRegistration(teamId, 'TEAM', adminId);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Reject Team
  async rejectTeam(req, res) {
    try {
      const teamId = req.params.id || req.body.teamId || req.body.id;
      const reason = req.body.reason || 'Criteria not met';
      const adminId = (req.user && req.user.id) || 'ADMIN';
      const result = await authService.rejectRegistration(teamId, 'TEAM', reason, adminId);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Get All Registrations across all roles
  async getAllRegistrations(req, res) {
    try {
      const { status, role } = req.query;
      const registrations = await authService.getAllRegistrations(status, role);
      res.status(200).json({ success: true, count: registrations.length, registrations });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Unified Approve Any Registration
  async approveRegistration(req, res) {
    try {
      const id = req.params.id || req.body.id;
      const type = req.body.type || req.query.type || 'TEAM';
      const adminId = (req.user && req.user.id) || 'ADMIN';
      const result = await authService.approveRegistration(id, type, adminId);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Unified Reject Any Registration
  async rejectRegistration(req, res) {
    try {
      const id = req.params.id || req.body.id;
      const type = req.body.type || req.query.type || 'TEAM';
      const reason = req.body.reason || 'Criteria not met';
      const adminId = (req.user && req.user.id) || 'ADMIN';
      const result = await authService.rejectRegistration(id, type, reason, adminId);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Admin Notifications
  async getAdminNotifications(req, res) {
    try {
      const statusFilter = req.query.status || null;
      const notifications = await authService.getAdminNotifications(statusFilter);
      res.status(200).json({ success: true, notifications });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  // Scorer List & Status
  async getScorers(req, res) {
    try {
      const statusFilter = req.query.status || null;
      const scorers = await authService.getScorers(statusFilter);
      res.status(200).json({ success: true, scorers });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateScorerStatus(req, res) {
    try {
      const idOrEmail = req.params.id || req.body.id || req.body.email;
      const { status, reason } = req.body;
      const result = await authService.updateScorerStatus(idOrEmail, status, reason);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // Current User Profile
  async getMe(req, res) {
    try {
      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({ success: true, user: profile });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();