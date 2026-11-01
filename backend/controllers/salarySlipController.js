
const fs = require("fs");
const mongoose = require("mongoose");
const salarySlipService = require("../services/salarySlipService");

const isAdmin = (req) => req.user?.role === "admin";

const isAuthorizedViewer = (req) =>
  ["admin", "employee"].includes(req.user?.role);

const isValidId = (id) =>
  typeof id === "string" && mongoose.isValidObjectId(id);

const getSlipEmployeeId = (slip) => {
  const employee = slip?.employee;

  if (!employee) return null;

  return String(employee._id || employee);
};

// Never expose internal server PDF paths through API responses.
const sanitizeSalarySlip = (slip) => {
  if (!slip) return slip;

  const safeSlip =
    typeof slip.toObject === "function"
      ? slip.toObject()
      : { ...slip };

  delete safeSlip.pdfPath;

  return safeSlip;
};

// Generate salary slip - Admin only.
const generateSalarySlip = async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can generate salary slips.",
      });
    }

    const { payrollId } = req.body || {};

    if (!isValidId(payrollId)) {
      return res.status(400).json({
        success: false,
        message: "A valid Payroll ID is required.",
      });
    }

    const slip = await salarySlipService.generateSalarySlip(
      payrollId,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "Salary slip generated successfully.",
      salarySlip: sanitizeSalarySlip(slip),
    });
  } catch (error) {
    console.error("[Generate Salary Slip Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      payrollId: req.body?.payrollId,
    });

    return next(error);
  }
};

// Email salary slip - Admin only.
const emailSalarySlip = async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can email salary slips.",
      });
    }

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid Salary Slip ID is required.",
      });
    }

    const result = await salarySlipService.emailSalarySlip(id);

    return res.status(200).json({
      success: true,
      ...result,
      salarySlip: sanitizeSalarySlip(result.salarySlip),
    });
  } catch (error) {
    console.error("[Email Salary Slip Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      salarySlipId: req.params?.id,
    });

    return next(error);
  }
};

// Monthly salary slip processing - Admin only.
const generateAndEmailMonthlySalarySlips = async (
  req,
  res,
  next
) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can process monthly salary slips.",
      });
    }

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
    });

    return next(error);
  }
};

// Get salary slips.
const getSalarySlips = async (req, res, next) => {
  try {
    if (!isAuthorizedViewer(req)) {
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

      // Employee cannot override their own employee ID.
      filters.employee = req.user.employeeId;
    } else if (req.query.employee) {
      if (!isValidId(req.query.employee)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Employee ID.",
        });
      }

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
    });

    return next(error);
  }
};

// Get salary slip by ID.
const getSalarySlipById = async (req, res, next) => {
  try {
    if (!isAuthorizedViewer(req)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view salary slips.",
      });
    }

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Salary Slip ID.",
      });
    }

    const slip = await salarySlipService.getSalarySlipById(id);

    if (req.user.role === "employee") {
      const slipEmployeeId = getSlipEmployeeId(slip);

      if (
        !req.user.employeeId ||
        slipEmployeeId !== String(req.user.employeeId)
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot access another employee's salary slip.",
        });
      }
    }

    const pdfAvailable = Boolean(
      slip.pdfPath && fs.existsSync(slip.pdfPath)
    );

    return res.status(200).json({
      success: true,
      salarySlip: {
        ...sanitizeSalarySlip(slip),
        pdfAvailable,
      },
    });
  } catch (error) {
    console.error("[Get Salary Slip By ID Error]", {
      message: error.message,
      name: error.name,
      code: error.code,
      salarySlipId: req.params?.id,
    });

    return next(error);
  }
};

// Download salary slip PDF.
const downloadSalarySlipPdf = async (req, res, next) => {
  try {
    if (!isAuthorizedViewer(req)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download salary slips.",
      });
    }

    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Salary Slip ID.",
      });
    }

    const slip = await salarySlipService.getSalarySlipById(id);

    if (req.user.role === "employee") {
      const slipEmployeeId = getSlipEmployeeId(slip);

      if (
        !req.user.employeeId ||
        slipEmployeeId !== String(req.user.employeeId)
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
