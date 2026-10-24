const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const User = require("../models/User");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmployeeCode = (value) =>
  String(value || "").trim().toUpperCase();

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError("Invalid employee ID.", 400);
  }
};

// Create employee
const createEmployee = async (data = {}) => {
  const employeeCode = normalizeEmployeeCode(data.employeeCode);
  const email = normalizeEmail(data.email);
  const firstName = String(data.firstName || "").trim();
  const lastName = String(data.lastName || "").trim();

  if (!employeeCode || !firstName || !lastName || !email || !data.joiningDate) {
    throw createError(
      "Employee code, first name, last name, email and joining date are required."
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError("Please provide a valid email address.");
  }

  const duplicate = await Employee.findOne({
    $or: [{ employeeCode }, { email }],
  }).lean();

  if (duplicate) {
    if (duplicate.employeeCode === employeeCode) {
      throw createError("Employee code already exists.", 409);
    }

    throw createError("Email already exists.", 409);
  }

  const employeeData = {
    ...data,
    employeeCode,
    firstName,
    lastName,
    email,
    pan: data.pan ? String(data.pan).trim().toUpperCase() : "",
  };

  if (data.department) {
    const departmentId =
      typeof data.department === "object"
        ? data.department._id || data.department.id
        : data.department;

    if (
      !departmentId ||
      !mongoose.Types.ObjectId.isValid(departmentId)
    ) {
      throw createError(
        "Please select a valid department from the department list."
      );
    }

    employeeData.department = departmentId;
  } else {
    employeeData.department = null;
  }

  try {
    return await Employee.create(employeeData);
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      if (duplicateField === "employeeCode") {
        throw createError("Employee code already exists.", 409);
      }

      if (duplicateField === "email") {
        throw createError("Email already exists.", 409);
      }

      throw createError("A duplicate employee record already exists.", 409);
    }

    throw error;
  }
};

// Get employees with pagination, search and filters
const getEmployees = async ({
  search = "",
  page = 1,
  limit = 10,
  status,
  department,
} = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 10));

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (department) {
    if (!mongoose.Types.ObjectId.isValid(department)) {
      throw createError("Invalid department ID.");
    }

    filter.department = department;
  }

  const searchText = String(search || "").trim();

  if (searchText) {
    const regex = new RegExp(escapeRegex(searchText), "i");

    filter.$or = [
      { employeeCode: regex },
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { designation: regex },
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .select(
        "employeeCode firstName lastName email phone pan department designation joiningDate employmentType status salary createdAt updatedAt"
      )
      .populate("department", "name code")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Employee.countDocuments(filter),
  ]);

  return {
    employees,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get one employee by ID
const getEmployeeById = async (id) => {
  validateObjectId(id);

  const employee = await Employee.findById(id)
    .select("+bankDetails.accountNumber +bankDetails.ifscCode")
    .populate("department", "name code")
    .populate("user", "name email role isActive");

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  return employee;
};

// Update employee
const updateEmployee = async (id, data = {}) => {
  validateObjectId(id);

  const employee = await Employee.findById(id).select(
    "+bankDetails.accountNumber +bankDetails.ifscCode"
  );

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "pan",
    "dateOfBirth",
    "gender",
    "address",
    "department",
    "designation",
    "joiningDate",
    "employmentType",
    "status",
    "salary",
    "bankDetails",
    "documents",
  ];

  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) {
      continue;
    }

    if (field === "pan") {
      employee.pan = data.pan
        ? String(data.pan).trim().toUpperCase()
        : "";
      continue;
    }

    if (field === "department") {
      if (!data.department) {
        employee.department = null;
        continue;
      }

      const departmentId =
        typeof data.department === "object"
          ? data.department._id || data.department.id
          : data.department;

      if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
        throw createError("Please select a valid department.");
      }

      employee.department = departmentId;
      continue;
    }

    if (field === "salary" && data.salary && typeof data.salary === "object") {
      const currentSalary = employee.salary?.toObject
        ? employee.salary.toObject()
        : employee.salary?.toObject?.() || employee.salary || {};

      employee.salary = {
        ...currentSalary,
        ...data.salary,
      };

      continue;
    }

    employee[field] = data[field];
  }

  try {
    await employee.save();
  } catch (error) {
    if (error.code === 11000) {
      throw createError(
        "Employee code, email or linked user already exists.",
        409
      );
    }

    throw error;
  }

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, {
      isActive: employee.status === "active",
    });
  }

  return employee;
};

// Deactivate employee
const deactivateEmployee = async (id) => {
  validateObjectId(id);

  const employee = await Employee.findById(id);

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  employee.status = "inactive";
  await employee.save();

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, {
      isActive: false,
    });
  }

  return {
    message: "Employee deactivated successfully.",
    employee,
  };
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
};
