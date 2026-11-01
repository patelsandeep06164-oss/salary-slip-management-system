
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// Get the authenticated Admin ID.
const getAdminId = (req) => {
  const adminId = req.user?.id || req.user?._id;

  if (!adminId || !mongoose.isValidObjectId(adminId)) {
    return null;
  }

  return adminId;
};

// GET /api/notifications
// Return notifications belonging only to the logged-in Admin.
const getNotifications = async (req, res, next) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated Admin not found.",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 20
      )
    );

    const skip = (page - 1) * limit;

    const filter = {
      recipientAdmin: adminId,
    };

    const [
      notifications,
      total,
      unreadCount,
    ] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        ...filter,
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
// Mark only the authenticated Admin's notification as read.
const markAsRead = async (req, res, next) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated Admin not found.",
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipientAdmin: adminId,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
// Mark only the authenticated Admin's notifications as read.
const markAllAsRead = async (req, res, next) => {
  try {
    const adminId = getAdminId(req);

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated Admin not found.",
      });
    }

    const result = await Notification.updateMany(
      {
        recipientAdmin: adminId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All your notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
