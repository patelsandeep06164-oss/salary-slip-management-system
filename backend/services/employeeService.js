const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Department = require("../models/Department");

const ALLOWED_EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "on-leave",
  "terminated",
];

const LOGIN_ALLOWED_STATUSES = ["active", "on-leave"];

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const hasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeEmployeeCode = (value) =>
  String(value ?? "").trim().toUpperCase();

const normalizeEmail = (value) =>
  String(value ?? "").trim().toLowerCase();

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid employee ID.");
  }
};

const validateStatus = (status) => {
  if (!ALLOWED_EMPLOYEE_STATUSES.includes(status)) {
    throw createError("Invalid employee status.");
  }

  return status;
};

const isLoginAllowed = (status) =>
  LOGIN_ALLOWED_STATUSES.includes(status);

const validateDepartment = async (value) => {
  if (value === null || value === "") {
    return null;
  }

  const id =
    value && typeof value === "object"
      ? value._id || value.id
      : value;

  if (!id || !mongoose.isValidObjectId(id)) {
    throw createError(
      "Please select a valid department from the department list."
    );
  }

  const department = await Department.findOne({
    _id: id,
    isActive: true,
  }).select("_id");

  if (!department) {
    throw createError(
      "Selected department does not exist or is inactive."
    );
  }

  return department._id;
};

const handleDuplicateError = (error) => {
  if (!error || error.code !== 11000) {
    throw error;
  }

  const field = Object.keys(error.keyPattern || {})[0];

  if (field === "employeeCode") {
    throw createError("Employee code already exists.", 409);
  }

  if (field === "email") {
    throw createError("Email already exists.", 409);
  }

  throw createError(
    "A duplicate employee record already exists.",
    409
  );
};

const validateName = (value, label) => {
  if (typeof value !== "string" || !value.trim()) {
    throw createError(`${label} is required.`);
  }

  return value.trim();
};

const validateOptionalLastName = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw createError("Last name must be valid text.");
  }

  return value.trim();
};

const validateJoiningDate = (value) => {
  if (
    !value ||
    Number.isNaN(new Date(value).getTime())
  ) {
    throw createError("Please provide a valid joining date.");
  }

  return value;
};

// --------------------------------------------------
// CREATE EMPLOYEE
// --------------------------------------------------

