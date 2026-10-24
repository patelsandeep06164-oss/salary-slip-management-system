
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaUser,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaDownload,
  FaPrint,
  FaSyncAlt,
  FaExclamationCircle,
} from "react-icons/fa";
import salarySlipService from "../../services/salarySlipService";
import "./SalarySlipDetails.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getEmployeeName = (employee = {}) => {
  const name = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");

  return name || employee.name || employee.fullName || "Employee";
};

function SalarySlipDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const loadSlip = useCallback(async () => {
    if (!id) {
      setError("Salary slip ID nahi mila.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await salarySlipService.getById(id);

      const data =
        response?.salarySlip ||
        response?.data?.salarySlip ||
        response?.data?.data?.salarySlip ||
        response?.data ||
        response;

      if (!data || typeof data !== "object" || (!data._id && !data.id)) {
        throw new Error("Salary slip record nahi mila.");
      }

      setSlip(data);
    } catch (err) {
      setSlip(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Salary slip details load nahi ho sakin."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSlip();
  }, [loadSlip]);

  const handleDownload = async () => {
    if (!id) return;

    setDownloading(true);
    setError("");

    try {
      const response = await salarySlipService.downloadPdf(id);

      const blob =
        response instanceof Blob
          ? response
          : response?.data instanceof Blob
            ? response.data
            : null;

      if (!blob) {
        throw new Error(
          "PDF download nahi hua. Backend PDF endpoint check karein."
        );
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `salary-slip-${id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "PDF download karne mein error aaya."
      );
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="ssd-page">
        <div className="ssd-state">
          <FaSyncAlt className="ssd-spin" />
          <h2>Loading Salary Slip</h2>
          <p>Salary details fetch ki ja rahi hain...</p>
        </div>
      </main>
    );
  }

  if (error && !slip) {
    return (
      <main className="ssd-page">
        <div className="ssd-state ssd-error-state">
          <FaExclamationCircle />
          <h2>Salary Slip Unavailable</h2>
          <p>{error}</p>

          <div className="ssd-state-actions">
            <button
              type="button"
              className="ssd-button ssd-button-primary"
              onClick={loadSlip}
            >
              <FaSyncAlt />
              Try Again
            </button>

            <button
              type="button"
              className="ssd-button ssd-button-light"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const employee = slip?.employee || slip?.employeeDetails || {};
  const payroll = slip?.payroll || slip?.payrollDetails || slip || {};

  const basicSalary = Number(
    payroll.basicSalary ?? slip.basicSalary ?? 0
  );

  const hra = Number(payroll.hra ?? slip.hra ?? 0);
  const allowances = Number(
    payroll.allowances ?? slip.allowances ?? 0
  );
  const bonus = Number(payroll.bonus ?? slip.bonus ?? 0);

  const grossSalary = Number(
    payroll.grossSalary ??
      slip.grossSalary ??
      basicSalary + hra + allowances + bonus
  );

  const deductions = Number(
    payroll.totalDeductions ??
      payroll.deductions ??
      slip.totalDeductions ??
      slip.deductions ??
      0
  );

  const netSalary = Number(
    payroll.netSalary ??
      slip.netSalary ??
      grossSalary - deductions
  );

  const month = slip.month ?? payroll.month ?? "—";
  const year = slip.year ?? payroll.year ?? "—";

  const slipNumber =
    slip.slipNumber || slip._id || slip.id || id;

  const status = String(
    slip.status || slip.emailStatus || "Generated"
  );

  return (
    <main className="ssd-page">
      <header className="ssd-header no-print">
        <div className="ssd-header-copy">
          <Link
            to={-1}
            className="ssd-back-link"
            onClick={(event) => {
              event.preventDefault();
              navigate(-1);
            }}
          >
            <FaArrowLeft />
            Back
          </Link>

          <span className="ssd-eyebrow">
            PAYROLL / SALARY SLIPS
          </span>

          <h1>Salary Slip Details</h1>

          <p>View the complete salary statement and payment breakdown.</p>
        </div>

        <div className="ssd-header-actions">
          <button
            type="button"
            className="ssd-button ssd-button-light"
            onClick={handlePrint}
          >
            <FaPrint />
            Print
          </button>

          <button
            type="button"
            className="ssd-button ssd-button-primary"
            onClick={handleDownload}
            disabled={downloading || !slip.pdfAvailable}
            title={
              slip.pdfAvailable
                ? "Download salary slip PDF"
                : "PDF is not available for this record"
            }
          >
            {downloading ? <FaSyncAlt className="ssd-spin" /> : <FaDownload />}
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </header>

      {error && (
        <div className="ssd-alert no-print" role="alert">
          <FaExclamationCircle />
          {error}
        </div>
      )}

      <section className="ssd-slip">
        <div className="ssd-slip-top">
          <div className="ssd-brand">
            <div className="ssd-brand-icon">
              <FaFileInvoiceDollar />
            </div>
            <div>
              <h2>Salary Statement</h2>
              <p>Employee Payroll Record</p>
            </div>
          </div>

          <div className="ssd-slip-number">
            <span>SLIP NUMBER</span>
            <strong>{slipNumber}</strong>
            <span className={`ssd-status ssd-status-${status.toLowerCase()}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="ssd-period-banner">
          <div>
            <span>
              <FaCalendarAlt />
              SALARY PERIOD
            </span>
            <h3>
              {month} {year}
            </h3>
          </div>

          <div className="ssd-net-summary">
            <span>NET PAYABLE</span>
            <strong>{money(netSalary)}</strong>
          </div>
        </div>

        <div className="ssd-section">
          <h3 className="ssd-section-title">
            <FaUser />
            Employee Information
          </h3>

          <div className="ssd-info-grid">
            <div className="ssd-info-item">
              <span>Employee Name</span>
              <strong>{getEmployeeName(employee)}</strong>
            </div>

            <div className="ssd-info-item">
              <span>Employee ID</span>
              <strong>
                {employee.employeeCode ||
                  employee._id ||
                  slip.employeeId ||
                  "—"}
              </strong>
            </div>

            <div className="ssd-info-item">
              <span>Department</span>
              <strong>
                {employee.department?.name ||
                  employee.department ||
                  "—"}
              </strong>
            </div>

            <div className="ssd-info-item">
              <span>Designation</span>
              <strong>
                {employee.designation?.name ||
                  employee.designation ||
                  employee.position ||
                  "—"}
              </strong>
            </div>

            <div className="ssd-info-item">
              <span>Email</span>
              <strong>{employee.email || "—"}</strong>
            </div>

            <div className="ssd-info-item">
              <span>Generated Date</span>
              <strong>{formatDate(slip.createdAt)}</strong>
            </div>
          </div>
        </div>

        <div className="ssd-salary-columns">
          <section className="ssd-salary-section">
            <h3 className="ssd-section-title">
              <FaMoneyBillWave />
              Earnings
            </h3>

            <div className="ssd-salary-row">
              <span>Basic Salary</span>
              <strong>{money(basicSalary)}</strong>
            </div>

            <div className="ssd-salary-row">
              <span>House Rent Allowance (HRA)</span>
              <strong>{money(hra)}</strong>
            </div>

            <div className="ssd-salary-row">
              <span>Other Allowances</span>
              <strong>{money(allowances)}</strong>
            </div>

            <div className="ssd-salary-row">
              <span>Bonus</span>
              <strong>{money(bonus)}</strong>
            </div>

            <div className="ssd-salary-total">
              <span>Gross Earnings</span>
              <strong>{money(grossSalary)}</strong>
            </div>
          </section>

          <section className="ssd-salary-section">
            <h3 className="ssd-section-title">
              <FaBuilding />
              Deductions
            </h3>

            <div className="ssd-salary-row">
              <span>Total Deductions</span>
              <strong className="ssd-deduction">
                {money(deductions)}
              </strong>
            </div>

            <div className="ssd-deduction-note">
              Deductions shown here are based on the saved payroll record.
            </div>

            <div className="ssd-salary-total ssd-net-total">
              <span>Net Salary</span>
              <strong>{money(netSalary)}</strong>
            </div>
          </section>
        </div>

        <div className="ssd-payment-footer">
          <div>
            <span>Payment / Record Date</span>
            <strong>
              {formatDate(
                payroll.paidAt ||
                  payroll.paymentDate ||
                  slip.paidAt ||
                  slip.createdAt
              )}
            </strong>
          </div>

          <div className="ssd-payment-total">
            <span>Net Payable</span>
            <strong>{money(netSalary)}</strong>
          </div>
        </div>

        <div className="ssd-note">
          <strong>Note:</strong> This salary statement is generated from the
          saved payroll record. Please contact the HR department if any
          information needs correction.
        </div>

        <div className="ssd-signature-row">
          <div>
            <span />
            <strong>Employee Signature</strong>
          </div>

          <div>
            <span />
            <strong>Authorized Signatory</strong>
          </div>
        </div>
      </section>

      <p className="ssd-confidential no-print">
        Confidential · Salary and payroll information
      </p>
    </main>
  );
}

export default SalarySlipDetails;
