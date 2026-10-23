
const mongoose = require("mongoose");

const salarySlipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    payroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 9999,
    },
    slipNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pdfPath: {
      type: String,
      default: null,
      select: false,
    },
    status: {
      type: String,
      enum: ["pending", "generated", "emailed", "failed"],
      default: "pending",
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "not-configured"],
      default: "pending",
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailAttempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastEmailError: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

salarySlipSchema.index(
  { employee: 1, year: 1, month: 1 },
  { unique: true }
);

salarySlipSchema.index({ status: 1, emailStatus: 1 });

module.exports = mongoose.model("SalarySlip", salarySlipSchema);
