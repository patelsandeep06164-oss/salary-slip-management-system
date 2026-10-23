const CompanySettings = require("../models/CompanySettings");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getSettings = async () => {
  let settings = await CompanySettings.findOne();

  if (!settings) {
    settings = await CompanySettings.create({
      companyName: "Your Company",
      currency: "INR",
      timezone: "Asia/Kolkata",
      payrollDay: 30,
      standardWorkingDaysPerMonth: 26,
      defaultAnnualLeaveDays: 12,

      // Enable automatic salary slip emails by default
      // for newly created company settings.
      emailSalarySlipsAutomatically: true,
    });
  }

  return settings;
};

const updateSettings = async (data, updatedBy) => {
  const allowedFields = [
    "companyName",
    "email",
    "phone",
    "website",
    "address",
    "logoPath",
    "currency",
    "financialYearStartMonth",
    "payrollDay",
    "standardWorkingDaysPerMonth",
    "defaultAnnualLeaveDays",
    "emailSalarySlipsAutomatically",
    "timezone",
  ];

  const updates = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updates[field] = data[field];
    }
  }

  if (
    updates.emailSalarySlipsAutomatically !== undefined &&
    typeof updates.emailSalarySlipsAutomatically !== "boolean"
  ) {
    throw createError(
      "Automatic salary slip email setting must be true or false."
    );
  }

  if (
    updates.financialYearStartMonth !== undefined &&
    (
      !Number.isInteger(Number(updates.financialYearStartMonth)) ||
      Number(updates.financialYearStartMonth) < 1 ||
      Number(updates.financialYearStartMonth) > 12
    )
  ) {
    throw createError(
      "Financial year start month must be between 1 and 12."
    );
  }

  if (
    updates.payrollDay !== undefined &&
    (
      !Number.isInteger(Number(updates.payrollDay)) ||
      Number(updates.payrollDay) < 1 ||
      Number(updates.payrollDay) > 31
    )
  ) {
    throw createError(
      "Payroll day must be between 1 and 31."
    );
  }

  if (
    updates.standardWorkingDaysPerMonth !== undefined &&
    (
      !Number.isFinite(Number(updates.standardWorkingDaysPerMonth)) ||
      Number(updates.standardWorkingDaysPerMonth) < 1 ||
      Number(updates.standardWorkingDaysPerMonth) > 31
    )
  ) {
    throw createError(
      "Working days per month must be between 1 and 31."
    );
  }

  if (updatedBy) {
    updates.updatedBy = updatedBy;
  }

  let settings = await CompanySettings.findOne();

  if (!settings) {
    settings = await CompanySettings.create({
      ...updates,
      companyName: updates.companyName || "Your Company",
      currency: updates.currency || "INR",
      timezone: updates.timezone || "Asia/Kolkata",

      // Respect an explicitly supplied setting.
      emailSalarySlipsAutomatically:
        updates.emailSalarySlipsAutomatically ?? true,
    });
  } else {
    // Update only fields supplied by the caller.
    // All other company settings remain unchanged.
    Object.assign(settings, updates);
    await settings.save();
  }

  return settings;
};

module.exports = {
  getSettings,
  updateSettings,
};
