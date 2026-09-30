/**
 * adminRoutes.js
 * 
 * Express routes for Secure Admin Management with Two-Person OTP Approval.
 */

const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// Enforce ADMIN role middleware across all endpoints
router.use(requireAdminAuth);

/**
 * GET /api/admin/admins
 * List all administrators
 */
router.get('/admins', async (req, res) => {
  try {
    const admins = await adminService.getAdmins();
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/audit-logs
 * List audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await adminService.getAuditLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/add/request
 * Initiate ADD ADMIN request
 */
router.post('/admins/add/request', async (req, res) => {
  try {
    const { name, email, phone, username } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Full Name, Email, and Phone are required.' });
    }

    const result = await adminService.initiateAddAdminRequest({
      initiatorEmail: req.adminUser.email,
      name,
      email,
      phone,
      username,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/add/verify-current
 * Verify Current Admin OTP for ADD ADMIN
 */
router.post('/admins/add/verify-current', async (req, res) => {
  try {
    const { requestId, otp } = req.body;
    if (!requestId || !otp) {
      return res.status(400).json({ error: 'requestId and otp are required.' });
    }

    const result = await adminService.verifyAddCurrentAdminOtp({
      requestId,
      otp,
      currentAdminEmail: req.adminUser.email,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/add/verify-target
 * Verify New Admin Candidate OTP for ADD ADMIN
 */
router.post('/admins/add/verify-target', async (req, res) => {
  try {
    const { requestId, otp, newAdminEmail } = req.body;
    if (!requestId || !otp || !newAdminEmail) {
      return res.status(400).json({ error: 'requestId, otp, and newAdminEmail are required.' });
    }

    const result = await adminService.verifyAddNewAdminOtp({
      requestId,
      otp,
      newAdminEmail,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/add/complete
 * Atomically complete ADD ADMIN creation
 */
router.post('/admins/add/complete', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required.' });
    }

    const result = await adminService.completeAddAdmin({
      requestId,
      currentAdminEmail: req.adminUser.email,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/remove/request
 * Initiate REMOVE ADMIN request
 */
router.post('/admins/remove/request', async (req, res) => {
  try {
    const { targetAdminId } = req.body;
    if (!targetAdminId) {
      return res.status(400).json({ error: 'targetAdminId is required.' });
    }

    const result = await adminService.initiateRemoveAdminRequest({
      initiatorEmail: req.adminUser.email,
      targetAdminId,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/remove/verify-current
 * Verify Initiator Admin OTP for REMOVE ADMIN
 */
router.post('/admins/remove/verify-current', async (req, res) => {
  try {
    const { requestId, otp } = req.body;
    if (!requestId || !otp) {
      return res.status(400).json({ error: 'requestId and otp are required.' });
    }

    const result = await adminService.verifyRemoveCurrentAdminOtp({
      requestId,
      otp,
      currentAdminEmail: req.adminUser.email,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/remove/verify-target
 * Verify Target Admin OTP for REMOVE ADMIN
 */
router.post('/admins/remove/verify-target', async (req, res) => {
  try {
    const { requestId, otp, targetAdminEmail } = req.body;
    if (!requestId || !otp || !targetAdminEmail) {
      return res.status(400).json({ error: 'requestId, otp, and targetAdminEmail are required.' });
    }

    const result = await adminService.verifyRemoveTargetAdminOtp({
      requestId,
      otp,
      targetAdminEmail,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/admin/admins/remove/complete
 * Atomically complete REMOVE ADMIN operation
 */
router.post('/admins/remove/complete', async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required.' });
    }

    const result = await adminService.completeRemoveAdmin({
      requestId,
      currentAdminEmail: req.adminUser.email,
      ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
