
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

const logSalarySlipError = (step, error, extra = {}) => {
  console.error(`[SalarySlip] ${step} failed:`, {
    message: error?.message,
    name: error?.name,
    code: error?.code,
    stack: error?.stack,
    ...extra,
  });
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
  let payroll;

  console.log("[SalarySlip] Step 1: Finding payroll", {
    payrollId: String(payrollId),
  });

  try {
    if (!payrollId) {
      throw createError("A valid Payroll ID is required.");
    }

    payroll = await Payroll.findById(payrollId);
  } catch (error) {
    logSalarySlipError("Payroll lookup", error, {
      payrollId: String(payrollId),
    });
    throw error;
  }

  if (!payroll) {
    throw createError("Payroll record not found.", 404);
  }

  console.log("[SalarySlip] Step 2: Payroll found", {
    payrollId: String(payroll._id),
    status: payroll.status,
    employeeId: String(payroll.employee || ""),
    month: payroll.month,
    year: payroll.year,
  });

  if (!["processed", "paid"].includes(payroll.status)) {
    throw createError(
      "Only processed or paid payroll can generate a salary slip."
    );
  }

  let slip;

  try {
    console.log("[SalarySlip] Step 3: Looking for existing slip");

    slip = await SalarySlip.findOne({
      employee: payroll.employee,
      month: payroll.month,
      year: payroll.year,
    }).select("+pdfPath");
  } catch (error) {
    logSalarySlipError("Existing salary slip lookup", error, {
      payrollId: String(payroll._id),
    });
    throw error;
  }

  if (slip?.pdfPath && fs.existsSync(slip.pdfPath)) {
    console.log("[SalarySlip] Existing PDF found", {
      salarySlipId: String(slip._id),
    });

    return slip;
  }

  let employee;

  try {
    console.log("[SalarySlip] Step 4: Finding employee");

    employee = await Employee.findById(payroll.employee).select(
      "+pan +panNumber +bankDetails"
    );
  } catch (error) {
    logSalarySlipError("Employee lookup", error, {
      payrollId: String(payroll._id),
      employeeId: String(payroll.employee || ""),
    });
    throw error;
  }

  if (!employee) {
    throw createError("Employee record not found.", 404);
  }

  console.log("[SalarySlip] Step 5: Employee found", {
    employeeId: String(employee._id),
    hasEmail: Boolean(employee.email),
  });

  let company;

  try {
    console.log("[SalarySlip] Step 6: Loading company settings");

    company = await CompanySettings.findOne();

    console.log("[SalarySlip] Company settings loaded", {
      found: Boolean(company),
    });
  } catch (error) {
    logSalarySlipError("Company settings lookup", error, {
      payrollId: String(payroll._id),
    });
    throw error;
  }

  const slipNumber = makeSlipNumber(
    employee,
    payroll.month,
    payroll.year
  );

  if (!slip) {
    try {
      console.log("[SalarySlip] Step 7: Creating salary slip", {
        slipNumber,
      });

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
      logSalarySlipError("Salary slip creation", error, {
        payrollId: String(payroll._id),
        slipNumber,
      });

      if (error.code !== 11000) {
        throw error;
      }

      // A concurrent request may have created the same slip.
      try {
        slip = await SalarySlip.findOne({
          employee: employee._id,
          month: payroll.month,
          year: payroll.year,
        }).select("+pdfPath");
      } catch (lookupError) {
        logSalarySlipError(
          "Duplicate salary slip lookup",
          lookupError,
          { slipNumber }
        );
        throw lookupError;
      }

      if (!slip) {
        throw error;
      }

      if (slip.pdfPath && fs.existsSync(slip.pdfPath)) {
        console.log("[SalarySlip] Reusing concurrently generated PDF", {
          salarySlipId: String(slip._id),
        });

        return slip;
      }
    }
  }

  if (!slip) {
    throw createError(
      "Unable to create or retrieve the salary slip.",
      500
    );
  }

  try {
    console.log("[SalarySlip] Step 8: Generating PDF", {
      salarySlipId: String(slip._id),
      slipNumber: slip.slipNumber,
    });

    const pdf = await generateSalarySlipPdf({
      payroll,
      employee,
      company,
      slipNumber: slip.slipNumber || slipNumber,
    });

    if (!pdf?.pdfPath) {
      throw createError(
        "PDF service did not return a file path.",
        500
      );
    }

    console.log("[SalarySlip] Step 9: PDF generated", {
      salarySlipId: String(slip._id),
      pdfPath: pdf.pdfPath,
      fileExists: fs.existsSync(pdf.pdfPath),
    });

    if (!fs.existsSync(pdf.pdfPath)) {
      throw createError(
        "Generated PDF file does not exist on the server.",
        500
      );
    }

    slip.payroll = payroll._id;
    slip.pdfPath = pdf.pdfPath;
    slip.status = "generated";
    slip.generatedAt = new Date();

    if (generatedBy) {
      slip.generatedBy = generatedBy;
    }

    console.log("[SalarySlip] Step 10: Saving generated slip", {
      salarySlipId: String(slip._id),
    });

    await slip.save();

    console.log("[SalarySlip] Step 11: Salary slip saved", {
      salarySlipId: String(slip._id),
    });

    return slip;
  } catch (error) {
    logSalarySlipError("PDF generation or salary slip save", error, {
      payrollId: String(payroll._id),
      salarySlipId: String(slip._id),
    });

    // Preserve the original error if the failure-status save also fails.
    try {
      slip.status = "failed";
      await slip.save();
    } catch (saveError) {
      logSalarySlipError("Saving failed status", saveError, {
        salarySlipId: String(slip._id),
      });
    }

    throw error;
  }
};

// Email an existing salary slip without sending duplicate emails.
const emailSalarySlip = async (salarySlipId) => {
  let slip;

  try {
    slip = await SalarySlip.findById(salarySlipId).select("+pdfPath");
  } catch (error) {
    logSalarySlipError("Email slip lookup", error, { salarySlipId });
    throw error;
  }

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

  let employee;
  let company;

  try {
    employee = await Employee.findById(slip.employee);
    company = await CompanySettings.findOne();
  } catch (error) {
    logSalarySlipError("Email employee or company lookup", error, {
      salarySlipId: String(slip._id),
    });
    throw error;
  }

  if (!employee) {
    throw createError("Employee record not found.", 404);
  }

  if (!employee.email) {
    slip.emailStatus = "failed";
    slip.lastEmailError = "Employee email address is missing.";

    try {
      await slip.save();
    } catch (error) {
      logSalarySlipError("Saving missing-email status", error, {
        salarySlipId: String(slip._id),
      });
    }

    throw createError("Employee email address is missing.", 400);
  }

  try {
    console.log("[SalarySlip] Sending email", {
      salarySlipId: String(slip._id),
    });

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

    console.log("[SalarySlip] Email sent successfully", {
      salarySlipId: String(slip._id),
    });

    return {
      message: "Salary slip emailed successfully.",
      salarySlip: slip,
    };
  } catch (error) {
    logSalarySlipError("Sending salary slip email", error, {
      salarySlipId: String(slip._id),
    });

    slip.emailStatus = "failed";
    slip.status = "failed";
    slip.emailAttempts = (slip.emailAttempts || 0) + 1;
    slip.lastEmailError = error.message;

    try {
      await slip.save();
    } catch (saveError) {
      logSalarySlipError("Saving email failure status", saveError, {
        salarySlipId: String(slip._id),
      });
    }

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

// Retrieve salary slips using filters and pagination.
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
      logSalarySlipError("Monthly slip processing", error, {
        payrollId: String(payroll._id),
      });

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
