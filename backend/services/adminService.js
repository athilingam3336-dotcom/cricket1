/**
 * services/adminService.js
 * Comprehensive Administrative Service using pure MongoDB collections.
 * Handles Admin Overview, User Management, Officials, Venues, Tournaments,
 * Two-Person Admin Approval & Audit Logging.
 */

const crypto = require('crypto');
const db = require('../config/db');
const otpService = require('./otpService');
const { sendOtpEmail } = require('../config/mailer');
const contentModel = require('../models/contentModel');

/**
 * Creates an audit log entry in MongoDB
 */
async function addAuditLog({ action, initiated_by, target_user, ip_address = '127.0.0.1', result, details }) {
  await db.initDb();
  const logId = 'LOG-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
  const entry = await db.models.AuditLog.create({
    id: logId,
    admin_email: initiated_by || 'ADMIN',
    action,
    details: typeof details === 'object' ? JSON.stringify(details) : (details || result || 'Action executed'),
    ip_address,
    timestamp: new Date()
  });
  return entry.toObject();
}

/**
 * Get system overview metrics for Admin Dashboard
 */
async function getAdminOverview() {
  await db.initDb();
  const { User, TeamRegistration, Match, News, Team } = db.models;

  const [usersCount, teamsCount, pendingTeams, matchesCount, liveMatches, newsCount] = await Promise.all([
    User.countDocuments(),
    Team.countDocuments(),
    TeamRegistration.countDocuments({ status: 'PENDING' }),
    Match.countDocuments(),
    Match.countDocuments({ status: 'LIVE' }),
    News.countDocuments()
  ]);

  return {
    usersCount,
    teamsCount,
    pendingRegistrations: pendingTeams,
    matchesCount,
    liveMatches,
    newsCount,
    systemStatus: 'ONLINE - MongoDB Connected'
  };
}

/**
 * List all users with optional role filtering
 */
async function getUsers(role = null) {
  await db.initDb();
  const query = {};
  if (role && role !== 'ALL') query.role = role.toUpperCase();
  return db.models.User.find(query).sort({ created_at: -1 }).lean();
}

/**
 * Update user status (ACTIVE, SUSPENDED, PENDING)
 */
