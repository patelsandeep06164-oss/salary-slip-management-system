const reportService = require("../services/reportService");

const getDashboardReport = async (req, res, next) => {
  try {
    const now = new Date();

    const report = await reportService.getDashboardReport({
      month: req.query.month || now.getMonth() + 1,
      year: req.query.year || now.getFullYear(),
    });

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

const getPayrollReport = async (req, res, next) => {
  try {
    const now = new Date();

    const report = await reportService.getPayrollReport({
      month: req.query.month || now.getMonth() + 1,
      year: req.query.year || now.getFullYear(),
      status: req.query.status,
    });

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const getAttendanceReport = async (req, res, next) => {
  try {
    const now = new Date();

    const employee =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.query.employee;

    const report = await reportService.getAttendanceReport({
      month: req.query.month || now.getMonth() + 1,
      year: req.query.year || now.getFullYear(),
      employee,
    });

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const getEmployeeReport = async (req, res, next) => {
  try {
    const employeeId =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.params.employeeId;

    if (
      req.user?.role === "employee" &&
      employeeId?.toString() !== req.user.employeeId?.toString()
    ) {
      const error = new Error("You cannot access another employee's report.");
      error.statusCode = 403;
      throw error;
    }

    const report = await reportService.getEmployeeReport(employeeId);

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardReport,
  getPayrollReport,
  getAttendanceReport,
  getEmployeeReport,
};