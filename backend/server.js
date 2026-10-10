/**
 * server.js
 * 
 * Express backend server for Cricket Federation Full-Stack Management & Scorer REST APIs.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');
const scorerRoutes = require('./routes/scorerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const newsRoutes = require('./routes/newsRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cricket Federation Express Backend API operational' });
});

// Authentication APIs (Password Auth & Registration Email OTP)
app.use('/api/auth', authRoutes);

// Admin Management APIs
app.use('/api/admin', adminRoutes);

// Team Registration, Login & Management APIs
app.use('/api/team', teamRoutes);
app.use('/api/teams', teamRoutes);

// Player Registration, Login & Profile APIs
app.use('/api/player', playerRoutes);
app.use('/api/players', playerRoutes);

// Scorer & Live Scoring APIs
app.use('/api/scorer', scorerRoutes);

// Match & Tournament APIs
app.use('/api/matches', matchRoutes);

// News & Announcements APIs
app.use('/api/news', newsRoutes);

// Portal Public APIs
app.use('/api/portal', portalRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Express Backend Server running on http://localhost:${PORT}`);
});

module.exports = app;
