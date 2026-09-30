/**
 * adminService.js
 * 
 * Core Admin Management Service implementing:
 * - Two-Person OTP Approval logic
 * - Atomic database transactions
 * - Audit logging for all actions
 * - Last Admin Protection guard
 * - Request expiration & concurrency protection
 */

const crypto = require('crypto');
const { getUseMemoryFallback, memoryDb, pool } = require('../config/db');
const otpService = require('./otpService');
const emailService = require('./emailService');

const REQUEST_EXPIRATION_MS = 15 * 60 * 1000; // 15 mins for full flow

/**
 * Creates an audit log entry
 */
async function addAuditLog({ action, initiated_by, target_user, ip_address = '127.0.0.1', result, verification_status, details }) {
  const log = {
    id: 'LOG-' + crypto.randomUUID(),
    action,
    initiated_by,
    target_user,
    timestamp: new Date().toISOString(),
    ip_address,
    result,
    verification_status,
    details
  };

  if (getUseMemoryFallback()) {
    memoryDb.auditLogs.unshift(log);
  } else {
    await pool.query(
      `INSERT INTO admin_audit_logs (id, action, initiated_by, target_user, timestamp, ip_address, result, verification_status, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.action, log.initiated_by, log.target_user, log.timestamp, log.ip_address, log.result, log.verification_status, log.details]
    );
  }
  return log;
}

/**
 * Gets list of all administrators
 */
async function getAdmins() {
  if (getUseMemoryFallback()) {
    return memoryDb.admins;
  }
  const [rows] = await pool.query('SELECT * FROM admins ORDER BY created_at DESC');
  return rows;
}

/**
 * Gets audit logs
 */
async function getAuditLogs() {
  if (getUseMemoryFallback()) {
    return memoryDb.auditLogs;
  }
  const [rows] = await pool.query('SELECT * FROM admin_audit_logs ORDER BY timestamp DESC LIMIT 100');
  return rows;
}

/**
 * Initiate ADD ADMIN Request
 */
async function initiateAddAdminRequest({ initiatorEmail, name, email, phone, username, ip_address }) {
  const admins = await getAdmins();
  const currentAdmin = admins.find(a => a.email.toLowerCase() === initiatorEmail.toLowerCase() && a.role === 'ADMIN' && a.status === 'ACTIVE');
  if (!currentAdmin) {
    throw new Error('Unauthorized: Initiator is not an active authenticated administrator.');
  }

  const existingUser = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
  if (existingUser && existingUser.role === 'ADMIN') {
    throw new Error(`User with email ${email} is already an active administrator.`);
  }

  if (initiatorEmail.toLowerCase() === email.toLowerCase()) {
    throw new Error('Self-approval violation: You cannot add yourself as a new admin.');
  }

  const requestId = 'REQ-ADD-' + crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + REQUEST_EXPIRATION_MS);

  const reqObj = {
    id: requestId,
    action_type: 'ADD_ADMIN',
    initiated_by: currentAdmin.email,
    target_user_id: null,
    target_name: name,
    target_email: email,
    target_phone: phone,
    target_username: username || '',
    status: 'PENDING',
    current_admin_verified: false,
    target_admin_verified: false,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    completed_at: null
  };

  if (getUseMemoryFallback()) {
    memoryDb.changeRequests.push(reqObj);
  } else {
    await pool.query(
      `INSERT INTO admin_change_requests (id, action_type, initiated_by, target_name, target_email, target_phone, target_username, status, current_admin_verified, target_admin_verified, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', FALSE, FALSE, ?, ?)`,
      [requestId, 'ADD_ADMIN', currentAdmin.email, name, email, phone, username || '', createdAt, expiresAt]
    );
  }

  // Generate 2 SEPARATE OTPs
  const currentOtpRes = await otpService.createOtpRecord({
    requestId,
    userRoleType: 'CURRENT_ADMIN',
    userIdentifier: currentAdmin.email
  });

  const newOtpRes = await otpService.createOtpRecord({
    requestId,
    userRoleType: 'NEW_ADMIN',
    userIdentifier: email
  });

  // Dispatch notifications via email service abstraction
  await emailService.sendOtpNotification({
    toEmail: currentAdmin.email,
    toPhone: currentAdmin.phone,
    recipientRole: 'CURRENT_ADMIN',
    otpCode: currentOtpRes.rawOtp,
    requestId
  });

  await emailService.sendOtpNotification({
    toEmail: email,
    toPhone: phone,
    recipientRole: 'NEW_ADMIN',
    otpCode: newOtpRes.rawOtp,
    requestId
  });

  await addAuditLog({
    action: 'ADMIN_ADD_INITIATED',
    initiated_by: currentAdmin.email,
    target_user: email,
    ip_address,
    result: 'SUCCESS',
    verification_status: 'PENDING_OTP',
    details: `Two-person approval request initiated for adding new administrator ${name} (${email})`
  });

  // DO NOT return OTP values in response!
  return {
    requestId,
    status: 'PENDING',
    expiresAt,
    currentAdmin: { name: currentAdmin.full_name, email: currentAdmin.email },
    newAdmin: { name, email, phone }
  };
}

/**
 * Verify Current Admin OTP for ADD ADMIN
 */
async function verifyAddCurrentAdminOtp({ requestId, otp, currentAdminEmail, ip_address }) {
  const reqObj = await getChangeRequest(requestId);
  if (!reqObj || reqObj.action_type !== 'ADD_ADMIN') {
    throw new Error('Invalid or expired admin change request.');
  }

  if (new Date() > new Date(reqObj.expires_at)) {
    reqObj.status = 'EXPIRED';
    await updateChangeRequestStatus(requestId, 'EXPIRED');
    throw new Error('OTP expired. Request a new OTP.');
  }

  if (reqObj.initiated_by.toLowerCase() !== currentAdminEmail.toLowerCase()) {
    throw new Error('Identity violation: OTP must be verified by the initiating administrator.');
  }

  const result = await otpService.verifyOtp({
    requestId,
    userRoleType: 'CURRENT_ADMIN',
    submittedOtp: otp,
    expectedIdentifier: currentAdminEmail
  });

  if (!result.valid) {
    await addAuditLog({
      action: 'OTP_FAILED',
      initiated_by: currentAdminEmail,
      target_user: reqObj.target_email,
      ip_address,
      result: 'FAILURE',
      verification_status: result.reason,
      details: `Current Admin OTP verification failed: ${result.message}`
    });
    throw new Error(result.message);
  }

  reqObj.current_admin_verified = true;
  reqObj.status = reqObj.target_admin_verified ? 'APPROVED' : 'PARTIAL_VERIFICATION';
  await updateChangeRequestVerification(requestId, true, reqObj.target_admin_verified, reqObj.status);

  await addAuditLog({
    action: 'OTP_VERIFIED',
    initiated_by: currentAdminEmail,
    target_user: reqObj.target_email,
    ip_address,
    result: 'SUCCESS',
    verification_status: 'CURRENT_ADMIN_VERIFIED',
    details: 'Initiating Current Administrator OTP verified successfully.'
  });

  return {
    requestId,
    currentAdminVerified: true,
    targetAdminVerified: reqObj.target_admin_verified,
    status: reqObj.status
  };
}

/**
 * Verify New Admin OTP for ADD ADMIN
 */
async function verifyAddNewAdminOtp({ requestId, otp, newAdminEmail, ip_address }) {
  const reqObj = await getChangeRequest(requestId);
  if (!reqObj || reqObj.action_type !== 'ADD_ADMIN') {
    throw new Error('Invalid or expired admin change request.');
  }

  if (new Date() > new Date(reqObj.expires_at)) {
    reqObj.status = 'EXPIRED';
    await updateChangeRequestStatus(requestId, 'EXPIRED');
    throw new Error('OTP expired. Request a new OTP.');
  }

  if (reqObj.target_email.toLowerCase() !== newAdminEmail.toLowerCase()) {
    throw new Error('Identity violation: OTP must be verified by the new administrator recipient.');
  }

  // Security rule: Ensure two different persons!
  if (reqObj.initiated_by.toLowerCase() === newAdminEmail.toLowerCase()) {
    throw new Error('Security rule violation: The same person cannot satisfy both OTP approvals.');
  }

  const result = await otpService.verifyOtp({
    requestId,
    userRoleType: 'NEW_ADMIN',
    submittedOtp: otp,
    expectedIdentifier: newAdminEmail
  });

  if (!result.valid) {
    await addAuditLog({
      action: 'OTP_FAILED',
      initiated_by: reqObj.initiated_by,
      target_user: newAdminEmail,
      ip_address,
      result: 'FAILURE',
      verification_status: result.reason,
      details: `New Admin OTP verification failed: ${result.message}`
    });
    throw new Error(result.message);
  }

  reqObj.target_admin_verified = true;
  reqObj.status = reqObj.current_admin_verified ? 'APPROVED' : 'PARTIAL_VERIFICATION';
  await updateChangeRequestVerification(requestId, reqObj.current_admin_verified, true, reqObj.status);

  await addAuditLog({
    action: 'OTP_VERIFIED',
    initiated_by: reqObj.initiated_by,
    target_user: newAdminEmail,
    ip_address,
    result: 'SUCCESS',
    verification_status: 'NEW_ADMIN_VERIFIED',
    details: 'New Administrator candidate OTP verified successfully.'
  });

  return {
    requestId,
    currentAdminVerified: reqObj.current_admin_verified,
    targetAdminVerified: true,
    status: reqObj.status
  };
}

/**
 * Complete ADD ADMIN transaction atomically
 */
async function completeAddAdmin({ requestId, currentAdminEmail, ip_address }) {
  const reqObj = await getChangeRequest(requestId);
  if (!reqObj || reqObj.action_type !== 'ADD_ADMIN') {
    throw new Error('Invalid request ID.');
  }

  if (reqObj.status === 'COMPLETED') {
    throw new Error('This request has already been completed.');
  }

  if (!reqObj.current_admin_verified || !reqObj.target_admin_verified) {
    throw new Error('Both Current Admin OTP and New Admin OTP must be verified before completing administrator creation.');
  }

  // Execute atomic creation transaction
  const newAdminId = 'ADM-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const newAdminUser = {
    id: newAdminId,
    full_name: reqObj.target_name,
    email: reqObj.target_email,
    phone: reqObj.target_phone,
    username: reqObj.target_username || reqObj.target_name.toLowerCase().replace(/\s+/g, '_'),
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now
  };

  try {
    if (getUseMemoryFallback()) {
      // Memory atomic check
      const idx = memoryDb.admins.findIndex(a => a.email.toLowerCase() === reqObj.target_email.toLowerCase());
      if (idx !== -1) {
        memoryDb.admins[idx].role = 'ADMIN';
        memoryDb.admins[idx].status = 'ACTIVE';
      } else {
        memoryDb.admins.push(newAdminUser);
      }
      reqObj.status = 'COMPLETED';
      reqObj.completed_at = now;
    } else {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [existing] = await conn.query('SELECT * FROM admins WHERE email = ?', [reqObj.target_email]);
        if (existing.length > 0) {
          await conn.query('UPDATE admins SET role = ?, status = ?, updated_at = NOW() WHERE email = ?', ['ADMIN', 'ACTIVE', reqObj.target_email]);
        } else {
          await conn.query(
            `INSERT INTO admins (id, full_name, email, phone, username, role, status) VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE')`,
            [newAdminId, reqObj.target_name, reqObj.target_email, reqObj.target_phone, reqObj.target_username]
          );
        }

        await conn.query('UPDATE admin_change_requests SET status = "COMPLETED", completed_at = NOW() WHERE id = ?', [requestId]);
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    await addAuditLog({
      action: 'ADMIN_ADDED',
      initiated_by: reqObj.initiated_by,
      target_user: reqObj.target_email,
      ip_address,
      result: 'SUCCESS',
      verification_status: 'TWO_PERSON_APPROVED',
      details: `New administrator ${reqObj.target_name} (${reqObj.target_email}) successfully activated with role ADMIN.`
    });

    return {
      success: true,
      message: 'New administrator added successfully.',
      admin: newAdminUser
    };
  } catch (err) {
    await addAuditLog({
      action: 'ADMIN_ADD_FAILED',
      initiated_by: reqObj.initiated_by,
      target_user: reqObj.target_email,
      ip_address,
      result: 'FAILURE',
      verification_status: 'TRANSACTION_ERROR',
      details: `Transaction error during administrator creation: ${err.message}`
    });
    throw err;
  }
}

/**
 * Initiate REMOVE ADMIN Request
 */
async function initiateRemoveAdminRequest({ initiatorEmail, targetAdminId, ip_address }) {
  const admins = await getAdmins();
  const activeAdmins = admins.filter(a => a.role === 'ADMIN' && a.status === 'ACTIVE');

  // LAST ADMIN PROTECTION RULE
  if (activeAdmins.length <= 1) {
    throw new Error('At least one active administrator must remain. Cannot remove the final administrator.');
  }

  const currentAdmin = admins.find(a => a.email.toLowerCase() === initiatorEmail.toLowerCase() && a.role === 'ADMIN' && a.status === 'ACTIVE');
  if (!currentAdmin) {
    throw new Error('Unauthorized: Initiator is not an active authenticated administrator.');
  }

  const targetAdmin = admins.find(a => a.id === targetAdminId || a.email.toLowerCase() === targetAdminId.toLowerCase());
  if (!targetAdmin || targetAdmin.role !== 'ADMIN') {
    throw new Error('Target user is not an active administrator.');
  }

  if (currentAdmin.email.toLowerCase() === targetAdmin.email.toLowerCase()) {
    throw new Error('Self-removal is not allowed via two-person flow. Another administrator must initiate.');
  }

  const requestId = 'REQ-REM-' + crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + REQUEST_EXPIRATION_MS);

  const reqObj = {
    id: requestId,
    action_type: 'REMOVE_ADMIN',
    initiated_by: currentAdmin.email,
    target_user_id: targetAdmin.id,
    target_name: targetAdmin.full_name,
    target_email: targetAdmin.email,
    target_phone: targetAdmin.phone,
    target_username: targetAdmin.username,
    status: 'PENDING',
    current_admin_verified: false,
    target_admin_verified: false,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    completed_at: null
  };

  if (getUseMemoryFallback()) {
    memoryDb.changeRequests.push(reqObj);
  } else {
    await pool.query(
      `INSERT INTO admin_change_requests (id, action_type, initiated_by, target_user_id, target_name, target_email, target_phone, target_username, status, current_admin_verified, target_admin_verified, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', FALSE, FALSE, ?, ?)`,
      [requestId, 'REMOVE_ADMIN', currentAdmin.email, targetAdmin.id, targetAdmin.full_name, targetAdmin.email, targetAdmin.phone, targetAdmin.username, createdAt, expiresAt]
    );
  }

  // Generate 2 SEPARATE OTPs
  const currentOtpRes = await otpService.createOtpRecord({
    requestId,
    userRoleType: 'CURRENT_ADMIN',
    userIdentifier: currentAdmin.email
  });

  const targetOtpRes = await otpService.createOtpRecord({
    requestId,
    userRoleType: 'TARGET_ADMIN',
    userIdentifier: targetAdmin.email
  });

  // Dispatch notifications via email service
  await emailService.sendOtpNotification({
    toEmail: currentAdmin.email,
    toPhone: currentAdmin.phone,
    recipientRole: 'CURRENT_ADMIN',
    otpCode: currentOtpRes.rawOtp,
    requestId
  });

  await emailService.sendOtpNotification({
    toEmail: targetAdmin.email,
    toPhone: targetAdmin.phone,
    recipientRole: 'TARGET_ADMIN',
    otpCode: targetOtpRes.rawOtp,
    requestId
  });

  await addAuditLog({
    action: 'ADMIN_REMOVE_INITIATED',
    initiated_by: currentAdmin.email,
    target_user: targetAdmin.email,
    ip_address,
    result: 'SUCCESS',
    verification_status: 'PENDING_OTP',
    details: `Two-person approval request initiated for removing administrator ${targetAdmin.full_name} (${targetAdmin.email})`
  });

  return {
    requestId,
    status: 'PENDING',
    expiresAt,
    currentAdmin: { name: currentAdmin.full_name, email: currentAdmin.email },
    targetAdmin: { name: targetAdmin.full_name, email: targetAdmin.email }
  };
}

