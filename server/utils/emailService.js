const nodemailer = require("nodemailer");

// Create transporter with SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Professional HTML email template for OTP
const getOTPEmailTemplate = (otp, userName = "User") => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 16px 0;
    }
    .subtitle {
      color: #cbd5e1;
      font-size: 14px;
      text-align: center;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }
    .otp-container {
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 0 0 32px 0;
    }
    .otp-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 12px 0;
    }
    .otp-code {
      color: #10b981;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      margin: 0;
      font-family: 'Courier New', monospace;
    }
    .info-box {
      background: rgba(148, 163, 184, 0.1);
      border-left: 3px solid #64748b;
      border-radius: 8px;
      padding: 16px;
      margin: 0 0 24px 0;
    }
    .info-text {
      color: #cbd5e1;
      font-size: 13px;
      margin: 0;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
    }
    .footer-link {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 22V12H15V22" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <h1 class="title">Verify Your Email</h1>
      <p class="subtitle">
        Hello ${userName},<br>
        Welcome to the Blockchain Land Registry System! Please use the verification code below to complete your registration.
      </p>
      
      <div class="otp-container">
        <p class="otp-label">Your Verification Code</p>
        <p class="otp-code">${otp}</p>
      </div>
      
      <div class="info-box">
        <p class="info-text">
          ⏱️ This code will expire in <strong>5 minutes</strong><br>
          🔒 For security reasons, never share this code with anyone<br>
          ❓ If you didn't request this code, please ignore this email
        </p>
      </div>
      
      <div class="footer">
        <p>
          Blockchain Land Registry System<br>
          Secure • Transparent • Decentralized
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "Land Registry System"}" <${
        process.env.FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to: email,
      subject: "Your Verification Code - Land Registry",
      text: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: getOTPEmailTemplate(otp, userName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

// Verify SMTP configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Email service configuration error:", error.message);
    return false;
  }
};

// Password reset email template
const getPasswordResetEmailTemplate = (otp, userName = "User") => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 16px 0;
    }
    .subtitle {
      color: #cbd5e1;
      font-size: 14px;
      text-align: center;
      margin: 0 0 32px 0;
      line-height: 1.5;
    }
    .otp-container {
      background: rgba(245, 158, 11, 0.1);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 0 0 32px 0;
    }
    .otp-label {
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 12px 0;
    }
    .otp-code {
      color: #f59e0b;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      margin: 0;
      font-family: 'Courier New', monospace;
    }
    .warning-box {
      background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
      border-radius: 8px;
      padding: 16px;
      margin: 0 0 24px 0;
    }
    .warning-text {
      color: #fca5a5;
      font-size: 13px;
      margin: 0;
      line-height: 1.6;
    }
    .info-box {
      background: rgba(148, 163, 184, 0.1);
      border-left: 3px solid #64748b;
      border-radius: 8px;
      padding: 16px;
      margin: 0 0 24px 0;
    }
    .info-text {
      color: #cbd5e1;
      font-size: 13px;
      margin: 0;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <h1 class="title">Reset Your Password</h1>
      <p class="subtitle">
        Hello ${userName},<br>
        We received a request to reset your password. Use the verification code below to proceed.
      </p>
      
      <div class="otp-container">
        <p class="otp-label">Your Verification Code</p>
        <p class="otp-code">${otp}</p>
      </div>
      
      <div class="warning-box">
        <p class="warning-text">
          🚨 <strong>Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
        </p>
      </div>
      
      <div class="info-box">
        <p class="info-text">
          ⏱️ This code will expire in <strong>5 minutes</strong><br>
          🔒 Never share this code with anyone<br>
          💡 After verification, you'll be able to set a new password
        </p>
      </div>
      
      <div class="footer">
        <p>
          Blockchain Land Registry System<br>
          Secure • Transparent • Decentralized
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Send password reset OTP email
const sendPasswordResetEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "Land Registry System"}" <${
        process.env.FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to: email,
      subject: "Password Reset Code - Land Registry",
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: getPasswordResetEmailTemplate(otp, userName),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  verifyEmailConfig,
};
