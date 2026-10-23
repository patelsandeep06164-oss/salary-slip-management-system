
const mongoose = require("mongoose");

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      default: "Your Company",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    logoPath: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      uppercase: true,
      default: "INR",
    },
    financialYearStartMonth: {
      type: Number,
      min: 1,
      max: 12,
      default: 4,
    },
    payrollDay: {
      type: Number,
      min: 1,
      max: 28,
      default: 28,
    },
    standardWorkingDaysPerMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: 26,
    },
    defaultAnnualLeaveDays: {
      type: Number,
      min: 0,
      default: 12,
    },
    emailSalarySlipsAutomatically: {
      type: Boolean,
      default: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanySettings", companySettingsSchema);
