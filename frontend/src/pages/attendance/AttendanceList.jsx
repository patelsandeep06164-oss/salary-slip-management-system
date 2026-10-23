
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaTrash,
  FaFileAlt,
  FaUsers,
  FaSyncAlt,
} from "react-icons/fa";
import "./AttendanceList.css";

const STORAGE_KEY = "attendance_records";

function readAttendance() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read attendance records:", error);
    return [];
  }
}

function formatDate(value) {
  if (!value) return "—";

  const parts = String(value).split("-");
  if (parts.length !== 3) return String(value);

  const [year, month, day] = parts.map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (Number.isNaN(parsedDate.getTime())) return String(value);

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToday() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeStatus(value) {
  return String(value || "Unknown").trim().toLowerCase();
}

function statusClass(value) {
  const status = normalizeStatus(value).replace(/\s+/g, "-");

  if (["present", "late", "absent", "half-day", "leave"].includes(status)) {
    return status;
  }

  return "unknown";
}

function getEmployeeName(record) {
  return record.employeeName || record.name || "Unknown";
}

function getEmployeeCode(record) {
  return record.employeeCode || record.employeeId || "No employee ID";
}

function getDepartment(record) {
  const department = record.department;

  if (typeof department === "string") return department || "—";

  if (department && typeof department === "object") {
    return department.name || department.departmentName || "—";
  }

  return "—";
}

function escapeCsv(value) {
  let text = String(value ?? "");

  // Reduce the risk of spreadsheet formula injection when opening exported CSV.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export default function AttendanceList() {
  const [records, setRecords] = useState(readAttendance);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [date, setDate] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const today = getToday();

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const searchableText = [
          getEmployeeName(record),
          getEmployeeCode(record),
          getDepartment(record),
          record.designation,
          record.notes,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesStatus =
          status === "All" ||
          normalizeStatus(record.status) === normalizeStatus(status);

        const matchesDate = !date || record.date === date;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateOrder = String(b.date || "").localeCompare(
          String(a.date || "")
        );

        return (
          dateOrder ||
          getEmployeeName(a).localeCompare(getEmployeeName(b))
        );
      });
  }, [records, search, status, date]);

  const todayRecords = useMemo(
    () => records.filter((record) => record.date === today),
    [records, today]
  );

  const presentToday = todayRecords.filter((record) =>
    ["present", "late", "half day"].includes(
      normalizeStatus(record.status)
    )
  ).length;

  const absentToday = todayRecords.filter(
    (record) => normalizeStatus(record.status) === "absent"
  ).length;

  function showNotice(message, type = "success") {
    setNotice(message);
    setNoticeType(type);
  }

  function refreshRecords() {
    setRecords(readAttendance());
    showNotice("Attendance records refreshed.");
  }

  function deleteRecord(record) {
    const employeeName = getEmployeeName(record);

    const confirmed = window.confirm(
      `Delete attendance for ${employeeName} on ${record.date || "this date"}?`
    );

    if (!confirmed) return;

    try {
      const recordId = record.id ?? record._id;

      const updated = records.filter((item) => {
        const itemId = item.id ?? item._id;

        if (recordId !== undefined && recordId !== null) {
          return String(itemId) !== String(recordId);
        }

        return item !== record;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRecords(updated);
      showNotice("Attendance record deleted successfully.");
    } catch (error) {
      console.error("Unable to delete attendance record:", error);
      showNotice(
        "Attendance record delete nahi hua. Browser storage check karein.",
        "error"
      );
    }
  }

  function exportCsv() {
    if (filteredRecords.length === 0) {
      showNotice("Export karne ke liye koi attendance record nahi hai.", "error");
      return;
    }

    const columns = [
      ["Employee", getEmployeeName],
      ["Employee ID", getEmployeeCode],
      ["Department", getDepartment],
      ["Date", (record) => record.date],
      ["Check In", (record) => record.checkIn],
      ["Check Out", (record) => record.checkOut],
      ["Status", (record) => record.status],
      ["Notes", (record) => record.notes],
    ];

    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...filteredRecords.map((record) =>
        columns
          .map(([, getValue]) => escapeCsv(getValue(record)))
          .join(",")
      ),
    ].join("\r\n");

    let url;

    try {
      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });

      url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `attendance-records-${today}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      showNotice(`${filteredRecords.length} attendance records exported.`);
    } catch (error) {
      console.error("CSV export failed:", error);
      showNotice("CSV export nahi ho paya.", "error");
    } finally {
      if (url) {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  }

  return (
    <div className="attendance-list-page">
      <header className="attendance-list-header">
        <div className="attendance-list-heading">
          <span className="attendance-list-eyebrow">ATTENDANCE MANAGEMENT</span>
          <h1>Attendance Records</h1>
          <p>Review employee attendance records, check-in times and status.</p>
        </div>

        <div className="attendance-list-actions">
          <button
            type="button"
            className="attendance-list-export"
            onClick={exportCsv}
          >
            <FaFileAlt /> Export CSV
          </button>

          <Link
            to="/admin/attendance/mark"
            className="attendance-list-primary"
          >
            <FaPlus /> Mark Attendance
          </Link>
        </div>
      </header>

      {notice && (
        <div
          className={`attendance-list-notice ${noticeType === "error" ? "error" : ""}`}
          role="status"
          aria-live="polite"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="attendance-list-stats">
        <article className="attendance-list-stat">
          <span className="attendance-list-stat-icon blue">
            <FaCalendarAlt />
          </span>
          <div>
            <span>Today's Records</span>
            <strong>{todayRecords.length}</strong>
            <small>Records dated today</small>
          </div>
        </article>

        <article className="attendance-list-stat">
          <span className="attendance-list-stat-icon green">
            <FaUsers />
          </span>
          <div>
            <span>Present Today</span>
            <strong>{presentToday}</strong>
            <small>Present, late and half day</small>
          </div>
        </article>

        <article className="attendance-list-stat">
          <span className="attendance-list-stat-icon orange">
            <FaCalendarAlt />
          </span>
          <div>
            <span>Absent Today</span>
            <strong>{absentToday}</strong>
            <small>Marked absent</small>
          </div>
        </article>
      </section>

      <section className="attendance-list-card">
        <div className="attendance-list-card-header">
          <div>
            <h2>All Attendance</h2>
            <p>Search and filter your saved attendance records.</p>
          </div>

          <button
            type="button"
            className="attendance-list-refresh"
            onClick={refreshRecords}
          >
            <FaSyncAlt /> Refresh
          </button>
        </div>

        <div className="attendance-list-toolbar">
          <label className="attendance-list-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, ID, department..."
              aria-label="Search attendance records"
            />
            {search && (
              <button
                type="button"
                className="attendance-list-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>

          <label className="attendance-list-filter">
            <span>Date</span>
            <input
              className="attendance-list-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Filter by attendance date"
            />
          </label>

          <label className="attendance-list-filter">
            <span>Status</span>
            <select
              className="attendance-list-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter attendance status"
            >
              <option value="All">All statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
            </select>
          </label>
        </div>

        <div className="attendance-list-table-wrap">
          <table className="attendance-list-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record, index) => {
                const recordKey = record.id ?? record._id ?? `${record.date}-${getEmployeeCode(record)}-${index}`;

                return (
                  <tr key={recordKey}>
                    <td>
                      <div className="attendance-list-person">
                        <span className="attendance-list-avatar">
                          {getEmployeeName(record).trim().charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{getEmployeeName(record)}</strong>
                          <small>{getEmployeeCode(record)}</small>
                        </div>
                      </div>
                    </td>

                    <td>{getDepartment(record)}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.checkIn || "—"}</td>
                    <td>{record.checkOut || "—"}</td>

                    <td>
                      <span
                        className={`attendance-list-badge ${statusClass(record.status)}`}
                      >
                        {record.status || "Unknown"}
                      </span>
                    </td>

                    <td className="attendance-list-notes" title={record.notes || ""}>
                      {record.notes || "—"}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="attendance-list-delete"
                        title="Delete attendance record"
                        aria-label={`Delete attendance for ${getEmployeeName(record)}`}
                        onClick={() => deleteRecord(record)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="attendance-list-empty">
              <span className="attendance-list-empty-icon">
                <FaCalendarAlt />
              </span>
              <strong>
                {records.length === 0
                  ? "No attendance records yet"
                  : "No matching attendance records"}
              </strong>
              <p>
                {records.length === 0
                  ? "Mark attendance to see saved records here."
                  : "Try changing the search, date or status filters."}
              </p>
              {records.length === 0 && (
                <Link
                  to="/admin/attendance/mark"
                  className="attendance-list-empty-link"
                >
                  <FaPlus /> Mark first attendance
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="attendance-list-footer">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of{" "}
            <strong>{records.length}</strong> attendance records
          </span>
          {(search || date || status !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDate("");
                setStatus("All");
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
