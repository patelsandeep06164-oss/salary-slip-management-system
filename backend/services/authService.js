
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Employee = require("../models/Employee");
const Notification = require("../models/Notification");

const otpService = require("./otpService");
const authEmailService = require("./authEmailService");
const sessionService = require("./sessionService");

const ALLOWED_ROLES = ["admin", "employee"];
const ALLOWED_EMPLOYEE_STATUSES = ["active", "on-leave"];

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

const normalizeEmployeeCode = (employeeCode) => {
  if (
    typeof employeeCode !== "string" ||
    !employeeCode.trim()
  ) {
    throw createError("Employee code is required.");
  }

  return employeeCode.trim().toUpperCase();
};

const validatePassword = (password) => {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw createError(
      "Password must contain between 8 and 128 characters."
    );
  }
};

const validateRole = (role) => {
  if (!ALLOWED_ROLES.includes(role)) {
    throw createError("Invalid account role.");
  }
};

const publicUser = (user, employeeId = null) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  employeeId,
});

const isEmployeeAllowed = (status) =>
  ALLOWED_EMPLOYEE_STATUSES.includes(status);

const handleDuplicateError = (error) => {
  if (error && error.code === 11000) {
    throw createError(
      "An account with this email or employee code already exists.",
      409
    );
  }

  throw error;
};

// --------------------------------------------------
// SEND REGISTRATION OTP
// --------------------------------------------------

const sendRegistrationOtp = async ({
  name,
  email,
  employeeCode,
  role = "employee",
}) => {
  const normalizedEmail = normalizeEmail(email);

  if (typeof name !== "string" || !name.trim()) {
    throw createError("Full name is required.");
  }

  validateRole(role);

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existingUser) {
    throw createError(
      "An account with this email already exists.",
      409
    );
  }

  let normalizedCode = null;

  if (role === "employee") {
    normalizedCode = normalizeEmployeeCode(employeeCode);

    const employee = await Employee.findOne({
      employeeCode: normalizedCode,
      email: normalizedEmail,
    }).select("_id user status");

    if (!employee) {
      throw createError(
        "Employee record not found. Contact your administrator.",
        404
      );
    }

    if (!isEmployeeAllowed(employee.status)) {
      throw createError(
        "This employee account is inactive or terminated.",
        403
      );
    }

    if (employee.user) {
      throw createError(
        "An account is already linked to this employee.",
        409
      );
    }
  }

  const purpose =
    role === "admin"
      ? "admin-registration"
      : "employee-registration";

  const otpData = await otpService.createOtp({
    email: normalizedEmail,
    purpose,
    employeeCode: normalizedCode,
  });

  await authEmailService.sendAuthOtpEmail({
    email: normalizedEmail,
    otp: otpData.otp,
    purpose,
    expiresInMinutes: otpData.expiresInMinutes,
  });

  return {
    success: true,
    message: "Verification OTP sent to your email.",
    email: normalizedEmail,
    purpose,
    expiresAt: otpData.expiresAt,
  };
};

// --------------------------------------------------
// VERIFY REGISTRATION OTP
// --------------------------------------------------

const verifyRegistrationOtp = async ({
  email,
  otp,
  role = "employee",
}) => {
  const normalizedEmail = normalizeEmail(email);

  validateRole(role);

  const purpose =
    role === "admin"
      ? "admin-registration"
      : "employee-registration";

  const result = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose,
    otp,
  });

  return {
    success: true,
    message: "Email verified successfully.",
    verificationProof: result.verificationProof,
    expiresAt: result.expiresAt,
    email: result.email,
    purpose: result.purpose,
    employeeCode: result.employeeCode,
  };
};

// --------------------------------------------------
// COMPLETE REGISTRATION
// --------------------------------------------------

