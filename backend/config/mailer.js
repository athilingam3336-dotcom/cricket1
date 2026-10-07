/**
 * config/mailer.js
 * Nodemailer configuration for sending real OTP emails via Gmail SMTP.
 */

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || 'cricketfederation21@gmail.com';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '#cricketfederation.';
const SMTP_FROM = process.env.SMTP_FROM || `"Cricket Federation" <${SMTP_USER}>`;

let transporter = null;

if (SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST.includes('gmail.com') ? 'smtp.gmail.com' : SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    family: 4, // Force IPv4 to prevent 90-second Windows IPv6 DNS timeout
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log(`📧 Nodemailer SMTP initialized for: ${SMTP_USER} (IPv4 direct TLS)`);
} else {
  console.log('ℹ️ Nodemailer: SMTP credentials not set.');
}

/**
 * Send OTP verification email
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.userName
 * @param {string} options.otp
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function sendOtpEmail({ toEmail, userName, otp }) {
  const subject = 'Cricket Association - Your Verification OTP';
  const textContent = `Hello ${userName || 'User'},\n\nYour One-Time Password (OTP) for verification is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share this OTP with anyone.\n\nCricket Association`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Cricket Association Portal</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${userName || 'User'}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">Use the following One-Time Password (OTP) to securely authenticate your account:</p>
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d97706;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">⏱️ This OTP is valid for <strong>5 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">Cricket Association &copy; 2026. All rights reserved.</p>
    </div>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`📧 OTP successfully sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, message: `OTP sent to ${toEmail} via Nodemailer` };
    } catch (err) {
      console.error(`❌ Nodemailer delivery note to ${toEmail}:`, err.message);
      return { 
        success: false, 
        message: `Failed to deliver email: ${err.message}`, 
        smtpError: err.message
      };
    }
  } else {
    console.log(`[Dev Console] OTP generated for ${toEmail}: ${otp}`);
    return { success: true, message: `OTP dispatched to ${toEmail}` };
  }
}

module.exports = {
  sendOtpEmail,
  transporter
};
