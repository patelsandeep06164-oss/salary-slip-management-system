const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const register = async ({ name, email, password, employeeCode }) => {
  if (!name || !email || !password || !employeeCode) {
    throw createError("Name, email, password and employee code are required.");
  }

  if (password.length < 8) {
    throw createError("Password must contain at least 8 characters.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = employeeCode.trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw createError("An account with this email already exists.", 409);
  }

  const employee = await Employee.findOne({
    employeeCode: normalizedCode,
    email: normalizedEmail,
  });

  if (!employee) {
    throw createError("Employee record not found. Contact your administrator.", 404);
  }

  if (employee.status !== "active") {
    throw createError("This employee account is inactive.", 403);
  }

  if (employee.user) {
    throw createError("An account is already linked to this employee.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "employee",
  });

  try {
    employee.user = user._id;
    await employee.save();
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  return {
    message: "Registration successful.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createError("Email and password are required.");
  }

  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  if (!user) {
    throw createError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw createError("Your account is inactive. Contact the administrator.", 403);
  }

  let employee = null;

  if (user.role === "employee") {
    employee = await Employee.findOne({ user: user._id });

    if (!employee || employee.status !== "active") {
      throw createError("Your employee account is inactive or not linked.", 403);
    }
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful.",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: employee?._id || null,
    },
  };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  if (!userId || !currentPassword || !newPassword) {
    throw createError("All password fields are required.");
  }

  if (newPassword.length < 8) {
    throw createError("New password must contain at least 8 characters.");
  }

  if (currentPassword === newPassword) {
    throw createError("New password must differ from the current password.");
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw createError("User not found.", 404);
  }

  const matches = await bcrypt.compare(currentPassword, user.password);

  if (!matches) {
    throw createError("Current password is incorrect.", 401);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();

  await user.save();

  return { message: "Password changed successfully." };
};

module.exports = {
  register,
  login,
  changePassword,
};