const register = async ({
  name,
  email,
  password,
  confirmPassword,
  employeeCode,
  role = "employee",
  verificationProof,
}) => {
  const normalizedEmail = normalizeEmail(email);

  if (typeof name !== "string" || !name.trim()) {
    throw createError("Name is required.");
  }

  validatePassword(password);
  validateRole(role);

  if (
    confirmPassword !== undefined &&
    password !== confirmPassword
  ) {
    throw createError("Passwords do not match.");
  }

  if (
    typeof verificationProof !== "string" ||
    !/^[a-f0-9]{64}$/i.test(verificationProof)
  ) {
    throw createError("A valid verification proof is required.");
  }

  const purpose =
    role === "admin"
      ? "admin-registration"
      : "employee-registration";

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existingUser) {
    throw createError(
      "An account with this email already exists.",
      409
    );
  }

  let normalizedCode = null;
  let employee = null;

  if (role === "employee") {
    normalizedCode = normalizeEmployeeCode(employeeCode);

    employee = await Employee.findOne({
      employeeCode: normalizedCode,
      email: normalizedEmail,
      status: { $in: ALLOWED_EMPLOYEE_STATUSES },
    }).select("_id employeeCode email user status");

    if (!employee) {
      throw createError(
        "Active or on-leave employee record not found.",
        404
      );
    }

    if (employee.user) {
      throw createError(
        "An account is already linked to this employee.",
        409
      );
    }
  }

  const proof = await otpService.consumeVerificationProof({
    email: normalizedEmail,
    purpose,
    verificationProof,
    ...(role === "employee"
      ? { expectedEmployeeCode: normalizedCode }
      : {}),
  });

  if (
    !proof.success ||
    proof.email !== normalizedEmail ||
    proof.purpose !== purpose
  ) {
    throw createError(
      "Email verification failed.",
      403
    );
  }

  if (role === "employee") {
    if (
      !proof.employeeCode ||
      proof.employeeCode !== normalizedCode
    ) {
      throw createError(
        "Employee code does not match the verified registration request.",
        403
      );
    }
  } else if (proof.employeeCode) {
    throw createError(
      "Invalid Admin registration verification.",
      403
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // ADMIN REGISTRATION
  if (role === "admin") {
    try {
      const admin = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
        isActive: false,
        adminApprovalStatus: "pending",
        adminApprovalRequestedAt: new Date(),
      });

      const existingAdmins = await User.find({
        _id: { $ne: admin._id },
        role: "admin",
        isActive: true,
        $or: [
          { adminApprovalStatus: "approved" },
          { adminApprovalStatus: null },
        ],
      })
        .select("_id")
        .lean();

      if (existingAdmins.length > 0) {
        const notifications = existingAdmins.map(
          (existingAdmin) => ({
            recipientAdmin: existingAdmin._id,
            title: "New Admin Registration Pending",
            message: `${admin.name} (${admin.email}) has requested Admin access. Please review this registration.`,
            type: "warning",
            category: "admin-approval",
            metadata: {
              adminId: admin._id,
              adminName: admin.name,
              adminEmail: admin.email,
              status: "pending",
            },
            dedupeKey: `admin-registration:${admin._id}:${existingAdmin._id}`,
          })
        );

        try {
          await Notification.insertMany(notifications, {
            ordered: false,
          });

          console.log(
            `Admin approval notifications created for ${notifications.length} existing Admin(s).`
          );
        } catch (notificationError) {
          console.error(
            "Admin registration notification creation failed:",
            notificationError
          );
        }
      } else {
        console.warn(
          "No active existing Admin found to receive the registration notification."
        );
      }

      return {
        message:
          "Admin registration submitted. Wait for approval from an existing Admin.",
        approvalStatus: "pending",
        user: publicUser(admin),
      };
    } catch (error) {
      handleDuplicateError(error);
    }
  }

  // EMPLOYEE REGISTRATION
  let user = null;

  try {
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "employee",
      isActive: true,
    });

    const linkedEmployee = await Employee.findOneAndUpdate(
      {
        _id: employee._id,
        email: normalizedEmail,
        employeeCode: normalizedCode,
        status: { $in: ALLOWED_EMPLOYEE_STATUSES },
        $or: [
          { user: { $exists: false } },
          { user: null },
        ],
      },
      {
        $set: {
          user: user._id,
        },
      },
      {
        new: true,
      }
    );

    if (!linkedEmployee) {
      throw createError(
        "This employee already has an account or is no longer eligible for registration.",
        409
      );
    }

    return {
      message: "Employee registration successful.",
      user: publicUser(user, linkedEmployee._id),
    };
  } catch (error) {
    if (user && user._id) {
      try {
        await User.findByIdAndDelete(user._id);
      } catch (cleanupError) {
        console.error(
          "Employee registration cleanup failed:",
          cleanupError.message
        );
      }
    }

    handleDuplicateError(error);
  }
};

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

