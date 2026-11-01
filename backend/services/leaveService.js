const Leave = require("../models/Leave");
const Employee = require("../models/Employee");

const INDIA_TIME_ZONE = "Asia/Kolkata";
const INDIA_OFFSET_MINUTES = 330;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Get YYYY-MM-DD according to India timezone.
const getIndiaDateString = (value) => {
  let date;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value.split("-").map(Number);

    const checkDate = new Date(Date.UTC(year, month - 1, day));

    if (
      checkDate.getUTCFullYear() !== year ||
      checkDate.getUTCMonth() !== month - 1 ||
      checkDate.getUTCDate() !== day
    ) {
      throw createError("Invalid date.");
    }

    return value;
  }

  date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createError("Invalid date.");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
};

// Convert India midnight to the corresponding UTC Date.
const startOfDay = (value) => {
  const dateString = getIndiaDateString(value);
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day) -
      INDIA_OFFSET_MINUTES * 60 * 1000
  );
};

const applyLeave = async (data) => {
  const { employee, leaveType, startDate, endDate, reason } = data;

  if (
    !employee ||
    !leaveType ||
    !startDate ||
    !endDate ||
    !reason ||
    !String(reason).trim()
  ) {
    throw createError(
      "Employee, leave type, dates and reason are required."
    );
  }

  const employeeRecord = await Employee.findById(employee);

  if (!employeeRecord || employeeRecord.status !== "active") {
    throw createError("Active employee not found.", 404);
  }

  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (end < start) {
    throw createError("End date cannot be before start date.");
  }

  const overlapping = await Leave.findOne({
    employee,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });

  if (overlapping) {
    throw createError(
      "A pending or approved leave overlaps these dates.",
      409
    );
  }

  const totalDays =
    Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;

  return Leave.create({
    employee,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason: String(reason).trim(),
    status: "pending",
  });
};

const getLeaves = async ({
  employee,
  status,
  startDate,
  endDate,
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
    filter.status = status;
  }

  // Return leaves that overlap the requested date range.
  if (startDate) {
    filter.endDate = {
      ...(filter.endDate || {}),
      $gte: startOfDay(startDate),
    };
  }

  if (endDate) {
    filter.startDate = {
      ...(filter.startDate || {}),
      $lte: startOfDay(endDate),
    };
  }

  const [leaves, total] = await Promise.all([
    Leave.find(filter)
      .populate("employee", "employeeCode firstName lastName email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Leave.countDocuments(filter),
  ]);

  return {
    leaves,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const reviewLeave = async ({
  leaveId,
  status,
  reviewedBy,
  reviewRemarks = "",
}) => {
  if (!["approved", "rejected"].includes(status)) {
    throw createError("Status must be approved or rejected.");
  }

  const leave = await Leave.findById(leaveId);

  if (!leave) {
    throw createError("Leave request not found.", 404);
  }

  if (leave.status !== "pending") {
    throw createError(
      "Only pending leave requests can be reviewed.",
      409
    );
  }

  leave.status = status;
  leave.reviewedBy = reviewedBy;
  leave.reviewedAt = new Date();
  leave.reviewRemarks = reviewRemarks;

  await leave.save();

  return leave;
};

const cancelLeave = async (leaveId, employeeId, isAdmin = false) => {
  // Only Admin or an authenticated Employee with a linked ID can cancel.
  if (!isAdmin && !employeeId) {
    throw createError("Employee account is not linked.", 403);
  }

  const leave = await Leave.findById(leaveId);

  if (!leave) {
    throw createError("Leave request not found.", 404);
  }

  // Employees can cancel only their own leave.
  if (
    !isAdmin &&
    leave.employee.toString() !== employeeId.toString()
  ) {
    throw createError(
      "You cannot cancel another employee's leave.",
      403
    );
  }

  if (!["pending", "approved"].includes(leave.status)) {
    throw createError(
      "This leave request cannot be cancelled.",
      409
    );
  }

  leave.status = "cancelled";

  await leave.save();

  return leave;
};

module.exports = {
  applyLeave,
  getLeaves,
  reviewLeave,
  cancelLeave,
};