
const fs = require("fs");
const salarySlipService = require("../services/salarySlipService");

const generateSalarySlip = async (req, res, next) => {
  try {
    const slip = await salarySlipService.generateSalarySlip(
      req.body.payrollId,
      req.user?.id || req.user?._id
    );

    res.status(201).json({
      success: true,
      message: "Salary slip generated successfully.",
      salarySlip: slip,
    });
  } catch (error) {
    next(error);
  }
};

const emailSalarySlip = async (req, res, next) => {
  try {
    const result = await salarySlipService.emailSalarySlip(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const generateAndEmailMonthlySalarySlips = async (req, res, next) => {
  try {
    const result =
      await salarySlipService.generateAndEmailMonthlySalarySlips(
        req.body.month,
        req.body.year
      );

    res.status(200).json({
      success: true,
      message: "Monthly salary slip processing completed.",
      result,
    });
  } catch (error) {
    next(error);
  }
};

const getSalarySlips = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      const error = new Error(
        "You are not authorized to view salary slips."
      );
      error.statusCode = 403;
      throw error;
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
        const error = new Error(
          "Employee account is not linked to an employee record."
        );
        error.statusCode = 403;
        throw error;
      }

      filters.employee = req.user.employeeId;
    } else {
      filters.employee = req.query.employee;
    }

    const result = await salarySlipService.getSalarySlips(filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getSalarySlipById = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      const error = new Error(
        "You are not authorized to view salary slips."
      );
      error.statusCode = 403;
      throw error;
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
        const error = new Error(
          "You cannot access another employee's salary slip."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    const safeSlip = slip.toObject();
    const pdfAvailable = Boolean(
      slip.pdfPath && fs.existsSync(slip.pdfPath)
    );

    delete safeSlip.pdfPath;

    res.status(200).json({
      success: true,
      salarySlip: {
        ...safeSlip,
        pdfAvailable,
      },
    });
  } catch (error) {
    next(error);
  }
};

const downloadSalarySlipPdf = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      const error = new Error(
        "You are not authorized to download salary slips."
      );
      error.statusCode = 403;
      throw error;
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
        const error = new Error(
          "You cannot download another employee's salary slip."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    if (!slip.pdfPath || !fs.existsSync(slip.pdfPath)) {
      const error = new Error("Salary slip PDF not found.");
      error.statusCode = 404;
      throw error;
    }

    res.download(slip.pdfPath, `${slip.slipNumber}.pdf`, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
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
