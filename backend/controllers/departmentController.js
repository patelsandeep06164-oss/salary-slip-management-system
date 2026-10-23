const Department = require("../models/Department");

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, manager } = req.body;

    if (!name || !code) {
      const error = new Error("Department name and code are required.");
      error.statusCode = 400;
      throw error;
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description,
      manager: manager || undefined,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = "Department name or code already exists.";
    }
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const departments = await Department.find(filter)
      .populate("manager", "firstName lastName employeeCode")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("manager", "firstName lastName employeeCode");

    if (!department) {
      const error = new Error("Department not found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, department });
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const allowedFields = ["name", "code", "description", "manager", "isActive"];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name) updates.name = updates.name.trim();
    if (updates.code) updates.code = updates.code.trim().toUpperCase();

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("manager", "firstName lastName employeeCode");

    if (!department) {
      const error = new Error("Department not found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = "Department name or code already exists.";
    }
    next(error);
  }
};

const deactivateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      const error = new Error("Department not found.");
      error.statusCode = 404;
      throw error;
    }

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