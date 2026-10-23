
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const uploadDirectory = path.resolve(
  __dirname,
  "../uploads/salary-slips"
);

const COMPANY_NAME = "ITtech Solution";

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numberValue(amount));
  } catch {
    return `INR ${numberValue(amount).toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const safeFilePart = (value) =>
  String(value || "employee").replace(/[^a-zA-Z0-9_-]/g, "_");

const getEmployeeName = (employee = {}) =>
  [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ") ||
  employee.fullName ||
  employee.name ||
  "Employee";

const getCompanyAddress = (company = {}) => {
  const address = company.address;

  if (typeof address === "string") {
    return address.trim();
  }

  if (address && typeof address === "object") {
    return [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "";
};

const amountInWords = (amount) => {
  const number = Math.max(0, Math.round(numberValue(amount)));
  if (number === 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const underThousand = (n) => {
    let result = "";

    if (n >= 100) {
      result += `${ones[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }

    if (n >= 20) {
      result += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    }

    if (n > 0) result += `${ones[n]} `;

    return result.trim();
  };

  const parts = [];
  const crore = Math.floor(number / 10000000);
  const lakh = Math.floor((number % 10000000) / 100000);
  const thousand = Math.floor((number % 100000) / 1000);
  const remainder = number % 1000;

  if (crore) parts.push(`${underThousand(crore)} Crore`);
  if (lakh) parts.push(`${underThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${underThousand(thousand)} Thousand`);
  if (remainder) parts.push(underThousand(remainder));

  return `${parts.join(" ")} Rupees Only`;
};

