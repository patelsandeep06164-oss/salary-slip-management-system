const formatCurrency = require("../utils/formatCurrency");
const formatDate = require("../utils/formatDate");

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

const salarySlipTemplate = (data = {}) => {
  const {
    company = {},
    employee = {},
    payroll = {},
    salarySlip = {},
  } = data;

  const currency = company.currency || "INR";
  const companyName = escapeHtml(company.companyName || "Your Company");
  const companyAddress = escapeHtml(company.address || "");
  const companyEmail = escapeHtml(company.email || "");
  const companyPhone = escapeHtml(company.phone || "");

  const employeeName = escapeHtml(employee.name || employee.fullName || "Employee");
  const employeeId = escapeHtml(employee.employeeId || employee._id || "N/A");
  const department = escapeHtml(employee.departmentName || employee.department?.name || "N/A");
  const designation = escapeHtml(employee.designation || employee.position || "N/A");
  const employeeEmail = escapeHtml(employee.email || "N/A");

  const month = salarySlip.month ?? payroll.month;
  const year = salarySlip.year ?? payroll.year;

  const salaryPeriod =
    month && year
      ? new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })
      : "Not specified";

  const issueDate = salarySlip.issueDate || salarySlip.createdAt || new Date();
  const formattedIssueDate = formatDate(issueDate);

  const basicSalary = Number(payroll.basicSalary ?? employee.basicSalary ?? 0);
  const hra = Number(payroll.hra ?? payroll.houseRentAllowance ?? 0);
  const allowances = Number(payroll.allowances ?? 0);
  const bonus = Number(payroll.bonus ?? payroll.bonuses ?? 0);
  const overtime = Number(payroll.overtimeAmount ?? 0);

  const grossSalary = Number(
    payroll.grossSalary ??
      basicSalary + hra + allowances + bonus + overtime
  );

  const pf = Number(payroll.pf ?? payroll.providentFund ?? 0);
  const tax = Number(payroll.tax ?? payroll.incomeTax ?? 0);
  const otherDeductions = Number(payroll.otherDeductions ?? payroll.deductions ?? 0);

  const totalDeductions = Number(
    payroll.totalDeductions ?? pf + tax + otherDeductions
  );

  const netSalary = Number(
    salarySlip.netSalary ??
      payroll.netSalary ??
      grossSalary - totalDeductions
  );

  const amountRows = [
    ["Basic Salary", basicSalary],
    ["House Rent Allowance", hra],
    ["Other Allowances", allowances],
    ["Bonus", bonus],
    ["Overtime", overtime],
  ];

  const deductionRows = [
    ["Provident Fund", pf],
    ["Income Tax", tax],
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Salary Slip - ${employeeName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: Arial, Helvetica, sans-serif;
      color: #243247;
      background: #eef4f8;
      font-size: 12px;
    }
    .salary-slip {
      max-width: 850px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #dce5ec;
    }
    .header {
      padding: 28px 30px;
      color: #fff;
      background: #087f8c;
    }
    .header h1 { margin: 0 0 8px; font-size: 25px; }
    .header p { margin: 4px 0; line-height: 1.6; }
    .title {
      padding: 22px 30px;
      border-bottom: 1px solid #dce5ec;
    }
    .title h2 { margin: 0 0 8px; font-size: 20px; }
    .title p { margin: 0; color: #64748b; }
    .content { padding: 24px 30px 30px; }
    .section-title {
      margin: 22px 0 10px;
      font-size: 13px;
      color: #087f8c;
      text-transform: uppercase;
      letter-spacing: .5px;
    }
    .details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      padding: 16px;
      background: #f6fafc;
      border: 1px solid #e1eaf0;
    }
    .detail-label { color: #64748b; font-size: 10px; margin-bottom: 5px; }
    .detail-value { font-weight: bold; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 11px 12px; border: 1px solid #e1eaf0; text-align: left; }
    th { background: #f1f6f8; font-size: 11px; }
    .amount { text-align: right; white-space: nowrap; }
    .total td { font-weight: bold; background: #f1fbfc; }
    .net {
      margin-top: 22px;
      padding: 18px;
      background: #e8f8f8;
      border: 1px solid #b9e5e7;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .net-label { font-size: 13px; font-weight: bold; }
    .net-value { color: #087f8c; font-size: 23px; font-weight: bold; text-align: right; }
    .words { margin-top: 14px; color: #536477; line-height: 1.7; }
    .footer {
      padding: 18px 30px;
      border-top: 1px solid #dce5ec;
      color: #64748b;
      font-size: 10px;
      line-height: 1.7;
      text-align: center;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .salary-slip { max-width: none; border: none; }
    }
    @media (max-width: 520px) {
      body { padding: 8px; }
      .header, .title, .content, .footer { padding-left: 16px; padding-right: 16px; }
      .details { grid-template-columns: 1fr; }
      th, td { padding: 8px 6px; font-size: 10px; }
      .net-value { font-size: 18px; }
    }
  </style>
</head>
<body>
  <main class="salary-slip">
    <header class="header">
      <h1>${companyName}</h1>
      ${companyAddress ? `<p>${companyAddress}</p>` : ""}
      ${companyEmail ? `<p>${companyEmail}</p>` : ""}
      ${companyPhone ? `<p>${companyPhone}</p>` : ""}
    </header>

    <section class="title">
      <h2>Salary Slip</h2>
      <p>Salary Period: <strong>${escapeHtml(salaryPeriod)}</strong></p>
    </section>

    <section class="content">
      <h3 class="section-title">Employee Information</h3>
      <div class="details">
        <div>
          <div class="detail-label">Employee Name</div>
          <div class="detail-value">${employeeName}</div>
        </div>
        <div>
          <div class="detail-label">Employee ID</div>
          <div class="detail-value">${employeeId}</div>
        </div>
        <div>
          <div class="detail-label">Department</div>
          <div class="detail-value">${department}</div>
        </div>
        <div>
          <div class="detail-label">Designation</div>
          <div class="detail-value">${designation}</div>
        </div>
        <div>
          <div class="detail-label">Email</div>
          <div class="detail-value">${employeeEmail}</div>
        </div>
        <div>
          <div class="detail-label">Issue Date</div>
          <div class="detail-value">${escapeHtml(formattedIssueDate)}</div>
        </div>
      </div>

      <h3 class="section-title">Earnings</h3>
      <table>
        <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
        <tbody>
          ${renderRows(amountRows)}
          <tr class="total">
            <td>Gross Salary</td>
            <td class="amount">${safeCurrency(grossSalary, currency)}</td>
          </tr>
        </tbody>
      </table>

      <h3 class="section-title">Deductions</h3>
      <table>
        <thead><tr><th>Description</th><th class="amount">Amount</th></tr></thead>
        <tbody>
          ${renderRows(deductionRows)}
          <tr class="total">
            <td>Total Deductions</td>
            <td class="amount">${safeCurrency(totalDeductions, currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="net">
        <div class="net-label">Net Salary Payable</div>
        <div class="net-value">${safeCurrency(netSalary, currency)}</div>
      </div>

      <p class="words">
        This salary slip is generated electronically. Please contact HR or Payroll
        if you notice any discrepancy in the information above.
      </p>
    </section>

    <footer class="footer">
      This is a computer-generated salary slip and does not require a physical signature.<br />
      &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
    </footer>
  </main>
</body>
</html>`;
};

module.exports = salarySlipTemplate;