
const mongoose = require("mongoose");
const Department = require("../models/Department");
const Employee = require("../models/Employee");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateDepartmentId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid department ID.", 400);
  }
};

const normalizeManagerId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "object") {
    value = value._id || value.id;
  }

  if (!value || !mongoose.isValidObjectId(value)) {
    throw createError("Please select a valid manager.", 400);
  }

  return value;
};

const validateManager = async (managerId) => {
  if (!managerId) return null;

  const manager = await Employee.findOne({
    _id: managerId,
    status: "active",
  })
    .select("_id")
    .lean();

  if (!manager) {
    throw createError(
      "Manager must be an active employee.",
      400
    );
  }

  return manager._id;
};

const ensureNoActiveEmployees = async (departmentId) => {
  const activeEmployees = await Employee.countDocuments({
    department: departmentId,
    status: "active",
  });

  if (activeEmployees > 0) {
    throw createError(
      "Cannot deactivate department while active employees are assigned to it.",
      409
    );
  }
};

const handleDepartmentError = (error) => {
  if (error.code === 11000) {
    return createError(
      "Department name or code already exists.",
      409
    );
  }

  return error;
};

// Create Department
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, manager } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof code !== "string" ||
      !code.trim()
    ) {
      throw createError(
        "Department name and code are required."
      );
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      throw createError(
        "Department description must be a string."
      );
    }

    const managerId = normalizeManagerId(manager);
    const validManager = await validateManager(managerId);

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || "",
      manager: validManager,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    next(handleDepartmentError(error));
  }
};

// Get Departments
const getDepartments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        throw createError(
          "isActive must be true or false."
        );
      }

      filter.isActive = req.query.isActive === "true";
    }

    const departments = await Department.find(filter)
      .populate("manager", "firstName lastName employeeCode")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
};

// Get Department By ID
const getDepartmentById = async (req, res, next) => {
  try {
    validateDepartmentId(req.params.id);

    const department = await Department.findById(req.params.id)
      .populate("manager", "firstName lastName employeeCode");

    if (!department) {
      throw createError("Department not found.", 404);
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    next(error);
  }
};

// Update Department
const updateDepartment = async (req, res, next) => {
  try {
    validateDepartmentId(req.params.id);

    const allowedFields = [
      "name",
      "code",
      "description",
      "manager",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw createError(
        "No valid department fields were provided."
      );
    }

    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      if (
        typeof updates.name !== "string" ||
        !updates.name.trim()
      ) {
        throw createError("Department name cannot be empty.");
      }

      updates.name = updates.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(updates, "code")) {
      if (
        typeof updates.code !== "string" ||
        !updates.code.trim()
      ) {
        throw createError("Department code cannot be empty.");
      }

      updates.code = updates.code.trim().toUpperCase();
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "description") &&
      typeof updates.description !== "string"
    ) {
      throw createError(
        "Department description must be a string."
      );
    }

    if (Object.prototype.hasOwnProperty.call(updates, "manager")) {
      const managerId = normalizeManagerId(updates.manager);
      updates.manager = await validateManager(managerId);
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "isActive") &&
      typeof updates.isActive !== "boolean"
    ) {
      throw createError("isActive must be a Boolean value.");
    }

    const department = await Department.findById(req.params.id);

    if (!department) {
      throw createError("Department not found.", 404);
    }

    if (
      updates.isActive === false &&
      department.isActive === true
    ) {
      await ensureNoActiveEmployees(department._id);
    }

    Object.assign(department, updates);

    await department.save();

    await department.populate(
      "manager",
      "firstName lastName employeeCode"
    );

    res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    next(handleDepartmentError(error));
  }
};

// Deactivate Department
const deactivateDepartment = async (req, res, next) => {
  try {
    validateDepartmentId(req.params.id);

    const department = await Department.findById(req.params.id);

    if (!department) {
      throw createError("Department not found.", 404);
    }

    if (department.isActive) {
      await ensureNoActiveEmployees(department._id);
    }

    department.isActive = false;

    await department.save();

    res.status(200).json({
      success: true,
      message: "Department deactivated successfully.",
      department,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deactivateDepartment,
};