const generateSalarySlipPdf = async ({
  payroll,
  employee,
  company,
  slipNumber,
}) => {
  if (!payroll || !employee) {
    throw new Error(
      "Payroll and employee details are required to create a PDF."
    );
  }

  await fs.promises.mkdir(uploadDirectory, { recursive: true });

  const employeeCode = safeFilePart(employee.employeeCode || employee._id);
  const fileName = `${safeFilePart(slipNumber)}_${employeeCode}.pdf`;
  const pdfPath = path.join(uploadDirectory, fileName);

  const companyName = company?.companyName?.trim() || COMPANY_NAME;
  const currency = payroll.currency || company?.currency || "INR";
  const employeeName = getEmployeeName(employee);
  const bank = employee.bankDetails || {};
  const address = getCompanyAddress(company);
  const department =
    employee.department?.name ||
    employee.department?.departmentName ||
    "";

  const monthLabel = new Date(
    Number(payroll.year),
    Number(payroll.month) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const basicSalary = numberValue(payroll.basicSalary);
  const hra = numberValue(payroll.hra);
  const allowances = numberValue(payroll.allowances);
  const overtimePay = numberValue(payroll.overtimePay);
  const bonus = numberValue(payroll.bonus);

  const earnings = [
    ["Basic Salary", basicSalary],
    ["House Rent Allowance (HRA)", hra],
    ["Other Allowances", allowances],
    ["Overtime Pay", overtimePay],
    ["Bonus", bonus],
  ];

  const grossSalary = numberValue(
    payroll.grossSalary ??
      basicSalary + hra + allowances + overtimePay + bonus
  );

  // Do not create or calculate a PF deduction in this PDF.
  // Keep the saved payroll deduction total as the source of truth.
  const deductionItems = [
    ["Other Deductions", numberValue(payroll.deductions)],
    ["Tax Deduction", numberValue(payroll.taxDeduction)],
    ["Unpaid Leave Deduction", numberValue(payroll.unpaidLeaveDeduction)],
  ].filter(([, amount]) => amount !== 0);

  const totalDeductions = numberValue(
    payroll.totalDeductions ??
      deductionItems.reduce((sum, [, amount]) => sum + amount, 0)
  );

  const netSalary = numberValue(
    payroll.netSalary ?? Math.max(0, grossSalary - totalDeductions)
  );

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 38, bottom: 42, left: 42, right: 42 },
    bufferPages: true,
    info: {
      Title: `Salary Slip ${slipNumber}`,
      Author: companyName,
      Subject: `Salary slip for ${employeeName}, ${monthLabel}`,
    },
  });

  const output = fs.createWriteStream(pdfPath);

  const finished = new Promise((resolve, reject) => {
    output.on("finish", resolve);
    output.on("error", reject);
    doc.on("error", reject);
  });

  doc.pipe(output);

  const pageWidth = doc.page.width;
  const left = 42;
  const right = pageWidth - 42;
  const contentWidth = right - left;
  const amountX = left + contentWidth * 0.61;
  const amountWidth = contentWidth * 0.39;

  let y = 38;

  const line = (positionY, width = 1) => {
    doc
      .save()
      .lineWidth(width)
      .strokeColor("#d8e1ee")
      .moveTo(left, positionY)
      .lineTo(right, positionY)
      .stroke()
      .restore();
  };

  const sectionTitle = (title) => {
    doc
      .roundedRect(left, y, contentWidth, 23, 5)
      .fill("#eaf1fb");

    doc
      .fillColor("#17345c")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(title.toUpperCase(), left + 9, y + 7, {
        width: contentWidth - 18,
      });

    y += 32;
  };

  const detail = (label, value, x, width, top = y) => {
    doc
      .fillColor("#65748b")
      .font("Helvetica")
      .fontSize(8)
      .text(label.toUpperCase(), x, top, { width });

    doc
      .fillColor("#172b4d")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        value === undefined || value === null || value === ""
          ? "—"
          : String(value),
        x,
        top + 12,
        { width }
      );
  };

  const salaryRow = (label, amount, options = {}) => {
    const { bold = false, highlight = false } = options;
    const rowHeight = 22;

    if (highlight) {
      doc
        .rect(left, y - 4, contentWidth, rowHeight)
        .fill("#edf7f2");
    }

    doc
      .fillColor(bold ? "#17345c" : "#334155")
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 9 : 8.5)
      .text(label, left + 8, y + 2, {
        width: amountX - left - 16,
      });

    doc
      .fillColor(bold ? "#17345c" : "#334155")
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 9 : 8.5)
      .text(formatCurrency(amount, currency), amountX, y + 2, {
        width: amountWidth - 8,
        align: "right",
      });

    y += rowHeight;
  };

  // Company header
  doc
    .roundedRect(left, y, contentWidth, 74, 8)
    .fill("#142f55");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(companyName, left + 15, y + 12, {
      width: contentWidth - 30,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#e0eafa")
    .text(address || " ", left + 15, y + 38, {
      width: contentWidth - 30,
      align: "center",
    });

  const contact = [
    company?.email,
    company?.phone,
    company?.website,
  ]
    .filter(Boolean)
    .join("  |  ");

  if (contact) {
    doc
      .fontSize(8)
      .text(contact, left + 15, y + 52, {
        width: contentWidth - 30,
        align: "center",
      });
  }

  y += 88;

  doc
    .fillColor("#17345c")
    .font("Helvetica-Bold")
    .fontSize(15)
    .text("SALARY SLIP", left, y, {
      width: contentWidth,
      align: "center",
    });

  y += 22;

  doc
    .fillColor("#5c6b80")
    .font("Helvetica")
    .fontSize(9)
    .text(`Salary Period: ${monthLabel}`, left, y, {
      width: contentWidth / 2,
    });

  doc.text(`Slip Number: ${slipNumber}`, left + contentWidth / 2, y, {
    width: contentWidth / 2,
    align: "right",
  });

  y += 19;
  line(y);
  y += 12;

  // Employee details
  sectionTitle("Employee Details");

  const colGap = 14;
  const colWidth = (contentWidth - colGap * 2) / 3;
  const x1 = left;
  const x2 = left + colWidth + colGap;
  const x3 = left + (colWidth + colGap) * 2;

  detail("Employee Name", employeeName, x1, colWidth);
  detail("Employee ID", employee.employeeCode || employee._id, x2, colWidth);
  detail("Designation", employee.designation, x3, colWidth);

  y += 43;

  detail("Department", department, x1, colWidth);
  detail("Email", employee.email, x2, colWidth);
  detail("Joining Date", formatDate(employee.joiningDate), x3, colWidth);

  y += 43;

  detail("PAN", employee.pan || employee.panNumber, x1, colWidth);
  detail("UAN No.", "", x2, colWidth);
  detail("PF No.", "", x3, colWidth);

  y += 43;

  // Payroll and attendance
  sectionTitle("Payroll & Attendance Details");

  detail("Working Days", payroll.workingDays, x1, colWidth);
  detail("Days Present", payroll.daysPresent, x2, colWidth);
  detail("Days Absent", payroll.daysAbsent, x3, colWidth);

  y += 43;

  detail("Unpaid Leave Days", payroll.unpaidLeaveDays, x1, colWidth);
  detail("Payroll Status", payroll.status, x2, colWidth);
  detail("Payment Date", formatDate(payroll.paidAt || payroll.paymentDate), x3, colWidth);

  y += 43;

  // Bank details
  sectionTitle("Bank Details");

  detail("Account Holder", bank.accountHolderName || employeeName, x1, colWidth);
  detail("Bank Name", bank.bankName, x2, colWidth);

  const accountNumber = bank.accountNumber
    ? `XXXXXX${String(bank.accountNumber).slice(-4)}`
    : "";

  detail("Account Number", accountNumber, x3, colWidth);

  y += 43;

  detail("IFSC Code", bank.ifscCode, x1, colWidth);
  y += 43;

  // Earnings table
  sectionTitle("Earnings");

  doc
    .fillColor("#ffffff")
    .rect(left, y - 3, contentWidth, 21)
    .fill("#17345c");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("DESCRIPTION", left + 8, y + 3);

  doc.text("AMOUNT", amountX, y + 3, {
    width: amountWidth - 8,
    align: "right",
  });

  y += 22;

  earnings.forEach(([label, amount]) => {
    // Keep the PDF clean by showing only positive/non-zero earnings.
    if (amount !== 0) salaryRow(label, amount);
  });

  salaryRow("TOTAL EARNINGS (A)", grossSalary, {
    bold: true,
    highlight: true,
  });

  y += 10;

  // Deductions table
  sectionTitle("Deductions");

  doc
    .fillColor("#ffffff")
    .rect(left, y - 3, contentWidth, 21)
    .fill("#17345c");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("DESCRIPTION", left + 8, y + 3);

  doc.text("AMOUNT", amountX, y + 3, {
    width: amountWidth - 8,
    align: "right",
  });

  y += 22;

  if (deductionItems.length === 0) {
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8.5)
      .text("No deductions recorded", left + 8, y + 2);

    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8.5)
      .text(formatCurrency(0, currency), amountX, y + 2, {
        width: amountWidth - 8,
        align: "right",
      });

    y += 22;
  } else {
    deductionItems.forEach(([label, amount]) => {
      salaryRow(label, amount);
    });
  }

  salaryRow("TOTAL DEDUCTIONS (B)", totalDeductions, {
    bold: true,
    highlight: true,
  });

  y += 10;

  // Net salary summary
  doc
    .roundedRect(left, y, contentWidth, 48, 7)
    .fill("#142f55");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("NET PAYABLE (A - B)", left + 12, y + 9);

  doc
    .fontSize(15)
    .text(formatCurrency(netSalary, currency), left + 12, y + 23, {
      width: contentWidth - 24,
      align: "right",
    });

  y += 59;

  doc
    .fillColor("#334155")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("Amount in Words", left, y);

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .text(amountInWords(netSalary), left, y + 12, {
      width: contentWidth,
    });

  y += 37;

  line(y);
  y += 12;

  doc
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(8)
    .text(
      "This is a computer-generated salary slip. Please contact HR if any information needs correction.",
      left,
      y,
      { width: contentWidth, align: "center" }
    );

  y += 35;

  const signatureY = Math.min(
    Math.max(y, doc.y + 5),
    doc.page.height - 70
  );

  doc
    .strokeColor("#9aa9bd")
    .moveTo(left + 10, signatureY)
    .lineTo(left + 150, signatureY)
    .stroke();

  doc
    .moveTo(right - 150, signatureY)
    .lineTo(right - 10, signatureY)
    .stroke();

  doc
    .fillColor("#64748b")
    .font("Helvetica")
    .fontSize(8)
    .text("Employee Signature", left + 10, signatureY + 6, {
      width: 140,
      align: "center",
    });

  doc.text("Authorized Signatory", right - 150, signatureY + 6, {
    width: 140,
    align: "center",
  });

  doc.end();
  await finished;

  return {
    pdfPath,
    fileName,
  };
};

module.exports = {
  generateSalarySlipPdf,
};
