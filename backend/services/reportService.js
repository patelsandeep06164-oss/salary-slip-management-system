const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const SalarySlip = require("../models/SalarySlip");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getPeriod = (month, year) => {
  month = Number(month);
  year = Number(year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw createError("Month must be between 1 and 12.");
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createError("Invalid year.");
  }

  return {
    month,
    year,
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
};

const getDashboardReport = async ({ month, year } = {}) => {
  const now = new Date();

  month = month === undefined ? now.getMonth() + 1 : month;
  year = year === undefined ? now.getFullYear() : year;

  const period = getPeriod(month, year);

  const [
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    pendingLeaves,
    attendanceSummary,
    payrollSummary,
    pendingSalarySlips,
  ] = await Promise.all([
    Employee.countDocuments(),
    Employee.countDocuments({ status: "active" }),
    Employee.countDocuments({ status: "inactive" }),
    Leave.countDocuments({ status: "pending" }),

    Attendance.aggregate([
      { $match: { date: { $gte: period.start, $lt: period.end } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    Payroll.aggregate([
      {
        $match: {
          month: period.month,
          year: period.year,
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: "$grossSalary" },
          totalDeductions: { $sum: "$totalDeductions" },
          totalNetSalary: { $sum: "$netSalary" },
          payrollCount: { $sum: 1 },
        },
      },
    ]),

    SalarySlip.countDocuments({
      month: period.month,
      year: period.year,
      emailStatus: { $in: ["pending", "failed"] },
    }),
  ]);

  const attendance = {};

  attendanceSummary.forEach((item) => {
    attendance[item._id] = item.count;
  });

  return {
    period: {
      month: period.month,
      year: period.year,
    },
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
    },
    leaves: {
      pending: pendingLeaves,
    },
    attendance,
    payroll: payrollSummary[0] || {
      totalPayroll: 0,
      totalDeductions: 0,
      totalNetSalary: 0,
      payrollCount: 0,
    },
    salarySlips: {
      pendingOrFailedEmails: pendingSalarySlips,
    },
  };
};

const getPayrollReport = async ({ month, year, status } = {}) => {
  const period = getPeriod(month, year);

  const filter = {
    month: period.month,
    year: period.year,
    status: { $ne: "cancelled" },
  };

  if (status) filter.status = status;

  const records = await Payroll.find(filter)
    .populate("employee", "employeeCode firstName lastName email")
    .sort({ netSalary: -1 });

  const totals = records.reduce(
    (result, payroll) => {
      result.grossSalary += Number(payroll.grossSalary) || 0;
      result.totalDeductions += Number(payroll.totalDeductions) || 0;
      result.netSalary += Number(payroll.netSalary) || 0;
      return result;
    },
    { grossSalary: 0, totalDeductions: 0, netSalary: 0 }
  );

  return {
    period: { month: period.month, year: period.year },
    count: records.length,
    totals,
    records,
  };
};

const getAttendanceReport = async ({ month, year, employee } = {}) => {
  const period = getPeriod(month, year);

  const match = {
    date: { $gte: period.start, $lt: period.end },
  };

  if (employee) match.employee = employee;

  const records = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          employee: "$employee",
          status: "$status",
        },
        count: { $sum: 1 },
        totalWorkHours: { $sum: { $ifNull: ["$workHours", 0] } },
        totalOvertimeHours: {
          $sum: { $ifNull: ["$overtimeHours", 0] },
        },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "_id.employee",
        foreignField: "_id",
        as: "employee",
      },
    },
    {
      $unwind: {
        path: "$employee",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        employeeId: "$_id.employee",
        status: "$_id.status",
        count: 1,
        totalWorkHours: 1,
        totalOvertimeHours: 1,
        employeeCode: "$employee.employeeCode",
        firstName: "$employee.firstName",
        lastName: "$employee.lastName",
      },
    },
    { $sort: { employeeCode: 1, status: 1 } },
  ]);

  return {
    period: { month: period.month, year: period.year },
    records,
  };
};

const getEmployeeReport = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate("department", "name code");

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  const [payrolls, attendanceCount, leaveCounts, salarySlips] =
    await Promise.all([
      Payroll.find({ employee: employeeId })
        .sort({ year: -1, month: -1 })
        .limit(12),

      Attendance.countDocuments({ employee: employeeId }),

      Leave.aggregate([
        { $match: { employee: employee._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      SalarySlip.find({ employee: employeeId })
        .select("-pdfPath")
        .sort({ year: -1, month: -1 })
        .limit(12),
    ]);

  return {
    employee,
    payrolls,
    attendanceCount,
    leaveCounts,
    salarySlips,
  };
};

module.exports = {
  getDashboardReport,
  getPayrollReport,
  getAttendanceReport,
  getEmployeeReport,
};