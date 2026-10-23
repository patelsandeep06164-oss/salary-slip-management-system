
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaDownload,
  FaChartBar,
} from "react-icons/fa";
import "./AttendanceReports.css";

function readAttendance() {
  try {
    return JSON.parse(localStorage.getItem("attendance_records") || "[]");
  } catch {
    return [];
  }
}

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AttendanceReports() {
  const [records] = useState(readAttendance);
  const [fromDate, setFromDate] = useState(getMonthStart);
  const [toDate, setToDate] = useState(getToday);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const filteredRecords = useMemo(() => {
    if (fromDate && toDate && fromDate > toDate) return [];

    return records.filter((record) => {
      const matchesDate =
        (!fromDate || record.date >= fromDate) &&
        (!toDate || record.date <= toDate);

      const matchesStatus = status === "All" || record.status === status;

      const name = [
        record.employeeName,
        record.employeeCode,
        record.department,
      ].join(" ").toLowerCase();

      return (
        matchesDate &&
        matchesStatus &&
        name.includes(search.toLowerCase())
      );
    });
  }, [records, fromDate, toDate, status, search]);

  const totals = useMemo(() => {
    const count = (value) =>
      filteredRecords.filter((record) => record.status === value).length;

    return {
      total: filteredRecords.length,
      present: count("Present"),
      late: count("Late"),
      absent: count("Absent"),
      halfDay: count("Half Day"),
      leave: count("Leave"),
    };
  }, [filteredRecords]);

  const attendanceRate = totals.total
    ? Math.round(((totals.present + totals.late + totals.halfDay) / totals.total) * 100)
    : 0;

  const employeeSummary = useMemo(() => {
    const grouped = new Map();

    filteredRecords.forEach((record) => {
      const key = String(record.employeeId);

      if (!grouped.has(key)) {
        grouped.set(key, {
          employeeId: key,
          employeeName: record.employeeName || "Unknown Employee",
          employeeCode: record.employeeCode || "—",
          department: record.department || "—",
          present: 0,
          late: 0,
          absent: 0,
          halfDay: 0,
          leave: 0,
          total: 0,
        });
      }

      const employee = grouped.get(key);
      employee.total += 1;

      if (record.status === "Present") employee.present += 1;
      if (record.status === "Late") employee.late += 1;
      if (record.status === "Absent") employee.absent += 1;
      if (record.status === "Half Day") employee.halfDay += 1;
      if (record.status === "Leave") employee.leave += 1;
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );
  }, [filteredRecords]);

  function exportReport() {
    setError("");

    if (fromDate && toDate && fromDate > toDate) {
      setError("Start date cannot be later than end date.");
      return;
    }

    if (!filteredRecords.length) {
      setError("There are no records to export for these filters.");
      return;
    }

    const columns = [
      ["Employee", "employeeName"],
      ["Employee ID", "employeeCode"],
      ["Department", "department"],
      ["Date", "date"],
      ["Check In", "checkIn"],
      ["Check Out", "checkOut"],
      ["Status", "status"],
      ["Notes", "notes"],
    ];

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...filteredRecords.map((record) =>
        columns.map(([, key]) => escapeCsv(record[key])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `attendance-report-${fromDate || "all"}-to-${toDate || "all"}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setFromDate(getMonthStart());
    setToDate(getToday());
    setStatus("All");
    setSearch("");
    setError("");
  }

  return (
    <div className="attendance-reports-page">
      <header className="attendance-reports-header">
        <div>
          <h1>Attendance Reports</h1>
          <p>Analyze attendance trends and export employee attendance data.</p>
        </div>

        <button
          type="button"
          className="attendance-report-export"
          onClick={exportReport}
        >
          <FaDownload /> Export CSV
        </button>
      </header>

      <section className="attendance-report-filter-card">
        <div className="attendance-report-filter-title">
          <FaCalendarAlt />
          <h2>Report Filters</h2>
        </div>

        <div className="attendance-report-filters">
          <div className="attendance-report-field">
            <label htmlFor="reportFromDate">From Date</label>
            <input
              id="reportFromDate"
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value);
                setError("");
              }}
            />
          </div>

          <div className="attendance-report-field">
            <label htmlFor="reportToDate">To Date</label>
            <input
              id="reportToDate"
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value);
                setError("");
              }}
            />
          </div>

          <div className="attendance-report-field">
            <label htmlFor="reportStatus">Status</label>
            <select
              id="reportStatus"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
            </select>
          </div>

          <div className="attendance-report-field">
            <label htmlFor="reportSearch">Employee</label>
            <input
              id="reportSearch"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, ID or department"
            />
          </div>

          <button
            type="button"
            className="attendance-report-reset"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        {fromDate && toDate && fromDate > toDate && (
          <div className="attendance-report-error">
            Start date cannot be later than end date.
          </div>
        )}

        {error && (
          <div className="attendance-report-error">{error}</div>
        )}
      </section>

      <section className="attendance-report-stats">
        <article className="attendance-report-stat">
          <span className="attendance-report-stat-icon blue"><FaUsers /></span>
          <div>
            <span>Total Records</span>
            <strong>{totals.total}</strong>
          </div>
        </article>

        <article className="attendance-report-stat">
          <span className="attendance-report-stat-icon green"><FaCheckCircle /></span>
          <div>
            <span>Present</span>
            <strong>{totals.present}</strong>
          </div>
        </article>

        <article className="attendance-report-stat">
          <span className="attendance-report-stat-icon red"><FaTimesCircle /></span>
          <div>
            <span>Absent</span>
            <strong>{totals.absent}</strong>
          </div>
        </article>

        <article className="attendance-report-stat">
          <span className="attendance-report-stat-icon orange"><FaClock /></span>
          <div>
            <span>Late</span>
            <strong>{totals.late}</strong>
          </div>
        </article>
      </section>

      <section className="attendance-report-overview">
        <div className="attendance-report-overview-icon">
          <FaChartBar />
        </div>

        <div className="attendance-report-overview-content">
          <div className="attendance-report-overview-top">
            <div>
              <h2>Attendance Overview</h2>
              <p>Attendance rate based on the currently filtered records.</p>
            </div>

            <strong>{attendanceRate}%</strong>
          </div>

          <div
            className="attendance-report-progress"
            role="progressbar"
            aria-label="Attendance rate"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={attendanceRate}
          >
            <span style={{ width: `${attendanceRate}%` }} />
          </div>

          <div className="attendance-report-breakdown">
            <span>Present: {totals.present}</span>
            <span>Late: {totals.late}</span>
            <span>Half Day: {totals.halfDay}</span>
            <span>Leave: {totals.leave}</span>
          </div>
        </div>
      </section>

      <section className="attendance-report-table-card">
        <div className="attendance-report-table-header">
          <div>
            <h2>Employee-wise Summary</h2>
            <p>Attendance totals for the selected period.</p>
          </div>
          <Link to="/admin/attendance">View Attendance List</Link>
        </div>

        <div className="attendance-report-table-wrap">
          <table className="attendance-report-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Present</th>
                <th>Late</th>
                <th>Absent</th>
                <th>Half Day</th>
                <th>Leave</th>
                <th>Total Records</th>
              </tr>
            </thead>

            <tbody>
              {employeeSummary.map((employee) => (
                <tr key={employee.employeeId}>
                  <td>
                    <strong>{employee.employeeName}</strong>
                    <small>{employee.employeeCode}</small>
                  </td>
                  <td>{employee.department}</td>
                  <td>{employee.present}</td>
                  <td>{employee.late}</td>
                  <td>{employee.absent}</td>
                  <td>{employee.halfDay}</td>
                  <td>{employee.leave}</td>
                  <td><strong>{employee.total}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          {employeeSummary.length === 0 && (
            <div className="attendance-report-empty">
              No attendance records found for the selected filters.
            </div>
          )}
        </div>
      </section>

      <p className="attendance-report-footnote">
        Reports are calculated from the attendance records currently stored in this browser.
      </p>
    </div>
  );
}
