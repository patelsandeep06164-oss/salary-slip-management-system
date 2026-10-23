
const payrollService = require("../services/payrollService");

const generatePayroll = async (req, res, next) => {
  try {
    const payroll = await payrollService.generatePayroll({
      employeeId: req.body.employeeId,
      month: req.body.month,
      year: req.body.year,
      generatedBy: req.user?.id || req.user?._id,
      basicSalary: req.body.basicSalary,
      hra: req.body.hra,
      allowances: req.body.allowances,
      bonus: req.body.bonus,
      deductions: req.body.deductions,
      workingDays: req.body.workingDays,
      paidDays: req.body.paidDays,
      remarks: req.body.notes || req.body.remarks,
    });

    res.status(201).json({
      success: true,
      message: "Payroll generated successfully.",
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

const getPayrollRecords = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      const error = new Error(
        "You are not authorized to view payroll records."
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

    if (req.user?.role === "employee") {
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

    const result = await payrollService.getPayrollRecords(filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getPayrollById = async (req, res, next) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user?.role)) {
      const error = new Error(
        "You are not authorized to view payroll records."
      );
      error.statusCode = 403;
      throw error;
    }

    const payroll = await payrollService.getPayrollById(req.params.id);

    if (req.user?.role === "employee") {
      const payrollEmployeeId =
        payroll.employee?._id?.toString() ||
        payroll.employee?.toString();

      if (
        !req.user.employeeId ||
        payrollEmployeeId !== req.user.employeeId.toString()
      ) {
        const error = new Error(
          "You cannot access another employee's payroll."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    res.status(200).json({
      success: true,
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

const updatePayrollStatus = async (req, res, next) => {
  try {
    const payroll = await payrollService.updatePayrollStatus({
      payrollId: req.params.id,
      status: req.body.status,
      paymentReference: req.body.paymentReference,
      remarks: req.body.remarks,
    });

    res.status(200).json({
      success: true,
      message: "Payroll status updated successfully.",
      payroll,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePayroll,
  getPayrollRecords,
  getPayrollById,
  updatePayrollStatus,
};
