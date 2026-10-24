
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import attendanceService from "../../services/attendantService";
import "./AttendanceList.css";

function getToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getRecordDate(record) {
  if (!record?.date) return "";

  const value = String(record.date);

  // MongoDB date values are normally returned as ISO strings.
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value) {
  if (!value) return "—";

  const dateValue = getRecordDate({ date: value });
  if (!dateValue) return String(value);

  const [year, month, day] = dateValue.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const text = String(value);

  // Support both saved Date values and time strings such as "09:00".
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hours, minutes] = text.split(":").map(Number);
    const parsed = new Date();
    parsed.setHours(hours, minutes, 0, 0);

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return text;

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeStatus(value) {
  const status = String(value || "Unknown")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  // The backend stores "on-leave"; the UI calls it "Leave".
  if (status === "on-leave") return "leave";

  return status;
}

function statusClass(value) {
  const status = normalizeStatus(value);

  if (
    ["present", "late", "absent", "half-day", "leave", "holiday"].includes(
      status
    )
  ) {
    return status;
  }

  return "unknown";
}

function getEmployeeName(record) {
  const employee = record?.employee;

  if (employee && typeof employee === "object") {
    const fullName = [employee.firstName, employee.lastName]
      .filter(Boolean)
      .join(" ");

    return fullName || employee.name || "Unknown";
  }

  return record?.employeeName || record?.name || "Unknown";
}

function getEmployeeCode(record) {
  const employee = record?.employee;

  if (employee && typeof employee === "object") {
    return (
      employee.employeeCode ||
      employee.employeeId ||
      employee.code ||
      "No employee ID"
    );
  }

  return (
    record?.employeeCode ||
    (typeof record?.employeeId === "string" ? record.employeeId : "") ||
    "No employee ID"
  );
}

function getDepartment(record) {
  const department = record?.department;

  if (typeof department === "string") {
    return department || "—";
  }

  if (department && typeof department === "object") {
    return (
      department.name ||
      department.departmentName ||
      department.title ||
      "—"
    );
  }

  const employee = record?.employee;

  if (employee && typeof employee === "object") {
    const employeeDepartment = employee.department;

    if (typeof employeeDepartment === "string") {
      return employeeDepartment || "—";
    }

    if (employeeDepartment && typeof employeeDepartment === "object") {
      return (
        employeeDepartment.name ||
        employeeDepartment.departmentName ||
        "—"
      );
    }
  }

  return "—";
}

function getNotes(record) {
  return record?.remarks || record?.notes || "";
}

