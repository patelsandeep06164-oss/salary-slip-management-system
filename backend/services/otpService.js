const crypto = require("crypto");
const AuthOtp = require("../models/AuthOtp");
const OtpRateLimit = require("../models/OtpRateLimit");

const OTP_EXPIRY_MINUTES = 5;
const PROOF_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

const OTP_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_OTP_REQUESTS = 3;

const ALLOWED_PURPOSES = [
  "employee-registration",
  "admin-registration",
  "admin-login",
  "employee-login",
  "password-reset",
];

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => {
  if (typeof email !== "string" || !email.trim()) {
    throw createError("A valid email address is required.");
  }

  return email.trim().toLowerCase();
};

const validatePurpose = (purpose) => {
  if (!ALLOWED_PURPOSES.includes(purpose)) {
    throw createError("Invalid OTP purpose.");
  }
};

const getHashSecret = () => {
  const secret =
    process.env.OTP_HASH_SECRET || process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw createError(
      "OTP security configuration is missing.",
      500
    );
  }

  return secret;
};

const hashValue = (value) => {
  return crypto
    .createHmac("sha256", getHashSecret())
    .update(String(value))
    .digest("hex");
};

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const generateProof = () => {
  return crypto.randomBytes(32).toString("hex");
};

const compareHashes = (storedHash, suppliedHash) => {
  if (
    typeof storedHash !== "string" ||
    typeof suppliedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(storedHash) ||
    !/^[a-f0-9]{64}$/i.test(suppliedHash)
  ) {
    return false;
  }

  const stored = Buffer.from(storedHash, "hex");
  const supplied = Buffer.from(suppliedHash, "hex");

  return (
    stored.length === supplied.length &&
    crypto.timingSafeEqual(stored, supplied)
  );
};

// Email + purpose based OTP request limit.
// Uses atomic database updates to handle concurrent requests.
const consumeOtpRateLimit = async ({ email, purpose }) => {
  const emailHash = hashValue(`otp-rate-limit:${email}`);

  const now = new Date();
  const cutoff = new Date(
    now.getTime() - OTP_RATE_LIMIT_WINDOW_MS
  );

  const filter = {
    emailHash,
    purpose,
  };

  // Reset an expired rate-limit window.
  const resetResult = await OtpRateLimit.updateOne(
    {
      ...filter,
      windowStartedAt: { $lte: cutoff },
    },
    {
      $set: {
        windowStartedAt: now,
        count: 1,
      },
    }
  );

  if (resetResult.modifiedCount > 0) {
    return true;
  }

  // Atomically increment an active window if below the limit.
  const updatedRecord = await OtpRateLimit.findOneAndUpdate(
    {
      ...filter,
      windowStartedAt: { $gt: cutoff },
      count: { $lt: MAX_OTP_REQUESTS },
    },
    {
      $inc: { count: 1 },
    },
    {
      new: true,
    }
  );

  if (updatedRecord) {
    return true;
  }

  // Check whether the active window has reached its limit.
  const currentRecord = await OtpRateLimit.findOne(filter);

  if (
    currentRecord &&
    currentRecord.windowStartedAt > cutoff &&
    currentRecord.count >= MAX_OTP_REQUESTS
  ) {
    throw createError(
      "Too many OTP requests for this email. Please try again after 5 minutes.",
      429
    );
  }

  // Create the first counter for this email and purpose.
  try {
    await OtpRateLimit.create({
      emailHash,
      purpose,
      windowStartedAt: now,
      count: 1,
    });

    return true;
  } catch (error) {
    // Another concurrent request may have created the counter.
    if (error.code !== 11000) {
      throw error;
    }
  }

  // Retry atomically after a concurrent insert.
  const retryRecord = await OtpRateLimit.findOneAndUpdate(
    {
      ...filter,
      windowStartedAt: { $gt: cutoff },
      count: { $lt: MAX_OTP_REQUESTS },
    },
    {
      $inc: { count: 1 },
    },
    {
      new: true,
    }
  );

  if (retryRecord) {
    return true;
  }

  throw createError(
    "Too many OTP requests for this email. Please try again after 5 minutes.",
    429
  );
};

