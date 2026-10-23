
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
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
      ],
      required: true,
    },

    // Optional details for the related payroll/email event.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Reuse the same key when updating an existing alert.
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

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
