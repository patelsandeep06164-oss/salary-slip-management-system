
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Admin who should receive this notification.
    // Optional for backward compatibility with existing notification creators.
    recipientAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["success", "warning", "error", "info"],
      default: "info",
      required: true,
    },

    category: {
      type: String,
      enum: [
        "payroll",
        "salary-slip",
        "email",
        "system",
        "admin-approval",
      ],
      required: true,
    },

    // Additional information related to the notification.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Keep deduplication keys unique.
    // For recipient-specific notifications, include recipientAdmin ID
    // in the key when creating the notification.
    dedupeKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Notification listing and unread-count indexes.
notificationSchema.index({
  recipientAdmin: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipientAdmin: 1,
  isRead: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
