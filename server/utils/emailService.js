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

module.exports = {
  sendOTPEmail,
  verifyEmailConfig,
};
