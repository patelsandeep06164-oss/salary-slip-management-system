
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaDownload,
  FaMoneyBillWave,
  FaUsers,
  FaCalendarAlt,
  FaTimes,
  FaFileInvoiceDollar,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import payrollService from "../../services/payrollService";
import salarySlipService from "../../services/salarySlipService";
import "./PayrollHistory.css";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  "https://salary-slip-backend-rjgj.onrender.com/api"
).replace(/\/+$/, "");

const PAYROLL_API = `${API_BASE_URL}/payroll`;

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
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (value, yearValue) => {
  if (!value) return "—";

  if (
    yearValue &&
    Number.isInteger(Number(value)) &&
    Number(value) >= 1 &&
    Number(value) <= 12
  ) {
    return new Date(
      Number(yearValue),
      Number(value) - 1,
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }

  const match = String(value)
    .slice(0, 7)
    .match(/^(\d{4})-(\d{2})$/);

  if (!match) return String(value);

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) return String(value);

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
};

const getPayrollId = (record) =>
  String(record?._id ?? record?.id ?? record?.payrollId ?? "");

const getEmployeeId = (record) =>
  String(
    record?.employeeId?._id ??
      record?.employeeId ??
      record?.employee?._id ??
      record?.employee?.employeeCode ??
      record?.employee?.employeeId ??
      record?.employee?.id ??
      ""
  );

const getEmployeeName = (record) =>
  record?.employeeName ||
  record?.employee?.name ||
  record?.employee?.fullName ||
  [
    record?.employee?.firstName,
    record?.employee?.lastName,
  ]
    .filter(Boolean)
    .join(" ") ||
  "Unnamed Employee";

const extractRecords = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.payrolls)) return response.payrolls;
  if (Array.isArray(response?.payrollRecords)) {
    return response.payrollRecords;
  }
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.payrolls)) {
    return response.data.payrolls;
  }
  if (Array.isArray(response?.data?.payrollRecords)) {
    return response.data.payrollRecords;
  }
  if (Array.isArray(response?.data?.records)) {
    return response.data.records;
  }

  return [];
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const getErrorMessage = (data, fallback) =>
  data?.message || data?.error || fallback;

