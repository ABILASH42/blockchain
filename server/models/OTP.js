const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    purpose: {
      type: String,
      enum: ["REGISTRATION", "PASSWORD_RESET", "EMAIL_CHANGE"],
      default: "REGISTRATION",
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete expired OTPs after 10 minutes
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

// Static method to clean up expired OTPs
otpSchema.statics.cleanupExpired = function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

// Static method to find valid OTP
otpSchema.statics.findValidOTP = function (email, otp) {
  return this.findOne({
    email: email.toLowerCase().trim(),
    otp,
    expiresAt: { $gt: new Date() },
  });
};

module.exports = mongoose.model("OTP", otpSchema);