/**
 * Verify Current Admin OTP for REMOVE ADMIN
 */
async function verifyRemoveCurrentAdminOtp({ requestId, otp, currentAdminEmail, ip_address }) {
  const reqObj = await getChangeRequest(requestId);
  if (!reqObj || reqObj.action_type !== 'REMOVE_ADMIN') {
    throw new Error('Invalid or expired admin change request.');
  }

  if (new Date() > new Date(reqObj.expires_at)) {
    reqObj.status = 'EXPIRED';
    await updateChangeRequestStatus(requestId, 'EXPIRED');
    throw new Error('OTP expired. Request a new OTP.');
  }

  const result = await otpService.verifyOtp({
    requestId,
    userRoleType: 'CURRENT_ADMIN',
    submittedOtp: otp,
    expectedIdentifier: currentAdminEmail
  });

  if (!result.valid) {
    await addAuditLog({
      action: 'OTP_FAILED',
      initiated_by: currentAdminEmail,
      target_user: reqObj.target_email,
      ip_address,
      result: 'FAILURE',
      verification_status: result.reason,
      details: `Initiator Admin OTP verification failed: ${result.message}`
    });
    throw new Error(result.message);
  }

  reqObj.current_admin_verified = true;
  reqObj.status = reqObj.target_admin_verified ? 'APPROVED' : 'PARTIAL_VERIFICATION';
  await updateChangeRequestVerification(requestId, true, reqObj.target_admin_verified, reqObj.status);

  await addAuditLog({
    action: 'OTP_VERIFIED',
    initiated_by: currentAdminEmail,
    target_user: reqObj.target_email,
    ip_address,
    result: 'SUCCESS',
    verification_status: 'CURRENT_ADMIN_VERIFIED',
    details: 'Initiating Administrator OTP verified for admin removal.'
  });

  return {
    requestId,
    currentAdminVerified: true,
    targetAdminVerified: reqObj.target_admin_verified,
    status: reqObj.status
  };
}

