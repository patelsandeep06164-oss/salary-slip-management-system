import React, { useMemo, useState } from "react";
import {
  FaMoneyBillWave,
  FaWallet,
  FaChartLine,
  FaFileInvoiceDollar,
  FaSearch,
  FaDownload,
  FaSyncAlt,
  FaFileAlt,
  FaCalendarAlt,
  FaArrowRight,
} from "react-icons/fa";
import "./PayrollReports.css";

const getPayrollRecords = () => {
  try {
    const saved = localStorage.getItem("payroll_records");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatMonth = (value) => {
  if (!value) return "—";

  const date = /^\d{4}-\d{2}$/.test(value)
    ? new Date(`${value}-01T00:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const getPayrollStatus = (record) => {
  const status = String(record.status || "Pending").toLowerCase();

  if (status === "paid") return "Paid";
  if (status === "generated") return "Generated";

  return "Pending";
};

const getGrossSalary = (record) => {
  if (record.grossSalary !== undefined && record.grossSalary !== null) {
    return toNumber(record.grossSalary);
  }

  return (
    toNumber(record.basicSalary) +
    toNumber(record.allowances) +
    toNumber(record.bonus)
  );
};

const getNetSalary = (record) => {
  if (record.netSalary !== undefined && record.netSalary !== null) {
    return toNumber(record.netSalary);
  }

  return getGrossSalary(record) - toNumber(record.deductions);
};

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function PayrollReports() {
  const [records, setRecords] = useState(getPayrollRecords);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [exportMessage, setExportMessage] = useState("");

  const months = useMemo(() => {
    return [
      ...new Set(
        records
          .map((record) => record.month)
          .filter(
            (month) => typeof month === "string" && month.length > 0
          )
      ),
    ].sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const employeeName = String(
        record.employeeName || record.name || ""
      ).toLowerCase();

      const employeeId = String(
        record.employeeId || record.empId || ""
      ).toLowerCase();

      const payrollId = String(
        record.id || record.payrollId || ""
      ).toLowerCase();

      const department = String(record.department || "").toLowerCase();

      const matchesSearch =
        !query ||
        employeeName.includes(query) ||
        employeeId.includes(query) ||
        payrollId.includes(query) ||
        department.includes(query);

      const matchesMonth =
        monthFilter === "All" || record.month === monthFilter;

      const matchesStatus =
        statusFilter === "All" ||
        getPayrollStatus(record) === statusFilter;

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [records, search, monthFilter, statusFilter]);

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (result, record) => {
        result.gross += getGrossSalary(record);
        result.deductions += toNumber(record.deductions);
        result.net += getNetSalary(record);

        const status = getPayrollStatus(record);

        if (status === "Paid") {
          result.paid += 1;
        } else if (status === "Generated") {
          result.generated += 1;
        } else {
          result.pending += 1;
        }

        return result;
      },
      {
        gross: 0,
        deductions: 0,
        net: 0,
        paid: 0,
        generated: 0,
        pending: 0,
      }
    );
  }, [filteredRecords]);

  const refreshRecords = () => {
    setRecords(getPayrollRecords());
    setExportMessage("");
  };

  const resetFilters = () => {
    setSearch("");
    setMonthFilter("All");
    setStatusFilter("All");
    setExportMessage("");
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      setExportMessage("Export karne ke liye payroll records nahi hain.");
      return;
    }

    const headers = [
      "Payroll ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Month",
      "Basic Salary",
      "Allowances",
      "Bonus",
      "Gross Salary",
      "Deductions",
      "Net Salary",
      "Status",
      "Generated On",
    ];

    const rows = filteredRecords.map((record) => [
      record.id || record.payrollId || "",
      record.employeeId || record.empId || "",
      record.employeeName || record.name || "",
      record.department || "",
      formatMonth(record.month),
      toNumber(record.basicSalary),
      toNumber(record.allowances),
      toNumber(record.bonus),
      getGrossSalary(record),
      toNumber(record.deductions),
      getNetSalary(record),
      getPayrollStatus(record),
      record.generatedOn || record.createdAt || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "payroll-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    setExportMessage("Payroll report CSV export ho gaya.");
  };

  return (
    <div className="payroll-reports-page">
      {/* Page Header */}
      <header className="payroll-reports-header">
        <div className="payroll-reports-heading">
          <span className="payroll-reports-eyebrow">
            <FaFileAlt />
            REPORTS & ANALYTICS
          </span>

          <h1>Payroll Reports</h1>

          <p>
            Salary, deductions aur payroll payment status ka complete overview.
          </p>
        </div>

        <div className="payroll-reports-header-actions">
          <button
            type="button"
            className="payroll-report-btn payroll-report-btn-light"
            onClick={refreshRecords}
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            type="button"
            className="payroll-report-btn payroll-report-btn-primary"
            onClick={exportCSV}
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="payroll-report-stats">
        <article className="payroll-report-stat-card">
          <div className="payroll-report-stat-top">
            <div className="payroll-report-stat-icon blue">
              <FaMoneyBillWave />
            </div>
            <span className="payroll-report-stat-label">GROSS PAYROLL</span>
          </div>

          <h2>{formatCurrency(summary.gross)}</h2>
          <p>Total salary before deductions</p>
          <div className="payroll-report-stat-bottom">
            <span>Gross amount</span>
            <FaArrowRight />
          </div>
        </article>

        <article className="payroll-report-stat-card">
          <div className="payroll-report-stat-top">
            <div className="payroll-report-stat-icon red">
              <FaWallet />
            </div>
            <span className="payroll-report-stat-label">DEDUCTIONS</span>
          </div>

          <h2>{formatCurrency(summary.deductions)}</h2>
          <p>Total deducted from salaries</p>
          <div className="payroll-report-stat-bottom">
            <span>Deduction amount</span>
            <FaArrowRight />
          </div>
        </article>

        <article className="payroll-report-stat-card">
          <div className="payroll-report-stat-top">
            <div className="payroll-report-stat-icon green">
              <FaChartLine />
            </div>
            <span className="payroll-report-stat-label">NET PAYROLL</span>
          </div>

          <h2>{formatCurrency(summary.net)}</h2>
          <p>Salary after deductions</p>
          <div className="payroll-report-stat-bottom">
            <span>Net payable</span>
            <FaArrowRight />
          </div>
        </article>

        <article className="payroll-report-stat-card">
          <div className="payroll-report-stat-top">
            <div className="payroll-report-stat-icon purple">
              <FaFileInvoiceDollar />
            </div>
            <span className="payroll-report-stat-label">PAYROLL RECORDS</span>
          </div>

          <h2>{filteredRecords.length}</h2>
          <p>Records matching current filters</p>
          <div className="payroll-report-stat-bottom">
            <span>{summary.paid} paid records</span>
            <FaArrowRight />
          </div>
        </article>
      </section>

      {/* Payment Status Summary */}
      <section className="payroll-report-status-summary">
        <div className="payroll-report-status-heading">
          <div className="payroll-report-section-icon">
            <FaChartLine />
          </div>

          <div>
            <h2>Payment Status Summary</h2>
            <p>Current payment status of payroll records</p>
          </div>
        </div>

        <div className="payroll-report-status-items">
          <div className="payroll-report-status-item">
            <span className="payroll-report-status-dot paid-dot" />
            <div>
              <span>Paid</span>
              <strong>{summary.paid}</strong>
            </div>
          </div>

          <div className="payroll-report-status-item">
            <span className="payroll-report-status-dot generated-dot" />
            <div>
              <span>Generated</span>
              <strong>{summary.generated}</strong>
            </div>
          </div>

          <div className="payroll-report-status-item">
            <span className="payroll-report-status-dot pending-dot" />
            <div>
              <span>Pending</span>
              <strong>{summary.pending}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Payroll Details */}
      <section className="payroll-report-panel">
        <div className="payroll-report-panel-heading">
          <div>
            <span className="payroll-report-panel-eyebrow">
              <FaCalendarAlt />
              PAYROLL MANAGEMENT
            </span>
            <h2>Payroll Details Report</h2>
            <p>Employee-wise payroll records and salary breakdown.</p>
          </div>

          <span className="payroll-report-result-count">
            {filteredRecords.length} Records
          </span>
        </div>

        {/* Filters */}
        <div className="payroll-report-filters">
          <div className="payroll-report-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search employee, ID or department..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search payroll records"
            />
          </div>

          <select
            aria-label="Filter by payroll month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
          >
            <option value="All">All Months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by payroll status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Generated">Generated</option>
            <option value="Pending">Pending</option>
          </select>

          <button
            type="button"
            className="payroll-report-reset-btn"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        {exportMessage && (
          <div className="payroll-report-message" role="status">
            {exportMessage}
          </div>
        )}

        {/* Table */}
        <div className="payroll-report-table-wrap">
          <table className="payroll-report-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Payroll Month</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => {
                  const employeeName =
                    record.employeeName || record.name || "Unnamed Employee";

                  const status = getPayrollStatus(record);

                  return (
                    <tr key={record.id || record.payrollId || index}>
                      <td>
                        <div className="payroll-report-person">
                          <div className="payroll-report-avatar">
                            {employeeName.charAt(0).toUpperCase()}
                          </div>

                          <div className="payroll-report-person-info">
                            <strong>{employeeName}</strong>
                            <span>
                              {record.employeeId || record.empId || "No ID"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="payroll-report-month">
                          {formatMonth(record.month)}
                        </span>
                      </td>

                      <td className="payroll-report-money">
                        {formatCurrency(getGrossSalary(record))}
                      </td>

                      <td className="payroll-report-deduction">
                        {formatCurrency(record.deductions)}
                      </td>

                      <td className="payroll-report-net">
                        {formatCurrency(getNetSalary(record))}
                      </td>

                      <td>
                        <span
                          className={`payroll-report-status ${status.toLowerCase()}`}
                        >
                          <span className="payroll-report-status-dot" />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="payroll-report-empty">
                    <div className="payroll-report-empty-icon">
                      <FaFileInvoiceDollar />
                    </div>
                    <strong>No payroll records found</strong>
                    <span>
                      Payroll generate karein ya search/filter change karein.
                    </span>
                    <button type="button" onClick={resetFilters}>
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="payroll-report-table-footer">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of{" "}
            <strong>{records.length}</strong> payroll records
          </span>

          <span className="payroll-report-footer-note">
            <span className="payroll-report-footer-dot" />
            Report updated from saved payroll records
          </span>
        </footer>
      </section>
    </div>
  );
}

export default PayrollReports;
