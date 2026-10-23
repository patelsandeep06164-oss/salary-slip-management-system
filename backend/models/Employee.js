
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      default: null,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // Employee PAN Details
    pan: {
      type: String,
      uppercase: true,
      trim: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
    },

    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "on-leave", "terminated"],
      default: "active",
    },

    salary: {
      currency: {
        type: String,
        default: "INR",
        uppercase: true,
      },
      basic: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      hra: {
        type: Number,
        min: 0,
        default: 0,
      },
      allowances: {
        type: Number,
        min: 0,
        default: 0,
      },
      deductions: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    bankDetails: {
      accountHolderName: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String,
        select: false,
        default: "",
      },
      ifscCode: {
        type: String,
        select: false,
        default: "",
      },
      bankName: {
        type: String,
        default: "",
      },
    },

    documents: [
      {
        documentType: {
          type: String,
          trim: true,
        },
        fileName: {
          type: String,
          trim: true,
        },
        filePath: {
          type: String,
          select: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ department: 1, status: 1 });

employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

employeeSchema.set("toJSON", { virtuals: true });
employeeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Employee", employeeSchema);
