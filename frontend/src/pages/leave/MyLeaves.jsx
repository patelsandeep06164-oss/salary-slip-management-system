
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUmbrellaBeach,
  FaPlus,
  FaSearch,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFilter,
  FaEye,
  FaSyncAlt,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";

import api from "../../services/api";
import "./MyLeaves.css";

function extractLeaves(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.leaves)) return data.leaves;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.leaveRequests)) return data.leaveRequests;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.leaves)) return data.data.leaves;
  if (Array.isArray(data?.data?.requests)) return data.data.requests;
  if (Array.isArray(data?.data?.leaveRequests)) {
    return data.data.leaveRequests;
  }

  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const dateValue = String(value).slice(0, 10);
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatus(status) {
  const normalized = String(status || "Pending").toLowerCase();

  if (normalized === "approved") {
    return {
      label: "Approved",
      className: "approved",
      icon: <FaCheckCircle />,
    };
  }

  if (normalized === "rejected") {
    return {
      label: "Rejected",
      className: "rejected",
      icon: <FaTimesCircle />,
    };
  }

  if (["cancelled", "canceled"].includes(normalized)) {
    return {
      label: "Cancelled",
      className: "cancelled",
      icon: <FaTimesCircle />,
    };
  }

  return {
    label: "Pending",
    className: "pending",
    icon: <FaHourglassHalf />,
  };
}

function getLeaveId(leave) {
  return leave?._id || leave?.id || leave?.leaveId || "";
}

