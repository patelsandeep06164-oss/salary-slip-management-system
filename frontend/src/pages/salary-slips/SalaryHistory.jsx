
import React, { useCallback, useEffect, useMemo, useState } from "react";
import salarySlipService from "../../services/salarySlipService";
import { Link, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaWallet,
  FaMoneyBillWave,
  FaChartLine,
  FaFileInvoiceDollar,
  FaEye,
  FaDownload,
  FaSyncAlt,
  FaHistory,
  FaCalendarAlt,
} from "react-icons/fa";
import "./SalaryHistory.css";

const readPayrollRecords = (sourceRecords = []) => {
  if (!Array.isArray(sourceRecords)) return [];

  return sourceRecords.map((record, index) => {
    const employee = record.employee || record.employeeDetails || {};
    const payroll = record.payroll || record.salaryDetails || record;

    const basic = Number(payroll.basicSalary) || 0;
    const hra = Number(payroll.hra) || 0;
    const allowances = Number(payroll.allowances) || 0;
    const bonus = Number(payroll.bonus) || 0;

    const deductions =
      Number(payroll.totalDeductions ?? payroll.deductions) || 0;

    const gross =
      Number(
        payroll.grossSalary ?? (basic + hra + allowances + bonus)
      ) || 0;

    const net =
      Number(payroll.netSalary ?? (gross - deductions)) || 0;

    const rawMonth = record.month ?? record.payrollMonth ?? "";
    const rawYear = record.year ?? record.payrollYear ?? payroll.year;

    const parsedMonth = parsePayrollMonth(rawMonth, rawYear);

    const fullName = [
      employee.firstName,
      employee.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...record,
      id: String(
        record._id ||
          record.id ||
          record.salarySlipId ||
          record.slipId ||
          `SLIP-${index + 1}`
      ),
      slipNumber: String(
        record.slipNumber ||
          record._id ||
          record.id ||
          `SLIP-${index + 1}`
      ),
      employeeId: String(
        employee.employeeCode ||
          employee._id ||
          record.employeeId ||
          record.empId ||
          ""
      ),
      employee: String(
        fullName ||
          employee.name ||
          employee.fullName ||
          record.employeeName ||
          record.name ||
          "Unnamed Employee"
      ),
      department: String(
        employee.department?.name ||
          employee.department ||
          record.department ||
          "—"
      ),
      month: parsedMonth.month,
      year: parsedMonth.year,
      monthKey: parsedMonth.monthKey,
      gross,
      deductions,
      net,
      status: normalizeStatus(record.status || record.emailStatus),
      payDate:
        record.paidAt ||
        record.emailSentAt ||
        record.payDate ||
        record.paymentDate ||
        record.createdAt ||
        "",
    };
  });
};

function parsePayrollMonth(value, fallbackYear) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const raw = String(value || "").trim();

  if (
    /^\d{1,2}$/.test(raw) &&
    Number(fallbackYear) &&
    Number(raw) >= 1 &&
    Number(raw) <= 12
  ) {
    const monthIndex = Number(raw) - 1;

    return {
      month: monthNames[monthIndex],
      year: Number(fallbackYear),
      monthKey: `${fallbackYear}-${String(
        monthIndex + 1
      ).padStart(2, "0")}`,
    };
  }

  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split("-").map(Number);
    const index = month - 1;

    if (index >= 0 && index < 12) {
      return {
        month: monthNames[index],
        year,
        monthKey: raw,
      };
    }
  }

  const monthYearMatch = raw.match(/^([A-Za-z]+)[\s/-]+(\d{4})$/);
  const yearMonthMatch = raw.match(/^(\d{4})[\s/-]+([A-Za-z]+)$/);

  let monthName = raw;
  let year = Number(fallbackYear) || "";

  if (monthYearMatch) {
    monthName = monthYearMatch[1];
    year = Number(monthYearMatch[2]);
  } else if (yearMonthMatch) {
    year = Number(yearMonthMatch[1]);
    monthName = yearMonthMatch[2];
  }

  const monthIndex = monthNames.findIndex(
    (name) => name.toLowerCase() === monthName.toLowerCase()
  );

  if (monthIndex !== -1) {
    return {
      month: monthNames[monthIndex],
      year,
      monthKey: year
        ? `${year}-${String(monthIndex + 1).padStart(2, "0")}`
        : monthNames[monthIndex],
    };
  }

  return {
    month: raw || "—",
    year,
    monthKey: raw || "—",
  };
}