/**
 * Verify Target Admin OTP for REMOVE ADMIN
 */
async function verifyRemoveTargetAdminOtp({ requestId, otp, targetAdminEmail, ip_address }) {
  const reqObj = await getChangeRequest(requestId);
  if (!reqObj || reqObj.action_type !== 'REMOVE_ADMIN') {
    throw new Error('Invalid or expired admin change request.');
  }

  if (new Date() > new Date(reqObj.expires_at)) {
    reqObj.status = 'EXPIRED';
    await updateChangeRequestStatus(requestId, 'EXPIRED');
    throw new Error('OTP expired. Request a new OTP.');
  }

  // Ensure target email matches
  if (reqObj.target_email.toLowerCase() !== targetAdminEmail.toLowerCase()) {
    throw new Error('Identity violation: OTP must be verified by the target administrator being removed.');
  }

  // Security rule: Ensure two different persons!
  if (reqObj.initiated_by.toLowerCase() === targetAdminEmail.toLowerCase()) {
    throw new Error('Security rule violation: The same person cannot satisfy both OTP approvals.');
  }

  const result = await otpService.verifyOtp({
    requestId,
    userRoleType: 'TARGET_ADMIN',
    submittedOtp: otp,
    expectedIdentifier: targetAdminEmail
  });

  if (!result.valid) {
    await addAuditLog({
      action: 'OTP_FAILED',
      initiated_by: reqObj.initiated_by,
      target_user: targetAdminEmail,
      ip_address,
      result: 'FAILURE',
      verification_status: result.reason,
      details: `Target Admin OTP verification failed: ${result.message}`
    });
    throw new Error(result.message);
  }

  reqObj.target_admin_verified = true;
  reqObj.status = reqObj.current_admin_verified ? 'APPROVED' : 'PARTIAL_VERIFICATION';
  await updateChangeRequestVerification(requestId, reqObj.current_admin_verified, true, reqObj.status);

  await addAuditLog({
    action: 'OTP_VERIFIED',
    initiated_by: reqObj.initiated_by,
    target_user: targetAdminEmail,
    ip_address,
    result: 'SUCCESS',
    verification_status: 'TARGET_ADMIN_VERIFIED',
    details: 'Target Administrator OTP verified for admin removal.'
  });

  return {
    requestId,
    currentAdminVerified: reqObj.current_admin_verified,
    targetAdminVerified: true,
    status: reqObj.status
  };
}

