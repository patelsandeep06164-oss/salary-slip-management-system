
const fs = require("fs");
const salarySlipService = require("../services/salarySlipService");

// Generate salary slip
const generateSalarySlip = async (req, res, next) => {
  try {
    const { payrollId } = req.body || {};

    if (!payrollId || typeof payrollId !== "string" && typeof payrollId !== "object") {
      return res.status(400).json({
        success: false,
        message: "A valid Payroll ID is required.",
      });
    }

    const slip = await salarySlipService.generateSalarySlip(
      payrollId,
      req.user?.id || req.user?._id
    );

    return res.status(201).json({
      success: true,
      message: "Salary slip generated successfully.",
      salarySlip: slip,
    });
  } catch (error) {
  console.error("[Generate Salary Slip Error]", {
    message: error.message,
    name: error.name,
    code: error.code,
    stack: error.stack,
    payrollId: req.body?.payrollId,
  });

  return next(error);
}
};

// Email an existing salary slip
const emailSalarySlip = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Salary slip ID is required.",
      });
    }

    const result = await salarySlipService.emailSalarySlip(id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Email Salary Slip Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      salarySlipId: req.params?.id,
    });

    return next(error);
  }
};

// Generate and email monthly salary slips
const generateAndEmailMonthlySalarySlips = async (req, res, next) => {
  try {
    const { month, year } = req.body || {};

    const parsedMonth = Number(month);
    const parsedYear = Number(year);

    if (
      month === undefined ||
      year === undefined ||
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      !Number.isInteger(parsedYear) ||
      parsedYear < 2000 ||
      parsedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid month (1-12) and year are required.",
      });
    }

    const result =
      await salarySlipService.generateAndEmailMonthlySalarySlips(
        parsedMonth,
        parsedYear
      );

    return res.status(200).json({
      success: true,
      message: "Monthly salary slip processing completed.",
      result,
    });
  } catch (error) {
    console.error("[Monthly Salary Slip Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
    });

    return next(error);
  }
};

// Get salary slips
const getSalarySlips = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view salary slips.",
      });
    }

    const filters = {
      month: req.query.month,
      year: req.query.year,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.user.role === "employee") {
      if (!req.user.employeeId) {
        return res.status(403).json({
          success: false,
          message: "Employee account is not linked to an employee record.",
        });
      }

      filters.employee = req.user.employeeId;
    } else {
      filters.employee = req.query.employee;
    }

    const result = await salarySlipService.getSalarySlips(filters);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Get Salary Slips Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
    });

    return next(error);
  }
};

// Get a salary slip by ID
const getSalarySlipById = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view salary slips.",
      });
    }

    const slip = await salarySlipService.getSalarySlipById(req.params.id);

    if (req.user.role === "employee") {
      const slipEmployeeId =
        slip.employee?._id?.toString() ||
        slip.employee?.toString();

      if (
        !req.user.employeeId ||
        slipEmployeeId !== req.user.employeeId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot access another employee's salary slip.",
        });
      }
    }

    const safeSlip = slip.toObject();
    const pdfAvailable = Boolean(
      slip.pdfPath && fs.existsSync(slip.pdfPath)
    );

    delete safeSlip.pdfPath;

    return res.status(200).json({
      success: true,
      salarySlip: {
        ...safeSlip,
        pdfAvailable,
      },
    });
  } catch (error) {
    console.error("[Get Salary Slip By ID Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      salarySlipId: req.params?.id,
    });

    return next(error);
  }
};

// Download salary slip PDF
const downloadSalarySlipPdf = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download salary slips.",
      });
    }

    const slip = await salarySlipService.getSalarySlipById(req.params.id);

    if (req.user.role === "employee") {
      const slipEmployeeId =
        slip.employee?._id?.toString() ||
        slip.employee?.toString();

      if (
        !req.user.employeeId ||
        slipEmployeeId !== req.user.employeeId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot download another employee's salary slip.",
        });
      }
    }

    if (!slip.pdfPath || !fs.existsSync(slip.pdfPath)) {
      return res.status(404).json({
        success: false,
        message: "Salary slip PDF not found.",
      });
    }

    return res.download(
      slip.pdfPath,
      `${slip.slipNumber}.pdf`,
      (error) => {
        if (error && !res.headersSent) {
          console.error("[Download Salary Slip PDF Error]", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
          });

          next(error);
        }
      }
    );
  } catch (error) {
    console.error("[Download Salary Slip Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      salarySlipId: req.params?.id,
    });

    return next(error);
  }
};

module.exports = {
  generateSalarySlip,
  emailSalarySlip,
  generateAndEmailMonthlySalarySlips,
  getSalarySlips,
  getSalarySlipById,
  downloadSalarySlipPdf,
};
