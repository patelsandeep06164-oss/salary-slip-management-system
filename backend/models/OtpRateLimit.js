const mongoose = require("mongoose");

const otpRateLimitSchema = new mongoose.Schema(
  {
    emailHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      required: true,
      enum: [
        "employee-registration",
        "admin-registration",
        "admin-login",
        "password-reset",
      ],
    },

    windowStartedAt: {
      type: Date,
      required: true,
    },

    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One counter per email and OTP purpose.
otpRateLimitSchema.index(
  { emailHash: 1, purpose: 1 },
  {
    unique: true,
    name: "unique_email_purpose_otp_limit",
  }
);

// Remove expired counters automatically.
otpRateLimitSchema.index(
  { windowStartedAt: 1 },
  { expireAfterSeconds: 300 }
);

module.exports = mongoose.model(
  "OtpRateLimit",
  otpRateLimitSchema
);