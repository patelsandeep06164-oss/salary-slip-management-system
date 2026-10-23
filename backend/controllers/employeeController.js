const employeeService = require("../services/employeeService");

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee,
    });
  } catch (error) {
    next(error);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      department: req.query.department,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);

    // Employees must not view another employee's private profile.
    if (req.user?.role === "employee") {
      const ownEmployeeId = req.user.employeeId?.toString();
      if (!ownEmployeeId || ownEmployeeId !== employee._id.toString()) {
        const error = new Error("You cannot access another employee's profile.");
        error.statusCode = 403;
        throw error;
      }
    }

    res.status(200).json({ success: true, employee });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      employee,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateEmployee = async (req, res, next) => {
  try {
    const result = await employeeService.deactivateEmployee(req.params.id);

    res.status(200).json({ success: true, ...result });
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