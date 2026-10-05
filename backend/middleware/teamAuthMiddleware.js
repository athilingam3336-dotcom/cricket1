/**
 * teamAuthMiddleware.js
 *
 * JWT-based authentication middleware for Team-protected endpoints.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_team_jwt_secret_2025';

function requireTeamAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'TEAM') {
      return res.status(403).json({ error: 'Access Denied: TEAM role required.' });
    }
    req.teamUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.' });
  }
}

module.exports = { requireTeamAuth };
