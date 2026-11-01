const leaveService = require("../services/leaveService");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const applyLeave = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Employee can apply only for their own leave.
    if (req.user?.role === "employee") {
      if (!req.user.employeeId) {
        throw createError("Employee account is not linked.", 403);
      }

      data.employee = req.user.employeeId;
    }

    const leave = await leaveService.applyLeave(data);

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully.",
      leave,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaves = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.user?.role === "employee") {
      if (!req.user.employeeId) {
        throw createError("Employee account is not linked.", 403);
      }

      // Never accept another employee's ID from query parameters.
      filters.employee = req.user.employeeId;
    } else if (req.user?.role === "admin") {
      filters.employee = req.query.employee;
    } else {
      throw createError("Access denied.", 403);
    }

    const result = await leaveService.getLeaves(filters);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const reviewLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.reviewLeave({
      leaveId: req.params.id,
      status: req.body.status,
      reviewedBy: req.user?.id || req.user?._id,
      reviewRemarks: req.body.reviewRemarks || "",
    });

    res.status(200).json({
      success: true,
      message: `Leave ${leave.status} successfully.`,
      leave,
    });
  } catch (error) {
    next(error);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && req.user?.role !== "employee") {
      throw createError("Access denied.", 403);
    }

    const employeeId = isAdmin
      ? undefined
      : req.user.employeeId;

    if (!isAdmin && !employeeId) {
      throw createError("Employee account is not linked.", 403);
    }

    const leave = await leaveService.cancelLeave(
      req.params.id,
      employeeId,
      isAdmin
    );

    res.status(200).json({
      success: true,
      message: "Leave cancelled successfully.",
      leave,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  reviewLeave,
  cancelLeave,
};