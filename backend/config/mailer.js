/**
 * config/mailer.js
 * Nodemailer configuration for sending official Scorer OTP emails.
 */

const nodemailer = require('nodemailer');

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim();
  const from = (process.env.SMTP_FROM || '').trim() || (user ? `"Cricket Federation" <${user}>` : '"Cricket Federation" <no-reply@cfvd.org>');

  return { host, port, secure, user, pass, from };
}

let activeTransporter = null;

function getTransporter() {
  const config = getSmtpConfig();

  // Test mode fallback: use jsonTransport to validate email construction without network
  if (process.env.NODE_ENV === 'test' && (!config.user || !config.pass)) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  if (config.user && config.pass) {
    if (!activeTransporter) {
      // For Gmail SMTP, use standard service: 'gmail' or direct host configuration
      const transportOptions = (config.host === 'smtp.gmail.com' || !config.host)
        ? {
            service: 'gmail',
            auth: {
              user: config.user,
              pass: config.pass // 16-character Google App Password
            }
          }
        : {
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
              user: config.user,
              pass: config.pass
            },
            tls: {
              rejectUnauthorized: false
            }
          };

      activeTransporter = nodemailer.createTransport(transportOptions);
    }
    return activeTransporter;
  }

  return null;
}

/**
 * Verify SMTP connection during development or on demand
 * Does NOT expose credentials
 */
async function verifySmtpConnection() {
  const config = getSmtpConfig();

  if (!config.user || !config.pass) {
    console.log('SMTP connection failed: SMTP_USER or SMTP_PASS missing in backend/.env');
    return {
      ok: false,
      status: 'SMTP configuration error',
      message: 'SMTP credentials missing. Please set SMTP_USER and SMTP_PASS in backend/.env'
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('SMTP connection failed: Failed to initialize transporter');
      return {
        ok: false,
        status: 'SMTP configuration error',
        message: 'Failed to initialize Nodemailer transporter'
      };
    }
    await transporter.verify();
    console.log('SMTP connection successful');
    return {
      ok: true,
      status: 'SMTP connection: OK',
      host: `${config.host}:${config.port}`
    };
  } catch (err) {
    console.error('SMTP connection failed:', err.message || err);
    return {
      ok: false,
      status: 'SMTP connection failed',
      message: err.message || 'SMTP connection verification failed'
    };
  }
}

/**
 * Send Scorer OTP verification email
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} [options.userName]
 * @param {string} options.otp
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
async function sendOtpEmail({ toEmail, userName, otp }) {
  const config = getSmtpConfig();

  let transporter = getTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV === 'test') {
      transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      console.error('[SMTP] Cannot send OTP email: SMTP_USER or SMTP_PASS is missing in backend/.env');
      throw new Error('Email service is not configured. Please configure SMTP_USER and SMTP_PASS in backend/.env');
    }
  }

  console.log('Sending scorer OTP to:', toEmail);

  // In live environments, verify the real SMTP connection
  if (process.env.NODE_ENV !== 'test') {
    try {
      await transporter.verify();
      console.log('SMTP connection successful');
    } catch (verifyErr) {
      console.error('SMTP connection failed:', verifyErr.message || verifyErr);
      throw new Error(`SMTP connection failed: ${verifyErr.message}`);
    }
  }

  const subject = 'CFVD Scorer Portal - OTP Verification';
  const text = `Cricket Federation of Virudhunagar District\n\nYour Scorer Portal verification code is:\n\n${otp}\n\nThis OTP is valid for a limited time.\n\nIf you did not request this code, please ignore this email.`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CFVD Scorer Portal - OTP Verification</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 19px; font-weight: 700; letter-spacing: 0.5px;">
        Cricket Federation of Virudhunagar District
      </h1>
      <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">
        Official Match Day Scorer Verification
      </p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="margin-top: 0; font-size: 15px; color: #334155; line-height: 1.5;">
        Hello <strong>${userName || 'Scorer'}</strong>,
      </p>
      <p style="font-size: 15px; color: #334155; line-height: 1.5;">
        Your Scorer Portal verification code is:
      </p>
      <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #92400e; font-family: monospace;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 6px;">
        ?? This OTP is valid for a limited time.
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 14px;">
        If you did not request this code, please ignore this email.
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 11px; color: #94a3b8;">
        Cricket Federation of Virudhunagar District &copy; 2026. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject,
      text,
      html
    });

    console.log('OTP email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('OTP EMAIL ERROR:', error);
    throw new Error(`Unable to send OTP email: ${error.message || error}`);
  }
}

module.exports = {
  sendOtpEmail,
  verifySmtpConnection,
  getTransporter
};
