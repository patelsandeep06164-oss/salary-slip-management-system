
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Link only when an actual User ObjectId exists.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
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
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

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
      street: {
        type: String,
        trim: true,
        default: "",
      },
      city: {
        type: String,
        trim: true,
        default: "",
      },
      state: {
        type: String,
        trim: true,
        default: "",
      },
      postalCode: {
        type: String,
        trim: true,
        default: "",
      },
      country: {
        type: String,
        trim: true,
        default: "India",
      },
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
        trim: true,
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
        trim: true,
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
  {
    timestamps: true,
  }
);

// Employee listing filters.
employeeSchema.index({ department: 1, status: 1 });

// Only actual User ObjectIds must be unique.
employeeSchema.index(
  { user: 1 },
  {
    name: "user_1",
    unique: true,
    partialFilterExpression: {
      user: { $type: "objectId" },
    },
  }
);

// Virtual full name.
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

employeeSchema.set("toJSON", { virtuals: true });
employeeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Employee", employeeSchema);