function getLeaveDays(leave) {
  const savedDays = Number(leave?.totalDays);

  if (Number.isFinite(savedDays) && savedDays > 0) {
    return savedDays;
  }

  if (!leave?.startDate || !leave?.endDate) return 0;

  const start = new Date(
    `${String(leave.startDate).slice(0, 10)}T00:00:00`
  );

  const end = new Date(
    `${String(leave.endDate).slice(0, 10)}T00:00:00`
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  return Math.round((end - start) / 86400000) + 1;
}

function getReviewRemarks(leave) {
  return (
    leave?.reviewRemarks ||
    leave?.reviewNote ||
    leave?.adminRemarks ||
    leave?.remarks ||
    ""
  );
}

function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Fetch only the authenticated employee's leave records.
  // The backend gets employeeId from the authenticated session.
  const loadLeaves = useCallback(async (isRefresh = false) => {
    setError("");

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get("/leaves");
      const data = response.data;

      if (data?.success === false) {
        throw new Error(
          data.message || "Unable to load leave requests."
        );
      }

      setLeaves(extractLeaves(data));
    } catch (err) {
      console.error("My Leaves API Error:", {
        status: err?.response?.status,
        response: err?.response?.data,
        message: err?.message,
      });

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your leave requests. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const leaveTypes = useMemo(
    () => [
      "All",
      ...new Set(
        leaves
          .map((leave) => leave.leaveType)
          .filter(
            (type) =>
              typeof type === "string" && type.trim()
          )
      ),
    ],
    [leaves]
  );

  const filteredLeaves = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leaves.filter((leave) => {
      const searchableValues = [
        leave.leaveType,
        leave.reason,
        leave.status,
        leave.startDate,
        leave.endDate,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const normalizedStatus = getStatus(leave.status).label;

      const matchesStatus =
        statusFilter === "All" ||
        normalizedStatus === statusFilter;

      const matchesType =
        typeFilter === "All" ||
        leave.leaveType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leaves, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => [
      {
        label: "Total Requests",
        value: leaves.length,
        icon: <FaUmbrellaBeach />,
        tone: "blue",
      },
      {
        label: "Pending",
        value: leaves.filter(
          (leave) =>
            getStatus(leave.status).label === "Pending"
        ).length,
        icon: <FaHourglassHalf />,
        tone: "orange",
      },
      {
        label: "Approved",
        value: leaves.filter(
          (leave) =>
            getStatus(leave.status).label === "Approved"
        ).length,
        icon: <FaCheckCircle />,
        tone: "green",
      },
      {
        label: "Rejected",
        value: leaves.filter(
          (leave) =>
            getStatus(leave.status).label === "Rejected"
        ).length,
        icon: <FaTimesCircle />,
        tone: "red",
      },
    ],
    [leaves]
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  };

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    typeFilter !== "All";

  const activeLeave = selectedLeave
    ? leaves.find(
        (leave) =>
          String(getLeaveId(leave)) ===
          String(getLeaveId(selectedLeave))
      ) || selectedLeave
    : null;

  return (
    <main className="my-leaves-page">
      <div className="my-leaves-top-accent" />

      <header className="my-leaves-header">
        <div className="my-leaves-header-copy">
          <span className="my-leaves-eyebrow">
            <span className="my-leaves-eyebrow-dot" />
            EMPLOYEE SELF SERVICE
          </span>

          <h1>My Leaves</h1>

          <p>
            Track your leave applications and review their current status.
          </p>
        </div>

        <div className="my-leaves-header-actions">
          <button
            type="button"
            className="my-leaves-refresh-button"
            onClick={() => loadLeaves(true)}
            disabled={loading || refreshing}
          >
            <FaSyncAlt
              className={
                refreshing ? "my-leaves-spinning" : ""
              }
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            to="/employee/leaves/apply"
            className="my-leaves-apply-button"
          >
            <FaPlus />
            Apply for Leave
          </Link>
        </div>
      </header>

      <section
        className="my-leaves-stats"
        aria-label="Leave summary"
      >
        {stats.map((stat) => (
          <article
            className="my-leaves-stat-card"
            key={stat.label}
          >
            <span
              className={`my-leaves-stat-icon ${stat.tone}`}
            >
              {stat.icon}
            </span>

            <div className="my-leaves-stat-content">
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
              <span>
                {stat.label === "Total Requests"
                  ? "All submitted applications"
                  : stat.label === "Pending"
                    ? "Awaiting review"
                    : stat.label === "Approved"
                      ? "Approved applications"
                      : "Rejected applications"}
              </span>
            </div>
          </article>
        ))}
      </section>

      {error && (
        <div className="my-leaves-alert" role="alert">
          <FaInfoCircle />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="my-leaves-panel">
        <div className="my-leaves-panel-heading">
          <div>
            <h2>Leave history</h2>
            <p>
              {loading
                ? "Loading your leave applications..."
                : `Showing ${filteredLeaves.length} of ${leaves.length} requests.`}
            </p>
          </div>

          <span className="my-leaves-heading-icon">
            <FaCalendarAlt />
          </span>
        </div>

        <div className="my-leaves-filters">
          <label className="my-leaves-search">
            <FaSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search leave type or reason..."
              aria-label="Search your leave requests"
            />
          </label>

          <label className="my-leaves-select-wrap">
            <FaFilter />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          <label className="my-leaves-select-wrap">
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              aria-label="Filter by leave type"
            >
              {leaveTypes.map((type) => (
                <option value={type} key={type}>
                  {type === "All"
                    ? "All leave types"
                    : type}
                </option>
              ))}
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              className="my-leaves-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="my-leaves-state">
            <span className="my-leaves-loader" />
            <h3>Loading leave history</h3>
            <p>Fetching your applications from the server.</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="my-leaves-empty">
            <span className="my-leaves-empty-icon">
              <FaUmbrellaBeach />
            </span>

            <h3>
              {leaves.length === 0
                ? "No leave requests yet"
                : "No leave requests found"}
            </h3>

            <p>
              {leaves.length === 0
                ? "Your submitted leave applications will appear here."
                : "Try changing your search or filter settings."}
            </p>

            {leaves.length === 0 ? (
              <Link to="/employee/leaves/apply">
                <FaPlus />
                Apply for Leave
              </Link>
            ) : (
              hasFilters && (
                <button
                  type="button"
                  className="my-leaves-clear-filters"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )
            )}
          </div>
        ) : (
          <div className="my-leaves-table-wrap">
            <table className="my-leaves-table">
              <thead>
                <tr>
                  <th>Leave type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Applied on</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeaves.map((leave, index) => {
                  const status = getStatus(leave.status);
                  const days = getLeaveDays(leave);
                  const id = getLeaveId(leave);

                  return (
                    <tr
                      key={
                        id ||
                        `${leave.startDate}-${index}`
                      }
                    >
                      <td>
                        <div className="my-leaves-type-cell">
                          <span>
                            <FaUmbrellaBeach />
                          </span>

                          <strong>
                            {leave.leaveType || "Leave"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div className="my-leaves-date-cell">
                          <strong>
                            {formatDate(leave.startDate)}
                          </strong>

                          <small>
                            to {formatDate(leave.endDate)}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span className="my-leaves-days">
                          {days} {days === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td className="my-leaves-applied-date">
                        {formatDate(
                          leave.appliedOn || leave.createdAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`my-leaves-status ${status.className}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="my-leaves-view-button"
                          onClick={() =>
                            setSelectedLeave(leave)
                          }
                          aria-label={`View ${
                            leave.leaveType || "leave"
                          } details`}
                        >
                          <FaEye />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredLeaves.length > 0 && (
          <footer className="my-leaves-table-footer">
            <span>
              Showing {filteredLeaves.length} of {leaves.length} requests
            </span>

            <button
              type="button"
              onClick={() => loadLeaves(true)}
              disabled={refreshing}
            >
              <FaSyncAlt
                className={
                  refreshing ? "my-leaves-spinning" : ""
                }
              />
              Refresh list
            </button>
          </footer>
        )}
      </section>

      {activeLeave && (
        <div
          className="my-leaves-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedLeave(null);
            }
          }}
        >
          <section
            className="my-leaves-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-leaves-modal-title"
          >
            <div className="my-leaves-modal-heading">
              <div>
                <span>LEAVE REQUEST DETAILS</span>

                <h2 id="my-leaves-modal-title">
                  {activeLeave.leaveType || "Leave"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                aria-label="Close details"
              >
                <FaTimes />
              </button>
            </div>

            <div className="my-leaves-modal-body">
              <div>
                <small>Start date</small>
                <strong>
                  {formatDate(activeLeave.startDate)}
                </strong>
              </div>

              <div>
                <small>End date</small>
                <strong>
                  {formatDate(activeLeave.endDate)}
                </strong>
              </div>

              <div>
                <small>Total days</small>
                <strong>
                  {getLeaveDays(activeLeave)}
                </strong>
              </div>

              <div>
                <small>Applied on</small>
                <strong>
                  {formatDate(
                    activeLeave.appliedOn ||
                    activeLeave.createdAt
                  )}
                </strong>
              </div>

              <div className="my-leaves-modal-reason">
                <small>Reason</small>
                <p>
                  {activeLeave.reason || "No reason provided."}
                </p>
              </div>

              {getReviewRemarks(activeLeave) && (
                <div className="my-leaves-modal-reason">
                  <small>Administrator's note</small>
                  <p>{getReviewRemarks(activeLeave)}</p>
                </div>
              )}

              <div className="my-leaves-modal-status">
                <small>Current status</small>

                <span
                  className={`my-leaves-status ${
                    getStatus(activeLeave.status).className
                  }`}
                >
                  {getStatus(activeLeave.status).icon}
                  {getStatus(activeLeave.status).label}
                </span>
              </div>
            </div>

            <div className="my-leaves-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default MyLeaves;
