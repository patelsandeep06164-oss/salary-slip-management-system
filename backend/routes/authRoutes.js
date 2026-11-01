const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const {
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  adminOtpVerifyLimiter,
  passwordResetLimiter,
} = require("../middleware/authRateLimit");

const {
  issueCsrfToken,
  verifyCsrfToken,
} = require("../middleware/csrfMiddleware");

// CSRF TOKEN
router.get("/csrf-token", issueCsrfToken, (req, res) => {
  res.status(200).json({
    success: true,
    csrfToken: res.locals.csrfToken,
  });
});

// REGISTRATION
router.post(
  "/registration/send-otp",
  otpSendLimiter,
  verifyCsrfToken,
  authController.sendRegistrationOtp
);

router.post(
  "/registration/verify-otp",
  otpVerifyLimiter,
  verifyCsrfToken,
  authController.verifyRegistrationOtp
);

router.post(
  "/register",
  verifyCsrfToken,
  authController.register
);

// LOGIN
router.post(
  "/login",
  loginLimiter,
  verifyCsrfToken,
  authController.login
);

// ADMIN LOGIN OTP
router.post(
  "/admin-login/verify-otp",
  adminOtpVerifyLimiter,
  verifyCsrfToken,
  authController.verifyAdminLoginOtp
);

// LOGOUT
router.post(
  "/logout",
  verifyCsrfToken,
  authMiddleware,
  authController.logout
);

// FORGOT PASSWORD
router.post(
  "/forgot-password",
  passwordResetLimiter,
  otpSendLimiter,
  verifyCsrfToken,
  authController.forgotPassword
);

// VERIFY PASSWORD RESET OTP
router.post(
  "/verify-password-reset-otp",
  passwordResetLimiter,
  otpVerifyLimiter,
  verifyCsrfToken,
  authController.verifyPasswordResetOtp
);

// RESET PASSWORD
router.post(
  "/reset-password",
  passwordResetLimiter,
  verifyCsrfToken,
  authController.resetPassword
);

// AUTHENTICATED USER ROUTES
router.get(
  "/me",
  authMiddleware,
  profileController.getMyProfile
);

router.patch(
  "/profile",
  verifyCsrfToken,
  authMiddleware,
  profileController.updateMyProfile
);

router.patch(
  "/change-password",
  verifyCsrfToken,
  authMiddleware,
  authController.changePassword
);

module.exports = router;