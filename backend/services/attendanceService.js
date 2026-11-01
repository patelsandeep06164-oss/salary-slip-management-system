
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const INDIA_TIME_ZONE = "Asia/Kolkata";
const INDIA_OFFSET_MINUTES = 330;

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Get YYYY-MM-DD according to India calendar date.
const getIndiaDateString = (dateValue = new Date()) => {
  // Date-only values must not be parsed as UTC and shifted.
  if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    const [year, month, day] = dateValue.split("-").map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));

    if (
      check.getUTCFullYear() !== year ||
      check.getUTCMonth() + 1 !== month ||
      check.getUTCDate() !== day
    ) {
      throw createError("Invalid attendance date.");
    }

    return dateValue;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw createError("Invalid attendance date.");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
};

// Convert India midnight to the corresponding UTC instant.
// India has no daylight-saving time.
const getDayRange = (dateValue = new Date()) => {
  const dateString = getIndiaDateString(dateValue);
  const [year, month, day] = dateString.split("-").map(Number);

  const start = new Date(
    Date.UTC(year, month - 1, day) -
      INDIA_OFFSET_MINUTES * 60 * 1000
  );

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
};

const markAttendance = async (data, markedBy) => {
  const { employee, date, status } = data;

  if (!employee || !date || !status) {
    throw createError("Employee, date and status are required.");
  }

  const validStatuses = [
    "present",
    "absent",
    "late",
    "half-day",
    "on-leave",
    "holiday",
  ];

  if (!validStatuses.includes(status)) {
    throw createError("Invalid attendance status.");
  }

  const employeeExists = await Employee.findById(employee);

  if (!employeeExists) {
    throw createError("Employee not found.", 404);
  }

  const { start } = getDayRange(date);

  const attendance = await Attendance.findOneAndUpdate(
    { employee, date: start },
    {
      $set: {
        status,
        remarks: data.remarks || "",
        ...(markedBy ? { markedBy } : {}),
      },
      $setOnInsert: {
        employee,
        date: start,
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  return attendance;
};

const checkIn = async (employeeId, dateValue = new Date()) => {
  const employee = await Employee.findById(employeeId);

  if (!employee || employee.status !== "active") {
    throw createError("Active employee not found.", 404);
  }

  const { start } = getDayRange(dateValue);

  let attendance = await Attendance.findOne({
    employee: employeeId,
    date: start,
  });

  if (attendance && attendance.checkIn) {
    throw createError("Check-in has already been recorded.", 409);
  }

  if (!attendance) {
    attendance = new Attendance({
      employee: employeeId,
      date: start,
      status: "present",
    });
  }

  attendance.checkIn = new Date();
  attendance.status = "present";

  await attendance.save();

  return attendance;
};

const checkOut = async (employeeId, dateValue = new Date()) => {
    const employee = await Employee.findById(employeeId);

  if (!employee || employee.status !== "active") {
    throw createError("Active employee not found.", 404);
  }
  const { start } = getDayRange(dateValue);

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: start,
  });

  if (!attendance || !attendance.checkIn) {
    throw createError("Please check in before checking out.", 400);
  }

  if (attendance.checkOut) {
    throw createError("Check-out has already been recorded.", 409);
  }

  const now = new Date();

  if (now < attendance.checkIn) {
    throw createError("Check-out cannot be before check-in.");
  }

  const hours =
    (now.getTime() - attendance.checkIn.getTime()) /
    (1000 * 60 * 60);

  attendance.checkOut = now;
  attendance.workHours = Number(hours.toFixed(2));
  attendance.overtimeHours = Number(Math.max(0, hours - 8).toFixed(2));

  if (hours < 4) attendance.status = "half-day";

  await attendance.save();

  return attendance;
};

const getAttendance = async ({
  employee,
  startDate,
  endDate,
  page = 1,
  limit = 50,
} = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 50));

  const filter = {};

  if (employee) filter.employee = employee;

  if (startDate || endDate) {
    filter.date = {};

    if (startDate) {
      filter.date.$gte = getDayRange(startDate).start;
    }

    if (endDate) {
      filter.date.$lt = getDayRange(endDate).end;
    }
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("employee", "employeeCode firstName lastName")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Attendance.countDocuments(filter),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMonthlySummary = async (employeeId, month, year) => {
  month = Number(month);
  year = Number(year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw createError("Month must be between 1 and 12.");
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw createError("Invalid year.");
  }

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;

  const nextMonthDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const start = getDayRange(monthStart).start;
  const end = getDayRange(nextMonthDate).start;

  const match = { date: { $gte: start, $lt: end } };

  if (employeeId) match.employee = employeeId;

  const summary = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$employee",
        totalRecords: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        halfDays: {
          $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] },
        },
        leaveDays: {
          $sum: { $cond: [{ $eq: ["$status", "on-leave"] }, 1, 0] },
        },
        workHours: { $sum: { $ifNull: ["$workHours", 0] } },
        overtimeHours: {
          $sum: { $ifNull: ["$overtimeHours", 0] },
        },
      },
    },
  ]);

  return summary;
};

module.exports = {
  markAttendance,
  checkIn,
  checkOut,
  getAttendance,
  getMonthlySummary,
};
