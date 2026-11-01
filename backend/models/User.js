
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
      required: true,
    },

    // Admin approval workflow.
    // New Admin registration must explicitly set "pending".
    // Existing Admin records without this field remain unchanged.
    adminApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: undefined,
    },

    adminApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminApprovedAt: {
      type: Date,
      default: null,
    },

    adminRejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminRejectedAt: {
      type: Date,
      default: null,
    },

    adminApprovalRequestedAt: {
      type: Date,
      default: null,
    },

    // Profile contact information.
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    // Compressed profile photo data URL.
    profilePhoto: {
      type: String,
      default: "",
      maxlength: 700000,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Efficient Admin approval queries.
userSchema.index({
  role: 1,
  adminApprovalStatus: 1,
  createdAt: -1,
});

module.exports = mongoose.model("User", userSchema);
