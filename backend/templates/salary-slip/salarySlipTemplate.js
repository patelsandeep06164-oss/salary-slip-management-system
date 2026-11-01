const formatCurrency = require("../../utils/formatCurrency");
const formatDate = require("../../utils/formatDate");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeCurrency = (value, currency) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    throw new TypeError("Salary amounts must be valid numbers.");
  }

  return formatCurrency(amount, currency);
};

// Indian number system: Rupees in words.
const numberToWords = (number) => {
  const value = Math.floor(Math.abs(Number(number)));

  if (!Number.isFinite(value)) {
    return "";
  }

  if (value === 0) {
    return "Zero";
  }

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

  const twoDigits = (num) => {
    if (num < 20) return ones[num];

    return `${tens[Math.floor(num / 10)]}${
      num % 10 ? ` ${ones[num % 10]}` : ""
    }`;
  };

  const threeDigits = (num) => {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;

    return [
      hundred ? `${ones[hundred]} Hundred` : "",
      remainder ? twoDigits(remainder) : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  let remaining = value;
  const parts = [];

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (remaining) parts.push(threeDigits(remaining));

  return parts.join(" ");
};

const amountInWords = (amount, currency) => {
  const absoluteAmount = Math.abs(Number(amount));
  const whole = Math.floor(absoluteAmount);
  const paise = Math.round((absoluteAmount - whole) * 100);

  const currencyName =
    currency === "INR" ? "Rupees" : currency;

  let result = `${numberToWords(whole)} ${currencyName}`;

  if (paise > 0) {
    result += ` and ${numberToWords(paise)} Paise`;
  }

  result += " Only";

  return Number(amount) < 0 ? `Minus ${result}` : result;
};

const salarySlipTemplate = (data = {}) => {
  const {
    company: companyData,
    employee: employeeData,
    payroll: payrollData,
    salarySlip: salarySlipData,
    logoDataUrl = "",
  } = data || {};

  const company = companyData || {};
  const employee = employeeData || {};
  const payroll = payrollData || {};
  const salarySlip = salarySlipData || {};

  const currency = company.currency || payroll.currency || "INR";

  const companyName = escapeHtml(
    company.companyName || "Your Company"
  );

  const companyAddress = escapeHtml(company.address || "");
  const companyEmail = escapeHtml(company.email || "");
  const companyPhone = escapeHtml(company.phone || "");
  const companyWebsite = escapeHtml(company.website || "");

  const validLogo =
    typeof logoDataUrl === "string" &&
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(logoDataUrl)
      ? logoDataUrl
      : "";

  const fullName =
    employee.fullName ||
    employee.name ||
    [employee.firstName, employee.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Employee";

  const employeeName = escapeHtml(fullName);

  const employeeId = escapeHtml(
    employee.employeeCode || employee.employeeId || "N/A"
  );

  const departmentValue =
    employee.departmentName ||
    employee.department?.name ||
    "";

  const department = escapeHtml(departmentValue || "N/A");

  const designation = escapeHtml(
    employee.designation || employee.position || "N/A"
  );

  const employeeEmail = escapeHtml(employee.email || "N/A");
  const employeePhone = escapeHtml(employee.phone || "N/A");
  const employeePan = escapeHtml(employee.pan || "");

  const month = salarySlip.month ?? payroll.month;
  const year = salarySlip.year ?? payroll.year;

  const salaryPeriod =
    month != null && year != null
      ? new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
          "en-IN",
          {
            month: "long",
            year: "numeric",
          }
        )
      : "Not specified";

  const issueDate =
    salarySlip.issueDate ||
    salarySlip.generatedAt ||
    salarySlip.createdAt ||
    new Date();

  const formattedIssueDate = escapeHtml(formatDate(issueDate));

  // Use stored payroll amounts. No payroll calculation is performed here.
  const basicSalary = Number(payroll.basicSalary ?? 0);
  const hra = Number(payroll.hra ?? 0);
  const allowances = Number(payroll.allowances ?? 0);
  const bonus = Number(payroll.bonus ?? 0);
  const overtime = Number(payroll.overtimePay ?? 0);

  const grossSalary = Number(payroll.grossSalary ?? 0);

  const tax = Number(payroll.taxDeduction ?? 0);
  const unpaidLeaveDeduction = Number(
    payroll.unpaidLeaveDeduction ?? 0
  );
  const otherDeductions = Number(payroll.deductions ?? 0);

  const totalDeductions = Number(
    payroll.totalDeductions ?? 0
  );

  const netSalary = Number(
    salarySlip.netSalary ?? payroll.netSalary ?? 0
  );

  const amounts = [
    basicSalary,
    hra,
    allowances,
    bonus,
    overtime,
    grossSalary,
    tax,
    unpaidLeaveDeduction,
    otherDeductions,
    totalDeductions,
    netSalary,
  ];

  if (!amounts.every(Number.isFinite)) {
    throw new TypeError(
      "Salary slip contains an invalid salary amount."
    );
  }

  const earningsRows = [
    ["Basic Salary", basicSalary],
    ["House Rent Allowance", hra],
    ["Other Allowances", allowances],
    ["Bonus", bonus],
    ["Overtime Pay", overtime],
  ];

  const deductionRows = [
    ["Tax Deduction", tax],
    ["Unpaid Leave Deduction", unpaidLeaveDeduction],
    ["Other Deductions", otherDeductions],
  ];

  const renderRows = (rows) =>
    rows
      .map(
        ([label, amount]) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td class="amount">${safeCurrency(amount, currency)}</td>
          </tr>
        `
      )
      .join("");

  const attendanceItems = [
    ["Working Days", payroll.workingDays],
    ["Days Present", payroll.daysPresent],
    ["Days Absent", payroll.daysAbsent],
    ["Unpaid Leave Days", payroll.unpaidLeaveDays],
  ].filter(([, value]) => value !== undefined && value !== null);

  const renderDetails = (items) =>
    items
      .map(
        ([label, value]) => `
          <div class="detail-item">
            <div class="detail-label">${escapeHtml(label)}</div>
            <div class="detail-value">${escapeHtml(value || "N/A")}</div>
          </div>
        `
      )
      .join("");

  const payrollStatus = escapeHtml(payroll.status || "N/A");
  const paymentReference = escapeHtml(
    payroll.paymentReference || ""
  );

  const paidDate = payroll.paidAt
    ? escapeHtml(formatDate(payroll.paidAt))
    : "";

  const attendanceHtml = attendanceItems.length
    ? `
      <section class="section">
        <h3 class="section-title">Attendance Details</h3>
        <div class="details attendance-grid">
          ${renderDetails(attendanceItems)}
        </div>
      </section>
    `
    : "";

  const payrollExtraItems = [
    ["Payroll Status", payrollStatus],
    ...(paymentReference
      ? [["Payment Reference", paymentReference]]
      : []),
    ...(paidDate ? [["Payment Date", paidDate]] : []),
  ];

  const payrollExtraHtml = payrollExtraItems.length
    ? `
      <div class="payroll-extra">
        ${renderDetails(payrollExtraItems)}
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Salary Slip - ${employeeName}</title>

  <style>
    @page {
      size: A4 landscape;
      margin: 7mm;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #253247;
      background: #ffffff;
      font-size: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .salary-slip {
      width: 100%;
      background: #ffffff;
      border: 1px solid #d6e0eb;
      overflow: hidden;
    }

    .company-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 22px;
      padding: 14px 20px;
      border-bottom: 2px solid #1d4e89;
    }

    .logo-area {
      width: 42%;
      display: flex;
      align-items: center;
      min-height: 65px;
    }

    .company-logo {
      display: block;
      max-width: 210px;
      max-height: 68px;
      width: auto;
      height: auto;
      object-fit: contain;
    }

    .company-details {
      width: 58%;
      text-align: right;
      line-height: 1.6;
      overflow-wrap: anywhere;
    }

    .company-details h1 {
      margin: 0 0 4px;
      color: #173d70;
      font-size: 19px;
      font-weight: 700;
    }

    .company-details p {
      margin: 1px 0;
      color: #53647a;
      font-size: 9px;
    }

    .payslip-title {
      padding: 9px 15px;
      text-align: center;
      color: #ffffff;
      background: #1d4e89;
    }

    .payslip-title h2 {
      margin: 0;
      font-size: 15px;
      letter-spacing: 1.2px;
    }

    .period {
      margin-top: 4px;
      font-size: 10px;
    }

    .content {
      padding: 12px 17px 14px;
    }

    .section {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .section-title {
      margin: 0 0 7px;
      padding: 5px 8px;
      color: #173d70;
      background: #eaf1f9;
      border-left: 3px solid #1d4e89;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .details {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px 14px;
      padding: 9px 10px;
      border: 1px solid #dce5ef;
      background: #fbfdff;
    }

    .detail-label {
      margin-bottom: 3px;
      color: #66758a;
      font-size: 8px;
    }

    .detail-value {
      color: #253247;
      font-size: 9px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .payroll-extra {
      margin-top: 7px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .payroll-extra .detail-item {
      padding: 6px 8px;
      border: 1px solid #dce5ef;
      background: #fbfdff;
    }

    .attendance-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .salary-tables {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      page-break-inside: avoid;
    }

    .table-heading {
      margin: 0;
      padding: 7px 9px;
      color: #ffffff;
      background: #1d4e89;
      font-size: 10px;
      text-transform: uppercase;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 6px 8px;
      border: 1px solid #dce5ef;
      font-size: 9px;
      text-align: left;
    }

    th {
      color: #34445a;
      background: #f1f5fa;
      font-size: 8px;
      text-transform: uppercase;
    }

    .amount {
      text-align: right;
      white-space: nowrap;
    }

    .total td {
      font-weight: 700;
      color: #173d70;
      background: #eaf1f9;
    }

    .net-pay {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
      margin-top: 10px;
      padding: 10px 13px;
      color: #ffffff;
      background: #173d70;
      page-break-inside: avoid;
    }

    .net-label {
      font-size: 12px;
      font-weight: 700;
    }

    .net-value {
      font-size: 18px;
      font-weight: 700;
      text-align: right;
    }

    .amount-words {
      margin-top: 8px;
      padding: 8px 10px;
      border: 1px solid #dce5ef;
      background: #fbfdff;
      line-height: 1.5;
    }

    .amount-words strong {
      color: #173d70;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      margin-top: 12px;
      padding: 10px 5px 2px;
      border-top: 1px solid #dce5ef;
      color: #64748b;
      font-size: 8px;
      page-break-inside: avoid;
    }

    .notes {
      max-width: 65%;
      line-height: 1.6;
    }

    .signature {
      min-width: 160px;
      text-align: center;
      color: #34445a;
    }

    .signature-line {
      height: 25px;
      margin-bottom: 5px;
      border-bottom: 1px solid #64748b;
    }

    .signature-label {
      font-weight: 700;
    }

    @media print {
      html, body {
        background: #ffffff;
      }

      .salary-slip {
        border: 1px solid #d6e0eb;
      }
    }
  </style>
</head>

<body>
  <main class="salary-slip">

    <header class="company-header">
      <div class="logo-area">
        ${
          validLogo
            ? `<img class="company-logo" src="${validLogo}" alt="ITteck Solution Logo" />`
            : ""
        }
      </div>

      <div class="company-details">
        <h1>${companyName}</h1>
        ${companyAddress ? `<p>${companyAddress}</p>` : ""}
        ${companyEmail ? `<p>${companyEmail}</p>` : ""}
        ${companyPhone ? `<p>${companyPhone}</p>` : ""}
        ${companyWebsite ? `<p>${companyWebsite}</p>` : ""}
      </div>
    </header>

    <section class="payslip-title">
      <h2>PAYSLIP FOR THE MONTH</h2>
      <div class="period">${escapeHtml(salaryPeriod)}</div>
    </section>

    <div class="content">

      <section class="section">
        <h3 class="section-title">Employee Details</h3>

        <div class="details">
          ${renderDetails([
            ["Employee Name", employeeName],
            ["Employee Code", employeeId],
            ["Department", department],
            ["Designation", designation],
            ["Email", employeeEmail],
            ["Phone", employeePhone],
            ...(employeePan ? [["PAN", employeePan]] : []),
            ["Issue Date", formattedIssueDate],
          ])}
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Payroll Details</h3>

        <div class="details">
          ${renderDetails([
            ["Salary Month", salaryPeriod],
            ["Currency", currency],
            ["Slip Number", salarySlip.slipNumber || "N/A"],
          ])}
        </div>

        ${payrollExtraHtml}
      </section>

      ${attendanceHtml}

      <section class="section">
        <div class="salary-tables">

          <div>
            <h3 class="table-heading">Earnings</h3>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>

              <tbody>
                ${renderRows(earningsRows)}

                <tr class="total">
                  <td>Gross Salary</td>
                  <td class="amount">${safeCurrency(grossSalary, currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 class="table-heading">Deductions</h3>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>

              <tbody>
                ${renderRows(deductionRows)}

                <tr class="total">
                  <td>Total Deductions</td>
                  <td class="amount">${safeCurrency(totalDeductions, currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      <section class="net-pay">
        <div class="net-label">NET PAY</div>
        <div class="net-value">${safeCurrency(netSalary, currency)}</div>
      </section>

      <div class="amount-words">
        <strong>Amount in Words:</strong>
        ${escapeHtml(amountInWords(netSalary, currency))}
      </div>

      <footer class="footer">
        <div class="notes">
          <strong>Notes:</strong><br />
          This is a computer-generated salary slip. Please contact the
          Admin if you notice any discrepancy.
        </div>

        <div class="signature">
          <div class="signature-line"></div>
          <div class="signature-label">Authorized Signatory</div>
          <div>${companyName}</div>
        </div>
      </footer>

    </div>
  </main>
</body>
</html>`;
};

module.exports = salarySlipTemplate;