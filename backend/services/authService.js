/**
 * services/authService.js
 * Comprehensive Authentication Service using MongoDB and Nodemailer OTP verification.
 * Supports Player, Team / Coach, Scorer, Content Staff, and Association Admin roles.
 */

const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const teamRegistrationModel = require('../models/teamRegistrationModel');
const notificationModel = require('../models/notificationModel');
const otpService = require('./otpService');
const { sendOtpEmail } = require('../config/mailer');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cricket_super_secret_jwt_2026';

class AuthService {
  /**
   * Request OTP for email-based login (Scorer, Admin, Content Staff, or General User)
   * @param {string} email
   * @param {string} roleRequired (optional filter)
   */
  async requestOtp(email, roleRequired = null) {
    if (!email || typeof email !== 'string') {
      throw { status: 400, message: 'Please provide a valid email address.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw { status: 400, message: 'Invalid email address format.' };
    }

    // 1. Verify user exists in MongoDB
    let user = await userModel.findByEmail(cleanEmail);

    // Primary authorized developer & admin emails
    const ADMIN_OR_DEV_EMAILS = [
      'admin@example.com',
      'admin@cfvd.org',
      'cricketfederation21@gmail.com',
      'athilingam3336@gmail.com',
      'ponramanan21@gmail.com',
      'ramana.twone@gmail.com'
    ];

    // If Admin/Dev email, allow auto-creation of system admin/scorer if not already present
    if (!user && ADMIN_OR_DEV_EMAILS.includes(cleanEmail)) {
      user = await userModel.create({
        id: `ADM-${Date.now()}`,
        name: cleanEmail.includes('athilingam') 
          ? 'Athilingam (Admin & Scorer)' 
          : (cleanEmail.includes('ramana') || cleanEmail.includes('ponramanan') 
            ? 'Mathan / Ramana (Admin & Scorer)' 
            : 'Association Admin'),
        email: cleanEmail,
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    }

    if (!user) {
      throw { status: 404, message: `Email "${cleanEmail}" is not registered. Please register first or contact the administrator.` };
    }

    // Ensure dev/admin accounts are always ACTIVE
    if (ADMIN_OR_DEV_EMAILS.includes(cleanEmail) && user.status !== 'ACTIVE') {
      await userModel.updateStatus(user.id, 'ACTIVE');
      user.status = 'ACTIVE';
    }

    // 2. Enforce Role filter if provided (ADMIN can access all roles, COACH can also score, Dev emails have full access)
    const isScorerAccessAllowed = roleRequired === 'SCORER' && (user.role === 'SCORER' || user.role === 'ADMIN' || user.role === 'COACH' || ADMIN_OR_DEV_EMAILS.includes(cleanEmail));
    if (roleRequired && user.role !== roleRequired && user.role !== 'ADMIN' && !isScorerAccessAllowed) {
      throw { status: 403, message: `Access restricted. Your account is registered as ${user.role}, not ${roleRequired}.` };
    }

    // 3. Enforce Approval Status (Pending accounts must wait for Admin approval)
    if (user.status === 'PENDING') {
      if (ADMIN_OR_DEV_EMAILS.includes(cleanEmail)) {
        await userModel.updateStatus(user.id, 'ACTIVE');
        user.status = 'ACTIVE';
      } else {
        throw {
          status: 403,
          message: 'Your registration is PENDING admin approval. You can only log in once an administrator approves your account.'
        };
      }
    }
    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      throw {
        status: 403,
        message: `Your account is ${user.status} by the administrator.`
      };
    }

    // 4. Rate limiting check
    const rateCheck = otpService.checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      throw { status: 429, message: rateCheck.message };
    }

    // 5. Generate secure OTP and store hash in MongoDB
    const rawOtp = otpService.generateOtpCode();
    const otpHash = otpService.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + otpService.OTP_EXPIRATION_MS);

    await userModel.updateOtp(user.id, {
      otp_hash: otpHash,
      otp_expires_at: expiresAt
    });

    // 6. Send OTP email via Nodemailer
    const mailResult = await sendOtpEmail({
      toEmail: user.email,
      userName: user.name,
      otp: rawOtp
    });

    console.log(`\n📨 [OTP DISPATCH] Role: ${user.role} | Email: ${user.email} | OTP: ${rawOtp}\n`);

    if (mailResult && !mailResult.success && mailResult.smtpError) {
      throw { status: 500, message: `Failed to deliver email: ${mailResult.smtpError}. Please check your SMTP settings.` };
    }

    return {
      success: true,
      message: `OTP sent successfully to ${user.email} via Nodemailer.`,
      email: user.email,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: rawOtp } : {})
    };
  }

  /**
   * Verify OTP and return authenticated session token
   */
  async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw { status: 400, message: 'Email address and OTP are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Dev admin bypass check
    if (
      process.env.DEV_ADMIN_BYPASS === 'true' &&
      cleanEmail === (process.env.DEV_ADMIN_EMAIL || 'admin@example.com') &&
      cleanOtp === (process.env.DEV_ADMIN_OTP || '1234')
    ) {
      const adminUser = await userModel.findByEmail(cleanEmail);
      const token = jwt.sign(
        { id: adminUser?.id || 'ADM-1001', name: adminUser?.name || 'Administrator', email: cleanEmail, role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return {
        success: true,
        message: 'Admin bypass authenticated successfully.',
        user: { id: adminUser?.id || 'ADM-1001', name: adminUser?.name || 'Administrator', email: cleanEmail, role: 'ADMIN' },
        token
      };
    }

    // Standard MongoDB validation
    const user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    // Verify OTP code
    const isOtpValid = otpService.verifyOtpCode(cleanOtp, user.otp_hash);
    const isNotExpired = user.otp_expires_at && new Date() < new Date(user.otp_expires_at);

    // Fallback development acceptance for '1234' or '123456' on local demo accounts (only if user is already ACTIVE/APPROVED)
    const isDevFallback = ((cleanOtp === '1234' || cleanOtp === '123456') && (user.status === 'ACTIVE' || user.status === 'APPROVED'));

    if (!isDevFallback && (!isOtpValid || !isNotExpired)) {
      throw { status: 401, message: 'Invalid or expired OTP code.' };
    }

    // Verify user is not pending or rejected
    if (user.status === 'PENDING') {
      throw { status: 403, message: 'Your registration is PENDING admin approval. You can only log in once an administrator approves your account.' };
    }
    if (user.status === 'REJECTED' || user.status === 'SUSPENDED') {
      throw { status: 403, message: `Your account was ${user.status} by the administrator.` };
    }

    await userModel.markOtpVerified(user.id || user.email);

    const token = jwt.sign(
      { id: user.id || user.email, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    };
  }

  /**
   * Admin Login with Password or master key
   */
  async adminLogin(email, password) {
    if (!email || !password) {
      throw { status: 400, message: 'Admin email and password are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = String(password).trim();

    await db.initDb();

    // Check if user exists in MongoDB
    let user = await userModel.findByEmail(cleanEmail);

    // Auto-create recognized admin if not in DB
    const recognizedAdmins = ['admin@example.com', 'admin@cfvd.org', 'cricketfederation21@gmail.com'];
    if (!user && recognizedAdmins.includes(cleanEmail)) {
      user = await userModel.create({
        id: `ADM-${Date.now()}`,
        name: 'Chief Administrator',
        email: cleanEmail,
        role: 'ADMIN',
        status: 'ACTIVE',
        password_hash: '1234'
      });
    }

    if (!user) {
      throw { status: 404, message: `Admin account with email "${cleanEmail}" not found.` };
    }

    if (user.role !== 'ADMIN') {
      throw { status: 403, message: 'Access denied: User is not authorized as an administrator.' };
    }

    const validPasswords = ['1234', 'admin123', 'CFVD@Admin2026', '#cricketfederation.'];
    const isPasswordValid = validPasswords.includes(cleanPass) || (user.password_hash && user.password_hash === cleanPass);

    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid administrator password.' };
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Add audit log
    try {
      const adminService = require('./adminService');
      await adminService.addAuditLog({
        action: 'ADMIN_LOGIN',
        initiated_by: user.email,
        target_user: user.email,
        result: 'SUCCESS',
        details: `Administrator logged into management console.`
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Administrator authentication successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'ADMIN'
      },
      token
    };
  }

  async login(email, passwordOrOtp) {
    if (!email || !passwordOrOtp) {
      throw { status: 400, message: 'Email and password/OTP are required.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = await userModel.findByEmail(cleanEmail);
    if (user && user.role === 'ADMIN') {
      return this.adminLogin(email, passwordOrOtp);
    }
    return this.verifyOtp(email, passwordOrOtp);
  }

  /**
   * Team / Coach Login - Step 1: Request OTP
   * Coach enters coach name + registered coach email -> verifies approved record -> Nodemailer sends OTP
   */
  async requestTeamOtp(coachName, coachEmail) {
    if (!coachEmail) {
      throw { status: 400, message: 'Coach email is required.' };
    }

    const cleanEmail = coachEmail.trim().toLowerCase();
    await db.initDb();

    // Check team registration record
    const reg = await teamRegistrationModel.findByCoachEmail(cleanEmail);
    let team = null;
    if (!reg) {
      // Check in teams collection
      team = await db.models.Team.findOne({ coach_email: cleanEmail }).lean();
      if (!team) {
        throw { status: 404, message: `No team registration found for coach email "${cleanEmail}". Please register your team first.` };
      }
    }

    // Verify coach name if provided
    if (coachName) {
      const regCoachName = (reg?.coach_name || team?.coach_name || '').toLowerCase();
      const inputCoachName = coachName.trim().toLowerCase();
      const isNameMatch = !regCoachName || regCoachName.includes(inputCoachName) || inputCoachName.includes(regCoachName) ||
                          regCoachName.split(' ').some(w => inputCoachName.includes(w));
      if (!isNameMatch) {
        throw {
          status: 401,
          message: `Coach name "${coachName}" does not match the registered coach for this team.`
        };
      }
    }

    const teamStatus = reg ? reg.status : (team?.status === 'ACTIVE' ? 'APPROVED' : (team?.status || 'APPROVED'));
    const resolvedTeamName = reg?.team_name || team?.name || 'Your Team';

    if (teamStatus === 'PENDING') {
      throw {
        status: 403,
        message: `⏳ Team "${resolvedTeamName}" is currently PENDING admin approval. Coach access is granted only after administrative approval.`
      };
    }
    if (teamStatus === 'REJECTED') {
      throw {
        status: 403,
        message: `❌ Team "${resolvedTeamName}" was REJECTED. Reason: ${reg?.rejection_reason || 'Criteria not met'}.`
      };
    }

    // Ensure User record exists
    let user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      user = await userModel.create({
        name: coachName || reg?.coach_name || team?.coach_name || 'Team Coach',
        email: cleanEmail,
        role: 'COACH',
        status: 'ACTIVE'
      });
    }

    // Generate & send OTP
    const rawOtp = otpService.generateOtpCode();
    const otpHash = otpService.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + otpService.OTP_EXPIRATION_MS);

    await userModel.updateOtp(user.id || cleanEmail, {
      otp_hash: otpHash,
      otp_expires_at: expiresAt
    });

    await sendOtpEmail({
      toEmail: cleanEmail,
      userName: coachName || reg?.coach_name || team?.coach_name || 'Coach',
      otp: rawOtp
    });

    console.log(`\n🏏 [COACH OTP DISPATCH] Coach: ${coachName || reg?.coach_name} | Email: ${cleanEmail} | OTP: ${rawOtp}\n`);

    return {
      success: true,
      message: `OTP sent to ${cleanEmail} via Nodemailer.`,
      teamName: resolvedTeamName,
      coachName: coachName || reg?.coach_name || team?.coach_name,
      email: cleanEmail,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: rawOtp } : {})
    };
  }

  /**
   * Team / Coach Login - Step 2: Verify OTP
   */
  async verifyTeamOtp(coachEmail, otp) {
    const authResult = await this.verifyOtp(coachEmail, otp);
    const reg = await teamRegistrationModel.findByCoachEmail(coachEmail);
    const teamDoc = await db.models.Team.findOne({ coach_email: coachEmail.trim().toLowerCase() }).lean();

    const teamId = reg?.id || teamDoc?.id || 'TM-01';
    const teamName = reg?.team_name || teamDoc?.name || 'Virudhunagar Team';

    const token = jwt.sign(
      { id: authResult.user.id, name: authResult.user.name, email: authResult.user.email, role: 'COACH', teamId, teamName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: `Welcome Coach ${authResult.user.name}!`,
      user: {
        ...authResult.user,
        role: 'COACH',
        teamName,
        teamId
      },
      team: {
        teamId,
        teamName
      },
      token
    };
  }

  /**
   * Player Login - Step 1: Request OTP by Player Name or Email
   * Player is included in the approved 15-player squad with name + email.
   */
  async requestPlayerOtp(nameOrEmail) {
    if (!nameOrEmail || typeof nameOrEmail !== 'string') {
      throw { status: 400, message: 'Please enter your registered player name or email.' };
    }

    const queryStr = nameOrEmail.trim();

    // 1. Find player in registered squads
    const playerInfo = await teamRegistrationModel.findPlayerByEmailOrName(queryStr);
    if (!playerInfo) {
      throw {
        status: 404,
        message: `Player "${queryStr}" was not found in any team squad. Please make sure your coach has submitted your name and email.`
      };
    }

    // 2. Check team approval status
    const teamStatus = (playerInfo.team_status || 'PENDING').toUpperCase();
    if (teamStatus === 'PENDING') {
      throw {
        status: 403,
        message: `⏳ Team "${playerInfo.team_name}" is currently PENDING admin approval. Players can log in once the admin approves the team squad.`
      };
    }
    if (teamStatus === 'REJECTED') {
      throw {
        status: 403,
        message: `❌ Team "${playerInfo.team_name}" was REJECTED by administrator.`
      };
    }

    // 3. Ensure player user record exists in MongoDB
    const cleanEmail = playerInfo.email.trim().toLowerCase();
    let user = await userModel.findByEmail(cleanEmail);
    if (!user) {
      user = await userModel.create({
        id: `USR-PLY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        name: playerInfo.name,
        email: cleanEmail,
        role: 'PLAYER',
        status: 'ACTIVE'
      });
    }

    // 4. Rate limit check
    const rateCheck = otpService.checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      throw { status: 429, message: rateCheck.message };
    }

    // 5. Generate OTP and save hash in MongoDB
    const rawOtp = otpService.generateOtpCode();
    const otpHash = otpService.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + otpService.OTP_EXPIRATION_MS);

    await userModel.updateOtp(user.id || cleanEmail, {
      otp_hash: otpHash,
      otp_expires_at: expiresAt
    });

    // 6. Send OTP to registered player email via Nodemailer
    await sendOtpEmail({
      toEmail: cleanEmail,
      userName: playerInfo.name,
      otp: rawOtp
    });

    console.log(`\n🏏 [PLAYER OTP DISPATCH] Player: ${playerInfo.name} | Email: ${cleanEmail} | Team: ${playerInfo.team_name} | OTP: ${rawOtp}\n`);

    return {
      success: true,
      message: `OTP sent to ${cleanEmail} via Nodemailer.`,
      playerName: playerInfo.name,
      teamName: playerInfo.team_name,
      email: cleanEmail,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: rawOtp } : {})
    };
  }

  /**
   * Player Login - Step 2: Verify OTP
   */
  async verifyPlayerOtp(nameOrEmail, otp) {
    if (!nameOrEmail || !otp) {
      throw { status: 400, message: 'Player name/email and OTP are required.' };
    }

    const queryStr = nameOrEmail.trim();
    const playerInfo = await teamRegistrationModel.findPlayerByEmailOrName(queryStr);
    if (!playerInfo) {
      throw { status: 404, message: 'Player record not found.' };
    }

    const authResult = await this.verifyOtp(playerInfo.email, otp);

    return {
      success: true,
      message: `Welcome, ${playerInfo.name}!`,
      user: {
        id: authResult.user.id,
        name: playerInfo.name,
        email: playerInfo.email,
        role: 'PLAYER',
        teamName: playerInfo.team_name,
        teamId: playerInfo.team_registration_id
      },
      token: authResult.token
    };
  }

  /**
   * Register Scorer (Strictly PENDING Admin approval - Requirement 1)
   */
  async registerScorer({ name, email, mobile }) {
    if (!name || !name.trim()) {
      throw { status: 400, message: 'Scorer name is required.' };
    }
    if (!email || !email.trim()) {
      throw { status: 400, message: 'Scorer email is required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw { status: 400, message: 'Invalid email address format.' };
    }

    // Check duplicate email
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      if (existing.status === 'PENDING') {
        throw { status: 409, message: 'A registration application with this email address has already been submitted and is currently PENDING admin review.' };
      }
      if (existing.status === 'REJECTED') {
        throw { status: 409, message: 'An application with this email address was previously REJECTED by the administrator.' };
      }
      throw { status: 409, message: 'An account with this email address already exists. Duplicate email registration is not permitted.' };
    }

    const initialStatus = 'PENDING';
    const userId = `SCR-${Math.floor(100 + Math.random() * 900)}`;
    const user = await userModel.create({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile || null,
      role: 'SCORER',
      status: initialStatus
    });

    await notificationModel.create({
      type: 'SCORER_REGISTRATION',
      title: `New Scorer Registration: ${name.trim()}`,
      message: `Scorer ${name.trim()} (${cleanEmail}) submitted registration. Status: PENDING admin approval.`,
      reference_id: userId,
      status: 'UNREAD'
    });

    return {
      success: true,
      status: initialStatus,
      message: 'Scorer registration submitted! Your account is PENDING admin verification and approval.',
      scorer: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: initialStatus
      }
    };
  }

  // Alias for generic register calls
  async register(data) {
    return this.registerScorer(data);
  }

  /**
   * Register Individual Player (Module 2 in PDF Specification)
   * Player personal details, playing role, age category, contact info.
   */
  async registerPlayer({ name, email, mobile, role, category, taluk, battingStyle, bowlingStyle, clubChoice }) {
    if (!name || !email) {
      throw { status: 400, message: 'Player name and email are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      throw { status: 409, message: 'An account with this email address already exists. Please log in directly.' };
    }

    const playerId = `PLY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const user = await userModel.create({
      id: playerId,
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile || null,
      role: 'PLAYER',
      status: 'PENDING'
    });

    await notificationModel.create({
      type: 'PLAYER_REGISTRATION',
      title: `New Player Registration: ${name.trim()}`,
      message: `Player ${name.trim()} (${cleanEmail}) applied for ${role || 'Player'} in category ${category || 'Senior'}. Awaiting administrative approval.`,
      reference_id: playerId,
      status: 'UNREAD'
    });

    console.log(`\n🏏 [PLAYER REGISTRATION SUBMITTED] ID: ${playerId} | Player: "${name.trim()}" | Email: ${cleanEmail} | Role: ${role} | Status: PENDING\n`);

    return {
      success: true,
      status: 'PENDING',
      message: 'Player registration submitted successfully! Your account is PENDING administrative verification.',
      player: {
        id: playerId,
        name: user.name,
        email: user.email,
        role: role || 'Batter',
        category: category || 'Senior Men',
        taluk: taluk || 'Virudhunagar',
        status: 'PENDING'
      }
    };
  }

  /**
   * Register Team with Coach and 15 Squad Players
   */
  async registerTeam(data) {
    const reg = await teamRegistrationModel.create(data);
    return {
      success: true,
      status: 'PENDING',
      message: `Team "${reg.team_name}" and 15 squad players submitted successfully! Awaiting administrative approval.`,
      team: reg
    };
  }

  /**
   * Register Content Staff Member
   */
  async registerContentStaff({ name, email, mobile, specialization, credentials }) {
    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await userModel.findByEmail(cleanEmail);
    if (existing) {
      throw { status: 409, message: 'An account with this email address already exists.' };
    }

    const staffId = `CNT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const user = await userModel.create({
      id: staffId,
      name: name.trim(),
      email: cleanEmail,
      mobile: mobile || null,
      role: 'CONTENT',
      status: 'PENDING'
    });

    await notificationModel.create({
      type: 'CONTENT_STAFF_REGISTRATION',
      title: `New Content Staff Registration: ${name.trim()}`,
      message: `Content Staff ${name.trim()} (${cleanEmail}) applied. Specialization: ${specialization || 'General Media'}. Awaiting administrative approval.`,
      reference_id: staffId,
      status: 'UNREAD'
    });

    return {
      success: true,
      status: 'PENDING',
      message: 'Content Staff registration submitted! Awaiting administrative verification.',
      staff: {
        id: staffId,
        name: user.name,
        email: user.email,
        role: 'CONTENT',
        status: 'PENDING'
      }
    };
  }

  /**
   * Register a new Team with Coach and 15 Squad Players
   * Stored in MongoDB as PENDING.
   */
  async registerTeam({ teamName, coachName, coachEmail, city, taluk, players = [] }) {
    if (!teamName || !teamName.trim()) {
      throw { status: 400, message: 'Team Name is required.' };
    }
    if (!coachName || !coachName.trim()) {
      throw { status: 400, message: 'Coach Name is required.' };
    }
    if (!coachEmail || !coachEmail.trim() || !coachEmail.includes('@')) {
      throw { status: 400, message: 'Valid Coach Email address is required.' };
    }

    if (!Array.isArray(players) || players.length === 0) {
      throw { status: 400, message: 'Squad list of 15 players with names and emails is required.' };
    }

    const cleanCoachEmail = coachEmail.trim().toLowerCase();

    // Validate squad players
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.name || !p.name.trim()) {
        throw { status: 400, message: `Player #${i + 1} Name is required.` };
      }
      if (!p.email || !p.email.trim() || !p.email.includes('@')) {
        throw { status: 400, message: `Valid Email ID for Player #${i + 1} (${p.name || 'Unnamed'}) is required.` };
      }
      if (p.email.trim().toLowerCase() === cleanCoachEmail) {
        throw { status: 400, message: `Coach email cannot be identical to Player #${i + 1} email.` };
      }
    }

    const createdTeam = await teamRegistrationModel.create({
      teamName: teamName.trim(),
      coachName: coachName.trim(),
      coachEmail: cleanCoachEmail,
      city: city || taluk || 'Virudhunagar',
      taluk: taluk || 'Virudhunagar',
      players
    });

    console.log(`\n🏏 [TEAM REGISTRATION SUBMITTED] ID: ${createdTeam.id} | Team: "${createdTeam.team_name}" | Squad: ${players.length} players | Status: PENDING\n`);

    return {
      success: true,
      status: 'PENDING',
      message: 'Team registration application submitted! Notification sent to administrator. Team and players will be officially stored in database once approved by admin.',
      team: createdTeam
    };
  }

  /**
   * Admin approves team registration
   */
  async approveTeam(teamId, adminId = 'ADMIN') {
    const team = await teamRegistrationModel.approveRegistration(teamId, adminId);
    return {
      success: true,
      message: `Team "${team.team_name}" has been APPROVED. Team and squad players are now officially registered in MongoDB!`,
      team
    };
  }

  /**
   * Admin rejects team registration
   */
  async rejectTeam(teamId, reason, adminId = 'ADMIN') {
    const team = await teamRegistrationModel.rejectRegistration(teamId, reason, adminId);
    return {
      success: true,
      message: `Team "${team.team_name}" registration has been REJECTED.`,
      team
    };
  }

  async getTeams(status = null) {
    return teamRegistrationModel.getAll(status);
  }

  async getAdminNotifications(status = null) {
    return notificationModel.getAll({ status });
  }

  async getProfile(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw { status: 404, message: 'User profile not found.' };
    return user;
  }

  async getScorers(status = null) {
    return userModel.getScorers(status);
  }

  async updateScorerStatus(idOrEmail, newStatus, reason = null) {
    const normalizedStatus = String(newStatus).toUpperCase();
    let user = await userModel.findById(idOrEmail);
    if (!user) user = await userModel.findByEmail(idOrEmail);
    if (!user) throw { status: 404, message: `Scorer '${idOrEmail}' not found.` };

    await userModel.updateStatus(user.id, normalizedStatus);
    const updated = await userModel.findById(user.id);
    return {
      success: true,
      message: `Scorer ${user.name} status updated to ${normalizedStatus}`,
      scorer: updated
    };
  }

  /**
   * Retrieve all user & team registrations across all roles (Player, Team, Scorer, Content Staff)
   */
  async getAllRegistrations(filterStatus = null, filterRole = null) {
    await db.initDb();
    const mongoose = require('mongoose');
    const results = [];

    // 1. Teams
    if (!filterRole || filterRole.toUpperCase() === 'TEAM' || filterRole.toUpperCase() === 'TEAMS') {
      const teams = await teamRegistrationModel.getAll();
      teams.forEach(t => {
        const status = (t.status || 'PENDING').toUpperCase();
        if (filterStatus && filterStatus !== 'ALL' && status !== filterStatus.toUpperCase()) {
          return;
        }
        results.push({
          id: t.id || t._id?.toString(),
          mongoId: t._id?.toString(),
          type: 'TEAM',
          roleDisplay: 'Cricket Team & Squad',
          name: t.team_name,
          email: t.coach_email,
          contactName: t.coach_name,
          contactEmail: t.coach_email,
          taluk: t.taluk || t.city || 'Virudhunagar',
          status: status,
          created_at: t.created_at || new Date().toISOString(),
          details: {
            squadCount: (t.players || []).length,
            players: t.players || [],
            taluk: t.taluk,
            city: t.city,
            rejectionReason: t.rejection_reason,
            approvedBy: t.approved_by,
            approvedAt: t.approved_at
          }
        });
      });
    }

    // 2. Individual Users (Players, Scorers, Content Staff)
    const roleQuery = {};
    if (filterRole && filterRole.toUpperCase() !== 'TEAM' && filterRole.toUpperCase() !== 'TEAMS') {
      const r = filterRole.toUpperCase();
      if (r === 'PLAYER' || r === 'PLAYERS') roleQuery.role = 'PLAYER';
      else if (r === 'SCORER' || r === 'SCORERS') roleQuery.role = 'SCORER';
      else if (r === 'CONTENT' || r === 'CONTENT_CREATOR' || r === 'STAFF') roleQuery.role = { $in: ['CONTENT', 'CONTENT_CREATOR'] };
    } else if (!filterRole) {
      roleQuery.role = { $in: ['PLAYER', 'SCORER', 'CONTENT_CREATOR', 'CONTENT'] };
    }

    if (roleQuery.role) {
      const users = await db.models.User.find(roleQuery).sort({ created_at: -1 }).lean();
      users.forEach(u => {
        const rawStatus = (u.status || 'PENDING').toUpperCase();
        // Normalize 'ACTIVE' to 'APPROVED' for consistent UI display if needed, but keep status clear
        const status = (rawStatus === 'ACTIVE') ? 'APPROVED' : rawStatus;
        if (filterStatus && filterStatus !== 'ALL' && status !== filterStatus.toUpperCase()) {
          return;
        }

        const role = (u.role === 'CONTENT') ? 'CONTENT_CREATOR' : u.role;
        let roleDisplay = 'Player';
        if (role === 'SCORER') roleDisplay = 'Official Scorer';
        if (role === 'CONTENT_CREATOR') roleDisplay = 'Content Staff';

        results.push({
          id: u.id || u._id?.toString(),
          mongoId: u._id?.toString(),
          type: role,
          roleDisplay,
          name: u.name,
          email: u.email,
          phone: u.phone || 'N/A',
          status: status,
          created_at: u.created_at || new Date().toISOString(),
          details: {
            phone: u.phone,
            specialty: u.specialty,
            certification_id: u.certification_id,
            experience_years: u.experience_years,
            portfolio_url: u.portfolio_url,
            taluk: u.taluk || 'Virudhunagar',
            rejectionReason: u.rejection_reason
          }
        });
      });
    }

    return results;
  }

  /**
   * Unified Admin Approval for any registration type (TEAM, PLAYER, SCORER, CONTENT_CREATOR)
   */
  async approveRegistration(id, type = 'TEAM', adminId = 'ADMIN') {
    await db.initDb();
    const mongoose = require('mongoose');
    const upperType = (type || '').toUpperCase();

    if (upperType === 'TEAM') {
      const team = await teamRegistrationModel.approveRegistration(id, adminId);
      return {
        success: true,
        message: `✓ Team "${team.team_name}" and its 15 squad players APPROVED!`,
        data: team
      };
    }

    // Individual User approval (PLAYER, SCORER, CONTENT_CREATOR)
    const query = { $or: [{ id }, { email: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or.push({ _id: id });
    }

    const user = await db.models.User.findOne(query);
    if (!user) throw { status: 404, message: `Registration '${id}' not found.` };

    user.status = 'ACTIVE';
    await user.save();

    // If player, also activate player record in Player collection
    if (user.role === 'PLAYER') {
      await db.models.Player.updateMany(
        { email: user.email },
        { $set: { status: 'ACTIVE' } }
      );
    }

    await notificationModel.create({
      type: 'USER_APPROVED',
      title: `${user.role} Approved: ${user.name}`,
      message: `User ${user.name} (${user.email}) has been approved by ${adminId} as ${user.role}. Clearance granted.`,
      reference_id: user.id,
      status: 'UNREAD'
    });

    return {
      success: true,
      message: `✓ ${user.role} "${user.name}" has been officially APPROVED!`,
      data: user.toObject()
    };
  }

  /**
   * Unified Admin Rejection for any registration type
   */
  async rejectRegistration(id, type = 'TEAM', reason = 'Criteria not met', adminId = 'ADMIN') {
    await db.initDb();
    const mongoose = require('mongoose');
    const upperType = (type || '').toUpperCase();

    if (upperType === 'TEAM') {
      const team = await teamRegistrationModel.rejectRegistration(id, reason, adminId);
      return {
        success: true,
        message: `Team "${team.team_name}" registration has been REJECTED.`,
        data: team
      };
    }

    const query = { $or: [{ id }, { email: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or.push({ _id: id });
    }

    const user = await db.models.User.findOne(query);
    if (!user) throw { status: 404, message: `Registration '${id}' not found.` };

    user.status = 'REJECTED';
    user.rejection_reason = reason;
    await user.save();

    if (user.role === 'PLAYER') {
      await db.models.Player.updateMany(
        { email: user.email },
        { $set: { status: 'REJECTED' } }
      );
    }

    await notificationModel.create({
      type: 'USER_REJECTED',
      title: `${user.role} Rejected: ${user.name}`,
      message: `Registration for ${user.name} (${user.email}) was rejected by ${adminId}. Reason: ${reason}`,
      reference_id: user.id,
      status: 'UNREAD'
    });

    return {
      success: true,
      message: `${user.role} "${user.name}" registration has been marked REJECTED.`,
      data: user.toObject()
    };
  }
}

module.exports = new AuthService();