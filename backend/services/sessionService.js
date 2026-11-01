const crypto = require("crypto");
const AuthSession = require("../models/AuthSession");

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

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

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const validateRevocationReason = (reason) => {
  if (!ALLOWED_REVOCATION_REASONS.includes(reason)) {
    throw new Error("Invalid session revocation reason.");
  }
};

// Create a new database-backed session.
const createSession = async ({ userId, req }) => {
  if (!userId) {
    throw new Error("User ID is required to create a session.");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_MS
  );

  await AuthSession.create({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: req?.ip || "",
    userAgent: req?.get?.("user-agent") || "",
    lastUsedAt: new Date(),
  });

  return {
    token: rawToken,
    expiresAt,
  };
};

// Find a valid, non-revoked session.
const getActiveSession = async (rawToken) => {
  if (
    typeof rawToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(rawToken)
  ) {
    return null;
  }

  const tokenHash = hashToken(rawToken);

  return AuthSession.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");
};

// Update last activity time for an active session.
const updateSessionActivity = async (sessionId) => {
  if (!sessionId) {
    return false;
  }

  const result = await AuthSession.updateOne(
    {
      _id: sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        lastUsedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
};

// Revoke one session.
const revokeSession = async (
  rawToken,
  reason = "logout"
) => {
  if (
    typeof rawToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(rawToken)
  ) {
    return false;
  }

  validateRevocationReason(reason);

  const result = await AuthSession.updateOne(
    {
      tokenHash: hashToken(rawToken),
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revocationReason: reason,
      },
    }
  );

  return result.modifiedCount > 0;
};

// Revoke every active session belonging to a user.
const revokeAllUserSessions = async (
  userId,
  reason = "password-change"
) => {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  validateRevocationReason(reason);

  const result = await AuthSession.updateMany(
    {
      userId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revocationReason: reason,
      },
    }
  );

  return result.modifiedCount;
};

module.exports = {
  createSession,
  getActiveSession,
  updateSessionActivity,
  revokeSession,
  revokeAllUserSessions,
  SESSION_DURATION_MS,
};