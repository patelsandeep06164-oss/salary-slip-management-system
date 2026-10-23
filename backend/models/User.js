
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
      enum: ["admin", "hr", "employee"],
      default: "employee",
      required: true,
    },

    // Profile contact information
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

    // Compressed profile photo data URL
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

module.exports = mongoose.model("User", userSchema);