const createEmployee = async (data = {}) => {
  const employeeCode = normalizeEmployeeCode(data.employeeCode);
  const email = normalizeEmail(data.email);

  const firstName = validateName(data.firstName, "First name");
  const lastName = validateOptionalLastName(data.lastName);
  const designation = validateName(
    data.designation,
    "Designation"
  );

  if (!employeeCode || !email) {
    throw createError(
      "Employee code and email are required."
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError("Please provide a valid email address.");
  }

  validateJoiningDate(data.joiningDate);

  const status =
    data.status === undefined
      ? "active"
      : validateStatus(data.status);

  const duplicate = await Employee.findOne({
    $or: [{ employeeCode }, { email }],
  }).lean();

  if (duplicate) {
    throw createError(
      duplicate.employeeCode === employeeCode
        ? "Employee code already exists."
        : "Email already exists.",
      409
    );
  }

  const departmentId = await validateDepartment(
    data.department ?? null
  );

  // Explicit allowlist: never accept a User link from request data.
  const employeeData = {
    employeeCode,
    email,
    firstName,
    lastName,
    phone: data.phone,
    pan: data.pan
      ? String(data.pan).trim().toUpperCase()
      : "",
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    address: data.address,
    department: departmentId,
    designation,
    joiningDate: data.joiningDate,
    employmentType: data.employmentType,
    status,
    salary: data.salary,
    bankDetails: data.bankDetails,
    documents: data.documents,
  };

  // Remove undefined fields so schema defaults can apply.
  Object.keys(employeeData).forEach((key) => {
    if (employeeData[key] === undefined) {
      delete employeeData[key];
    }
  });

  try {
    return await Employee.create(employeeData);
  } catch (error) {
    handleDuplicateError(error);
  }
};

// --------------------------------------------------
// GET EMPLOYEES
// --------------------------------------------------

const getEmployees = async ({
  search = "",
  page = 1,
  limit = 10,
  status,
  department,
} = {}) => {
  page = Math.max(1, Math.floor(Number(page) || 1));

  limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(limit) || 10))
  );

  const filter = {};

  if (status) {
    validateStatus(status);
    filter.status = status;
  }

  if (department) {
    if (!mongoose.isValidObjectId(department)) {
      throw createError("Invalid department ID.");
    }

    filter.department = department;
  }

  const searchText = String(search ?? "").trim();

  if (searchText) {
    const regex = new RegExp(
      escapeRegex(searchText),
      "i"
    );

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

// --------------------------------------------------
// GET EMPLOYEE BY ID
// --------------------------------------------------

const getEmployeeById = async (id) => {
  validateObjectId(id);

  const employee = await Employee.findById(id)
    .select(
      "+bankDetails.accountNumber +bankDetails.ifscCode"
    )
    .populate("department", "name code")
    .populate("user", "name email role isActive");

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  return employee;
};

// --------------------------------------------------
// UPDATE EMPLOYEE
// --------------------------------------------------

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

  const updates = allowedFields.filter((field) =>
    hasOwn(data, field)
  );

  if (updates.length === 0) {
    throw createError("No valid fields provided for update.");
  }

  for (const field of updates) {
    const value = data[field];

    if (field === "firstName") {
      employee.firstName = validateName(
        value,
        "First name"
      );
      continue;
    }

    if (field === "lastName") {
      employee.lastName = validateOptionalLastName(value);
      continue;
    }

    if (field === "designation") {
      employee.designation = validateName(
        value,
        "Designation"
      );
      continue;
    }

    if (field === "pan") {
      employee.pan = value
        ? String(value).trim().toUpperCase()
        : "";
      continue;
    }

    if (field === "department") {
      employee.department = await validateDepartment(value);
      continue;
    }

    if (field === "joiningDate") {
      employee.joiningDate = validateJoiningDate(value);
      continue;
    }

    if (field === "salary") {
      if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        throw createError("Invalid salary data.");
      }

      const currentSalary =
        employee.salary?.toObject?.() ||
        employee.salary ||
        {};

      employee.salary = {
        ...currentSalary,
        ...value,
      };

      continue;
    }

    if (field === "status") {
      employee.status = validateStatus(value);
      continue;
    }

    employee[field] = value;
  }

  const statusChanged = employee.isModified("status");

  try {
    if (statusChanged && employee.user) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          await employee.save({ session });

          const result = await User.updateOne(
            { _id: employee.user },
            {
              $set: {
                isActive: isLoginAllowed(employee.status),
              },
            },
            { session }
          );

          if (result.matchedCount !== 1) {
            throw createError(
              "Linked user account not found.",
              409
            );
          }
        });
      } finally {
        await session.endSession();
      }
    } else {
      await employee.save();
    }
  } catch (error) {
    handleDuplicateError(error);
  }

  return employee;
};

// --------------------------------------------------
// DEACTIVATE EMPLOYEE
// --------------------------------------------------

const deactivateEmployee = async (id) => {
  validateObjectId(id);

  const employee = await Employee.findById(id);

  if (!employee) {
    throw createError("Employee not found.", 404);
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      employee.status = "inactive";

      await employee.save({ session });

      if (employee.user) {
        const result = await User.updateOne(
          { _id: employee.user },
          {
            $set: {
              isActive: false,
            },
          },
          { session }
        );

        if (result.matchedCount !== 1) {
          throw createError(
            "Linked user account not found.",
            409
          );
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return {
    message: "Employee deactivated successfully.",
    employee,
  };
};

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deactivateEmployee,
};