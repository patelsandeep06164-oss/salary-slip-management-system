
const employeeService = require("../services/employeeService");
const mongoose = require("mongoose");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Remove sensitive fields before sending employee data to the client.
const sanitizeEmployee = (employee) => {
  if (!employee) return employee;

  const data =
    typeof employee.toObject === "function"
      ? employee.toObject()
      : { ...employee };

  if (data.bankDetails) {
    delete data.bankDetails.accountNumber;
    delete data.bankDetails.ifscCode;
  }

  if (Array.isArray(data.documents)) {
    data.documents = data.documents.map((document) => {
      const item =
        typeof document.toObject === "function"
          ? document.toObject()
          : { ...document };

      delete item.filePath;
      return item;
    });
  }

  return data;
};

// Create employee
const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee: sanitizeEmployee(employee),
    });
  } catch (error) {
    next(error);
  }
};

// Get employees (Admin only - protected by route middleware)
const getEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      department: req.query.department,
    });

    res.status(200).json({
      success: true,
      ...result,
      employees: result.employees.map(sanitizeEmployee),
    });
  } catch (error) {
    next(error);
  }
};

// Get employee by ID
const getEmployeeById = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    if (!mongoose.isValidObjectId(employeeId)) {
      throw createError("Invalid employee ID.", 400);
    }

    let employee;

    if (req.user?.role === "employee") {
      const ownEmployeeId = req.user.employeeId?.toString();

      if (!ownEmployeeId) {
        throw createError(
          "Employee profile is not linked to this account.",
          403
        );
      }

      if (ownEmployeeId !== employeeId.toString()) {
        throw createError(
          "You cannot access another employee's profile.",
          403
        );
      }

      // Ownership is checked before fetching the employee record.
      employee = await employeeService.getEmployeeById(ownEmployeeId);
    } else if (req.user?.role === "admin") {
      employee = await employeeService.getEmployeeById(employeeId);
    } else {
      throw createError("Access denied.", 403);
    }

    res.status(200).json({
      success: true,
      employee: sanitizeEmployee(employee),
    });
  } catch (error) {
    next(error);
  }
};

// Update employee (Admin only - protected by route middleware)
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      employee: sanitizeEmployee(employee),
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate employee (Admin only - protected by route middleware)
const deactivateEmployee = async (req, res, next) => {
  try {
    const result = await employeeService.deactivateEmployee(
      req.params.id
    );

    res.status(200).json({
      success: true,
      ...result,
      employee: sanitizeEmployee(result.employee),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
};
