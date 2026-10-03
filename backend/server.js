/**
 * server.js
 * 
 * Express and Socket.IO Backend Server for Cricket Federation Scorer & Management System.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { initSocket } = require('./services/socketService');
const { verifySmtpConnection } = require('./config/mailer');
const authController = require('./controllers/authController');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scorerRoutes = require('./routes/scorerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const { router: teamRoutes } = require('./routes/teamRoutes');
const teamController = require('./controllers/teamController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO on HTTP server
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Cricket Federation Scorer Backend API',
    timestamp: new Date().toISOString()
  });
});

// Direct REST APIs for Scorers and Admin Scorer Management
app.post('/api/scorers/register', (req, res) => authController.registerScorer(req, res));
app.get('/api/scorers/check', (req, res) => authController.checkScorer(req, res));

app.get('/api/admin/scorers/pending', (req, res) => authController.getPendingScorers(req, res));
app.get('/api/admin/scorers', (req, res) => authController.getScorers(req, res));
app.patch('/api/admin/scorers/:id/approve', (req, res) => authController.approveScorer(req, res));
app.post('/api/admin/scorers/:id/approve', (req, res) => authController.approveScorer(req, res));
app.patch('/api/admin/scorers/:id/reject', (req, res) => authController.rejectScorer(req, res));
app.post('/api/admin/scorers/:id/reject', (req, res) => authController.rejectScorer(req, res));

app.post('/api/scorer/send-otp', (req, res) => authController.requestScorerOtp(req, res));
app.post('/api/scorer/verify-otp', (req, res) => authController.verifyScorerOtp(req, res));

// Mount Sub-Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scorer', scorerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);
app.get('/api/admin/teams', (req, res) => teamController.getAllTeamsForAdmin(req, res));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

if (require.main === module) {
  server.listen(PORT, async () => {
    console.log(`🏏 Cricket Express & Socket.IO Server running on http://localhost:${PORT}`);
    try {
      const smtpCheck = await verifySmtpConnection();
      if (smtpCheck.ok) {
        console.log(`[SMTP] SMTP connection: OK (${smtpCheck.host})`);
      } else {
        console.log(`[SMTP] ${smtpCheck.status}: ${smtpCheck.message}`);
      }
    } catch (e) {
      console.log(`[SMTP] SMTP configuration check error: ${e.message}`);
    }
  });
}

module.exports = { app, server };
