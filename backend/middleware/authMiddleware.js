/**
 * middleware/authMiddleware.js
 * JWT Authentication middleware verifying Bearer tokens
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cricket_super_secret_jwt_2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token.'
      });
    }
  }

  // Development/testing custom headers (only if token is absent)
  if (process.env.NODE_ENV !== 'production') {
    const roleHeader = req.headers['x-user-role'] || req.headers['role'];
    const emailHeader = req.headers['x-user-email'] || req.headers['user-email'];
    const idHeader = req.headers['x-user-id'] || req.headers['scorer-id'];

    if (roleHeader) {
      req.user = {
        id: idHeader || (roleHeader.toUpperCase() === 'ADMIN' ? 'ADM-1001' : 'SCR-101'),
        email: emailHeader || (roleHeader.toUpperCase() === 'ADMIN' ? 'admin@example.com' : 'scorer@cfvd.org'),
        role: roleHeader.toUpperCase(),
        name: roleHeader.toUpperCase() === 'ADMIN' ? 'Chief Admin' : 'S. Ramesh'
      };
      return next();
    }
  }

  // No token or credentials provided
  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Authentication token required.'
  });
}

// Scorer authorization helper (backward compatibility)
function requireScorerAuth(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'SCORER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: SCORER or ADMIN authorization required.',
        details: `Role '${req.user.role}' cannot access scorer endpoints.`
      });
    }
    next();
  });
}

// Admin authorization helper (backward compatibility)
function requireAdminAuth(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: ADMIN authorization required.',
        details: `Role '${req.user.role}' cannot access administrative management endpoints.`
      });
    }
    req.adminUser = req.user;
    next();
  });
}

module.exports = {
  verifyToken,
  requireScorerAuth,
  requireAdminAuth
};
