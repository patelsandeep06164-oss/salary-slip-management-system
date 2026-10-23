
import React from "react";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaClock,
  FaCalendarCheck,
  FaUsers,
} from "react-icons/fa";

function AttendanceTable({
  attendance = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  emptyMessage = "No attendance records found.",
}) {
  const records = Array.isArray(attendance) ? attendance : [];

  const getInitials = (name = "") =>
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const getStatus = (status = "") => {
    const normalized = String(status).trim().toLowerCase();

    if (normalized === "half-day" || normalized === "half day") {
      return "half-day";
    }

    if (
      ["present", "late", "absent", "leave"].includes(normalized)
    ) {
      return normalized;
    }

    return "unknown";
  };

  const formatTime = (value) => {
    if (value === undefined || value === null || value === "") {
      return "--";
    }

    const text = String(value).trim();

    // Preserve a time that is already formatted.
    if (/^\d{1,2}:\d{2}(\s?(AM|PM))?$/i.test(text)) {
      return text;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return text;
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (value) => {
    if (!value) return "--";

    // Parse date-only values locally to avoid timezone date shifts.
    const text = String(value);
    const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    const date = dateOnlyMatch
      ? new Date(
          Number(dateOnlyMatch[1]),
          Number(dateOnlyMatch[2]) - 1,
          Number(dateOnlyMatch[3])
        )
      : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return text;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const parseTimeToMinutes = (value) => {
    if (!value) return null;

    const text = String(value).trim();
    const match = text.match(
      /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
    );

    if (match) {
      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const period = match[3]?.toUpperCase();

      if (minutes > 59 || hours > (period ? 12 : 23)) {
        return null;
      }

      if (period) {
        if (hours < 1 || hours > 12) return null;
        if (period === "PM" && hours < 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      }

      return hours * 60 + minutes;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date.getHours() * 60 + date.getMinutes();
  };

  const calculateWorkingHours = (record) => {
    const savedHours = record.workingHours;

    if (
      savedHours !== undefined &&
      savedHours !== null &&
      savedHours !== ""
    ) {
      return typeof savedHours === "number"
        ? `${Math.floor(savedHours)}h ${Math.round(
            (savedHours % 1) * 60
          )}m`
        : savedHours;
    }

    if (!record.checkIn || !record.checkOut) {
      return "--";
    }

    const start = parseTimeToMinutes(record.checkIn);
    const end = parseTimeToMinutes(record.checkOut);

    if (start === null || end === null) return "--";

    let difference = end - start;

    // Support overnight shifts.
    if (difference < 0) difference += 24 * 60;

    const hours = Math.floor(difference / 60);
    const minutes = difference % 60;

    return `${hours}h ${minutes}m`;
  };

  const getEmployeeName = (record) => {
    if (record.employeeName) return record.employeeName;
    if (record.name) return record.name;

    if (record.employee && typeof record.employee === "object") {
      return (
        record.employee.name ||
        record.employee.fullName ||
        "Unnamed employee"
      );
    }

    return "Unnamed employee";
  };

  const getEmployeeId = (record) => {
    if (record.employeeId) return record.employeeId;

    if (record.employee && typeof record.employee === "object") {
      return (
        record.employee.employeeId ||
        record.employee.id ||
        record.employee._id ||
        "--"
      );
    }

    return "--";
  };

  return (
    <>
      <style>{`
        .attendance-table-wrapper,
        .attendance-table-wrapper * {
          box-sizing: border-box;
        }

        .attendance-table-card {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e8edf5;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 5px 20px rgba(15, 23, 42, 0.035);
          font-family: Inter, Arial, sans-serif;
        }

        .attendance-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 21px 23px;
          border-bottom: 1px solid #edf1f7;
        }

        .attendance-table-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .attendance-table-heading-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 17px;
        }

        .attendance-table-heading h3 {
          margin: 0;
          color: #17233e;
          font-size: 16px;
          font-weight: 700;
        }

        .attendance-table-heading p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .attendance-table-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .attendance-table-scroll {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }

        .attendance-table {
          width: 100%;
          min-width: 930px;
          border-collapse: collapse;
          text-align: left;
        }

        .attendance-table thead {
          background: #f8faff;
        }

        .attendance-table th {
          padding: 15px 18px;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.35px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .attendance-table td {
          padding: 15px 18px;
          border-top: 1px solid #f0f3f8;
          color: #475569;
          font-size: 12px;
          vertical-align: middle;
          white-space: nowrap;
        }

        .attendance-table tbody tr {
          transition: background 0.2s ease;
        }

        .attendance-table tbody tr:hover {
          background: #f8fbff;
        }

        .attendance-employee {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 185px;
        }

        .attendance-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 39px;
          height: 39px;
          border: 1px solid #dbeafe;
          border-radius: 11px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
        }

        .attendance-employee-info {
          min-width: 0;
        }

        .attendance-employee-name {
          display: block;
          max-width: 180px;
          overflow: hidden;
          color: #1e293b;
          font-size: 12px;
          font-weight: 700;
          text-overflow: ellipsis;
        }

        .attendance-employee-id {
          display: block;
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
        }

        .attendance-time {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #475569;
          font-size: 12px;
        }

        .attendance-time svg {
          color: #94a3b8;
          font-size: 11px;
        }

        .attendance-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .attendance-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .attendance-status.present {
          background: #dcfce7;
          color: #15803d;
        }

        .attendance-status.late {
          background: #fef3c7;
          color: #b45309;
        }

        .attendance-status.absent {
          background: #fee2e2;
          color: #b91c1c;
        }

        .attendance-status.half-day {
          background: #f3e8ff;
          color: #7e22ce;
        }

        .attendance-status.leave {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .attendance-status.unknown {
          background: #f1f5f9;
          color: #64748b;
        }

        .attendance-hours {
          color: #1e293b;
          font-weight: 600;
        }

        .attendance-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .attendance-action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 33px;
          height: 33px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .attendance-action-button:hover {
          border-color: #bfdbfe;
          background: #eff6ff;
          color: #2563eb;
        }

        .attendance-action-button.delete:hover {
          border-color: #fecaca;
          background: #fef2f2;
          color: #dc2626;
        }

        .attendance-action-button:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        .attendance-loading,
        .attendance-empty {
          padding: 48px 20px;
          text-align: center;
        }

        .attendance-loading-spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto 12px;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: attendance-spin 0.8s linear infinite;
        }

        @keyframes attendance-spin {
          to { transform: rotate(360deg); }
        }

        .attendance-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 55px;
          height: 55px;
          margin: 0 auto 14px;
          border-radius: 16px;
          background: #eff6ff;
          color: #60a5fa;
          font-size: 22px;
        }

        .attendance-empty h4 {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .attendance-empty p,
        .attendance-loading p {
          margin: 7px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        @media (max-width: 600px) {
          .attendance-table-header {
            padding: 16px;
          }

          .attendance-table-heading {
            gap: 9px;
          }

          .attendance-table-heading-icon {
            width: 37px;
            height: 37px;
          }

          .attendance-table-heading h3 {
            font-size: 14px;
          }

          .attendance-table-heading p {
            font-size: 11px;
          }

          .attendance-table-count {
            padding: 6px 8px;
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .attendance-table tbody tr,
          .attendance-action-button {
            transition: none;
          }

          .attendance-loading-spinner {
            animation-duration: 1.5s;
          }
        }
      `}</style>

      <div className="attendance-table-wrapper">
        <section className="attendance-table-card">
          <div className="attendance-table-header">
            <div className="attendance-table-heading">
              <div className="attendance-table-heading-icon">
                <FaCalendarCheck />
              </div>

              <div>
                <h3>Attendance Records</h3>
                <p>Employee attendance and working hours</p>
              </div>
            </div>

            <span className="attendance-table-count">
              <FaUsers />
              {records.length} Records
            </span>
          </div>

          {loading ? (
            <div className="attendance-loading" role="status">
              <div className="attendance-loading-spinner" />
              <p>Loading attendance records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="attendance-empty">
              <div className="attendance-empty-icon">
                <FaCalendarCheck />
              </div>

              <h4>No attendance records</h4>
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <div className="attendance-table-scroll">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record, index) => {
                    const name = getEmployeeName(record);
                    const status = getStatus(record.status);
                    const rowId =
                      record._id || record.id || `${name}-${index}`;

                    return (
                      <tr key={rowId}>
                        <td>
                          <div className="attendance-employee">
                            <div className="attendance-avatar">
                              {getInitials(name) || "EM"}
                            </div>

                            <div className="attendance-employee-info">
                              <span className="attendance-employee-name">
                                {name}
                              </span>

                              <span className="attendance-employee-id">
                                ID: {getEmployeeId(record)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>{formatDate(record.date)}</td>

                        <td>
                          <span className="attendance-time">
                            <FaClock />
                            {formatTime(record.checkIn)}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-time">
                            <FaClock />
                            {formatTime(record.checkOut)}
                          </span>
                        </td>

                        <td>
                          <span className="attendance-hours">
                            {calculateWorkingHours(record)}
                          </span>
                        </td>

                        <td>
                          <span className={`attendance-status ${status}`}>
                            <span className="attendance-status-dot" />
                            {status === "unknown"
                              ? "Unknown"
                              : status === "half-day"
                                ? "Half Day"
                                : status}
                          </span>
                        </td>

                        <td>
                          <div className="attendance-actions">
                            {onView && (
                              <button
                                type="button"
                                className="attendance-action-button"
                                title="View attendance"
                                aria-label={`View attendance for ${name}`}
                                onClick={() => onView(record)}
                              >
                                <FaEye />
                              </button>
                            )}

                            {onEdit && (
                              <button
                                type="button"
                                className="attendance-action-button"
                                title="Edit attendance"
                                aria-label={`Edit attendance for ${name}`}
                                onClick={() => onEdit(record)}
                              >
                                <FaEdit />
                              </button>
                            )}

                            {onDelete && (
                              <button
                                type="button"
                                className="attendance-action-button delete"
                                title="Delete attendance"
                                aria-label={`Delete attendance for ${name}`}
                                onClick={() => onDelete(record)}
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default AttendanceTable;
