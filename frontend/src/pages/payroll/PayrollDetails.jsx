
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaSyncAlt,
  FaUser,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://salary-slip-backend-rjgj.onrender.com/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

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

const getEmployeeName = (employee) => {
  if (!employee) return "—";

  return (
    employee.name ||
    employee.fullName ||
    [employee.firstName, employee.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed Employee"
  );
};

function PayrollDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionType, setActionType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  const loadPayroll = useCallback(async () => {
    if (!id) {
      setError("Payroll ID is missing from the URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/payroll/${encodeURIComponent(id)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to load payroll details."
        );
      }

      const record = data.payroll || data.data?.payroll || data.data;

      if (!record || typeof record !== "object") {
        throw new Error("Payroll record was not returned by the server.");
      }

      setPayroll(record);
    } catch (err) {
      setError(err.message || "Unable to load payroll details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const updateStatus = async (status) => {
    if (!payroll?._id && !payroll?.id) {
      setActionType("error");
      setActionMessage("Payroll ID is unavailable.");
      return;
    }

    setSubmitting(true);
    setActionMessage("");

    try {
      const token = localStorage.getItem("token");
      const payrollId = payroll._id || payroll.id;

      const response = await fetch(
        `${API_BASE_URL}/payroll/${encodeURIComponent(payrollId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            status,
            remarks: payroll.remarks || "",
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to update payroll status."
        );
      }

      setActionType("success");
      setActionMessage(
        data.message || `Payroll status changed to ${status}.`
      );

      await loadPayroll();
    } catch (err) {
      setActionType("error");
      setActionMessage(
        err.message || "Unable to update payroll status."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const employee = payroll?.employee || {};
  const status = String(payroll?.status || "draft").toLowerCase();

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <FaSyncAlt className="payroll-details-spin" />
          <p>Loading payroll details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <FaExclamationCircle size={28} color="#dc2626" />
          <h2>Unable to load payroll</h2>
          <p>{error}</p>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft /> Go Back
            </button>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={loadPayroll}
            >
              <FaSyncAlt /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <span style={styles.eyebrow}>PAYROLL MANAGEMENT</span>
          <h1 style={styles.heading}>Payroll Details</h1>
          <p style={styles.subtitle}>
            Review employee salary information and payroll status.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => navigate("/admin/payroll/history")}
        >
          <FaArrowLeft /> Payroll History
        </button>
      </header>

      {actionMessage && (
        <div
          role="status"
          style={{
            ...styles.notice,
            background:
              actionType === "success" ? "#dcfce7" : "#fee2e2",
            color:
              actionType === "success" ? "#166534" : "#991b1b",
          }}
        >
          {actionType === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}
          {actionMessage}
        </div>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div style={styles.iconCircle}>
            <FaUser />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={styles.sectionTitle}>
              {getEmployeeName(employee)}
            </h2>
            <p style={styles.muted}>
              {employee.employeeCode ||
                employee.employeeId ||
                employee.email ||
                "Employee information"}
            </p>
          </div>

          <span
            style={{
              ...styles.status,
              ...(status === "paid"
                ? styles.paid
                : status === "processed"
                ? styles.processed
                : status === "cancelled"
                ? styles.cancelled
                : styles.draft),
            }}
          >
            {status}
          </span>
        </div>

        <div style={styles.infoGrid}>
          <InfoItem
            label="Department"
            value={
              typeof employee.department === "object"
                ? employee.department?.name
                : employee.department
            }
          />
          <InfoItem label="Email" value={employee.email} />
          <InfoItem
            label="Payroll Month"
            value={
              payroll.month && payroll.year
                ? new Date(
                    Number(payroll.year),
                    Number(payroll.month) - 1,
                    1
                  ).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
          <InfoItem
            label="Generated On"
            value={formatDate(payroll.createdAt || payroll.generatedOn)}
          />
          <InfoItem
            label="Working Days"
            value={payroll.workingDays ?? "—"}
          />
          <InfoItem
            label="Present Days"
            value={payroll.daysPresent ?? "—"}
          />
          <InfoItem
            label="Absent Days"
            value={payroll.daysAbsent ?? "—"}
          />
          <InfoItem
            label="Unpaid Leave Days"
            value={payroll.unpaidLeaveDays ?? 0}
          />
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div style={styles.iconCircle}>
            <FaFileInvoiceDollar />
          </div>
          <div>
            <h2 style={styles.sectionTitle}>Salary Breakdown</h2>
            <p style={styles.muted}>
              Salary components and deductions for this payroll.
            </p>
          </div>
        </div>

        <div style={styles.salaryLines}>
          <SalaryLine
            label="Basic Salary"
            amount={payroll.basicSalary}
          />
          <SalaryLine label="HRA" amount={payroll.hra} />
          <SalaryLine
            label="Allowances"
            amount={payroll.allowances}
          />
          <SalaryLine
            label="Overtime Pay"
            amount={payroll.overtimePay}
          />
          <SalaryLine label="Bonus" amount={payroll.bonus} />

          <SalaryLine
            label="Gross Salary"
            amount={payroll.grossSalary}
            strong
          />

          <SalaryLine
            label="Deductions"
            amount={payroll.deductions}
            negative
          />
          <SalaryLine
            label="Tax Deduction"
            amount={payroll.taxDeduction}
            negative
          />
          <SalaryLine
            label="Unpaid Leave Deduction"
            amount={payroll.unpaidLeaveDeduction}
            negative
          />
          <SalaryLine
            label="Total Deductions"
            amount={payroll.totalDeductions}
            negative
            strong
          />
        </div>

        <div style={styles.netPay}>
          <div>
            <span style={styles.netPayLabel}>Net Payable Salary</span>
            <p style={styles.muted}>
              <FaMoneyBillWave /> Final salary after deductions
            </p>
          </div>

          <strong style={styles.netAmount}>
            {formatCurrency(payroll.netSalary)}
          </strong>
        </div>
      </section>

      {payroll.remarks && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Payroll Remarks</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{payroll.remarks}</p>
        </section>
      )}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Payroll Actions</h2>
        <p style={styles.muted}>
          Process the draft payroll before generating its salary slip.
        </p>

        <div style={styles.actions}>
          {status === "draft" && (
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => updateStatus("processed")}
              disabled={submitting}
            >
              <FaCheckCircle />
              {submitting ? "Processing..." : "Process Payroll"}
            </button>
          )}

          {status === "processed" && (
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => navigate("/admin/salary-slips")}
              disabled={submitting}
            >
              <FaFileInvoiceDollar /> Open Salary Slips
            </button>
          )}

          {status === "paid" && (
            <span style={styles.muted}>
              This payroll is marked as paid.
            </span>
          )}

          {status === "cancelled" && (
            <span style={{ color: "#b91c1c" }}>
              This payroll has been cancelled.
            </span>
          )}

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={loadPayroll}
            disabled={submitting}
          >
            <FaSyncAlt /> Refresh Details
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <strong style={styles.infoValue}>
        {value === undefined || value === null || value === ""
          ? "—"
          : String(value)}
      </strong>
    </div>
  );
}

function SalaryLine({ label, amount, negative = false, strong = false }) {
  return (
    <div style={styles.salaryLine}>
      <span
        style={{
          ...styles.salaryLabel,
          ...(strong ? { fontWeight: 800 } : {}),
        }}
      >
        {label}
      </span>

      <strong
        style={{
          ...styles.salaryAmount,
          ...(negative ? { color: "#b91c1c" } : {}),
          ...(strong ? { fontWeight: 800 } : {}),
        }}
      >
        {negative ? "− " : ""}
        {formatCurrency(amount)}
      </strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    padding: "clamp(14px, 3vw, 28px)",
    background: "linear-gradient(135deg, #e0f7fa, #eff6ff)",
    color: "#153047",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#087e8b",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  heading: {
    margin: "6px 0",
    fontSize: "clamp(24px, 4vw, 34px)",
  },
  subtitle: {
    margin: 0,
    color: "#60758a",
  },
  card: {
    background: "#fff",
    border: "1px solid #dce9ef",
    borderRadius: 16,
    padding: "clamp(16px, 3vw, 24px)",
    marginBottom: 20,
    boxShadow: "0 8px 24px rgba(16, 64, 91, 0.06)",
    minWidth: 0,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 22,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#cffafe",
    color: "#087e8b",
    fontSize: 19,
  },
  sectionTitle: {
    margin: "0 0 6px",
    fontSize: 19,
  },
  muted: {
    margin: "4px 0",
    color: "#64748b",
    fontSize: 13,
  },
  status: {
    display: "inline-block",
    borderRadius: 20,
    padding: "7px 12px",
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: 800,
  },
  draft: { background: "#fef3c7", color: "#92400e" },
  processed: { background: "#dbeafe", color: "#1d4ed8" },
  paid: { background: "#dcfce7", color: "#166534" },
  cancelled: { background: "#fee2e2", color: "#991b1b" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: 16,
  },
  infoItem: {
    background: "#f8fbfd",
    border: "1px solid #e5eef3",
    borderRadius: 10,
    padding: 14,
    minWidth: 0,
  },
  infoLabel: {
    display: "block",
    color: "#64748b",
    fontSize: 12,
    marginBottom: 8,
  },
  infoValue: {
    display: "block",
    overflowWrap: "anywhere",
    fontSize: 14,
  },
  salaryLines: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  salaryLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "13px 0",
    borderBottom: "1px solid #e5eef3",
  },
  salaryLabel: {
    color: "#526579",
    fontSize: 14,
  },
  salaryAmount: {
    color: "#1e293b",
    fontVariantNumeric: "tabular-nums",
  },
  netPay: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 22,
    padding: 18,
    borderRadius: 12,
    background: "linear-gradient(135deg, #cffafe, #dbeafe)",
  },
  netPayLabel: {
    fontWeight: 800,
    fontSize: 15,
  },
  netAmount: {
    fontSize: "clamp(22px, 4vw, 30px)",
    color: "#087e8b",
    overflowWrap: "anywhere",
  },
  actions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 18,
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "12px 16px",
    border: 0,
    borderRadius: 9,
    background: "#087e8b",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: "12px 16px",
    border: "1px solid #cbdde6",
    borderRadius: 9,
    background: "#fff",
    color: "#23445c",
    fontWeight: 700,
    cursor: "pointer",
  },
  notice: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
};

export default PayrollDetails;
