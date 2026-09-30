/**
 * server.js
 * 
 * Express backend server for Cricket Federation Secure Admin Management APIs.
 */

const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cricket Federation Express Backend API operational' });
});

// Admin Management APIs
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Express Backend Server running on http://localhost:${PORT}`);
});

module.exports = app;
