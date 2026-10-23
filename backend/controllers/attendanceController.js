const attendanceService = require("../services/attendanceService");

const markAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.markAttendance(
      req.body,
      req.user?.id || req.user?._id
    );

    res.status(200).json({
      success: true,
      message: "Attendance saved successfully.",
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const employeeId =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.body.employeeId;

    if (!employeeId) {
      const error = new Error("Employee ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const attendance = await attendanceService.checkIn(
      employeeId,
      req.body.date || new Date()
    );

    res.status(200).json({
      success: true,
      message: "Check-in recorded successfully.",
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const employeeId =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.body.employeeId;

    if (!employeeId) {
      const error = new Error("Employee ID is required.");
      error.statusCode = 400;
      throw error;
    }

    const attendance = await attendanceService.checkOut(
      employeeId,
      req.body.date || new Date()
    );

    res.status(200).json({
      success: true,
      message: "Check-out recorded successfully.",
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.user?.role === "employee") {
      filters.employee = req.user.employeeId;
    } else {
      filters.employee = req.query.employee;
    }

    const result = await attendanceService.getAttendance(filters);

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const employeeId =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.query.employeeId;

    const now = new Date();

    const month = req.query.month || now.getMonth() + 1;
    const year = req.query.year || now.getFullYear();

    const summary = await attendanceService.getMonthlySummary(
      employeeId,
      month,
      year
    );

    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  checkIn,
  checkOut,
  getAttendance,
  getMonthlySummary,
};