const normalizeStatus = (value) => {
  const status = String(value || "Pending").toLowerCase();

  if (status === "paid") return "Paid";
  if (status === "emailed" || status === "sent") return "Emailed";
  if (status === "generated") return "Generated";
  if (status === "processed" || status === "processing") {
    return "Processing";
  }
  if (status === "failed" || status === "cancelled") return "Failed";

  return "Pending";
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function SalaryHistory() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const detailsPath = isAdmin
    ? "/admin/salary-slips/details"
    : "/employee/salary-slips/details";

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("All");
  const [status, setStatus] = useState("All");
  const [month, setMonth] = useState("All");
  const [message, setMessage] = useState("");

  const years = useMemo(() => {
    return [
      ...new Set(
        records
          .map((record) => String(record.year || ""))
          .filter((value) => /^\d{4}$/.test(value))
      ),
    ].sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const months = useMemo(() => {
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return [
      ...new Set(
        records
          .map((record) => record.month)
          .filter((value) => value && value !== "—")
      ),
    ].sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesSearch =
          !term ||
          record.employee.toLowerCase().includes(term) ||
          record.employeeId.toLowerCase().includes(term) ||
          record.id.toLowerCase().includes(term) ||
          record.department.toLowerCase().includes(term);

        const matchesYear =
          year === "All" || String(record.year) === year;

        const matchesMonth =
          month === "All" || record.month === month;

        const matchesStatus =
          status === "All" || record.status === status;

        return (
          matchesSearch &&
          matchesYear &&
          matchesMonth &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        const dateA = String(a.monthKey || "");
        const dateB = String(b.monthKey || "");

        return dateB.localeCompare(dateA);
      });
  }, [records, search, year, month, status]);

  const summary = useMemo(() => {
    return filteredRecords.reduce(
      (result, record) => {
        result.gross += toNumber(record.gross);
        result.deductions += toNumber(record.deductions);
        result.net += toNumber(record.net);

        if (record.status === "Emailed") {
          result.emailed += 1;
          result.emailedAmount += toNumber(record.net);
        }

        if (record.status === "Pending") result.pending += 1;
        if (record.status === "Processing") result.processing += 1;
        if (record.status === "Generated") result.generated += 1;
        if (record.status === "Failed") result.failed += 1;

        return result;
      },
      {
        gross: 0,
        deductions: 0,
        net: 0,
        emailed: 0,
        emailedAmount: 0,
        pending: 0,
        processing: 0,
        generated: 0,
        failed: 0,
      }
    );
  }, [filteredRecords]);

  const refreshHistory = useCallback(async () => {
    setLoading(true);

    try {
      const response = await salarySlipService.getAll({
        page: 1,
        limit: 100,
      });

      const slips =
        response?.salarySlips ||
        response?.data?.salarySlips ||
        [];

      setRecords(readPayrollRecords(slips));
      setMessage("");
    } catch (error) {
      setRecords([]);
      setMessage(
        error?.response?.data?.message ||
          error.message ||
          "Unable to load salary history from backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const resetFilters = () => {
    setSearch("");
    setYear("All");
    setMonth("All");
    setStatus("All");
    setMessage("");
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      setMessage(
        "Export karne ke liye salary records available nahi hain."
      );
      return;
    }

    const headers = [
      "Slip ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Month",
      "Year",
      "Gross Earnings",
      "Deductions",
      "Net Salary",
      "Status",
      "Payment Date",
    ];

    const rows = filteredRecords.map((record) => [
      record.id,
      record.employeeId,
      record.employee,
      record.department,
      record.month,
      record.year,
      record.gross,
      record.deductions,
      record.net,
      record.status,
      record.payDate,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "salary-history.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setMessage("Salary history CSV successfully exported.");
  };

  return (
    <main className="salary-history-page">
      <header className="sh-heading">
        <div className="sh-heading-copy">
          <span className="sh-eyebrow">
            <FaHistory />
            PAYROLL / RECORDS
          </span>

          <h1>Salary History</h1>

          <p>
            Review previous salary records, payroll details and payment status.
          </p>
        </div>

        <div className="sh-heading-actions">
          <button
            type="button"
            className="sh-btn sh-btn-light"
            onClick={() => refreshHistory()}
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            type="button"
            className="sh-btn sh-btn-primary"
            onClick={exportCSV}
          >
            <FaDownload />
            Export History
          </button>
        </div>
      </header>

      <section className="sh-company-banner">
        <div className="sh-company-logo">
          <FaFileInvoiceDollar />
        </div>

        <div className="sh-company-info">
          <strong>Salary History</strong>
          <span>Payroll records and employee salary statements</span>
        </div>

        <div className="sh-banner-period">
          <span>REPORT PERIOD</span>
          <strong>{year === "All" ? "All Years" : year}</strong>
        </div>
      </section>

      <section className="sh-summary-grid">
        <article className="sh-summary-card">
          <div className="sh-card-top">
            <div className="sh-summary-icon sh-blue">
              <FaFileInvoiceDollar />
            </div>
            <span className="sh-card-label">RECORDS</span>
          </div>
          <strong className="sh-card-value">
            {filteredRecords.length}
          </strong>
          <span className="sh-card-description">
            Salary history entries
          </span>
        </article>

        <article className="sh-summary-card">
          <div className="sh-card-top">
            <div className="sh-summary-icon sh-green">
              <FaMoneyBillWave />
            </div>
            <span className="sh-card-label">GROSS EARNINGS</span>
          </div>
          <strong className="sh-card-value">
            {money(summary.gross)}
          </strong>
          <span className="sh-card-description">
            Before salary deductions
          </span>
        </article>

        <article className="sh-summary-card">
          <div className="sh-card-top">
            <div className="sh-summary-icon sh-red">
              <FaWallet />
            </div>
            <span className="sh-card-label">DEDUCTIONS</span>
          </div>
          <strong className="sh-card-value">
            {money(summary.deductions)}
          </strong>
          <span className="sh-card-description">
            Total recorded deductions
          </span>
        </article>

        <article className="sh-summary-card">
          <div className="sh-card-top">
            <div className="sh-summary-icon sh-teal">
              <FaChartLine />
            </div>
            <span className="sh-card-label">NET SALARY</span>
          </div>
          <strong className="sh-card-value">
            {money(summary.net)}
          </strong>
          <span className="sh-card-description">
            After deductions
          </span>
        </article>
      </section>

      <section className="sh-paid-summary">
        <div className="sh-paid-summary-icon">
          <FaMoneyBillWave />
        </div>

        <div className="sh-paid-summary-content">
          <span>Total net amount in emailed salary slips</span>
          <strong>{money(summary.emailedAmount)}</strong>
        </div>

        <div className="sh-paid-summary-count">
          <span>Emailed records</span>
          <strong>{summary.emailed}</strong>
        </div>
      </section>

      <section className="sh-history-card">
        <div className="sh-history-header">
          <div>
            <span className="sh-section-eyebrow">
              <FaCalendarAlt />
              PAYROLL MANAGEMENT
            </span>
            <h2>Monthly Payroll History</h2>
            <p>
              Search salary slips and review employee payment records.
            </p>
          </div>

          <span className="sh-history-count">
            {filteredRecords.length} Records
          </span>
        </div>

        <div className="sh-filter-row">
          <label className="sh-search-box">
            <FaSearch />
            <input
              type="search"
              placeholder="Search employee, ID or department..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search salary history"
            />
          </label>

          <select
            aria-label="Filter by year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="All">All Years</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            <option value="All">All Months</option>
            {months.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by payment status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Generated">Generated</option>
            <option value="Emailed">Emailed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            type="button"
            className="sh-reset-btn"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        {loading && (
          <div className="sh-message" role="status">
            Loading salary history from database…
          </div>
        )}

        {message && (
          <div className="sh-message" role="status">
            {message}
          </div>
        )}

        <div className="sh-status-overview">
          <span>
            <i className="sh-status-dot paid-dot" />
            Emailed: <strong>{summary.emailed}</strong>
          </span>
          <span>
            <i className="sh-status-dot generated-dot" />
            Generated: <strong>{summary.generated}</strong>
          </span>
          <span>
            <i className="sh-status-dot pending-dot" />
            Pending: <strong>{summary.pending}</strong>
          </span>
          <span>
            <i className="sh-status-dot processing-dot" />
            Failed: <strong>{summary.failed}</strong>
          </span>
        </div>

        <div className="sh-table-wrap">
          <table className="sh-table">
            <thead>
              <tr>
                <th>PAY PERIOD</th>
                <th>EMPLOYEE</th>
                <th>GROSS</th>
                <th>DEDUCTIONS</th>
                <th>NET SALARY</th>
                <th>STATUS</th>
                <th>PAYMENT DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const initials = record.employee
                    .trim()
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={record.id}>
                      <td>
                        <div className="sh-period">
                          <strong>
                            {record.month} {record.year}
                          </strong>
                          <small>{record.id}</small>
                        </div>
                      </td>

                      <td>
                        <div className="sh-employee">
                          <div className="sh-avatar">
                            {initials || "—"}
                          </div>

                          <div className="sh-employee-info">
                            <strong>{record.employee}</strong>
                            <small>
                              {record.employeeId || "No employee ID"}
                              {" · "}
                              {record.department}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td className="sh-money">
                        {money(record.gross)}
                      </td>

                      <td className="sh-red-text">
                        {money(record.deductions)}
                      </td>

                      <td className="sh-green-text">
                        {money(record.net)}
                      </td>

                      <td>
                        <span
                          className={`sh-status sh-status-${record.status.toLowerCase()}`}
                        >
                          <i />
                          {record.status}
                        </span>
                      </td>

                      <td className="sh-date">
                        {formatDate(record.payDate)}
                      </td>

                      <td>
                        <Link
                          className="sh-view-link"
                          to={`${detailsPath}/${encodeURIComponent(record.id)}`}
                          title="View salary slip details"
                        >
                          <FaEye />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="sh-empty">
                    <div className="sh-empty-icon">
                      <FaFileInvoiceDollar />
                    </div>
                    <strong>No salary history found</strong>
                    <span>
                      Saved payroll records yahan show honge. Search ya filters
                      change karke dekhein.
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

        <footer className="sh-table-footer">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of{" "}
            <strong>{records.length}</strong> records
          </span>
          <span>All amounts are in Indian Rupees (INR)</span>
        </footer>
      </section>

      <p className="sh-confidential">
        Salary History · Confidential payroll information
      </p>
    </main>
  );
}

export default SalaryHistory;