// Create a new OTP.
const createOtp = async ({
  email,
  purpose,
  employeeCode = null,
  userId = null,
}) => {
  const normalizedEmail = normalizeEmail(email);

  validatePurpose(purpose);

  if (
    employeeCode !== null &&
    typeof employeeCode !== "string"
  ) {
    throw createError("Invalid employee code.");
  }

  // Apply email-wise limit BEFORE invalidating previous OTPs.
  await consumeOtpRateLimit({
    email: normalizedEmail,
    purpose,
  });

  await AuthOtp.updateMany(
    {
      email: normalizedEmail,
      purpose,
      consumedAt: null,
    },
    {
      $set: {
        consumedAt: new Date(),
        verificationTokenHash: null,
        proofExpiresAt: null,
      },
    }
  );

  const otp = generateOtp();

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  let otpRecord;

  try {
    otpRecord = await AuthOtp.create({
      email: normalizedEmail,
      purpose,
      otpHash: hashValue(otp),

      employeeCode: employeeCode
        ? employeeCode.trim().toUpperCase()
        : null,

      user: userId || null,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAt,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "An OTP request is already being processed. Please wait and try again.",
        429
      );
    }

    throw error;
  }

  return {
    otp,
    otpId: otpRecord._id,
    expiresAt: otpRecord.expiresAt,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
};

// Verify OTP and issue a one-time verification proof.
const verifyOtp = async ({ email, purpose, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  validatePurpose(purpose);

  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    throw createError("Please enter a valid 6-digit OTP.");
  }

  const now = new Date();

  const otpRecord = await AuthOtp.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    verifiedAt: null,
    expiresAt: { $gt: now },
    attempts: { $lt: MAX_ATTEMPTS },
  })
    .sort({ createdAt: -1 })
    .select("+otpHash");

  if (!otpRecord) {
    throw createError(
      "OTP is invalid, expired or already used."
    );
  }

  const suppliedHash = hashValue(otp);
  const matches = compareHashes(
    otpRecord.otpHash,
    suppliedHash
  );

  if (!matches) {
    const updatedRecord = await AuthOtp.findOneAndUpdate(
      {
        _id: otpRecord._id,
        consumedAt: null,
        verifiedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_ATTEMPTS },
      },
      {
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!updatedRecord) {
      throw createError(
        "OTP expired or maximum attempts exceeded.",
        429
      );
    }

    if (updatedRecord.attempts >= MAX_ATTEMPTS) {
      await AuthOtp.updateOne(
        {
          _id: updatedRecord._id,
          consumedAt: null,
        },
        {
          $set: {
            consumedAt: new Date(),
            verificationTokenHash: null,
            proofExpiresAt: null,
          },
        }
      );

      throw createError(
        "Maximum OTP attempts exceeded. Request a new OTP.",
        429
      );
    }

    throw createError(
      `Incorrect OTP. ${
        MAX_ATTEMPTS - updatedRecord.attempts
      } attempts remaining.`,
      400
    );
  }

  const proof = generateProof();
  const proofHash = hashValue(proof);

  const proofExpiresAt = new Date(
    Math.min(
      Date.now() + PROOF_EXPIRY_MINUTES * 60 * 1000,
      otpRecord.expiresAt.getTime()
    )
  );

  const verifiedAt = new Date();

  const consumedRecord = await AuthOtp.findOneAndUpdate(
    {
      _id: otpRecord._id,
      otpHash: otpRecord.otpHash,
      consumedAt: null,
      verifiedAt: null,
      expiresAt: { $gt: verifiedAt },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    {
      $set: {
        verifiedAt,
        consumedAt: verifiedAt,
        verificationTokenHash: proofHash,
        proofExpiresAt,
      },
    },
    { new: true }
  );

  if (!consumedRecord) {
    throw createError(
      "OTP has expired or has already been used.",
      409
    );
  }

  return {
    success: true,
    message: "OTP verified successfully.",
    verificationProof: proof,
    expiresAt: proofExpiresAt,
    email: consumedRecord.email,
    purpose: consumedRecord.purpose,
    employeeCode: consumedRecord.employeeCode,
    userId: consumedRecord.user,
  };
};

// Consume verification proof exactly once.
// Consume verification proof exactly once.
// For employee registration, bind the proof to the expected Employee Code
// in the same atomic database operation.
const consumeVerificationProof = async ({
  email,
  purpose,
  verificationProof,
  expectedEmployeeCode,
}) => {
  const normalizedEmail = normalizeEmail(email);

  validatePurpose(purpose);

  if (
    typeof verificationProof !== "string" ||
    !/^[a-f0-9]{64}$/i.test(verificationProof)
  ) {
    throw createError("Invalid verification proof.");
  }

  const proofHash = hashValue(verificationProof);

  const filter = {
    email: normalizedEmail,
    purpose,
    consumedAt: { $ne: null },
    verifiedAt: { $ne: null },
    verificationTokenHash: proofHash,
    proofExpiresAt: { $gt: new Date() },
  };

  // Employee registration proof must match the submitted Employee Code.
  // Admin registration does not supply expectedEmployeeCode.
  if (expectedEmployeeCode !== undefined) {
    if (
      typeof expectedEmployeeCode !== "string" ||
      !expectedEmployeeCode.trim()
    ) {
      throw createError("A valid employee code is required.");
    }

    filter.employeeCode = expectedEmployeeCode.trim().toUpperCase();
  }

  const verifiedRecord = await AuthOtp.findOneAndUpdate(
    filter,
    {
      $set: {
        verificationTokenHash: null,
        proofExpiresAt: null,
      },
    },
    { new: true }
  );

  if (!verifiedRecord) {
    throw createError(
      "Verification proof is invalid, expired, already used or does not match the Employee Code.",
      403
    );
  }

  return {
    success: true,
    email: verifiedRecord.email,
    purpose: verifiedRecord.purpose,
    employeeCode: verifiedRecord.employeeCode,
    userId: verifiedRecord.user,
  };
};

module.exports = {
  createOtp,
  verifyOtp,
  consumeVerificationProof,
};
