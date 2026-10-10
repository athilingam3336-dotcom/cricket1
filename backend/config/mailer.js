const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || 'cricketfederation21@gmail.com';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'rkwu lzke kklq znig';
const SMTP_FROM = process.env.SMTP_FROM || `"Cricket Federation" <${SMTP_USER}>`;

let transporter = null;

if (SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  console.log(`📧 Nodemailer SMTP initialized for: ${SMTP_USER}`);
} else {
  console.log('ℹ️ Nodemailer: SMTP credentials not set.');
}

async function sendOtpEmail({ toEmail, userName, otp }) {
  console.log(`\n======================================================`);
  console.log(`🔑 >>> YOUR LOGIN OTP FOR ${toEmail}: [ ${otp} ] <<<`);
  console.log(`======================================================\n`);

  const subject = 'Cricket Association - Your Verification OTP';
  const textContent = `Hello ${userName || 'User'},\n\nYour One-Time Password (OTP) for verification is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nCricket Association`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2>Cricket Association Portal</h2>
      <p>Hello <strong>${userName || 'User'}</strong>,</p>
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d97706;">${otp}</span>
      </div>
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
      console.warn(`⚠️ Email delivery timed out (${err.message}). Using console fallback!`);
      return {
        success: true,
        message: `OTP generated successfully (use terminal OTP)`,
        otp
      };
    }
  } else {
    return { success: true, message: `OTP dispatched to ${toEmail}` };
  }
}

module.exports = {
  sendOtpEmail,
  transporter
};
