const mongoose = require("mongoose");

const ALLOWED_REVOCATION_REASONS = [
  "logout",
  "password-change",
  "password-reset",
  "admin-revoked",
  "account-disabled",
  "admin-pending",
  "admin-rejected",
  "invalid-admin-approval",
  "employee-inactive-or-unlinked",
  "invalid-account-role",
];

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Store only the SHA-256 hash, never the raw session token.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revocationReason: {
      type: String,
      enum: ALLOWED_REVOCATION_REASONS,
      default: null,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    ipAddress: {
      type: String,
      default: "",
      maxlength: 64,
    },

    userAgent: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Expired sessions are automatically removed by MongoDB.
// Authentication must still check expiresAt and revokedAt.
authSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

authSessionSchema.index({
  userId: 1,
  revokedAt: 1,
  expiresAt: 1,
});

module.exports = mongoose.model(
  "AuthSession",
  authSessionSchema
);