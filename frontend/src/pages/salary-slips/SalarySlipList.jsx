
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaFileInvoiceDollar,
  FaEye,
  FaDownload,
  FaSyncAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaEnvelope,
  FaExclamationCircle,
} from "react-icons/fa";
import salarySlipService from "../../services/salarySlipService";
import "./SalarySlipList.css";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (slip) => {
  const status = String(
    slip.status || slip.emailStatus || "Pending"
  ).toLowerCase();

  if (status === "emailed" || status === "sent") return "Emailed";
  if (status === "generated") return "Generated";
  if (status === "paid") return "Paid";
  if (status === "failed" || status === "cancelled") return "Failed";

  return "Pending";
};

const getEmployeeName = (slip) => {
  const employee = slip.employee || slip.employeeDetails || {};

  const name = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    name ||
    employee.name ||
    employee.fullName ||
    slip.employeeName ||
    "Employee"
  );
};

const getNetSalary = (slip) => {
  const payroll = slip.payroll || slip.payrollDetails || {};

  return Number(
    slip.netSalary ??
      payroll.netSalary ??
      slip.salary ??
      0
  );
};

const getSlipId = (slip) =>
  String(slip._id || slip.id || slip.salarySlipId || "");

function SalarySlipList() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const detailsBase = isAdmin
    ? "/admin/salary-slips/details"
    : "/employee/salary-slips/details";

  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [error, setError] = useState("");

  const loadSalarySlips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await salarySlipService.getAll({
        page: 1,
        limit: 100,
      });

      const data =
        response?.salarySlips ||
        response?.data?.salarySlips ||
        response?.data?.data?.salarySlips ||
        [];

      setSalarySlips(Array.isArray(data) ? data : []);
    } catch (err) {
      setSalarySlips([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Salary slips load nahi ho payin. Backend connection check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalarySlips();
  }, [loadSalarySlips]);

  const months = useMemo(() => {
    return [
      ...new Set(
        salarySlips.map((slip) => {
          const payroll = slip.payroll || {};
          const month = slip.month ?? payroll.month ?? "";
          const year = slip.year ?? payroll.year ?? "";

          return month && year ? `${month}-${year}` : "";
        }).filter(Boolean)
      ),
    ].sort().reverse();
  }, [salarySlips]);

  const filteredSlips = useMemo(() => {
    const query = search.trim().toLowerCase();

    return salarySlips.filter((slip) => {
      const employee = slip.employee || slip.employeeDetails || {};
      const employeeName = getEmployeeName(slip).toLowerCase();
      const employeeId = String(
        employee.employeeCode ||
          employee._id ||
          slip.employeeId ||
          ""
      ).toLowerCase();

      const slipId = getSlipId(slip).toLowerCase();
      const status = getStatus(slip);

      const payroll = slip.payroll || {};
      const month = slip.month ?? payroll.month ?? "";
      const year = slip.year ?? payroll.year ?? "";
      const monthKey = month && year ? `${month}-${year}` : "";

      const matchesSearch =
        !query ||
        employeeName.includes(query) ||
        employeeId.includes(query) ||
        slipId.includes(query);

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      const matchesMonth =
        monthFilter === "All" || monthKey === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [salarySlips, search, statusFilter, monthFilter]);

  const stats = useMemo(() => {
    return filteredSlips.reduce(
      (result, slip) => {
        result.total += 1;
        result.netSalary += getNetSalary(slip);

        const status = getStatus(slip);

        if (status === "Emailed") result.emailed += 1;
        if (status === "Generated") result.generated += 1;
        if (status === "Pending") result.pending += 1;
        if (status === "Failed") result.failed += 1;

        return result;
      },
      {
        total: 0,
        netSalary: 0,
        emailed: 0,
        generated: 0,
        pending: 0,
        failed: 0,
      }
    );
  }, [filteredSlips]);

  const downloadCSV = () => {
    if (!filteredSlips.length) {
      setError("Export karne ke liye koi salary slip available nahi hai.");
      return;
    }

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Salary Slip ID",
      "Employee Name",
      "Employee ID",
      "Month",
      "Year",
      "Net Salary",
      "Status",
      "Created Date",
    ];

    const rows = filteredSlips.map((slip) => {
      const employee = slip.employee || slip.employeeDetails || {};
      const payroll = slip.payroll || {};
      const month = slip.month ?? payroll.month ?? "";
      const year = slip.year ?? payroll.year ?? "";

      return [
        getSlipId(slip),
        getEmployeeName(slip),
        employee.employeeCode || employee._id || slip.employeeId || "",
        month,
        year,
        getNetSalary(slip),
        getStatus(slip),
        slip.createdAt || "",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "salary-slips.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="salary-slip-list-page">
      <header className="ssl-heading">
        <div>
          <span className="ssl-eyebrow">
            <FaFileInvoiceDollar />
            PAYROLL MANAGEMENT
          </span>
          <h1>Salary Slips</h1>
          <p>
            View, search and manage salary slips generated from payroll records.
          </p>
        </div>

        <div className="ssl-heading-actions">
          <button
            type="button"
            className="ssl-btn ssl-btn-light"
            onClick={loadSalarySlips}
            disabled={loading}
          >
            <FaSyncAlt />
            Refresh
          </button>

          <button
            type="button"
            className="ssl-btn ssl-btn-primary"
            onClick={downloadCSV}
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </header>

      <section className="ssl-banner">
        <div className="ssl-banner-icon">
          <FaFileInvoiceDollar />
        </div>

        <div className="ssl-banner-text">
          <h2>Salary Slip Records</h2>
          <p>Database-connected salary slip management</p>
        </div>

        <div className="ssl-banner-count">
          <span>TOTAL RECORDS</span>
          <strong>{stats.total}</strong>
        </div>
      </section>

      <section className="ssl-stats-grid">
        <article className="ssl-stat-card">
          <div className="ssl-stat-icon ssl-icon-blue">
            <FaFileInvoiceDollar />
          </div>
          <span>Total Slips</span>
          <strong>{stats.total}</strong>
          <small>Matching current filters</small>
        </article>

        <article className="ssl-stat-card">
          <div className="ssl-stat-icon ssl-icon-green">
            <FaMoneyBillWave />
          </div>
          <span>Total Net Salary</span>
          <strong>{money(stats.netSalary)}</strong>
          <small>For displayed records</small>
        </article>

        <article className="ssl-stat-card">
          <div className="ssl-stat-icon ssl-icon-teal">
            <FaEnvelope />
          </div>
          <span>Emailed</span>
          <strong>{stats.emailed}</strong>
          <small>Salary slips emailed</small>
        </article>

        <article className="ssl-stat-card">
          <div className="ssl-stat-icon ssl-icon-orange">
            <FaCalendarAlt />
          </div>
          <span>Pending</span>
          <strong>{stats.pending}</strong>
          <small>Awaiting completion</small>
        </article>
      </section>

      <section className="ssl-table-card">
        <div className="ssl-table-heading">
          <div>
            <h2>All Salary Slips</h2>
            <p>Search employee records and filter by month or status.</p>
          </div>
          <span className="ssl-record-count">
            {filteredSlips.length} records
          </span>
        </div>

        <div className="ssl-filters">
          <label className="ssl-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee or slip ID..."
              aria-label="Search salary slips"
            />
          </label>

          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            aria-label="Filter by month"
          >
            <option value="All">All Months</option>
            {months.map((item) => (
              <option value={item} key={item}>
                {item.replace("-", " / ")}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="Generated">Generated</option>
            <option value="Emailed">Emailed</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            type="button"
            className="ssl-reset-btn"
            onClick={() => {
              setSearch("");
              setMonthFilter("All");
              setStatusFilter("All");
              setError("");
            }}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="ssl-alert" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="ssl-state">
            <FaSyncAlt className="ssl-loading-icon" />
            <strong>Loading salary slips...</strong>
            <span>Please wait while records are fetched from the backend.</span>
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="ssl-state">
            <div className="ssl-empty-icon">
              <FaFileInvoiceDollar />
            </div>
            <strong>No salary slips found</strong>
            <span>
              Backend mein records available hone par yahan dikhai denge.
            </span>
          </div>
        ) : (
          <div className="ssl-table-wrap">
            <table className="ssl-table">
              <thead>
                <tr>
                  <th>SALARY SLIP</th>
                  <th>EMPLOYEE</th>
                  <th>PAY PERIOD</th>
                  <th>NET SALARY</th>
                  <th>STATUS</th>
                  <th>GENERATED DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredSlips.map((slip) => {
                  const employee = slip.employee || slip.employeeDetails || {};
                  const employeeCode =
                    employee.employeeCode ||
                    employee._id ||
                    slip.employeeId ||
                    "—";

                  const name = getEmployeeName(slip);

                  const initials = name
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const payroll = slip.payroll || {};
                  const month = slip.month ?? payroll.month ?? "—";
                  const year = slip.year ?? payroll.year ?? "—";
                  const slipId = getSlipId(slip);
                  const status = getStatus(slip);

                  return (
                    <tr key={slipId}>
                      <td>
                        <div className="ssl-slip-cell">
                          <div className="ssl-slip-icon">
                            <FaFileInvoiceDollar />
                          </div>
                          <div>
                            <strong>
                              {slip.slipNumber || slipId || "Salary Slip"}
                            </strong>
                            <small>Salary statement</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ssl-employee-cell">
                          <div className="ssl-avatar">
                            {initials || "E"}
                          </div>
                          <div>
                            <strong>{name}</strong>
                            <small>{employeeCode}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ssl-period-cell">
                          <strong>{month}</strong>
                          <small>{year}</small>
                        </div>
                      </td>

                      <td className="ssl-salary">
                        {money(getNetSalary(slip))}
                      </td>

                      <td>
                        <span
                          className={`ssl-status ssl-status-${status.toLowerCase()}`}
                        >
                          <i />
                          {status}
                        </span>
                      </td>

                      <td>{formatDate(slip.createdAt)}</td>

                      <td>
                        <Link
                          className="ssl-view-btn"
                          to={`${detailsBase}/${encodeURIComponent(slipId)}`}
                          title="View salary slip"
                        >
                          <FaEye />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="ssl-footer">
          <span>
            Showing <strong>{filteredSlips.length}</strong> of{" "}
            <strong>{salarySlips.length}</strong> salary slips
          </span>
          <span>Currency: INR (₹)</span>
        </footer>
      </section>

      <p className="ssl-confidential">
        Salary Slip Management · Confidential payroll information
      </p>
    </main>
  );
}

export default SalarySlipList;
