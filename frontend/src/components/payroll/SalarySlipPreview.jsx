import React, { useMemo } from "react";
import {
  FaPrint,
  FaDownload,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

function SalarySlipPreview({
  employee = {},
  payroll = {},
  company = {},
  currency = "INR",
  loading = false,
  onDownload,
  title = "Salary Slip",
}) {
  const numberFormat = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat("en-IN", {
        style: "decimal",
        maximumFractionDigits: 2,
      });
    }
  }, [currency]);

  const formatAmount = (value) => {
    const amount = Number(value);
    return numberFormat.format(
      Number.isFinite(amount) ? amount : 0
    );
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const employeeName = employee.name || employee.fullName || "—";
  const employeeId = employee.employeeId || employee.empId || "—";
  const designation = employee.designation || employee.position || "—";
  const department =
    typeof employee.department === "object"
      ? employee.department?.name ||
        employee.department?.departmentName ||
        "—"
      : employee.department || "—";

  const companyName = company.companyName || company.name || "Company";
  const companyAddress = company.address || "";
  const companyEmail = company.email || "";
  const companyPhone = company.phone || "";

  const period = payroll.month
    ? `${payroll.month}${payroll.year ? ` ${payroll.year}` : ""}`
    : payroll.payPeriod ||
      payroll.period ||
      (payroll.year ? String(payroll.year) : "—");

  const basicSalary = Number(
    payroll.basicSalary ?? payroll.basic ?? 0
  ) || 0;

  const allowances = Number(
    payroll.allowances ?? payroll.totalAllowances ?? 0
  ) || 0;

  const deductions = Number(
    payroll.deductions ?? payroll.totalDeductions ?? 0
  ) || 0;

  const grossSalary = Number(
    payroll.grossSalary ?? basicSalary + allowances
  ) || 0;

  const netSalary = Number(
    payroll.netSalary ?? payroll.netPay ?? grossSalary - deductions
  ) || 0;

  const status = String(payroll.status || "—")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="salary-slip-preview-loading" aria-busy="true">
        <style>{styles}</style>
        <div className="salary-slip-loading-bar" />
        <div className="salary-slip-loading-bar short" />
        <div className="salary-slip-loading-box" />
        <p>Loading salary slip...</p>
      </div>
    );
  }

  return (
    <section className="salary-slip-preview-wrapper">
      <style>{styles}</style>

      <div className="salary-slip-preview-toolbar">
        <div>
          <h3>{title}</h3>
          <p>Review the details before printing.</p>
        </div>

        <div className="salary-slip-toolbar-actions">
          <button
            type="button"
            className="salary-slip-action-button secondary"
            onClick={handlePrint}
          >
            <FaPrint />
            <span>Print</span>
          </button>

          {typeof onDownload === "function" && (
            <button
              type="button"
              className="salary-slip-action-button primary"
              onClick={() => onDownload({ employee, payroll, company })}
            >
              <FaDownload />
              <span>Download</span>
            </button>
          )}
        </div>
      </div>

      <article className="salary-slip-paper">
        <header className="salary-slip-paper-header">
          <div className="salary-slip-company-mark">
            <FaBuilding />
          </div>

          <div className="salary-slip-company-details">
            <h1>{companyName}</h1>

            {companyAddress && <p>{companyAddress}</p>}

            <div className="salary-slip-contact">
              {companyEmail && <span>{companyEmail}</span>}
              {companyPhone && <span>{companyPhone}</span>}
            </div>
          </div>

          <div className="salary-slip-document-label">
            <span>PAYROLL DOCUMENT</span>
            <strong>SALARY SLIP</strong>
          </div>
        </header>

        <div className="salary-slip-period-banner">
          <div>
            <span>Salary Period</span>
            <strong>{period}</strong>
          </div>

          <div>
            <span>Payment Status</span>
            <strong className="salary-slip-status">{status}</strong>
          </div>
        </div>

        <section className="salary-slip-section">
          <h2>
            <FaUser />
            Employee Information
          </h2>

          <div className="salary-slip-info-grid">
            <InfoItem label="Employee Name" value={employeeName} />
            <InfoItem label="Employee ID" value={employeeId} />
            <InfoItem label="Designation" value={designation} />
            <InfoItem label="Department" value={department} />
            <InfoItem
              label="Joining Date"
              value={formatDate(employee.joiningDate)}
            />
            <InfoItem
              label="Payment Date"
              value={formatDate(payroll.paymentDate)}
            />
          </div>
        </section>

        <section className="salary-slip-section">
          <h2>
            <FaMoneyBillWave />
            Earnings & Deductions
          </h2>

          <div className="salary-slip-table-wrap">
            <table className="salary-slip-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Earnings</th>
                  <th>Deductions</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>{formatAmount(basicSalary)}</td>
                  <td>—</td>
                </tr>

                <tr>
                  <td>Allowances</td>
                  <td>{formatAmount(allowances)}</td>
                  <td>—</td>
                </tr>

                <tr>
                  <td>Other Deductions</td>
                  <td>—</td>
                  <td>{formatAmount(deductions)}</td>
                </tr>
              </tbody>

              <tfoot>
                <tr>
                  <th>Total</th>
                  <th>{formatAmount(grossSalary)}</th>
                  <th>{formatAmount(deductions)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="salary-slip-net-pay">
          <div>
            <span>Net Salary Payable</span>
            <small>Final amount after deductions</small>
          </div>

          <strong>{formatAmount(netSalary)}</strong>
        </div>

        {payroll.paymentMethod && (
          <div className="salary-slip-payment-info">
            <strong>Payment Method:</strong> {payroll.paymentMethod}
          </div>
        )}

        <footer className="salary-slip-paper-footer">
          <div>
            <FaCalendarAlt />
            Generated on {formatDate(payroll.generatedAt || new Date())}
          </div>

          <p>
            This salary slip contains confidential employee payroll
            information.
          </p>
        </footer>
      </article>
    </section>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="salary-slip-info-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

const styles = `
  .salary-slip-preview-wrapper,
  .salary-slip-preview-wrapper *,
  .salary-slip-preview-loading,
  .salary-slip-preview-loading * {
    box-sizing: border-box;
  }

  .salary-slip-preview-wrapper {
    width: 100%;
    min-width: 0;
    color: #183247;
  }

  .salary-slip-preview-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 18px;
  }

  .salary-slip-preview-toolbar h3 {
    margin: 0;
    color: #12304a;
    font-size: 19px;
    font-weight: 800;
  }

  .salary-slip-preview-toolbar p {
    margin: 5px 0 0;
    color: #718096;
    font-size: 12px;
  }

  .salary-slip-toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .salary-slip-action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 10px 15px;
    border: 1px solid transparent;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .salary-slip-action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 14px rgba(15, 78, 120, 0.12);
  }

  .salary-slip-action-button.primary {
    color: #ffffff;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
  }

  .salary-slip-action-button.secondary {
    color: #075985;
    background: #e0f2fe;
    border-color: #bae6fd;
  }

  .salary-slip-paper {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 34px;
    border: 1px solid #dbeafe;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 78, 120, 0.09);
    color: #183247;
  }

  .salary-slip-paper-header {
    display: flex;
    align-items: center;
    gap: 15px;
    padding-bottom: 24px;
    border-bottom: 2px solid #0ea5e9;
  }

  .salary-slip-company-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    flex-shrink: 0;
    border-radius: 15px;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    color: #ffffff;
    font-size: 24px;
  }

  .salary-slip-company-details {
    flex: 1;
    min-width: 0;
  }

  .salary-slip-company-details h1 {
    margin: 0;
    color: #12304a;
    font-size: 22px;
    font-weight: 900;
    overflow-wrap: anywhere;
  }

  .salary-slip-company-details p {
    margin: 6px 0;
    color: #64748b;
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .salary-slip-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 12px;
    color: #64748b;
    font-size: 11px;
    overflow-wrap: anywhere;
  }

  .salary-slip-document-label {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    text-align: right;
  }

  .salary-slip-document-label span {
    color: #0284c7;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .salary-slip-document-label strong {
    color: #12304a;
    font-size: 16px;
  }

  .salary-slip-period-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    margin: 22px 0;
    padding: 16px 18px;
    border: 1px solid #bae6fd;
    border-radius: 12px;
    background: linear-gradient(120deg, #e0f7ff, #eef2ff);
  }

  .salary-slip-period-banner > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .salary-slip-period-banner span {
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
  }

  .salary-slip-period-banner strong {
    color: #075985;
    font-size: 14px;
  }

  .salary-slip-status {
    display: inline-flex;
    align-self: flex-start;
    padding: 5px 10px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #bae6fd;
  }

  .salary-slip-section {
    margin-top: 26px;
  }

  .salary-slip-section h2 {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 15px;
    color: #12304a;
    font-size: 15px;
    font-weight: 800;
  }

  .salary-slip-section h2 svg {
    color: #0284c7;
  }

  .salary-slip-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 22px;
    padding: 0 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .salary-slip-info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 14px 0;
    border-bottom: 1px solid #edf2f7;
  }

  .salary-slip-info-item span {
    color: #64748b;
    font-size: 11px;
  }

  .salary-slip-info-item strong {
    color: #183247;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .salary-slip-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #dbeafe;
    border-radius: 12px;
  }

  .salary-slip-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .salary-slip-table th,
  .salary-slip-table td {
    padding: 13px 14px;
    text-align: right;
    border-bottom: 1px solid #e8eef5;
    white-space: nowrap;
  }

  .salary-slip-table th:first-child,
  .salary-slip-table td:first-child {
    text-align: left;
  }

  .salary-slip-table thead {
    background: #eaf7ff;
    color: #075985;
  }

  .salary-slip-table tbody td {
    color: #475569;
  }

  .salary-slip-table tfoot {
    background: #f0f9ff;
    color: #12304a;
  }

  .salary-slip-table tfoot th {
    border-bottom: 0;
    font-weight: 800;
  }

  .salary-slip-net-pay {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #bae6fd;
    border-radius: 14px;
    background: linear-gradient(120deg, #e0f7ff, #eaf1ff);
  }

  .salary-slip-net-pay > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .salary-slip-net-pay span {
    color: #075985;
    font-size: 15px;
    font-weight: 800;
  }

  .salary-slip-net-pay small {
    color: #64748b;
    font-size: 11px;
  }

  .salary-slip-net-pay > strong {
    color: #075985;
    font-size: 23px;
    font-weight: 900;
    overflow-wrap: anywhere;
  }

  .salary-slip-payment-info {
    margin-top: 16px;
    color: #526579;
    font-size: 12px;
  }

  .salary-slip-paper-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 30px;
    padding-top: 18px;
    border-top: 1px dashed #cbd5e1;
    color: #64748b;
    font-size: 10px;
  }

  .salary-slip-paper-footer > div {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .salary-slip-paper-footer svg {
    color: #0284c7;
  }

  .salary-slip-paper-footer p {
    margin: 0;
  }

  .salary-slip-preview-loading {
    padding: 24px;
    border: 1px solid #dbeafe;
    border-radius: 16px;
    background: #ffffff;
  }

  .salary-slip-loading-bar,
  .salary-slip-loading-box {
    margin-bottom: 14px;
    border-radius: 8px;
    background: #eaf2f8;
    animation: salarySlipShimmer 1.4s infinite alternate;
  }

  .salary-slip-loading-bar {
    height: 20px;
  }

  .salary-slip-loading-bar.short {
    width: 55%;
  }

  .salary-slip-loading-box {
    height: 180px;
  }

  .salary-slip-preview-loading p {
    color: #64748b;
    font-size: 12px;
  }

  @keyframes salarySlipShimmer {
    from { opacity: 0.55; }
    to { opacity: 1; }
  }

  @media (max-width: 600px) {
    .salary-slip-paper {
      padding: 18px;
      border-radius: 12px;
    }

    .salary-slip-paper-header {
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
    }

    .salary-slip-company-mark {
      width: 42px;
      height: 42px;
      font-size: 19px;
    }

    .salary-slip-company-details {
      flex: 1 1 calc(100% - 60px);
    }

    .salary-slip-company-details h1 {
      font-size: 18px;
    }

    .salary-slip-document-label {
      width: 100%;
      align-items: flex-start;
      text-align: left;
    }

    .salary-slip-info-grid {
      grid-template-columns: minmax(0, 1fr);
      padding: 0 12px;
    }

    .salary-slip-info-item {
      padding: 11px 0;
    }

    .salary-slip-period-banner {
      padding: 13px;
    }

    .salary-slip-net-pay {
      padding: 15px;
    }

    .salary-slip-net-pay > strong {
      font-size: 19px;
    }

    .salary-slip-preview-toolbar h3 {
      font-size: 17px;
    }
  }

  @media print {
    @page {
      size: A4;
      margin: 12mm;
    }

    body {
      background: #ffffff !important;
    }

    body * {
      visibility: hidden !important;
    }

    .salary-slip-paper,
    .salary-slip-paper * {
      visibility: visible !important;
    }

    .salary-slip-preview-toolbar {
      display: none !important;
    }

    .salary-slip-preview-wrapper {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .salary-slip-paper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .salary-slip-section,
    .salary-slip-net-pay,
    .salary-slip-period-banner {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .salary-slip-table-wrap {
      overflow: visible !important;
    }

    .salary-slip-table {
      width: 100% !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .salary-slip-loading-bar,
    .salary-slip-loading-box {
      animation: none;
    }

    .salary-slip-action-button {
      transition: none;
    }
  }
`;

export default SalarySlipPreview;
