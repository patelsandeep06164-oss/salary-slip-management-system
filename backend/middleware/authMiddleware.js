
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          error.name === "TokenExpiredError"
            ? "Session expired. Please login again."
            : "Invalid authentication token.",
      });
    }

    const userId = decoded.id || decoded.userId || decoded._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    const user = await User.findById(userId).select(
      "_id name email role isActive"
    );

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "User account not found or inactive.",
      });
    }

    let employeeId = null;

    if (user.role === "employee") {
      const employee = await Employee.findOne({
        user: user._id,
        status: "active",
      }).select("_id");

      if (!employee) {
        return res.status(403).json({
          success: false,
          message: "No active employee profile is linked to this account.",
        });
      }

      employeeId = employee._id.toString();
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
