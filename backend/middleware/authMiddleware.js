/**
 * middleware/authMiddleware.js
 * Authorization middleware for SCORER and ADMIN roles
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cricket_super_secret_jwt_2026';

function extractUser(req) {
  // Check Authorization Bearer header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Token invalid
      return null;
    }
  }

  // Fallback to custom headers for testing / dev
  const role = req.headers['x-user-role'] || req.headers['role'];
  const email = req.headers['x-user-email'] || req.headers['user-email'];
  const id = req.headers['x-user-id'] || req.headers['scorer-id'] || (role === 'ADMIN' ? 'ADM-1001' : 'SCR-101');

  if (role) {
    return {
      id,
      email: email || (role === 'ADMIN' ? 'admin@cfvd.org' : 'scorer@cfvd.org'),
      role: role.toUpperCase(),
      name: role === 'ADMIN' ? 'Chief Admin' : 'S. Ramesh'
    };
  }

  // Default demo fallback for scorer if no header
  return {
    id: 'SCR-101',
    email: 'scorer@cfvd.org',
    role: 'SCORER',
    name: 'S. Ramesh'
  };
}

function requireScorerAuth(req, res, next) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token required.'
    });
  }

  if (user.role !== 'SCORER' && user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: SCORER or ADMIN authorization required.',
      details: `Role '${user.role}' cannot access scorer endpoints.`
    });
  }

  req.user = user;
  next();
}

function requireAdminAuth(req, res, next) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication token required.'
    });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: ADMIN authorization required.',
      details: `Role '${user.role}' cannot access administrative management endpoints.`
    });
  }

  req.adminUser = user;
  next();
}

module.exports = {
  requireScorerAuth,
  requireAdminAuth
};
