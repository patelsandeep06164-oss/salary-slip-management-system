
const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
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
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    basicSalary: { type: Number, required: true, min: 0 },
    hra: { type: Number, min: 0, default: 0 },
    allowances: { type: Number, min: 0, default: 0 },
    overtimePay: { type: Number, min: 0, default: 0 },
    bonus: { type: Number, min: 0, default: 0 },
    deductions: { type: Number, min: 0, default: 0 },
    taxDeduction: { type: Number, min: 0, default: 0 },
    unpaidLeaveDeduction: { type: Number, min: 0, default: 0 },
    grossSalary: { type: Number, required: true, min: 0 },
    totalDeductions: { type: Number, required: true, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    workingDays: { type: Number, min: 0, default: 0 },
    daysPresent: { type: Number, min: 0, default: 0 },
    daysAbsent: { type: Number, min: 0, default: 0 },
    unpaidLeaveDays: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "processed", "paid", "cancelled"],
      default: "draft",
    },
    processedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paymentReference: { type: String, trim: true, default: "" },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    remarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

payrollSchema.index(
  { employee: 1, year: 1, month: 1 },
  { unique: true }
);

payrollSchema.index({ year: 1, month: 1, status: 1 });

module.exports = mongoose.model("Payroll", payrollSchema);
