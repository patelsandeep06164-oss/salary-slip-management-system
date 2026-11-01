
const User = require("../models/User");
const Notification = require("../models/Notification");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// List pending Admin registrations.
const getPendingAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({
      role: "admin",
      adminApprovalStatus: "pending",
      isActive: false,
    })
      .select(
        "_id name email adminApprovalStatus adminApprovalRequestedAt createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    next(error);
  }
};

// Update all notifications related to this Admin registration.
const updateAdminApprovalNotifications = async (
  admin,
  status,
  actorId
) => {
  const approved = status === "approved";

  const title = approved
    ? "Admin Registration Approved"
    : "Admin Registration Rejected";

  const message = approved
    ? `${admin.name} (${admin.email})'s Admin registration has been approved.`
    : `${admin.name} (${admin.email})'s Admin registration has been rejected.`;

  await Notification.updateMany(
    {
      category: "admin-approval",
      "metadata.adminId": admin._id,
    },
    {
      $set: {
        title,
        message,
        type: approved ? "success" : "error",
        "metadata.status": status,
        "metadata.processedBy": actorId,
        "metadata.processedAt": new Date(),
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

// Approve a pending Admin.
const approveAdmin = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const approverId = req.user.id || req.user._id;

    if (!adminId) {
      throw createError("Admin ID is required.");
    }

    if (String(adminId) === String(approverId)) {
      throw createError(
        "You cannot approve your own registration.",
        403
      );
    }

    const admin = await User.findOneAndUpdate(
      {
        _id: adminId,
        role: "admin",
        adminApprovalStatus: "pending",
        isActive: false,
      },
      {
        $set: {
          adminApprovalStatus: "approved",
          adminApprovedBy: approverId,
          adminApprovedAt: new Date(),
          isActive: true,
        },
        $unset: {
          adminRejectedBy: "",
          adminRejectedAt: "",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "_id name email role isActive adminApprovalStatus adminApprovedBy adminApprovedAt"
    );

    if (!admin) {
      throw createError(
        "This Admin registration has already been processed or was not found.",
        409
      );
    }

    await updateAdminApprovalNotifications(
      admin,
      "approved",
      approverId
    );

    res.status(200).json({
      success: true,
      message: "Admin registration approved successfully.",
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// Reject a pending Admin.
const rejectAdmin = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const rejecterId = req.user.id || req.user._id;

    if (!adminId) {
      throw createError("Admin ID is required.");
    }

    if (String(adminId) === String(rejecterId)) {
      throw createError(
        "You cannot reject your own registration.",
        403
      );
    }

    const admin = await User.findOneAndUpdate(
      {
        _id: adminId,
        role: "admin",
        adminApprovalStatus: "pending",
        isActive: false,
      },
      {
        $set: {
          adminApprovalStatus: "rejected",
          adminRejectedBy: rejecterId,
          adminRejectedAt: new Date(),
          isActive: false,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "_id name email role isActive adminApprovalStatus adminRejectedBy adminRejectedAt"
    );

    if (!admin) {
      throw createError(
        "This Admin registration has already been processed or was not found.",
        409
      );
    }

    await updateAdminApprovalNotifications(
      admin,
      "rejected",
      rejecterId
    );

    res.status(200).json({
      success: true,
      message: "Admin registration rejected successfully.",
      admin,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingAdmins,
  approveAdmin,
  rejectAdmin,
};
