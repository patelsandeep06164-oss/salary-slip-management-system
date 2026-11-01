
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaSyncAlt,
  FaHistory,
  FaCheckCircle,
} from "react-icons/fa";

import attendanceService from "../../services/attendantService";
import "./EmployeeAttendance.css";

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};
  parts.forEach((part) => {
    if (part.type !== "literal") values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function getIndiaDate(value) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};
  parts.forEach((part) => {
    if (part.type !== "literal") values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(value) {
  const dateValue = getIndiaDate(value);
  if (!dateValue) return "—";

  const [year, month, day] = dateValue.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatHours(value) {
  const hours = Number(value);
  return Number.isFinite(hours) ? `${hours.toFixed(2)} hrs` : "0.00 hrs";
}

function normalizeStatus(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function getStatusLabel(value) {
  const status = normalizeStatus(value);

  const labels = {
    present: "Present",
    late: "Late",
    absent: "Absent",
    "half-day": "Half Day",
    "on-leave": "On Leave",
    holiday: "Holiday",
  };

  return labels[status] || "Not Marked";
}

function getStatusClass(value) {
  const status = normalizeStatus(value);

  return [
    "present",
    "late",
    "absent",
    "half-day",
    "on-leave",
    "holiday",
  ].includes(status)
    ? status
    : "unknown";
}

function getRecords(response) {
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getSummary(response) {
  const value = response?.summary ?? response?.data?.summary;

  if (Array.isArray(value)) return value[0] || {};
  if (value && typeof value === "object") return value;

  return {};
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function EmployeeAttendance() {
  const today = getIndiaToday();
  const currentMonth = today.slice(0, 7);

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const showNotice = useCallback((message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  }, []);

  const loadAttendance = useCallback(
    async (showRefreshNotice = false) => {
      setRefreshing(true);
      setError("");

      try {
        const [attendanceResponse, summaryResponse] = await Promise.all([
          attendanceService.getAll({
            startDate: `${selectedMonth}-01`,
            endDate: getNextMonthDate(selectedMonth),
            page: 1,
            limit: 100,
          }),
          attendanceService.getMonthlySummary({
            month: Number(selectedMonth.split("-")[1]),
            year: Number(selectedMonth.split("-")[0]),
          }),
        ]);

        setRecords(getRecords(attendanceResponse));
        setSummary(getSummary(summaryResponse));

        if (showRefreshNotice) {
          showNotice("Attendance records refreshed successfully.");
        }
      } catch (requestError) {
        console.error("Employee attendance loading failed:", requestError);

        setError(
          getErrorMessage(
            requestError,
            "Unable to load attendance records. Please try again."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMonth, showNotice]
  );

  useEffect(() => {
    loadAttendance(false);
  }, [loadAttendance]);

  function getNextMonthDate(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);

    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;

    return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  }

  const todayRecord = useMemo(
    () => records.find((record) => getIndiaDate(record.date) === today),
    [records, today]
  );

  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);

  const canCheckIn = !hasCheckedIn && !actionLoading;
  const canCheckOut = hasCheckedIn && !hasCheckedOut && !actionLoading;

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) =>
        getIndiaDate(b.date).localeCompare(getIndiaDate(a.date))
      ),
    [records]
  );

  async function handleCheckIn() {
    if (!canCheckIn) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await attendanceService.checkIn();

      showNotice("Your check-in has been recorded successfully.");
      await loadAttendance(false);
    } catch (requestError) {
      console.error("Employee check-in failed:", requestError);

      showNotice(
        getErrorMessage(requestError, "Unable to record check-in."),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!canCheckOut) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await attendanceService.checkOut();

      showNotice("Your check-out has been recorded successfully.");
      await loadAttendance(false);
    } catch (requestError) {
      console.error("Employee check-out failed:", requestError);

      showNotice(
        getErrorMessage(requestError, "Unable to record check-out."),
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  const monthLabel = new Date(
    Number(selectedMonth.split("-")[0]),
    Number(selectedMonth.split("-")[1]) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="employee-attendance-page">
      <header className="employee-attendance-header">
        <div>
          <span className="employee-attendance-eyebrow">
            EMPLOYEE SELF SERVICE
          </span>
          <h1>My Attendance</h1>
          <p>Check in, check out and review your attendance history.</p>
        </div>

        <button
          type="button"
          className="employee-attendance-refresh"
          onClick={() => loadAttendance(true)}
          disabled={refreshing || actionLoading}
        >
          <FaSyncAlt className={refreshing ? "is-spinning" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {notice && (
        <div
          className={`employee-attendance-notice ${noticeType}`}
          role={noticeType === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            Dismiss
          </button>
        </div>
      )}

      <section className="employee-attendance-today">
        <div className="employee-attendance-today-heading">
          <div>
            <span className="employee-attendance-section-label">
              TODAY'S ATTENDANCE
            </span>
            <h2>{formatDate(today)}</h2>
          </div>

          <span
            className={`employee-attendance-status ${getStatusClass(
              todayRecord?.status
            )}`}
          >
            {getStatusLabel(todayRecord?.status)}
          </span>
        </div>

        <div className="employee-attendance-punch-grid">
          <article className="employee-attendance-punch-card">
            <span className="employee-attendance-punch-icon check-in">
              <FaSignInAlt />
            </span>

            <div className="employee-attendance-punch-info">
              <span>Check In</span>
              <strong>
                {hasCheckedIn ? formatTime(todayRecord.checkIn) : "Not yet"}
              </strong>
            </div>

            <button
              type="button"
              className="employee-attendance-checkin-btn"
              onClick={handleCheckIn}
              disabled={!canCheckIn}
            >
              <FaSignInAlt />
              {actionLoading
                ? "Please wait..."
                : hasCheckedIn
                  ? "Checked In"
                  : "Check In"}
            </button>
          </article>

          <article className="employee-attendance-punch-card">
            <span className="employee-attendance-punch-icon check-out">
              <FaSignOutAlt />
            </span>

            <div className="employee-attendance-punch-info">
              <span>Check Out</span>
              <strong>
                {hasCheckedOut ? formatTime(todayRecord.checkOut) : "Not yet"}
              </strong>
            </div>

            <button
              type="button"
              className="employee-attendance-checkout-btn"
              onClick={handleCheckOut}
              disabled={!canCheckOut}
            >
              <FaSignOutAlt />
              {actionLoading
                ? "Please wait..."
                : hasCheckedOut
                  ? "Checked Out"
                  : "Check Out"}
            </button>
          </article>
        </div>

        {!hasCheckedIn && (
          <p className="employee-attendance-hint">
            You have not checked in today. Use the Check In button to record
            your attendance.
          </p>
        )}

        {hasCheckedIn && !hasCheckedOut && (
          <p className="employee-attendance-hint">
            Your check-in is recorded. Please check out when your workday ends.
          </p>
        )}

        {hasCheckedOut && (
          <p className="employee-attendance-hint success">
            <FaCheckCircle /> Your attendance for today is complete.
          </p>
        )}
      </section>

      <section className="employee-attendance-summary">
        <div className="employee-attendance-section-heading">
          <div>
            <span className="employee-attendance-section-label">
              MONTHLY OVERVIEW
            </span>
            <h2>{monthLabel}</h2>
          </div>

          <label className="employee-attendance-month-picker">
            <FaCalendarAlt />
            <input
              type="month"
              value={selectedMonth}
              max={currentMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              aria-label="Select attendance month"
            />
          </label>
        </div>

        <div className="employee-attendance-summary-grid">
          <article className="employee-attendance-summary-card blue">
            <span>Total Records</span>
            <strong>{loading ? "—" : summary.totalRecords ?? records.length}</strong>
            <small>Attendance entries</small>
          </article>

          <article className="employee-attendance-summary-card green">
            <span>Present</span>
            <strong>{loading ? "—" : summary.present ?? 0}</strong>
            <small>Present days</small>
          </article>

          <article className="employee-attendance-summary-card orange">
            <span>Late</span>
            <strong>{loading ? "—" : summary.late ?? 0}</strong>
            <small>Late entries</small>
          </article>

          <article className="employee-attendance-summary-card red">
            <span>Absent</span>
            <strong>{loading ? "—" : summary.absent ?? 0}</strong>
            <small>Absent days</small>
          </article>

          <article className="employee-attendance-summary-card purple">
            <span>Half Days</span>
            <strong>{loading ? "—" : summary.halfDays ?? 0}</strong>
            <small>Half-day entries</small>
          </article>

          <article className="employee-attendance-summary-card teal">
            <span>Work Hours</span>
            <strong>
              {loading ? "—" : formatHours(summary.workHours)}
            </strong>
            <small>Total recorded hours</small>
          </article>
        </div>
      </section>

      <section className="employee-attendance-history">
        <div className="employee-attendance-section-heading">
          <div>
            <span className="employee-attendance-section-label">
              ATTENDANCE HISTORY
            </span>
            <h2>My Records</h2>
            <p>Your attendance entries for the selected month.</p>
          </div>

          <span className="employee-attendance-record-count">
            {loading ? "Loading..." : `${sortedRecords.length} Records`}
          </span>
        </div>

        {error ? (
          <div className="employee-attendance-empty error">
            <FaClock />
            <strong>Unable to load attendance</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="employee-attendance-empty">
            <FaSyncAlt className="is-spinning" />
            <strong>Loading your attendance...</strong>
            <p>Please wait while your records are fetched.</p>
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="employee-attendance-empty">
            <FaHistory />
            <strong>No attendance records found</strong>
            <p>No attendance entries are available for {monthLabel}.</p>
          </div>
        ) : (
          <div className="employee-attendance-table-wrap">
            <table className="employee-attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {sortedRecords.map((record, index) => (
                  <tr key={record._id || record.id || index}>
                    <td>{formatDate(record.date)}</td>
                    <td>{formatTime(record.checkIn)}</td>
                    <td>{formatTime(record.checkOut)}</td>
                    <td>{formatHours(record.workHours)}</td>
                    <td>
                      <span
                        className={`employee-attendance-status ${getStatusClass(
                          record.status
                        )}`}
                      >
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="employee-attendance-security-note">
        <FaCheckCircle />
        <span>
          Your attendance is linked to your signed-in employee account. You can
          only view and record your own attendance.
        </span>
      </div>
    </div>
  );
}
