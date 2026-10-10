/**
 * controllers/authController.js
 * Controller for Email OTP Registration Verification, Password Set,
 * and Password Authentication with JWT HTTP Cookie support.
 */

const authService = require('../services/authService');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
};

function setAuthCookies(res, token) {
  if (token) {
    res.cookie('auth_token', token, COOKIE_OPTIONS);
    res.cookie('token', token, COOKIE_OPTIONS);
  }
}

function clearAuthCookies(res) {
  res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax' });
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
}

class AuthController {
  // Step 1 of Registration: Request OTP to verify email
  async requestRegistrationOtp(req, res) {
    try {
      const { email, name, role } = req.body;
      const result = await authService.requestRegistrationOtp(email, name, role);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Failed to request registration OTP'
      });
    }
  }

  // Step 2 of Registration: Verify OTP code
  async verifyRegistrationOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyRegistrationOtp(email, otp);
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Registration OTP verification failed'
      });
    }
  }

  // Unified Password-Based Login (Sets JWT Cookie)
  async login(req, res) {
    try {
      const { email, emailOrPhone, name, username, password, otp, role } = req.body;
      const identifier = email || emailOrPhone || username || name;
      const credential = password || otp;
      const result = await authService.login(identifier, credential, role);
      if (result.token) {
        setAuthCookies(res, result.token);
      }
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Login failed'
      });
    }
  }

  // Admin Direct Login (Sets JWT Cookie)
  async adminLogin(req, res) {
    try {
      const { email, password, otp } = req.body;
      const result = await authService.adminLogin(email, password || otp);
      if (result.token) {
        setAuthCookies(res, result.token);
      }
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 401;
      res.status(status).json({
        success: false,
        message: err.message || 'Administrator login failed'
      });
    }
  }

  // Logout (Clears JWT Cookie)
  async logout(req, res) {
    try {
      clearAuthCookies(res);
      res.status(200).json({
        success: true,
        message: 'Logged out successfully. Cookie cleared.'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Logout failed: ' + (err.message || 'Unknown error')
      });
    }
  }

  // Current authenticated user
  async getMe(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      res.status(200).json({
        success: true,
        user: req.user
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Legacy/Compatibility OTP Request & Verify
  async requestOtp(req, res) {
    return this.requestRegistrationOtp(req, res);
  }

  async verifyOtp(req, res) {
    return this.login(req, res);
  }

  async requestTeamOtp(req, res) {
    return this.requestRegistrationOtp(req, res);
  }

  async verifyTeamOtp(req, res) {
    return this.login(req, res);
  }

  async requestPlayerOtp(req, res) {
    return this.requestRegistrationOtp(req, res);
  }

  async verifyPlayerOtp(req, res) {
    return this.login(req, res);
  }

  // Register Scorer
  async registerScorer(req, res) {
    try {
      const result = await authService.registerScorer(req.body);
      if (result.token) {
        setAuthCookies(res, result.token);
      }
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Scorer registration failed'
      });
    }
  }

  // Register Player
  async registerPlayer(req, res) {
    try {
      const result = await authService.registerPlayer(req.body);
      if (result.token) {
        setAuthCookies(res, result.token);
      }
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Player registration failed'
      });
    }
  }

  // Register Team
  async registerTeam(req, res) {
    try {
      const result = await authService.registerTeam(req.body);
      if (result.token) {
        setAuthCookies(res, result.token);
      }
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Team registration failed'
      });
    }
  }

  // Register Content Staff
  async registerContentStaff(req, res) {
    try {
      const result = await authService.registerContentStaff(req.body);
      if (result.token) {
        setAuthCookies(res, result.token);
      }
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 400;
      res.status(status).json({
        success: false,
        message: err.message || 'Content Staff registration failed'
      });
    }
  }

  async getTeams(req, res) {
    try {
      const teams = await authService.getTeams();
      res.status(200).json({ success: true, teams });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async approveTeam(req, res) {
    try {
      const result = await authService.approveTeam(req.params.id || req.body.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async rejectTeam(req, res) {
    try {
      const result = await authService.rejectTeam(req.params.id || req.body.id, req.body.reason);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAllRegistrations(req, res) {
    try {
      const result = await authService.getAllRegistrations();
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAdminNotifications(req, res) {
    try {
      const notifs = await authService.getAdminNotifications();
      res.status(200).json({ success: true, notifications: notifs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateScorerStatus(req, res) {
    try {
      const result = await authService.updateScorerStatus(req.params.id || req.body.id, req.body.status);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

const authController = new AuthController();
authController.setAuthCookies = setAuthCookies;
authController.clearAuthCookies = clearAuthCookies;
module.exports = authController;