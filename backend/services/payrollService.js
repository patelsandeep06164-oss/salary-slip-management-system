
const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const CompanySettings = require("../models/CompanySettings");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validatePeriod = (month, year) => {
  month = Number(month);
  year = Number(year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw createError("Month must be between 1 and 12.");
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createError("Invalid payroll year.");
  }

  return { month, year };
};

const generatePayroll = async ({
  employeeId,
  month,
  year,
  generatedBy,
  basicSalary: inputBasicSalary,
  hra: inputHra,
  allowances: inputAllowances,
  bonus: inputBonus,
  deductions: inputDeductions,
  workingDays: inputWorkingDays,
  paidDays: inputPaidDays,
  remarks,
}) => {
  ({ month, year } = validatePeriod(month, year));

  if (!employeeId) {
    throw createError("Employee ID is required.");
  }

  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  if (employee.status !== "active") {
    throw createError("Cannot generate payroll for an inactive employee.");
  }

  const existing = await Payroll.findOne({
    employee: employeeId,
    month,
    year,
  });

  if (existing) {
    throw createError(
      "Payroll already exists for this employee and month.",
      409
    );
  }

  const settings = await CompanySettings.findOne();
  const salary = employee.salary || {};

  let basicSalary = Number(salary.basic) || 0;
  let hra = Number(salary.hra) || 0;
  let allowances = Number(salary.allowances) || 0;
  let bonus = 0;
  let baseDeductions = Number(salary.deductions) || 0;
  let workingDays =
    Number(settings?.standardWorkingDaysPerMonth) || 26;

  let daysPresent = 0;
  let daysAbsent = 0;
  let unpaidLeaveDays = 0;
  let unpaidLeaveDeduction = 0;
  let grossSalary = 0;
  let totalDeductions = 0;
  let netSalary = 0;

  // Manual UI generation uses validated values submitted by admin/HR.
  // Scheduled generation uses saved employee salary and attendance data.
  const hasManualInputs =
    inputWorkingDays !== undefined &&
    inputPaidDays !== undefined;

  if (hasManualInputs) {
    const values = {
      basicSalary: inputBasicSalary ?? salary.basic ?? 0,
      hra: inputHra ?? salary.hra ?? 0,
      allowances: inputAllowances ?? salary.allowances ?? 0,
      bonus: inputBonus ?? 0,
      deductions: inputDeductions ?? salary.deductions ?? 0,
      workingDays: inputWorkingDays,
      paidDays: inputPaidDays,
    };

    for (const [key, value] of Object.entries(values)) {
      const number = Number(value);

      if (!Number.isFinite(number) || number < 0) {
        throw createError(
          `${key} must be a valid non-negative number.`
        );
      }

      values[key] = number;
    }

    if (
      !Number.isInteger(values.workingDays) ||
      values.workingDays < 1 ||
      values.workingDays > 31
    ) {
      throw createError("Working days must be between 1 and 31.");
    }

    if (values.paidDays > values.workingDays) {
      throw createError("Paid days cannot exceed working days.");
    }

    const factor = values.paidDays / values.workingDays;

    basicSalary = Number(
      (values.basicSalary * factor).toFixed(2)
    );

    hra = Number((values.hra * factor).toFixed(2));

    allowances = Number(
      (values.allowances * factor).toFixed(2)
    );

    bonus = Number(values.bonus.toFixed(2));
    baseDeductions = Number(values.deductions.toFixed(2));
    workingDays = values.workingDays;
    daysPresent = values.paidDays;
    daysAbsent = Math.max(
      0,
      values.workingDays - values.paidDays
    );

    grossSalary = Number(
      (basicSalary + hra + allowances + bonus).toFixed(2)
    );

    totalDeductions = Number(baseDeductions.toFixed(2));

    if (totalDeductions > grossSalary) {
      throw createError("Deductions cannot exceed gross salary.");
    }

    netSalary = Number(
      (grossSalary - totalDeductions).toFixed(2)
    );
  } else {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [attendance, unpaidLeaves] = await Promise.all([
      Attendance.find({
        employee: employeeId,
        date: { $gte: start, $lt: end },
      }),

      Leave.find({
        employee: employeeId,
        status: "approved",
        leaveType: "unpaid",
        startDate: { $lt: end },
        endDate: { $gte: start },
      }),
    ]);

    const presentDays = attendance.filter((record) =>
      ["present", "late"].includes(record.status)
    ).length;

    const halfDays = attendance.filter(
      (record) => record.status === "half-day"
    ).length;

    daysPresent = presentDays + halfDays * 0.5;

    daysAbsent = attendance.filter(
      (record) => record.status === "absent"
    ).length;

    unpaidLeaveDays = unpaidLeaves.reduce((total, leave) => {
      const leaveStart = new Date(
        Math.max(
          new Date(leave.startDate).getTime(),
          start.getTime()
        )
      );

      const leaveEnd = new Date(
        Math.min(
          new Date(leave.endDate).getTime(),
          end.getTime() - 1
        )
      );

      leaveStart.setHours(0, 0, 0, 0);
      leaveEnd.setHours(0, 0, 0, 0);

      const days =
        Math.floor(
          (leaveEnd.getTime() - leaveStart.getTime()) /
            86400000
        ) + 1;

      return total + Math.max(0, days);
    }, 0);

    const totalSalary = basicSalary + hra + allowances;
    const perDaySalary = totalSalary / workingDays;

    unpaidLeaveDeduction = Number(
      (perDaySalary * unpaidLeaveDays).toFixed(2)
    );

    grossSalary = Number(totalSalary.toFixed(2));

    totalDeductions = Number(
      (baseDeductions + unpaidLeaveDeduction).toFixed(2)
    );

    netSalary = Number(
      Math.max(0, grossSalary - totalDeductions).toFixed(2)
    );
  }

  try {
    return await Payroll.create({
      employee: employeeId,
      month,
      year,
      currency: salary.currency || settings?.currency || "INR",
      basicSalary,
      hra,
      allowances,
      overtimePay: 0,
      bonus,
      deductions: baseDeductions,
      taxDeduction: 0,
      unpaidLeaveDeduction,
      grossSalary,
      totalDeductions,
      netSalary,
      workingDays,
      daysPresent,
      daysAbsent,
      unpaidLeaveDays,
      status: "draft",
      generatedBy,
      remarks: String(remarks || "").trim().slice(0, 1000),
    });
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "Payroll already exists for this period.",
        409
      );
    }

    throw error;
  }
};