function PayrollHistory() {
  const navigate = useNavigate();

  const [payrollRecords, setPayrollRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [actionBusyId, setActionBusyId] = useState("");

  const loadPayrollRecords = useCallback(async () => {
    setLoading(true);
    setNotice("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(PAYROLL_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load payroll history.")
        );
      }

      setPayrollRecords(extractRecords(data));
    } catch (error) {
      console.error("Load Payroll History Error:", error);

      setNoticeType("error");
      setNotice(
        error.message || "Unable to connect to the payroll server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayrollRecords();
  }, [loadPayrollRecords]);

  const handleProcessPayroll = async (record) => {
    const id = getPayrollId(record);

    if (!id) {
      setNoticeType("error");
      setNotice("Payroll ID is missing. Refresh and try again.");
      return;
    }

    setActionBusyId(id);
    setNotice("");

    try {
      await payrollService.approve(
        id,
        record.remarks || "Processed by payroll admin"
      );

      setNoticeType("success");
      setNotice(
        "Payroll marked as processed. You can now generate its salary slip."
      );

      await loadPayrollRecords();
    } catch (error) {
      console.error("Process Payroll Error:", error);
      console.error("API response:", error.response?.data);

      setNoticeType("error");
      setNotice(
        error?.response?.data?.message ||
          error.message ||
          "Unable to process payroll."
      );
    } finally {
      setActionBusyId("");
    }
  };

  // Generate salary slip first, then send it by email.
  // Console logs identify which request is failing.
  const handleGenerateAndEmailSlip = async (record) => {
    const payrollId = getPayrollId(record);

    if (!payrollId) {
      setNoticeType("error");
      setNotice("Payroll ID is missing. Please refresh and try again.");
      return;
    }

    setActionBusyId(payrollId);
    setNotice("");

    try {
      console.log("STEP 1: Starting salary slip generation", {
        payrollId,
        employee: getEmployeeName(record),
      });

      let generated;

      try {
        generated = await salarySlipService.generate({ payrollId });

        console.log("STEP 2: Generate API response", generated);
      } catch (error) {
        console.error("SALARY SLIP GENERATION REQUEST FAILED:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          response: error.response?.data,
          message: error.message,
        });

        throw new Error(
          `Salary slip generation failed: ${
            error.response?.data?.message ||
            error.message ||
            "Unknown server error"
          }`
        );
      }

      const slip =
        generated?.salarySlip ||
        generated?.data?.salarySlip ||
        generated?.data ||
        null;

      const slipId = slip?._id || slip?.id;

      if (!slipId) {
        console.error(
          "Salary slip response does not contain a slip ID:",
          generated
        );

        throw new Error(
          "The server did not return a salary slip ID. Check the generate API response."
        );
      }

      console.log("STEP 3: Salary slip generated; sending email", {
        slipId,
        payrollId,
      });

      let emailResult;

      try {
        emailResult = await salarySlipService.email(slipId);

        console.log("STEP 4: Email API response", emailResult);
      } catch (error) {
        console.error("SALARY SLIP EMAIL REQUEST FAILED:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          response: error.response?.data,
          message: error.message,
        });

        throw new Error(
          `Salary slip was generated, but email failed: ${
            error.response?.data?.message ||
            error.message ||
            "Unknown server error"
          }`
        );
      }

      setNoticeType("success");
      setNotice(
        "Salary slip generated and email request completed successfully."
      );

      await loadPayrollRecords();
    } catch (error) {
      console.error("GENERATE & EMAIL SLIP FAILED:", error);

      setNoticeType("error");
      setNotice(
        error.message || "Salary slip generation/email failed."
      );
    } finally {
      setActionBusyId("");
    }
  };

  const availableMonths = useMemo(() => {
    const months = payrollRecords.map((record) => {
      const month = record.month ?? record.payrollMonth;
      const year = record.year ?? record.payrollYear;

      if (
        year &&
        Number.isInteger(Number(month)) &&
        Number(month) >= 1 &&
        Number(month) <= 12
      ) {
        return `${year}-${String(month).padStart(2, "0")}`;
      }

      return String(month || "").slice(0, 7);
    });

    return [
      ...new Set(
        months.filter((month) => /^\d{4}-\d{2}$/.test(month))
      ),
    ].sort((a, b) => b.localeCompare(a));
  }, [payrollRecords]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return payrollRecords
      .filter((record) => {
        const employeeName = getEmployeeName(record).toLowerCase();
        const employeeId = getEmployeeId(record).toLowerCase();
        const payrollId = getPayrollId(record).toLowerCase();

        const department = String(
          record.department ||
            record.employee?.department?.name ||
            record.employee?.department ||
            ""
        ).toLowerCase();

        const matchesSearch =
          !query ||
          employeeName.includes(query) ||
          employeeId.includes(query) ||
          department.includes(query) ||
          payrollId.includes(query);

        const rawMonth = record.month ?? record.payrollMonth;
        const rawYear = record.year ?? record.payrollYear;

        const recordMonth =
          rawYear &&
          Number.isInteger(Number(rawMonth)) &&
          Number(rawMonth) >= 1 &&
          Number(rawMonth) <= 12
            ? `${rawYear}-${String(rawMonth).padStart(2, "0")}`
            : String(rawMonth || "").slice(0, 7);

        const matchesMonth =
          !monthFilter || recordMonth === monthFilter;

        const status = String(record.status || "Generated").toLowerCase();

        const matchesStatus =
          statusFilter === "All" ||
          status === statusFilter.toLowerCase();

        return matchesSearch && matchesMonth && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt || a.generatedOn || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.generatedOn || 0
        ).getTime();

        return dateB - dateA;
      });
  }, [payrollRecords, searchTerm, monthFilter, statusFilter]);

  const totalNetPay = filteredRecords.reduce(
    (sum, record) => sum + (Number(record.netSalary) || 0),
    0
  );

  const totalGrossPay = filteredRecords.reduce(
    (sum, record) => sum + (Number(record.grossSalary) || 0),
    0
  );

  const uniqueEmployees = new Set(
    filteredRecords.map(getEmployeeId).filter(Boolean)
  ).size;

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      setNoticeType("error");
      setNotice("There are no payroll records to export.");
      return;
    }

    const headers = [
      "Payroll ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Month",
      "Working Days",
      "Present Days",
      "Absent Days",
      "Basic Salary",
      "HRA",
      "Allowances",
      "Bonus",
      "Gross Salary",
      "Deductions",
      "Net Salary",
      "Status",
      "Generated On",
    ];

    const rows = filteredRecords.map((record) => [
      getPayrollId(record),
      getEmployeeId(record),
      getEmployeeName(record),
      record.department || "",
      record.designation || record.position || "",
      formatMonth(
        record.month ?? record.payrollMonth,
        record.year ?? record.payrollYear
      ),
      record.workingDays ?? "",
      record.daysPresent ?? record.paidDays ?? "",
      record.daysAbsent ?? "",
      record.basicSalary ?? 0,
      record.hra ?? 0,
      record.allowances ?? 0,
      record.bonus ?? 0,
      record.grossSalary ?? 0,
      record.totalDeductions ?? record.deductions ?? 0,
      record.netSalary ?? 0,
      record.status || "Generated",
      formatDate(record.generatedOn || record.createdAt),
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `payroll-history-${monthFilter || "all"}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setNoticeType("success");
    setNotice("Payroll history exported successfully.");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMonthFilter("");
    setStatusFilter("All");
    setNotice("");
  };

  const getStatusClass = (status) =>
    String(status || "Generated")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  const openPayrollDetails = (record) => {
    const id = getPayrollId(record);

    if (!id) {
      setNoticeType("error");
      setNotice(
        "This payroll record has no ID. Please refresh the records and try again."
      );
      return;
    }

    navigate(`/admin/payroll/details/${encodeURIComponent(id)}`);
  };

  return (
    <div className="payroll-history-page">
      <div className="payroll-history-header">
        <div className="payroll-history-heading">
          <span className="payroll-history-eyebrow">
            PAYROLL MANAGEMENT
          </span>

          <h1>Payroll History</h1>

          <p>
            Track generated payroll, review salary details, and export records.
          </p>
        </div>

        <div className="payroll-history-header-actions">
          <button
            type="button"
            className="payroll-history-secondary-btn"
            onClick={() => navigate("/admin/payroll/generate")}
          >
            <FaArrowLeft /> Back to Payroll
          </button>

          <button
            type="button"
            className="payroll-history-primary-btn"
            onClick={() => navigate("/admin/payroll/generate")}
          >
            <FaMoneyBillWave /> Generate Payroll
          </button>

          <button
            type="button"
            className="payroll-history-refresh-btn"
            onClick={loadPayrollRecords}
            disabled={loading}
            aria-label="Refresh payroll history"
          >
            <FaSyncAlt
              className={loading ? "payroll-history-spin" : ""}
            />
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`payroll-history-notice ${noticeType}`}
          role="status"
        >
          {noticeType === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}

          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="payroll-history-stats">
        <div className="payroll-history-stat-card">
          <div className="payroll-history-stat-icon blue">
            <FaFileInvoiceDollar />
          </div>
          <div className="payroll-history-stat-info">
            <span>Payroll Records</span>
            <h3>{loading ? "—" : filteredRecords.length}</h3>
            <small>Matching current filters</small>
          </div>
        </div>

        <div className="payroll-history-stat-card">
          <div className="payroll-history-stat-icon purple">
            <FaUsers />
          </div>
          <div className="payroll-history-stat-info">
            <span>Employees</span>
            <h3>{loading ? "—" : uniqueEmployees}</h3>
            <small>In filtered results</small>
          </div>
        </div>

        <div className="payroll-history-stat-card">
          <div className="payroll-history-stat-icon green">
            <FaMoneyBillWave />
          </div>
          <div className="payroll-history-stat-info">
            <span>Total Net Pay</span>
            <h3>{loading ? "—" : formatCurrency(totalNetPay)}</h3>
            <small>After deductions</small>
          </div>
        </div>

        <div className="payroll-history-stat-card">
          <div className="payroll-history-stat-icon orange">
            <FaCalendarAlt />
          </div>
          <div className="payroll-history-stat-info">
            <span>Total Gross Pay</span>
            <h3>{loading ? "—" : formatCurrency(totalGrossPay)}</h3>
            <small>Before deductions</small>
          </div>
        </div>
      </div>

      <section className="payroll-history-content">
        <div className="payroll-history-toolbar">
          <div>
            <h2>Generated Payroll Records</h2>
            <p>
              Search, filter, inspect, and export employee salary records.
            </p>
          </div>

          <button
            type="button"
            className="payroll-history-export-btn"
            onClick={handleExportCsv}
            disabled={loading || filteredRecords.length === 0}
          >
            <FaDownload /> Export CSV
          </button>
        </div>

        <div className="payroll-history-filters">
          <div className="payroll-history-search">
            <FaSearch />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search employee, ID or department..."
              aria-label="Search payroll history"
            />
          </div>

          <div className="payroll-history-filter-control">
            <FaCalendarAlt />
            <select
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              aria-label="Filter by payroll month"
            >
              <option value="">All Months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </div>

          <div className="payroll-history-filter-control">
            <FaFilter />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by payroll status"
            >
              <option value="All">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="button"
            className="payroll-history-clear-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="payroll-history-table-wrap">
          <table className="payroll-history-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Payroll Month</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Generated On</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredRecords.map((record, index) => {
                  const status = record.status || "draft";
                  const id = getPayrollId(record);

                  return (
                    <tr
                      key={id || `${getEmployeeId(record)}-${index}`}
                    >
                      <td>
                        <div className="payroll-history-employee">
                          <div className="payroll-history-avatar">
                            {getEmployeeName(record)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="payroll-history-employee-info">
                            <strong>{getEmployeeName(record)}</strong>
                            <span>
                              ID: {getEmployeeId(record) || "—"}
                            </span>
                            <small>
                              {record.department ||
                                record.employee?.department?.name ||
                                record.employee?.department ||
                                "No department"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="payroll-history-month">
                          {formatMonth(
                            record.month ?? record.payrollMonth,
                            record.year ?? record.payrollYear
                          )}
                        </span>
                      </td>

                      <td>{formatCurrency(record.grossSalary)}</td>

                      <td className="payroll-history-deduction">
                        {formatCurrency(
                          record.totalDeductions ?? record.deductions
                        )}
                      </td>

                      <td className="payroll-history-net">
                        {formatCurrency(record.netSalary)}
                      </td>

                      <td>
                        <span
                          className={`payroll-history-status ${getStatusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {formatDate(record.generatedOn || record.createdAt)}
                      </td>

                      <td>
                        <div className="payroll-history-row-actions">
                          <button
                            type="button"
                            className="payroll-history-view-btn"
                            onClick={() => openPayrollDetails(record)}
                            disabled={!id || Boolean(actionBusyId)}
                            aria-label={`View payroll for ${getEmployeeName(record)}`}
                          >
                            <FaEye /> View
                          </button>

                          {String(status).toLowerCase() === "draft" && (
                            <button
                              type="button"
                              className="payroll-history-view-btn"
                              onClick={() => handleProcessPayroll(record)}
                              disabled={Boolean(actionBusyId)}
                            >
                              {actionBusyId === id ? "Processing…" : "Process"}
                            </button>
                          )}

                          {["processed", "paid"].includes(
                            String(status).toLowerCase()
                          ) && (
                            <button
                              type="button"
                              className="payroll-history-view-btn"
                              onClick={() =>
                                handleGenerateAndEmailSlip(record)
                              }
                              disabled={Boolean(actionBusyId)}
                            >
                              {actionBusyId === id
                                ? "Working…"
                                : "Generate & Email Slip"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {loading && (
                <tr>
                  <td colSpan="8">
                    <div className="payroll-history-empty">
                      <span className="payroll-history-loader" />
                      <p>Loading payroll history...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="payroll-history-empty">
                      <div className="payroll-history-empty-icon">
                        <FaFileInvoiceDollar />
                      </div>
                      <h3>No payroll records found</h3>
                      <p>
                        Try changing the filters or generate payroll to create
                        your first record.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/payroll/generate")}
                      >
                        Generate Payroll
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payroll-history-footer">
          <span>
            Showing{" "}
            <strong>{loading ? "—" : filteredRecords.length}</strong> of{" "}
            <strong>{loading ? "—" : payrollRecords.length}</strong> records
          </span>
          <span>Currency: INR (₹)</span>
        </div>
      </section>
    </div>
  );
}

export default PayrollHistory;