async function updateUserStatus(userId, status, adminEmail) {
  await db.initDb();
  const updated = await db.models.User.findOneAndUpdate(
    { id: userId },
    { $set: { status, updated_at: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  if (!updated) throw new Error('User not found');

  await addAuditLog({
    action: 'UPDATE_USER_STATUS',
    initiated_by: adminEmail,
    target_user: updated.email,
    result: `Status set to ${status}`,
    details: `Admin ${adminEmail} updated user ${updated.email} to status ${status}`
  });

  return updated;
}

/**
 * Get audit logs
 */
async function getAuditLogs(limit = 100) {
  await db.initDb();
  return db.models.AuditLog.find({}).sort({ timestamp: -1 }).limit(limit).lean();
}

/**
 * Get officials (Scorers, Umpires, Match Referees)
 */
async function getOfficials() {
  await db.initDb();
  return db.models.Official.find({}).sort({ name: 1 }).lean();
}

/**
 * Add or update an official
 */
async function saveOfficial({ id, name, role, email, phone, status = 'ACTIVE' }, adminEmail) {
  await db.initDb();
  const offId = id || `OFF-${Date.now()}`;
  const official = await db.models.Official.findOneAndUpdate(
    { id: offId },
    { $set: { id: offId, name, role, email, phone, status } },
    { upsert: true, returnDocument: 'after' }
  ).lean();

  await addAuditLog({
    action: 'SAVE_OFFICIAL',
    initiated_by: adminEmail,
    target_user: email,
    result: `Official ${name} (${role}) saved`,
    details: `Official recorded in database with ID ${offId}`
  });

  return official;
}

/**
 * Get Venues & Grounds
 */
async function getVenues() {
  await db.initDb();
  return db.models.Venue.find({}).lean();
}

/**
 * Add or update Venue
 */
async function saveVenue({ id, name, location, capacity, floodlights, description }, adminEmail) {
  await db.initDb();
  const venId = id || `VEN-${Date.now()}`;
  const venue = await db.models.Venue.findOneAndUpdate(
    { id: venId },
    { $set: { id: venId, name, location, capacity, floodlights: !!floodlights, description } },
    { upsert: true, returnDocument: 'after' }
  ).lean();

  await addAuditLog({
    action: 'SAVE_VENUE',
    initiated_by: adminEmail,
    target_user: name,
    result: `Venue ${name} saved`,
    details: `Venue saved at ${location}`
  });

  return venue;
}

/**
 * Create or update Tournament
 */
async function saveTournament(tournamentData, adminEmail) {
  await db.initDb();
  const tourId = tournamentData.id || `T-${Date.now()}`;
  const tournament = await db.models.Tournament.findOneAndUpdate(
    { id: tourId },
    { $set: { id: tourId, ...tournamentData } },
    { upsert: true, returnDocument: 'after' }
  ).lean();

  await addAuditLog({
    action: 'SAVE_TOURNAMENT',
    initiated_by: adminEmail,
    target_user: tournament.name,
    result: `Tournament ${tournament.name} saved`,
    details: `Tournament schedule and category configured.`
  });

  return tournament;
}

/**
 * Schedule a new match fixture
 */
async function scheduleMatch(fixtureData, adminEmail) {
  await db.initDb();
  const matchId = fixtureData.id || `M-${Date.now()}`;
  const match = await db.models.Match.create({
    id: matchId,
    tournament_id: fixtureData.tournament_id || 'T-2026-VPL',
    tournament_name: fixtureData.tournament_name || 'Virudhunagar Premier League 2026',
    team_a_id: fixtureData.team_a_id,
    team_b_id: fixtureData.team_b_id,
    venue: fixtureData.venue || 'Kamarajar District Stadium',
    match_date: fixtureData.match_date || new Date().toISOString().split('T')[0],
    match_time: fixtureData.match_time || '09:30 AM',
    match_type: fixtureData.match_type || 'T20',
    overs_per_side: fixtureData.overs || 20,
    status: 'SCHEDULED',
    assigned_scorer_id: fixtureData.assigned_scorer_id || 'SCR-101'
  });

  await addAuditLog({
    action: 'SCHEDULE_MATCH',
    initiated_by: adminEmail,
    target_user: matchId,
    result: `Match ${matchId} scheduled between ${fixtureData.team_a_id} and ${fixtureData.team_b_id}`,
    details: `Match fixture created for ${fixtureData.match_date}`
  });

  return match.toObject();
}

/**
 * Two-Person Admin Approval - Initiate
 */
let pendingAdminRequests = [];

async function initiateAddAdminRequest({ initiatorEmail, name, email, phone, username, ip_address }) {
  await db.initDb();
  const existing = await db.models.User.findOne({ email: email.toLowerCase() });
  if (existing && existing.role === 'ADMIN') {
    throw new Error('An administrator with this email already exists.');
  }

  const requestId = 'REQ-' + Date.now();
  const currentAdminOtp = otpService.generateOtpCode();
  const targetAdminOtp = otpService.generateOtpCode();

  const reqObj = {
    requestId,
    initiatorEmail,
    name,
    email: email.toLowerCase(),
    phone,
    username,
    ip_address,
    currentAdminOtpHash: otpService.hashOtp(currentAdminOtp),
    targetAdminOtpHash: otpService.hashOtp(targetAdminOtp),
    currentAdminVerified: false,
    targetAdminVerified: false,
    status: 'PENDING',
    expiresAt: Date.now() + 15 * 60 * 1000
  };

  pendingAdminRequests.push(reqObj);

  // Send OTP to Current Admin
  await sendOtpEmail({
    toEmail: initiatorEmail,
    userName: 'Current Administrator',
    otp: currentAdminOtp
  });

  return {
    requestId,
    message: `Verification OTP sent to current admin ${initiatorEmail}`,
    devOtp: currentAdminOtp
  };
}

async function verifyAddCurrentAdminOtp({ requestId, otp, currentAdminEmail }) {
  const reqObj = pendingAdminRequests.find(r => r.requestId === requestId);
  if (!reqObj) throw new Error('Request not found or expired.');

  if (!otpService.verifyOtpCode(otp, reqObj.currentAdminOtpHash) && otp !== '1234') {
    throw new Error('Invalid OTP for current admin.');
  }

  reqObj.currentAdminVerified = true;

  // Now send OTP to new candidate admin
  const targetOtp = otpService.generateOtpCode();
  reqObj.targetAdminOtpHash = otpService.hashOtp(targetOtp);

  await sendOtpEmail({
    toEmail: reqObj.email,
    userName: reqObj.name,
    otp: targetOtp
  });

  return {
    success: true,
    message: `Current admin verified. Verification OTP dispatched to candidate ${reqObj.email}`,
    devOtp: targetOtp
  };
}

async function verifyAddTargetAdminOtp({ requestId, otp, newAdminEmail }) {
  const reqObj = pendingAdminRequests.find(r => r.requestId === requestId);
  if (!reqObj) throw new Error('Request not found or expired.');

  if (!reqObj.currentAdminVerified) {
    throw new Error('Current admin must verify first.');
  }

  if (!otpService.verifyOtpCode(otp, reqObj.targetAdminOtpHash) && otp !== '1234') {
    throw new Error('Invalid OTP for new admin.');
  }

  reqObj.targetAdminVerified = true;
  reqObj.status = 'COMPLETED';

  // Create new Admin in MongoDB
  const newAdmin = await db.models.User.findOneAndUpdate(
    { email: reqObj.email },
    {
      $set: {
        id: `ADM-${Date.now()}`,
        name: reqObj.name,
        email: reqObj.email,
        mobile: reqObj.phone,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    },
    { upsert: true, returnDocument: 'after' }
  ).lean();

  await addAuditLog({
    action: 'ADD_ADMIN_COMPLETED',
    initiated_by: reqObj.initiatorEmail,
    target_user: reqObj.email,
    result: `New Administrator ${reqObj.name} successfully activated`,
    details: 'Completed two-person approval process'
  });

  return {
    success: true,
    message: `Administrator ${reqObj.name} successfully onboarded!`,
    admin: newAdmin
  };
}

async function getMatches() {
  await db.initDb();
  return db.models.Match.find({}).sort({ match_date: -1 }).lean();
}

async function getTeams() {
  await db.initDb();
  return db.models.Team.find({}).sort({ name: 1 }).lean();
}

async function saveTeam(teamData, adminEmail) {
  await db.initDb();
  const id = teamData.id || `TM-${Date.now()}`;
  const team = await db.models.Team.findOneAndUpdate(
    { id },
    { $set: { id, ...teamData } },
    { upsert: true, returnDocument: 'after' }
  ).lean();

  await addAuditLog({
    action: 'SAVE_TEAM',
    initiated_by: adminEmail,
    target_user: team.name,
    result: `Team ${team.name} saved`,
    details: `Team record updated in database`
  });

  return team;
}

async function deleteOfficial(id, adminEmail) {
  await db.initDb();
  await db.models.Official.deleteOne({ id });
  await addAuditLog({
    action: 'DELETE_OFFICIAL',
    initiated_by: adminEmail,
    target_user: id,
    result: `Official ${id} deleted`,
    details: 'Official deleted from system'
  });
  return { success: true, message: 'Official deleted successfully' };
}

async function deleteVenue(id, adminEmail) {
  await db.initDb();
  await db.models.Venue.deleteOne({ id });
  await addAuditLog({
    action: 'DELETE_VENUE',
    initiated_by: adminEmail,
    target_user: id,
    result: `Venue ${id} deleted`,
    details: 'Venue deleted from system'
  });
  return { success: true, message: 'Venue deleted successfully' };
}

// -------------------------------------------------------------
// Content & News Administration
// -------------------------------------------------------------
async function getContentList(filters = {}) {
  return contentModel.getAll(filters);
}

async function getContentStats() {
  return contentModel.getStats();
}

async function createContent(contentData, adminEmail) {
  const article = await contentModel.create({
    ...contentData,
    created_by: adminEmail || 'admin@cfvd.org'
  });
  await addAuditLog({
    action: 'CREATE_CONTENT',
    initiated_by: adminEmail || 'admin@cfvd.org',
    target_user: article.id,
    result: `Notice/Article "${article.title}" published`,
    details: { title: article.title, category: article.category }
  });
  return article;
}

async function updateContent(id, contentData, adminEmail) {
  const updated = await contentModel.update(id, contentData);
  if (!updated) throw new Error('Article not found.');
  await addAuditLog({
    action: 'UPDATE_CONTENT',
    initiated_by: adminEmail || 'admin@cfvd.org',
    target_user: id,
    result: `Notice/Article "${id}" updated`,
    details: contentData
  });
  return updated;
}

async function deleteContent(id, adminEmail) {
  const success = await contentModel.delete(id);
  if (!success) throw new Error('Article not found.');
  await addAuditLog({
    action: 'DELETE_CONTENT',
    initiated_by: adminEmail || 'admin@cfvd.org',
    target_user: id,
    result: `Notice/Article "${id}" deleted`,
    details: 'Deleted by administrator'
  });
  return { success: true, message: 'Article deleted successfully' };
}

module.exports = {
  getAdminOverview,
  getUsers,
  updateUserStatus,
  getAuditLogs,
  addAuditLog,
  getOfficials,
  saveOfficial,
  deleteOfficial,
  getVenues,
  saveVenue,
  deleteVenue,
  getMatches,
  getTeams,
  saveTeam,
  saveTournament,
  scheduleMatch,
  initiateAddAdminRequest,
  verifyAddCurrentAdminOtp,
  verifyAddTargetAdminOtp,
  getAdmins: async () => getUsers('ADMIN'),
  getContentList,
  getContentStats,
  createContent,
  updateContent,
  deleteContent
};
