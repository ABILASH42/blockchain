const OTP = require("../models/OTP");
const { sendOTPEmail, sendPasswordResetEmail } = require("./emailService");

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create and send OTP
const createAndSendOTP = async (email, userName, purpose = "REGISTRATION") => {
  try {
    // Clean up any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase().trim() });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    const otpDoc = new OTP({
      email: email.toLowerCase().trim(),
      otp,
      expiresAt,
      purpose,
    });
    await otpDoc.save();

    // Send OTP via email (use appropriate template based on purpose)
    if (purpose === "PASSWORD_RESET") {
      await sendPasswordResetEmail(email, otp, userName);
    } else {
      await sendOTPEmail(email, otp, userName);
    }

    console.log(`OTP created for ${email}, expires at ${expiresAt}`);
    return {
      success: true,
      message: "Verification code sent to your email",
      expiresAt,
    };
  } catch (error) {
    console.error("Error creating/sending OTP:", error);
    throw error;
  }
};

// Verify OTP
const verifyOTP = async (email, otpCode) => {
  try {
    const otpDoc = await OTP.findValidOTP(email, otpCode);

    if (!otpDoc) {
      // Check if OTP exists but expired
      const expiredOTP = await OTP.findOne({
        email: email.toLowerCase().trim(),
        otp: otpCode,
      });

      if (expiredOTP) {
        return {
          success: false,
          error: "OTP has expired. Please request a new code.",
        };
      }

      // Increment attempts if OTP exists
      await OTP.updateOne(
        { email: email.toLowerCase().trim() },
        { $inc: { attempts: 1 } }
      );

      return {
        success: false,
        error: "Invalid verification code. Please try again.",
      };
    }

    // OTP is valid - delete it (single use)
    await OTP.deleteOne({ _id: otpDoc._id });

    console.log(`OTP verified successfully for ${email}`);
    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

// Check if OTP exists and is valid
const checkOTPStatus = async (email) => {
  try {
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase().trim(),
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return { exists: false };
    }

    const isExpired = otpDoc.expiresAt < new Date();
    const timeRemaining = Math.max(
      0,
      Math.floor((otpDoc.expiresAt - new Date()) / 1000)
    );

    return {
      exists: true,
      isExpired,
      timeRemaining,
      attempts: otpDoc.attempts,
    };
  } catch (error) {
    console.error("Error checking OTP status:", error);
    throw error;
  }
};

// Cleanup expired OTPs (can be called periodically)
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.cleanupExpired();
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    return result;
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  createAndSendOTP,
  verifyOTP,
  checkOTPStatus,
  cleanupExpiredOTPs,
};
