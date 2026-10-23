
const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    salarySlip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalarySlip",
      default: null,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    emailType: {
      type: String,
      enum: ["salary-slip", "welcome", "password-reset", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
    },
    attempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ status: 1, nextRetryAt: 1 });
emailLogSchema.index({ salarySlip: 1, createdAt: -1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
