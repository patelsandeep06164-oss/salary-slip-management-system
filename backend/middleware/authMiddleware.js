const User = require("../models/User");
const Employee = require("../models/Employee");
const sessionService = require("../services/sessionService");
const { getSessionToken } = require("../config/sessionCookie");

const LOGIN_ALLOWED_EMPLOYEE_STATUSES = [
  "active",
  "on-leave",
];

const authMiddleware = async (req, res, next) => {
  try {
    const token = getSessionToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    const session = await sessionService.getActiveSession(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid. Please login again.",
      });
    }

    const user = await User.findById(session.userId).select(
      "_id name email role isActive adminApprovalStatus passwordChangedAt"
    );

    if (!user) {
      await sessionService.revokeSession(
        token,
        "account-disabled"
      );

      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Reject sessions created before or at password-change time.
    if (
      user.passwordChangedAt &&
      session.createdAt &&
      new Date(session.createdAt).getTime() <=
        new Date(user.passwordChangedAt).getTime()
    ) {
      await sessionService.revokeSession(
        token,
        "password-change"
      );

      return res.status(401).json({
        success: false,
        message: "Password changed. Please login again.",
      });
    }

    // Admin approval verification.
    // Legacy Admin accounts without approval status remain valid.
    if (user.role === "admin") {
      if (user.adminApprovalStatus === "pending") {
        await sessionService.revokeSession(
          token,
          "admin-pending"
        );

        return res.status(403).json({
          success: false,
          message: "Your Admin registration is pending approval.",
          approvalStatus: "pending",
        });
      }

      if (user.adminApprovalStatus === "rejected") {
        await sessionService.revokeSession(
          token,
          "admin-rejected"
        );

        return res.status(403).json({
          success: false,
          message: "Your Admin registration has been rejected.",
          approvalStatus: "rejected",
        });
      }

      if (
        user.adminApprovalStatus &&
        user.adminApprovalStatus !== "approved"
      ) {
        await sessionService.revokeSession(
          token,
          "invalid-admin-approval"
        );

        return res.status(403).json({
          success: false,
          message: "Admin approval status is invalid.",
        });
      }
    }

    if (user.isActive !== true) {
      await sessionService.revokeSession(
        token,
        "account-disabled"
      );

      return res.status(401).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    let employeeId = null;

    // Verify Employee profile and status on every API request.
    if (user.role === "employee") {
      const employee = await Employee.findOne({
        user: user._id,
        status: {
          $in: LOGIN_ALLOWED_EMPLOYEE_STATUSES,
        },
      }).select("_id status");

      if (!employee) {
        await sessionService.revokeSession(
          token,
          "employee-inactive-or-unlinked"
        );

        return res.status(403).json({
          success: false,
          message:
            "Your employee account is inactive, terminated or not linked.",
        });
      }

      employeeId = employee._id.toString();
    } else if (user.role !== "admin") {
      await sessionService.revokeSession(
        token,
        "invalid-account-role"
      );

      return res.status(403).json({
        success: false,
        message: "Invalid account role.",
      });
    }

    // Update session activity after successful authentication.
    await sessionService.updateSessionActivity(session._id);

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId,
    };

    req.authSession = {
      id: session._id.toString(),
      expiresAt: session.expiresAt,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authMiddleware;