const leaveService = require("../services/leaveService");

const applyLeave = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Employee must only be able to apply for their own leave.
    if (req.user?.role === "employee") {
      if (!req.user.employeeId) {
        const error = new Error("Employee account is not linked.");
        error.statusCode = 403;
        throw error;
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

    filters.employee =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.query.employee;

    const result = await leaveService.getLeaves(filters);

    res.status(200).json({ success: true, ...result });
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
    const employeeId =
      req.user?.role === "employee"
        ? req.user.employeeId
        : req.body.employeeId;

    const leave = await leaveService.cancelLeave(
      req.params.id,
      employeeId
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