function getApiError(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function escapeCsv(value) {
  let text = String(value ?? "");

  // Reduce spreadsheet formula-injection risk in exported CSV files.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function getResponseRecords(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data)) return response.data;

  return [];
}

export default function AttendanceList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [date, setDate] = useState("");

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [loadError, setLoadError] = useState("");

  const today = getToday();

  const showNotice = useCallback((message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  }, []);

  const refreshRecords = useCallback(
    async (showSuccessNotice = true) => {
      setRefreshing(true);
      setLoadError("");

      try {
        const response = await attendanceService.getAll();
        const list = getResponseRecords(response);

        setRecords(list);

        if (showSuccessNotice) {
          showNotice("Attendance records refreshed successfully.");
        }
      } catch (error) {
        console.error("Unable to load attendance records:", error);

        const message = getApiError(
          error,
          "Unable to load attendance records from the server."
        );

        setLoadError(message);
        showNotice(message, "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showNotice]
  );

  useEffect(() => {
    refreshRecords(false);
  }, [refreshRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedStatus = normalizeStatus(status);

    return records
      .filter((record) => {
        const searchableText = [
          getEmployeeName(record),
          getEmployeeCode(record),
          getDepartment(record),
          record?.designation,
          getNotes(record),
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesStatus =
          status === "All" ||
          normalizeStatus(record?.status) === selectedStatus;

        const matchesDate =
          !date || getRecordDate(record) === date;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateOrder = getRecordDate(b).localeCompare(
          getRecordDate(a)
        );

        return (
          dateOrder ||
          getEmployeeName(a).localeCompare(getEmployeeName(b))
        );
      });
  }, [records, search, status, date]);

  const todayRecords = useMemo(
    () => records.filter((record) => getRecordDate(record) === today),
    [records, today]
  );

  const presentToday = todayRecords.filter((record) =>
    ["present", "late", "half-day"].includes(
      normalizeStatus(record.status)
    )
  ).length;

  const absentToday = todayRecords.filter(
    (record) => normalizeStatus(record.status) === "absent"
  ).length;

  function exportCsv() {
    if (filteredRecords.length === 0) {
      showNotice(
        "Export karne ke liye koi attendance record nahi hai.",
        "error"
      );
      return;
    }

    const columns = [
      ["Employee", getEmployeeName],
      ["Employee ID", getEmployeeCode],
      ["Department", getDepartment],
      ["Date", (record) => getRecordDate(record)],
      ["Check In", (record) => formatTime(record.checkIn)],
      ["Check Out", (record) => formatTime(record.checkOut)],
      ["Status", (record) => record.status],
      ["Notes", getNotes],
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

  function handleDeleteUnavailable() {
    showNotice(
      "Delete feature abhi backend API se connected nahi hai. Record delete nahi hua.",
      "error"
    );
  }

  function clearFilters() {
    setSearch("");
    setDate("");
    setStatus("All");
  }

  return (
    <div className="attendance-list-page">
      <header className="attendance-list-header">
        <div className="attendance-list-heading">
          <span className="attendance-list-eyebrow">
            ATTENDANCE MANAGEMENT
          </span>
          <h1>Attendance Records</h1>
          <p>
            Review employee attendance records, check-in times and status.
          </p>
        </div>

        <div className="attendance-list-actions">
          <button
            type="button"
            className="attendance-list-export"
            onClick={exportCsv}
            disabled={loading || Boolean(loadError)}
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
          className={`attendance-list-notice ${
            noticeType === "error" ? "error" : ""
          }`}
          role={noticeType === "error" ? "alert" : "status"}
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
            <strong>{loading ? "—" : todayRecords.length}</strong>
            <small>Records dated today</small>
          </div>
        </article>

        <article className="attendance-list-stat">
          <span className="attendance-list-stat-icon green">
            <FaUsers />
          </span>
          <div>
            <span>Present Today</span>
            <strong>{loading ? "—" : presentToday}</strong>
            <small>Present, late and half day</small>
          </div>
        </article>

        <article className="attendance-list-stat">
          <span className="attendance-list-stat-icon orange">
            <FaCalendarAlt />
          </span>
          <div>
            <span>Absent Today</span>
            <strong>{loading ? "—" : absentToday}</strong>
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
            onClick={() => refreshRecords(true)}
            disabled={refreshing}
          >
            <FaSyncAlt />
            {refreshing ? "Refreshing..." : "Refresh"}
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
              disabled={loading || Boolean(loadError)}
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
              disabled={loading || Boolean(loadError)}
            />
          </label>

          <label className="attendance-list-filter">
            <span>Status</span>
            <select
              className="attendance-list-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter attendance status"
              disabled={loading || Boolean(loadError)}
            >
              <option value="All">All statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
              <option value="Holiday">Holiday</option>
            </select>
          </label>
        </div>

        <div className="attendance-list-table-wrap">
          {loading ? (
            <div className="attendance-list-empty" role="status">
              <span className="attendance-list-empty-icon">
                <FaSyncAlt />
              </span>
              <strong>Loading attendance records...</strong>
              <p>Records are being fetched from the server.</p>
            </div>
          ) : loadError ? (
            <div className="attendance-list-empty" role="alert">
              <span className="attendance-list-empty-icon">
                <FaCalendarAlt />
              </span>
              <strong>Unable to load attendance records</strong>
              <p>{loadError}</p>
              <button
                type="button"
                className="attendance-list-refresh"
                onClick={() => refreshRecords(true)}
                disabled={refreshing}
              >
                <FaSyncAlt />
                {refreshing ? "Retrying..." : "Try again"}
              </button>
            </div>
          ) : (
            <>
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
                    const recordKey =
                      record._id ||
                      record.id ||
                      `${getRecordDate(record)}-${getEmployeeCode(record)}-${index}`;

                    const employeeName = getEmployeeName(record);
                    const notes = getNotes(record);

                    return (
                      <tr key={recordKey}>
                        <td>
                          <div className="attendance-list-person">
                            <span className="attendance-list-avatar">
                              {employeeName.trim().charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <strong>{employeeName}</strong>
                              <small>{getEmployeeCode(record)}</small>
                            </div>
                          </div>
                        </td>

                        <td>{getDepartment(record)}</td>
                        <td>{formatDate(record.date)}</td>
                        <td>{formatTime(record.checkIn)}</td>
                        <td>{formatTime(record.checkOut)}</td>

                        <td>
                          <span
                            className={`attendance-list-badge ${statusClass(
                              record.status
                            )}`}
                          >
                            {normalizeStatus(record.status) === "half-day"
                              ? "Half Day"
                              : normalizeStatus(record.status) === "leave"
                                ? "Leave"
                                : record.status || "Unknown"}
                          </span>
                        </td>

                        <td
                          className="attendance-list-notes"
                          title={notes}
                        >
                          {notes || "—"}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="attendance-list-delete"
                            title="Backend delete API is not configured"
                            aria-label={`Delete attendance for ${employeeName} (currently unavailable)`}
                            onClick={handleDeleteUnavailable}
                            disabled
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
                      ? "Mark attendance to see database records here."
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
            </>
          )}
        </div>

        <div className="attendance-list-footer">
          <span>
            Showing <strong>{loading || loadError ? 0 : filteredRecords.length}</strong>{" "}
            of <strong>{loading || loadError ? 0 : records.length}</strong>{" "}
            attendance records
          </span>

          {(search || date || status !== "All") && (
            <button type="button" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
