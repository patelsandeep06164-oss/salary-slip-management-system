const fs = require("fs");

const SalarySlip = require("../models/SalarySlip");
const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const CompanySettings = require("../models/CompanySettings");

const { generateSalarySlipPdf } = require("./pdfService");
const { sendSalarySlipEmail } = require("./emailService");

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
    throw createError("Invalid year.");
  }

  return { month, year };
};

const makeSlipNumber = (employee, month, year) => {
  const employeeCode = String(
    employee.employeeCode || employee._id
  ).replace(/[^a-zA-Z0-9_-]/g, "_");

  return `SS-${year}${String(month).padStart(2, "0")}-${employeeCode}`;
};

// Generate a salary slip only for processed or paid payroll.
const generateSalarySlip = async (payrollId, generatedBy) => {
  const payroll = await Payroll.findById(payrollId);

  if (!payroll) {
    throw createError("Payroll record not found.", 404);
  }

  if (!["processed", "paid"].includes(payroll.status)) {
    throw createError(
      "Only processed or paid payroll can generate a salary slip."
    );
  }

  let slip = await SalarySlip.findOne({
    employee: payroll.employee,
    month: payroll.month,
    year: payroll.year,
  }).select("+pdfPath");

  // Reuse an existing PDF rather than creating a duplicate slip.
  if (slip?.pdfPath && fs.existsSync(slip.pdfPath)) {
    return slip;
  }

 const employee = await Employee.findById(payroll.employee)
  .select("+pan +panNumber +bankDetails");

  if (!employee) {
    throw createError("Employee record not found.", 404);
  }

  const company = await CompanySettings.findOne();

  const slipNumber = makeSlipNumber(
    employee,
    payroll.month,
    payroll.year
  );

  if (!slip) {
    try {
      slip = await SalarySlip.create({
        employee: employee._id,
        payroll: payroll._id,
        month: payroll.month,
        year: payroll.year,
        slipNumber,
        status: "pending",
        emailStatus: "pending",
        generatedBy,
      });
    } catch (error) {
      if (error.code === 11000) {
        slip = await SalarySlip.findOne({
          employee: employee._id,
          month: payroll.month,
          year: payroll.year,
        }).select("+pdfPath");

        if (!slip) {
          throw error;
        }

        // Another request may already have generated the PDF.
        if (slip.pdfPath && fs.existsSync(slip.pdfPath)) {
          return slip;
        }
      } else {
        throw error;
      }
    }
  }

  try {
    const pdf = await generateSalarySlipPdf({
      payroll,
      employee,
      company,
      slipNumber: slip.slipNumber,
    });

    slip.payroll = payroll._id;
    slip.pdfPath = pdf.pdfPath;
    slip.status = "generated";
    slip.generatedAt = new Date();

    if (generatedBy) {
      slip.generatedBy = generatedBy;
    }

    await slip.save();

    return slip;
  } catch (error) {
    slip.status = "failed";
    await slip.save();
    throw error;
  }
};

// Email an existing salary slip without sending duplicate emails.
const emailSalarySlip = async (salarySlipId) => {
  const slip = await SalarySlip.findById(salarySlipId)
    .select("+pdfPath");

  if (!slip) {
    throw createError("Salary slip not found.", 404);
  }

  if (!slip.pdfPath || !fs.existsSync(slip.pdfPath)) {
    throw createError(
      "PDF is missing. Generate the salary slip again.",
      404
    );
  }

  if (slip.emailStatus === "sent") {
    return {
      message: "Salary slip has already been emailed.",
      salarySlip: slip,
    };
  }

  const employee = await Employee.findById(slip.employee);
  const company = await CompanySettings.findOne();

  if (!employee) {
    throw createError("Employee record not found.", 404);
  }

  if (!employee.email) {
    slip.emailStatus = "failed";
    slip.lastEmailError = "Employee email address is missing.";

    await slip.save();

    throw createError(
      "Employee email address is missing.",
      400
    );
  }

  try {
    await sendSalarySlipEmail({
      employee,
      salarySlip: slip,
      pdfPath: slip.pdfPath,
      companyName: company?.companyName || "Your Company",
    });

    slip.emailStatus = "sent";
    slip.status = "emailed";
    slip.emailSentAt = new Date();
    slip.emailAttempts = (slip.emailAttempts || 0) + 1;
    slip.lastEmailError = undefined;

    await slip.save();

    return {
      message: "Salary slip emailed successfully.",
      salarySlip: slip,
    };
  } catch (error) {
    slip.emailStatus = "failed";
    slip.status = "failed";
    slip.emailAttempts = (slip.emailAttempts || 0) + 1;
    slip.lastEmailError = error.message;

    await slip.save();

    throw error;
  }
};

