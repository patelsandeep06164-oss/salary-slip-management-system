
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const puppeteer = require("puppeteer");

const salarySlipTemplate = require("../templates/salary-slip/salarySlipTemplate");

const toPlainObject = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return typeof value.toObject === "function"
    ? value.toObject()
    : value;
};

const toAmount = (value, fieldName) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    throw new TypeError(`Invalid salary amount: ${fieldName}`);
  }

  return amount;
};

const generateSalarySlipPdf = async ({
  payroll = {},
  employee = {},
  company = {},
  slipNumber = "SALARY-SLIP",
  salarySlip = {},
} = {}) => {
  const safePayroll = toPlainObject(payroll);
  const safeEmployee = toPlainObject(employee);
  const companyObject = toPlainObject(company);
  const safeSalarySlip = toPlainObject(salarySlip);

  // Safely convert company address.
  const rawAddress = companyObject.address;

  const companyAddress =
    typeof rawAddress === "string"
      ? rawAddress
      : rawAddress && typeof rawAddress === "object"
        ? [
            rawAddress.street,
            rawAddress.city,
            rawAddress.state,
            rawAddress.postalCode,
            rawAddress.country,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

  const safeCompany = {
    ...companyObject,
    companyName: companyObject.companyName || "Your Company",
    address: companyAddress,
    currency: companyObject.currency || "INR",
  };

  // Salary earnings.
  const basicSalary = toAmount(
    safePayroll.basicSalary ?? safeEmployee.basicSalary,
    "basicSalary"
  );

  const hra = toAmount(
    safePayroll.hra ?? safePayroll.houseRentAllowance,
    "hra"
  );

  const allowances = toAmount(
    safePayroll.allowances,
    "allowances"
  );

  const bonus = toAmount(
    safePayroll.bonus ?? safePayroll.bonuses,
    "bonus"
  );

  const overtime = toAmount(
    safePayroll.overtimePay ?? safePayroll.overtimeAmount,
    "overtimePay"
  );

  const grossSalary = toAmount(
    safePayroll.grossSalary ??
      basicSalary + hra + allowances + bonus + overtime,
    "grossSalary"
  );

  // Salary deductions.
  const taxDeduction = toAmount(
    safePayroll.taxDeduction ??
      safePayroll.tax ??
      safePayroll.incomeTax,
    "taxDeduction"
  );

  const unpaidLeaveDeduction = toAmount(
    safePayroll.unpaidLeaveDeduction,
    "unpaidLeaveDeduction"
  );

  const otherDeductions = toAmount(
    safePayroll.deductions ?? safePayroll.otherDeductions,
    "deductions"
  );

  const calculatedDeductions =
    taxDeduction +
    unpaidLeaveDeduction +
    otherDeductions;

  const totalDeductions = toAmount(
    safePayroll.totalDeductions ?? calculatedDeductions,
    "totalDeductions"
  );

  const netSalary = toAmount(
    safeSalarySlip.netSalary ??
      safePayroll.netSalary ??
      grossSalary - totalDeductions,
    "netSalary"
  );

  // Prevent invalid PDF filenames and filename collisions.
  const safeSlipNumber = String(slipNumber)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100) || "SALARY-SLIP";

  const uniqueFileName =
    `${safeSlipNumber}-${crypto.randomUUID()}.pdf`;

  const outputDir = path.resolve(
    __dirname,
    "../uploads/salary-slips"
  );

  await fs.promises.mkdir(outputDir, {
    recursive: true,
  });

  const pdfPath = path.join(outputDir, uniqueFileName);

  const templateSalarySlip = {
    ...safeSalarySlip,
    slipNumber,
    month: safeSalarySlip.month ?? safePayroll.month,
    year: safeSalarySlip.year ?? safePayroll.year,
    netSalary,
    issueDate:
      safeSalarySlip.issueDate ||
      safeSalarySlip.generatedAt ||
      new Date(),
  };

  // Pass fields matching the Salary Slip template.
  const templatePayroll = {
    ...safePayroll,
    basicSalary,
    hra,
    allowances,
    bonus,
    overtimePay: overtime,
    overtimeAmount: overtime,
    grossSalary,
    taxDeduction,
    unpaidLeaveDeduction,
    deductions: otherDeductions,
    otherDeductions,
    totalDeductions,
    netSalary,
  };

  const html = salarySlipTemplate({
    company: safeCompany,
    employee: safeEmployee,
    payroll: templatePayroll,
    salarySlip: templateSalarySlip,
  });

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    const fileStats = await fs.promises.stat(pdfPath);

    if (!fileStats.isFile() || fileStats.size === 0) {
      throw new Error("Generated PDF is empty or invalid.");
    }

    return { pdfPath };
  } catch (error) {
    // Delete only this newly created PDF.
    // Never delete an older salary slip.
    try {
      await fs.promises.unlink(pdfPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error(
          "[PDF Service] Temporary PDF cleanup failed:",
          cleanupError.message
        );
      }
    }

    console.error(
      "[PDF Service] PDF generation failed:",
      error
    );

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generateSalarySlipPdf,
};
