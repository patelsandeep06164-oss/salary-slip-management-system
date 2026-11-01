const rateLimit = require("express-rate-limit");

const createLimiter = ({
  limit,
  message,
  windowMs = 15 * 60 * 1000,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

// Password login: maximum 5 attempts per IP in 15 minutes.
const loginLimiter = createLimiter({
  limit: 5,
  message:
    "Too many login attempts. Please try again after 15 minutes.",
});

// OTP sending: maximum 3 requests per IP in 15 minutes.
const otpSendLimiter = createLimiter({
  limit: 3,
  message:
    "Too many OTP requests. Please try again after 15 minutes.",
});

// Registration OTP verification: maximum 5 attempts per IP.
const otpVerifyLimiter = createLimiter({
  limit: 5,
  message:
    "Too many OTP verification attempts. Please try again later.",
});

// Admin login OTP: separate limit.
const adminOtpVerifyLimiter = createLimiter({
  limit: 5,
  message:
    "Too many Admin OTP verification attempts. Please try again later.",
});

// Password reset verification and reset requests.
const passwordResetLimiter = createLimiter({
  limit: 5,
  message:
    "Too many password reset attempts. Please try again after 15 minutes.",
});

module.exports = {
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  adminOtpVerifyLimiter,
  passwordResetLimiter,
};