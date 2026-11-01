
const mongoose = require("mongoose");

const authOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
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

    otpHash: {
      type: String,
      required: true,
      select: false,
    },

    employeeCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    consumedAt: {
      type: Date,
      default: null,
    },

    verificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    proofExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired OTP records.
authOtpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Efficient lookup by email and purpose.
authOtpSchema.index({
  email: 1,
  purpose: 1,
  createdAt: -1,
});

// Allow only one unconsumed OTP per email and purpose.
authOtpSchema.index(
  { email: 1, purpose: 1 },
  {
    unique: true,
    partialFilterExpression: {
      consumedAt: null,
    },
    name: "unique_unconsumed_otp_per_email_purpose",
  }
);

module.exports = mongoose.model("AuthOtp", authOtpSchema);
