/**
 * server.js
 * 
 * Express and Socket.IO Backend Server for Cricket Federation Scorer & Management System.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const { initSocket } = require('./services/socketService');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scorerRoutes = require('./routes/scorerRoutes');
const matchRoutes = require('./routes/matchRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO on HTTP server
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Cricket Federation Scorer Backend API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/scorer', scorerRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🏏 Cricket Express & Socket.IO Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
