
const Employee = require("../models/Employee");
const User = require("../models/User");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create employee
const createEmployee = async (data) => {
  if (
    !data.employeeCode ||
    !data.firstName ||
    !data.lastName ||
    !data.email ||
    !data.joiningDate
  ) {
    throw createError(
      "Employee code, first name, last name, email and joining date are required."
    );
  }

  const email = data.email.trim().toLowerCase();

  const duplicate = await Employee.findOne({
    $or: [
      { employeeCode: data.employeeCode.trim() },
      { email },
    ],
  });

  if (duplicate) {
    throw createError("Employee code or email already exists.", 409);
  }

  const employee = await Employee.create({
    ...data,
    employeeCode: data.employeeCode.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    pan: data.pan ? data.pan.trim().toUpperCase() : "",
  });

  return employee;
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

  if (status) filter.status = status;
  if (department) filter.department = department;

  if (search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");

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
const updateEmployee = async (id, data) => {
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
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      if (field === "pan") {
        employee.pan = data.pan
          ? String(data.pan).trim().toUpperCase()
          : "";
      } else {
        employee[field] = data[field];
      }
    }
  }

  await employee.save();

  if (employee.user) {
    await User.findByIdAndUpdate(employee.user, {
      isActive: employee.status === "active",
    });
  }

  return employee;
};

// Deactivate employee
const deactivateEmployee = async (id) => {
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