/**
 * Complete REMOVE ADMIN transaction atomically
 */
async function completeRemoveAdmin({ requestId, currentAdminEmail, ip_address }) {
  const reqObj = await getChangeRequest(requestId);
  if (!reqObj || reqObj.action_type !== 'REMOVE_ADMIN') {
    throw new Error('Invalid request ID.');
  }

  if (reqObj.status === 'COMPLETED') {
    throw new Error('This request has already been completed.');
  }

  // LAST ADMIN PROTECTION RE-CHECK
  const admins = await getAdmins();
  const activeAdmins = admins.filter(a => a.role === 'ADMIN' && a.status === 'ACTIVE');
  if (activeAdmins.length <= 1) {
    throw new Error('At least one active administrator must remain.');
  }

  if (!reqObj.current_admin_verified || !reqObj.target_admin_verified) {
    throw new Error('Both Initiator Admin OTP and Target Admin OTP must be verified before completing administrator removal.');
  }

  const now = new Date().toISOString();

  try {
    if (getUseMemoryFallback()) {
      const idx = memoryDb.admins.findIndex(a => a.email.toLowerCase() === reqObj.target_email.toLowerCase());
      if (idx !== -1) {
        // Do NOT delete user record. Change role & preserve account history.
        memoryDb.admins[idx].role = 'STAFF';
        memoryDb.admins[idx].status = 'REVOKED';
        memoryDb.admins[idx].updated_at = now;
      }
      reqObj.status = 'COMPLETED';
      reqObj.completed_at = now;
    } else {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Update role to STAFF / REVOKED to preserve record and history
        await conn.query('UPDATE admins SET role = "STAFF", status = "REVOKED", updated_at = NOW() WHERE email = ?', [reqObj.target_email]);
        await conn.query('UPDATE admin_change_requests SET status = "COMPLETED", completed_at = NOW() WHERE id = ?', [requestId]);

        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    await addAuditLog({
      action: 'ADMIN_REMOVED',
      initiated_by: reqObj.initiated_by,
      target_user: reqObj.target_email,
      ip_address,
      result: 'SUCCESS',
      verification_status: 'TWO_PERSON_APPROVED',
      details: `Administrator role removed from ${reqObj.target_name} (${reqObj.target_email}). Account history preserved.`
    });

    return {
      success: true,
      message: 'Administrator role removed successfully.',
      targetEmail: reqObj.target_email
    };
  } catch (err) {
    await addAuditLog({
      action: 'ADMIN_REMOVE_FAILED',
      initiated_by: reqObj.initiated_by,
      target_user: reqObj.target_email,
      ip_address,
      result: 'FAILURE',
      verification_status: 'TRANSACTION_ERROR',
      details: `Transaction error during administrator removal: ${err.message}`
    });
    throw err;
  }
}

// Helpers
async function getChangeRequest(id) {
  if (getUseMemoryFallback()) {
    return memoryDb.changeRequests.find(r => r.id === id) || null;
  }
  const [rows] = await pool.query('SELECT * FROM admin_change_requests WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateChangeRequestStatus(id, status) {
  if (getUseMemoryFallback()) {
    const r = memoryDb.changeRequests.find(req => req.id === id);
    if (r) r.status = status;
  } else {
    await pool.query('UPDATE admin_change_requests SET status = ? WHERE id = ?', [status, id]);
  }
}

async function updateChangeRequestVerification(id, currentVerified, targetVerified, status) {
  if (getUseMemoryFallback()) {
    const r = memoryDb.changeRequests.find(req => req.id === id);
    if (r) {
      r.current_admin_verified = currentVerified;
      r.target_admin_verified = targetVerified;
      r.status = status;
    }
  } else {
    await pool.query(
      'UPDATE admin_change_requests SET current_admin_verified = ?, target_admin_verified = ?, status = ? WHERE id = ?',
      [currentVerified, targetVerified, status, id]
    );
  }
}

module.exports = {
  getAdmins,
  getAuditLogs,
  addAuditLog,
  initiateAddAdminRequest,
  verifyAddCurrentAdminOtp,
  verifyAddNewAdminOtp,
  completeAddAdmin,
  initiateRemoveAdminRequest,
  verifyRemoveCurrentAdminOtp,
  verifyRemoveTargetAdminOtp,
  completeRemoveAdmin,
  getChangeRequest
};
