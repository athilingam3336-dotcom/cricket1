/**
 * config/mailer.js
 * Nodemailer configuration for sending real OTP emails via Gmail SMTP or custom SMTP.
 */

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const SMTP_FROM = process.env.SMTP_FROM || '"Cricket Federation" <no-reply@cfvd.org>';

let transporter = null;

if (SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  });
  console.log(`📧 Nodemailer SMTP initialized with host: ${SMTP_HOST}:${SMTP_PORT}`);
} else {
  console.log('ℹ️ Nodemailer: SMTP credentials (SMTP_USER / SMTP_PASSWORD) not configured in .env. Real email delivery will be simulated in development.');
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
  const subject = 'Cricket Portal - Your Verification OTP';
  const textContent = `Hello ${userName || 'User'},\n\nYour One-Time Password (OTP) for login is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share this OTP with anyone.\n\nCricket Federation of Virudhunagar District`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0; text-align: center;">Cricket Federation Portal</h2>
      <p style="color: #475569; font-size: 15px;">Hello <strong>${userName || 'User'}</strong>,</p>
      <p style="color: #475569; font-size: 15px;">Use the following One-Time Password (OTP) to securely log in to your account:</p>
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #b45309;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">⏱️ This OTP is valid for <strong>5 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">Cricket Federation of Virudhunagar District &copy; 2026. All rights reserved.</p>
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
      return { success: true, message: `OTP sent to ${toEmail}` };
    } catch (err) {
      console.error(`❌ Failed to send OTP email to ${toEmail}:`, err.message);
      // Return success with delivery notice so local auth flow doesn't fail if SMTP server rejects temporary connection
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[Development Mode] OTP generated for ${toEmail}: [SECURED IN DATABASE]. In production, configure SMTP_USER & SMTP_PASSWORD in .env to deliver real emails.`);
    return { success: true, message: `OTP dispatched to ${toEmail} (dev mode)` };
  }
}

module.exports = {
  sendOtpEmail,
  transporter
};