const getPayrollById = async (id) => {
  const payroll = await Payroll.findById(id)
    .populate("employee")
    .populate("generatedBy", "name email");

  if (!payroll) {
    throw createError("Payroll record not found.", 404);
  }

  return payroll;
};

const getPayrollRecords = async ({
  employee,
  month,
  year,
  status,
  page = 1,
  limit = 20,
} = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 20));

  const filter = {};

  if (employee) {
    filter.employee = employee;
  }

  if (status) {
    const validStatuses = [
      "draft",
      "processed",
      "paid",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      throw createError("Invalid payroll status.");
    }

    filter.status = status;
  }

  if (month !== undefined && month !== "") {
    const parsedMonth = Number(month);

    if (
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      throw createError("Month must be between 1 and 12.");
    }

    filter.month = parsedMonth;
  }

  if (year !== undefined && year !== "") {
    const parsedYear = Number(year);

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 2000 ||
      parsedYear > 2100
    ) {
      throw createError("Invalid payroll year.");
    }

    filter.year = parsedYear;
  }

  const [payrolls, total] = await Promise.all([
    Payroll.find(filter)
      .populate(
        "employee",
        "employeeCode firstName lastName email"
      )
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Payroll.countDocuments(filter),
  ]);

  return {
    payrolls,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updatePayrollStatus = async ({
  payrollId,
  status,
  paymentReference,
  remarks,
}) => {
  const validStatuses = [
    "draft",
    "processed",
    "paid",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw createError("Invalid payroll status.");
  }

  const payroll = await Payroll.findById(payrollId);

  if (!payroll) {
    throw createError("Payroll record not found.", 404);
  }

  if (payroll.status === "cancelled") {
    throw createError(
      "Cancelled payroll cannot be changed.",
      409
    );
  }

  if (payroll.status === "paid" && status !== "paid") {
    throw createError(
      "Paid payroll cannot be moved to another status.",
      409
    );
  }

  if (status === "paid" && payroll.status !== "processed") {
    throw createError(
      "Only processed payroll can be marked as paid.",
      409
    );
  }

  payroll.status = status;

  if (status === "processed" && !payroll.processedAt) {
    payroll.processedAt = new Date();
  }

  if (status === "paid") {
    payroll.paidAt = payroll.paidAt || new Date();

    if (paymentReference) {
      payroll.paymentReference = paymentReference;
    }
  }

  if (remarks !== undefined) {
    payroll.remarks = String(remarks)
      .trim()
      .slice(0, 1000);
  }

  await payroll.save();

  return payroll;
};

const generateMonthlyPayroll = async ({ month, year }) => {
  ({ month, year } = validatePeriod(month, year));

  const employees = await Employee.find({ status: "active" });

  const results = {
    month,
    year,
    total: employees.length,
    successful: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const employee of employees) {
    try {
      const existing = await Payroll.findOne({
        employee: employee._id,
        month,
        year,
      });

      if (existing) {
        results.skipped++;

        results.details.push({
          employeeId: employee._id,
          status: "skipped",
          reason: "Payroll already exists",
        });

        continue;
      }

      await generatePayroll({
        employeeId: employee._id,
        month,
        year,
      });

      results.successful++;

      results.details.push({
        employeeId: employee._id,
        status: "generated",
      });
    } catch (error) {
      results.failed++;

      results.details.push({
        employeeId: employee._id,
        status: "failed",
        error: error.message,
      });
    }
  }

  console.log("[Monthly Payroll] Result:", {
    month,
    year,
    total: results.total,
    successful: results.successful,
    skipped: results.skipped,
    failed: results.failed,
  });

  return results;
};

module.exports = {
  generatePayroll,
  generateMonthlyPayroll,
  getPayrollById,
  getPayrollRecords,
  updatePayrollStatus,
};
