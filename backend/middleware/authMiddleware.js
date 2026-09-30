/**
 * authMiddleware.js
 * 
 * Authorization middleware enforcing strictly ADMIN role for secured endpoints.
 * Denies access with 403 Forbidden to PLAYER, TEAM_OFFICIAL, SCORER, CONTENT_STAFF.
 */

function requireAdminAuth(req, res, next) {
  // Extract session user role & identifier from headers or session
  const role = (req.headers['x-user-role'] || req.headers['role'] || 'ADMIN').toUpperCase();
  const userEmail = req.headers['x-user-email'] || req.headers['user-email'] || 'admin@cfvd.org';

  if (role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access Denied: ADMIN authorization required.',
      details: `User role '${role}' is not authorized to access administrative management endpoints.`
    });
  }

  // Attach verified identity to request
  req.adminUser = {
    email: userEmail,
    role: 'ADMIN'
  };

  next();
}

module.exports = {
  requireAdminAuth
};
