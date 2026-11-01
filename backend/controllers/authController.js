const authService = require("../services/authService");
const sessionService = require("../services/sessionService");
const {
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
} = require("../config/sessionCookie");

// Send registration OTP.
const sendRegistrationOtp = async (req, res, next) => {
  try {
    const result = await authService.sendRegistrationOtp(req.body);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Verify registration OTP.
const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyRegistrationOtp(req.body);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Register Employee or Admin.
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Create a database session and issue an HttpOnly cookie.
const establishSession = async (req, res, user) => {
  if (!user?.id) {
    throw new Error("Authenticated user information is missing.");
  }

  const session = await sessionService.createSession({
    userId: user.id,
    req,
  });

  try {
    setSessionCookie(res, session.token);
  } catch (error) {
    // Do not leave an active database session if cookie setup fails.
    await sessionService.revokeSession(
      session.token,
      "account-disabled"
    );

    throw error;
  }

  return session.expiresAt;
};

// Login.
// Employee: Email + Password.
// Admin: Email + Password, then Email OTP.
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    if (result.otpRequired) {
      return res.status(200).json({
        success: true,
        ...result,
      });
    }

    const expiresAt = await establishSession(req, res, result.user);

    return res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// Verify Admin login OTP and create a session.
const verifyAdminLoginOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyAdminLoginOtp(req.body);

    const expiresAt = await establishSession(req, res, result.user);

    return res.status(200).json({
      success: true,
      message: result.message,
      user: result.user,
      expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// Logout and revoke the current database session.
const logout = async (req, res, next) => {
  try {
    const token = getSessionToken(req);

    if (token) {
      await sessionService.revokeSession(token, "logout");
    }

    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Send password reset OTP.
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Verify password reset OTP.
const verifyPasswordResetOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyPasswordResetOtp(req.body);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Reset password.
const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// Change password.
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await authService.changePassword({
      userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  register,
  login,
  verifyAdminLoginOtp,
  logout,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  changePassword,
};