const generateAndEmailSalarySlip = async (
  payrollId,
  generatedBy
) => {
  const slip = await generateSalarySlip(payrollId, generatedBy);

  if (slip.emailStatus === "sent") {
    return {
      message: "Salary slip already generated and emailed.",
      salarySlip: slip,
    };
  }

  return emailSalarySlip(slip._id);
};

// Retrieve salary slips using month/year/status filters and pagination.
const getSalarySlips = async ({
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
      "pending",
      "generated",
      "emailed",
      "failed",
    ];

    if (!validStatuses.includes(status)) {
      throw createError("Invalid salary slip status.");
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
      throw createError("Invalid year.");
    }

    filter.year = parsedYear;
  }

  const [salarySlips, total] = await Promise.all([
    SalarySlip.find(filter)
      .populate(
        "employee",
        "employeeCode firstName lastName email"
      )
      .populate("payroll")
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    SalarySlip.countDocuments(filter),
  ]);

  return {
    salarySlips,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSalarySlipById = async (id) => {
  const slip = await SalarySlip.findById(id)
    .select("+pdfPath")
    .populate(
      "employee",
      "employeeCode firstName lastName email"
    )
    .populate("payroll");

  if (!slip) {
    throw createError("Salary slip not found.", 404);
  }

  return slip;
};

// Process existing eligible payrolls for a specific month.
const generateAndEmailMonthlySalarySlips = async (
  month,
  year
) => {
  ({ month, year } = validatePeriod(month, year));

  const settings = await CompanySettings.findOne();
  const automaticEmailEnabled =
    settings?.emailSalarySlipsAutomatically === true;

  const payrolls = await Payroll.find({
    month,
    year,
    status: { $in: ["processed", "paid"] },
  }).select("_id employee");

  const results = {
    month,
    year,
    total: payrolls.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    emailed: 0,
    emailEnabled: automaticEmailEnabled,
    details: [],
  };

  for (const payroll of payrolls) {
    try {
      const slip = await generateSalarySlip(payroll._id);

      if (!automaticEmailEnabled) {
        results.successful++;

        results.details.push({
          payrollId: payroll._id,
          salarySlipId: slip._id,
          status: "generated-email-disabled",
        });

        continue;
      }

      if (slip.emailStatus === "sent") {
        results.skipped++;

        results.details.push({
          payrollId: payroll._id,
          salarySlipId: slip._id,
          status: "already-emailed",
        });

        continue;
      }

      await emailSalarySlip(slip._id);

      results.successful++;
      results.emailed++;

      results.details.push({
        payrollId: payroll._id,
        salarySlipId: slip._id,
        status: "generated-and-emailed",
      });
    } catch (error) {
      results.failed++;

      results.details.push({
        payrollId: payroll._id,
        status: "failed",
        error: error.message,
      });
    }
  }

  console.log("[Monthly Salary Slip Email] Result:", {
    month,
    year,
    total: results.total,
    successful: results.successful,
    emailed: results.emailed,
    skipped: results.skipped,
    failed: results.failed,
    emailEnabled: results.emailEnabled,
  });

  return results;
};

module.exports = {
  generateSalarySlip,
  emailSalarySlip,
  generateAndEmailSalarySlip,
  generateAndEmailMonthlySalarySlips,
  getSalarySlips,
  getSalarySlipById,
};