const login = async ({ email, password, role }) => {
  const normalizedEmail = normalizeEmail(email);

  if (typeof password !== "string" || !password) {
    throw createError("Email and password are required.");
  }

  validateRole(role);

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw createError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw createError("Invalid email or password.", 401);
  }

  if (user.role !== role) {
    throw createError(
      `This account is not registered as ${
        role === "admin" ? "an Admin" : "an Employee"
      }.`,
      403
    );
  }

  // Check account status
  if (!user.isActive) {
    if (
      user.role === "admin" &&
      user.adminApprovalStatus === "pending"
    ) {
      throw createError(
        "Your Admin registration is awaiting approval.",
        403
      );
    }

    if (
      user.role === "admin" &&
      user.adminApprovalStatus === "rejected"
    ) {
      throw createError(
        "Your Admin registration has been rejected.",
        403
      );
    }

    throw createError(
      "Your account is inactive. Contact the administrator.",
      403
    );
  }

  // ADMIN LOGIN: PASSWORD + EMAIL OTP
  if (user.role === "admin") {
    if (
      user.adminApprovalStatus &&
      user.adminApprovalStatus !== "approved"
    ) {
      throw createError(
        "Your Admin account is not approved.",
        403
      );
    }

    const otpData = await otpService.createOtp({
      email: normalizedEmail,
      purpose: "admin-login",
      userId: user._id,
    });

    await authEmailService.sendAuthOtpEmail({
      email: normalizedEmail,
      otp: otpData.otp,
      purpose: "admin-login",
      expiresInMinutes: otpData.expiresInMinutes,
    });

    return {
      message: "Admin verification OTP sent to your email.",
      otpRequired: true,
      email: normalizedEmail,
      expiresAt: otpData.expiresAt,
    };
  }

  // EMPLOYEE LOGIN: PASSWORD ONLY
  if (user.role === "employee") {
    const employee = await Employee.findOne({
      user: user._id,
      status: { $in: ALLOWED_EMPLOYEE_STATUSES },
    }).select("_id status");

    if (!employee) {
      throw createError(
        "Your employee account is inactive, terminated or not linked.",
        403
      );
    }

    user.lastLogin = new Date();
    await user.save();

    return {
      message: "Employee login successful.",
      user: publicUser(user, employee._id),
    };
  }

  throw createError("Invalid account role.", 403);
};

// --------------------------------------------------
// VERIFY ADMIN LOGIN OTP
// --------------------------------------------------

const verifyAdminLoginOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  const verification = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose: "admin-login",
    otp,
  });

  const proof = await otpService.consumeVerificationProof({
    email: normalizedEmail,
    purpose: "admin-login",
    verificationProof: verification.verificationProof,
  });

  if (
    !proof.success ||
    proof.email !== normalizedEmail ||
    proof.purpose !== "admin-login" ||
    !proof.userId
  ) {
    throw createError(
      "Admin verification is invalid.",
      403
    );
  }

  const user = await User.findById(proof.userId).select(
    "_id name email role isActive adminApprovalStatus"
  );

  if (
    !user ||
    user.email !== normalizedEmail ||
    user.role !== "admin" ||
    !user.isActive ||
    (user.adminApprovalStatus &&
      user.adminApprovalStatus !== "approved")
  ) {
    throw createError(
      "Admin account is inactive or not approved.",
      403
    );
  }

  user.lastLogin = new Date();
  await user.save();

  return {
    message: "Admin login successful.",
    user: publicUser(user),
  };
};

// --------------------------------------------------
// VERIFY EMPLOYEE LOGIN OTP
// --------------------------------------------------

const verifyEmployeeLoginOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  const verification = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose: "employee-login",
    otp,
  });

  const proof = await otpService.consumeVerificationProof({
    email: normalizedEmail,
    purpose: "employee-login",
    verificationProof: verification.verificationProof,
  });

  if (
    !proof.success ||
    proof.email !== normalizedEmail ||
    proof.purpose !== "employee-login" ||
    !proof.userId
  ) {
    throw createError(
      "Employee verification is invalid.",
      403
    );
  }

  const user = await User.findById(proof.userId).select(
    "_id name email role isActive"
  );

  if (
    !user ||
    user.email !== normalizedEmail ||
    user.role !== "employee" ||
    !user.isActive
  ) {
    throw createError(
      "Employee account is inactive or invalid.",
      403
    );
  }

  const employee = await Employee.findOne({
    user: user._id,
    status: { $in: ALLOWED_EMPLOYEE_STATUSES },
  }).select("_id status");

  if (!employee) {
    throw createError(
      "Your employee account is inactive, terminated or not linked.",
      403
    );
  }

  user.lastLogin = new Date();
  await user.save();

  return {
    message: "Employee login successful.",
    user: publicUser(user, employee._id),
  };
};

// --------------------------------------------------
// FORGOT PASSWORD - SEND OTP
// --------------------------------------------------

const forgotPassword = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("_id email isActive");

  if (!user || !user.isActive) {
    return {
      message:
        "If an active account exists for this email, a verification OTP will be sent.",
    };
  }

  const otpData = await otpService.createOtp({
    email: normalizedEmail,
    purpose: "password-reset",
    userId: user._id,
  });

  await authEmailService.sendAuthOtpEmail({
    email: normalizedEmail,
    otp: otpData.otp,
    purpose: "password-reset",
    expiresInMinutes: otpData.expiresInMinutes,
  });

  return {
    message:
      "If an active account exists for this email, a verification OTP will be sent.",
    expiresAt: otpData.expiresAt,
  };
};

// --------------------------------------------------
// VERIFY PASSWORD RESET OTP
// --------------------------------------------------

const verifyPasswordResetOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  const result = await otpService.verifyOtp({
    email: normalizedEmail,
    purpose: "password-reset",
    otp,
  });

  return {
    message: "OTP verified successfully.",
    verificationProof: result.verificationProof,
    expiresAt: result.expiresAt,
  };
};

// --------------------------------------------------
// RESET PASSWORD
// --------------------------------------------------

const resetPassword = async ({
  email,
  verificationProof,
  newPassword,
  confirmPassword,
}) => {
  const normalizedEmail = normalizeEmail(email);

  validatePassword(newPassword);

  if (
    confirmPassword !== undefined &&
    newPassword !== confirmPassword
  ) {
    throw createError("Passwords do not match.");
  }

  const proof = await otpService.consumeVerificationProof({
    email: normalizedEmail,
    purpose: "password-reset",
    verificationProof,
  });

  if (
    !proof.success ||
    proof.email !== normalizedEmail ||
    proof.purpose !== "password-reset" ||
    !proof.userId
  ) {
    throw createError(
      "Password reset verification failed.",
      403
    );
  }

  const user = await User.findOne({
    _id: proof.userId,
    email: normalizedEmail,
    isActive: true,
  }).select("+password");

  if (!user) {
    throw createError("Active account not found.", 404);
  }

  const samePassword = await bcrypt.compare(
    newPassword,
    user.password
  );

  if (samePassword) {
    throw createError(
      "New password must differ from the current password."
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();

  await user.save();

  await sessionService.revokeAllUserSessions(
    user._id,
    "password-reset"
  );

  return {
    message: "Password reset successfully. Please login again.",
  };
};

// --------------------------------------------------
// CHANGE PASSWORD
// --------------------------------------------------

const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  if (!userId || !currentPassword || !newPassword) {
    throw createError("All password fields are required.");
  }

  validatePassword(newPassword);

  if (currentPassword === newPassword) {
    throw createError(
      "New password must differ from the current password."
    );
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw createError("User not found.", 404);
  }

  const matches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!matches) {
    throw createError(
      "Current password is incorrect.",
      401
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();

  await user.save();

  await sessionService.revokeAllUserSessions(
    user._id,
    "password-change"
  );

  return {
    message: "Password changed successfully.",
  };
};

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  register,
  login,
  verifyAdminLoginOtp,
  verifyEmployeeLoginOtp,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  changePassword,
};
