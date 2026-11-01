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

  // Convert nested CompanySettings address into readable text.
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
    currency: companyObject.currency || safePayroll.currency || "INR",
  };

  // Read the original JPEG logo. No conversion or modification.
  const logoPath = path.resolve(
    __dirname,
    "../assets/itteck-solution-logo.jpeg"
  );

  let logoDataUrl = "";

  try {
    const logoBase64 = await fs.promises.readFile(logoPath, "base64");
    logoDataUrl = `data:image/jpeg;base64,${logoBase64}`;
  } catch (error) {
    throw new Error(
      `Company logo could not be loaded from ${logoPath}: ${error.message}`
    );
  }

  // Payroll earnings: use stored payroll values only.
  const basicSalary = toAmount(
    safePayroll.basicSalary,
    "basicSalary"
  );

  const hra = toAmount(safePayroll.hra, "hra");
  const allowances = toAmount(safePayroll.allowances, "allowances");
  const bonus = toAmount(safePayroll.bonus, "bonus");
  const overtime = toAmount(safePayroll.overtimePay, "overtimePay");

  const grossSalary = toAmount(
    safePayroll.grossSalary,
    "grossSalary"
  );

  // Payroll deductions.
  const taxDeduction = toAmount(
    safePayroll.taxDeduction,
    "taxDeduction"
  );

  const unpaidLeaveDeduction = toAmount(
    safePayroll.unpaidLeaveDeduction,
    "unpaidLeaveDeduction"
  );

  const otherDeductions = toAmount(
    safePayroll.deductions,
    "deductions"
  );

  const totalDeductions = toAmount(
    safePayroll.totalDeductions,
    "totalDeductions"
  );

  const netSalary = toAmount(
    safePayroll.netSalary,
    "netSalary"
  );

  // Prevent invalid PDF filenames and filename collisions.
  const safeSlipNumber =
    String(slipNumber)
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
      safeSalarySlip.createdAt ||
      new Date(),
  };

  const templatePayroll = {
    ...safePayroll,
    basicSalary,
    hra,
    allowances,
    bonus,
    overtimePay: overtime,
    grossSalary,
    taxDeduction,
    unpaidLeaveDeduction,
    deductions: otherDeductions,
    totalDeductions,
    netSalary,
  };

  const html = salarySlipTemplate({
    company: safeCompany,
    employee: safeEmployee,
    payroll: templatePayroll,
    salarySlip: templateSalarySlip,
    logoDataUrl,
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
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "7mm",
        right: "8mm",
        bottom: "7mm",
        left: "8mm",
      },
    });

    const fileStats = await fs.promises.stat(pdfPath);

    if (!fileStats.isFile() || fileStats.size === 0) {
      throw new Error("Generated PDF is empty or invalid.");
    }

    return { pdfPath };
  } catch (error) {
    // Delete only the newly generated PDF.
    // Existing salary slips and payroll records remain untouched.
    try {
      await fs.promises.unlink(pdfPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error(
          "[PDF Service] PDF cleanup failed:",
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