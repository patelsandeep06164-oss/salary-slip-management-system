
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSyncAlt,
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaTimes,
  FaFilter,
  FaFileAlt,
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaRegCalendarCheck,
  FaInfoCircle,
  FaArrowRight,
} from "react-icons/fa";
import "./LeaveRequests.css";

/*
  BACKEND INTEGRATION
  Change API_BASE_URL if your backend uses another base URL.
  Expected endpoints:
  GET   /api/leave-requests
  PATCH /api/leave-requests/:id/status
*/

const API_BASE_URL = "/api/leave-requests";

const LEAVE_TYPES = [
  "Casual Leave",
  "Sick Leave",
  "Earned Leave",
  "Unpaid Leave",
  "Other",
];

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

function getToken() {
  return localStorage.getItem("token") || "";
}

function getRequestId(request) {
  return request?._id || request?.id || request?.leaveId || "";
}

function getEmployeeName(request) {
  return (
    request?.employeeName ||
    request?.employee?.name ||
    request?.employee?.fullName ||
    request?.name ||
    "Employee"
  );
}

function getEmployeeId(request) {
  return (
    request?.employeeId ||
    request?.employeeCode ||
    request?.employee?.employeeId ||
    request?.employee?.employeeCode ||
    ""
  );
}

function getStatus(status) {
  const value = String(status || "Pending").toLowerCase();

  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  if (["cancelled", "canceled"].includes(value)) return "Cancelled";

  return "Pending";
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateDays(startDate, endDate, savedDays) {
  if (Number(savedDays) > 0) return Number(savedDays);
  if (!startDate || !endDate) return 0;

  const start = new Date(`${String(startDate).slice(0, 10)}T00:00:00`);
  const end = new Date(`${String(endDate).slice(0, 10)}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  return Math.round((end - start) / 86400000) + 1;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

async function apiRequest(url, options = {}) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object"
        ? data?.message || data?.error
        : data;

    throw new Error(
      message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

function extractRequests(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.leaveRequests)) return data.leaveRequests;
  if (Array.isArray(data?.leaves)) return data.leaves;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.requests)) return data.data.requests;
  if (Array.isArray(data?.data?.leaves)) return data.data.leaves;

  return [];
}

function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const loadRequests = useCallback(async (showRefresh = false) => {
    setError("");
    setNotice("");

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await apiRequest(API_BASE_URL);
      setRequests(extractRequests(result));
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load leave requests. Please check your backend API."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        (request) => getStatus(request.status) === "Pending"
      ).length,
      approved: requests.filter(
        (request) => getStatus(request.status) === "Approved"
      ).length,
      rejected: requests.filter(
        (request) => getStatus(request.status) === "Rejected"
      ).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const employeeName = getEmployeeName(request).toLowerCase();
      const employeeId = String(getEmployeeId(request)).toLowerCase();
      const email = String(
        request.email || request.employee?.email || ""
      ).toLowerCase();
      const leaveType = String(request.leaveType || "").toLowerCase();
      const reason = String(request.reason || "").toLowerCase();

      const matchesSearch =
        !query ||
        employeeName.includes(query) ||
        employeeId.includes(query) ||
        email.includes(query) ||
        leaveType.includes(query) ||
        reason.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        getStatus(request.status) === statusFilter;

      const matchesType =
        typeFilter === "All" || request.leaveType === typeFilter;

      const start = String(request.startDate || "").slice(0, 10);
      const end = String(request.endDate || "").slice(0, 10);

      const matchesFromDate = !fromDate || end >= fromDate;
      const matchesToDate = !toDate || start <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [requests, search, statusFilter, typeFilter, fromDate, toDate]);

  const handleStatusUpdate = async () => {
    if (!confirmAction) return;

    const request = confirmAction.request;
    const id = getRequestId(request);
    const nextStatus = confirmAction.status;

    if (!id) {
      setError(
        "This leave request has no ID. Ensure your backend returns each request's _id or id."
      );
      setConfirmAction(null);
      return;
    }

    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      /*
        Expected backend:
        PATCH /api/leave-requests/:id/status
        Body: { "status": "Approved" } or { "status": "Rejected" }

        Adjust this URL or payload to match your backend route.
      */
      const result = await apiRequest(
        `${API_BASE_URL}/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const updatedRequest =
        result?.request ||
        result?.leaveRequest ||
        result?.data?.request ||
        result?.data?.leaveRequest ||
        result?.data;

      setRequests((previous) =>
        previous.map((item) => {
          if (String(getRequestId(item)) !== String(id)) return item;

          if (
            updatedRequest &&
            typeof updatedRequest === "object" &&
            !Array.isArray(updatedRequest)
          ) {
            return {
              ...item,
              ...updatedRequest,
              status: updatedRequest.status || nextStatus,
            };
          }

          return { ...item, status: nextStatus };
        })
      );

      setSelectedRequest((previous) => {
        if (
          !previous ||
          String(getRequestId(previous)) !== String(id)
        ) {
          return previous;
        }

        return {
          ...previous,
          ...(updatedRequest && typeof updatedRequest === "object"
            ? updatedRequest
            : {}),
          status: updatedRequest?.status || nextStatus,
        };
      });

      setNotice(`Leave request ${nextStatus.toLowerCase()} successfully.`);
      setConfirmAction(null);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to update the leave request. Please try again."
        )
      );
    } finally {
      setUpdatingId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    search || statusFilter !== "All" || typeFilter !== "All" ||
    fromDate || toDate;

  const activeRequest = selectedRequest
    ? requests.find(
        (request) =>
          String(getRequestId(request)) ===
          String(getRequestId(selectedRequest))
      ) || selectedRequest
    : null;

  return (
    <main className="leave-requests-page">
      <div className="lr-top-accent" />

      <header className="lr-page-header">
        <div className="lr-header-copy">
          <span className="lr-eyebrow">
            <span className="lr-eyebrow-dot" />
            ADMINISTRATION / LEAVE MANAGEMENT
          </span>

          <h1>Leave Requests</h1>

          <p>
            Review employee leave applications and manage approval decisions.
          </p>
        </div>

        <button
          type="button"
          className="lr-refresh-button"
          onClick={() => loadRequests(true)}
          disabled={loading || refreshing}
        >
          <FaSyncAlt className={refreshing ? "lr-spinning" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section className="lr-stats-grid" aria-label="Leave request summary">
        <article className="lr-stat-card">
          <div className="lr-stat-icon lr-stat-blue">
            <FaFileAlt />
          </div>
          <div className="lr-stat-content">
            <span>Total requests</span>
            <strong>{stats.total}</strong>
            <small>All submitted applications</small>
          </div>
        </article>

        <article className="lr-stat-card">
          <div className="lr-stat-icon lr-stat-orange">
            <FaClock />
          </div>
          <div className="lr-stat-content">
            <span>Pending review</span>
            <strong>{stats.pending}</strong>
            <small>Awaiting administrator action</small>
          </div>
        </article>

        <article className="lr-stat-card">
          <div className="lr-stat-icon lr-stat-green">
            <FaCheckCircle />
          </div>
          <div className="lr-stat-content">
            <span>Approved</span>
            <strong>{stats.approved}</strong>
            <small>Approved leave applications</small>
          </div>
        </article>

        <article className="lr-stat-card">
          <div className="lr-stat-icon lr-stat-red">
            <FaTimesCircle />
          </div>
          <div className="lr-stat-content">
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
            <small>Rejected leave applications</small>
          </div>
        </article>
      </section>

      {error && (
        <div className="lr-alert lr-alert-error" role="alert">
          <FaInfoCircle />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {notice && (
        <div className="lr-alert lr-alert-success" role="status">
          <FaCheckCircle />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="lr-filter-card">
        <div className="lr-filter-heading">
          <div className="lr-filter-title">
            <span className="lr-filter-icon">
              <FaFilter />
            </span>
            <div>
              <h2>Find leave requests</h2>
              <p>Search and filter submitted applications.</p>
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="lr-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="lr-filters-grid">
          <div className="lr-search-box">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, email or reason..."
              aria-label="Search leave requests"
            />
          </div>

          <div className="lr-filter-field">
            <label htmlFor="lr-status-filter">Status</label>
            <select
              id="lr-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="lr-filter-field">
            <label htmlFor="lr-type-filter">Leave type</label>
            <select
              id="lr-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="All">All leave types</option>
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="lr-filter-field">
            <label htmlFor="lr-from-date">From date</label>
            <input
              id="lr-from-date"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>

          <div className="lr-filter-field">
            <label htmlFor="lr-to-date">To date</label>
            <input
              id="lr-to-date"
              type="date"
              min={fromDate || undefined}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="lr-requests-card">
        <div className="lr-table-heading">
          <div>
            <h2>Submitted applications</h2>
            <p>
              {loading
                ? "Loading leave requests..."
                : `${filteredRequests.length} ${
                    filteredRequests.length === 1 ? "request" : "requests"
                  } found`}
            </p>
          </div>

          <span className="lr-table-heading-icon">
            <FaUsers />
          </span>
        </div>

        {loading ? (
          <div className="lr-state-box">
            <span className="lr-loader" />
            <strong>Loading requests</strong>
            <p>Fetching leave applications from the server.</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="lr-state-box">
            <span className="lr-empty-icon">
              <FaRegCalendarCheck />
            </span>
            <strong>
              {requests.length === 0
                ? "No leave requests available"
                : "No matching requests"}
            </strong>
            <p>
              {requests.length === 0
                ? "Leave applications will appear here when the backend returns them."
                : "Try changing your search or filter criteria."}
            </p>

            {hasFilters && (
              <button
                type="button"
                className="lr-empty-button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="lr-table-scroll">
            <table className="lr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave type</th>
                  <th>Leave dates</th>
                  <th>Duration</th>
                  <th>Applied on</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request, index) => {
                  const id = getRequestId(request);
                  const status = getStatus(request.status);
                  const employeeName = getEmployeeName(request);
                  const employeeId = getEmployeeId(request);
                  const days = calculateDays(
                    request.startDate,
                    request.endDate,
                    request.totalDays
                  );

                  return (
                    <tr key={id || `${employeeName}-${index}`}>
                      <td>
                        <div className="lr-employee-cell">
                          <span className="lr-employee-avatar">
                            {employeeName
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </span>

                          <div className="lr-employee-info">
                            <strong>{employeeName}</strong>
                            <span>
                              {employeeId
                                ? `ID: ${employeeId}`
                                : request.email ||
                                  request.employee?.email ||
                                  "Employee ID unavailable"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="lr-leave-type">
                          {request.leaveType || "Not specified"}
                        </span>
                      </td>

                      <td>
                        <div className="lr-date-cell">
                          <strong>{formatDate(request.startDate)}</strong>
                          <span>
                            <FaArrowRight />
                            {formatDate(request.endDate)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="lr-duration-pill">
                          <FaCalendarAlt />
                          {days} {days === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td className="lr-applied-date">
                        {formatDate(request.appliedOn || request.createdAt)}
                      </td>

                      <td>
                        <span
                          className={`lr-status lr-status-${status.toLowerCase()}`}
                        >
                          <span />
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="lr-row-actions">
                          <button
                            type="button"
                            className="lr-action-button lr-view-button"
                            title="View request details"
                            aria-label={`View ${employeeName}'s request`}
                            onClick={() => setSelectedRequest(request)}
                          >
                            <FaEye />
                          </button>

                          {status === "Pending" && (
                            <>
                              <button
                                type="button"
                                className="lr-action-button lr-approve-button"
                                title="Approve request"
                                aria-label={`Approve ${employeeName}'s request`}
                                disabled={updatingId === id || !id}
                                onClick={() =>
                                  setConfirmAction({
                                    request,
                                    status: "Approved",
                                  })
                                }
                              >
                                <FaCheckCircle />
                              </button>

                              <button
                                type="button"
                                className="lr-action-button lr-reject-button"
                                title="Reject request"
                                aria-label={`Reject ${employeeName}'s request`}
                                disabled={updatingId === id || !id}
                                onClick={() =>
                                  setConfirmAction({
                                    request,
                                    status: "Rejected",
                                  })
                                }
                              >
                                <FaTimesCircle />
                              </button>
                            </>
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

        {!loading && filteredRequests.length > 0 && (
          <div className="lr-table-footer">
            <span>
              Showing {filteredRequests.length} of {requests.length} requests
            </span>

            <button
              type="button"
              className="lr-footer-refresh"
              onClick={() => loadRequests(true)}
              disabled={refreshing}
            >
              <FaSyncAlt className={refreshing ? "lr-spinning" : ""} />
              Refresh list
            </button>
          </div>
        )}
      </section>

      {activeRequest && (
        <div
          className="lr-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <section
            className="lr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lr-detail-title"
          >
            <div className="lr-modal-header">
              <div>
                <span className="lr-modal-eyebrow">LEAVE APPLICATION</span>
                <h2 id="lr-detail-title">Request details</h2>
              </div>

              <button
                type="button"
                className="lr-modal-close"
                aria-label="Close details"
                onClick={() => setSelectedRequest(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="lr-modal-body">
              <div className="lr-detail-profile">
                <span className="lr-detail-avatar">
                  {getEmployeeName(activeRequest)
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>

                <div>
                  <h3>{getEmployeeName(activeRequest)}</h3>
                  <p>
                    {getEmployeeId(activeRequest)
                      ? `Employee ID: ${getEmployeeId(activeRequest)}`
                      : "Employee ID unavailable"}
                  </p>
                </div>

                <span
                  className={`lr-status lr-status-${getStatus(
                    activeRequest.status
                  ).toLowerCase()}`}
                >
                  <span />
                  {getStatus(activeRequest.status)}
                </span>
              </div>

              <div className="lr-detail-grid">
                <div className="lr-detail-item">
                  <span><FaFileAlt /> Leave type</span>
                  <strong>{activeRequest.leaveType || "—"}</strong>
                </div>

                <div className="lr-detail-item">
                  <span><FaCalendarAlt /> Duration</span>
                  <strong>
                    {calculateDays(
                      activeRequest.startDate,
                      activeRequest.endDate,
                      activeRequest.totalDays
                    )}{" "}
                    days
                  </strong>
                </div>

                <div className="lr-detail-item">
                  <span><FaRegCalendarCheck /> Start date</span>
                  <strong>{formatDate(activeRequest.startDate)}</strong>
                </div>

                <div className="lr-detail-item">
                  <span><FaRegCalendarCheck /> End date</span>
                  <strong>{formatDate(activeRequest.endDate)}</strong>
                </div>

                <div className="lr-detail-item">
                  <span><FaCalendarAlt /> Applied on</span>
                  <strong>
                    {formatDate(
                      activeRequest.appliedOn || activeRequest.createdAt
                    )}
                  </strong>
                </div>

                <div className="lr-detail-item">
                  <span><FaBuilding /> Department</span>
                  <strong>
                    {activeRequest.department ||
                      activeRequest.employee?.department ||
                      "—"}
                  </strong>
                </div>

                <div className="lr-detail-item lr-detail-full">
                  <span><FaEnvelope /> Email address</span>
                  <strong>
                    {activeRequest.email ||
                      activeRequest.employee?.email ||
                      "—"}
                  </strong>
                </div>

                <div className="lr-detail-item lr-detail-full">
                  <span><FaUser /> Reason for leave</span>
                  <p className="lr-reason-text">
                    {activeRequest.reason || "No reason provided."}
                  </p>
                </div>

                {activeRequest.adminRemarks && (
                  <div className="lr-detail-item lr-detail-full">
                    <span><FaInfoCircle /> Administrator remarks</span>
                    <p className="lr-reason-text">
                      {activeRequest.adminRemarks}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lr-modal-footer">
              <button
                type="button"
                className="lr-modal-secondary"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>

              {getStatus(activeRequest.status) === "Pending" && (
                <>
                  <button
                    type="button"
                    className="lr-modal-reject"
                    disabled={updatingId === getRequestId(activeRequest)}
                    onClick={() => {
                      setConfirmAction({
                        request: activeRequest,
                        status: "Rejected",
                      });
                      setSelectedRequest(null);
                    }}
                  >
                    <FaTimesCircle />
                    Reject
                  </button>

                  <button
                    type="button"
                    className="lr-modal-approve"
                    disabled={updatingId === getRequestId(activeRequest)}
                    onClick={() => {
                      setConfirmAction({
                        request: activeRequest,
                        status: "Approved",
                      });
                      setSelectedRequest(null);
                    }}
                  >
                    <FaCheckCircle />
                    Approve
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="lr-modal-overlay">
          <section
            className="lr-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="lr-confirm-title"
          >
            <span
              className={`lr-confirm-icon ${
                confirmAction.status === "Approved"
                  ? "lr-confirm-icon-approve"
                  : "lr-confirm-icon-reject"
              }`}
            >
              {confirmAction.status === "Approved" ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
            </span>

            <h2 id="lr-confirm-title">
              {confirmAction.status === "Approved"
                ? "Approve leave request?"
                : "Reject leave request?"}
            </h2>

            <p>
              You are about to{" "}
              {confirmAction.status === "Approved" ? "approve" : "reject"}{" "}
              the leave application submitted by{" "}
              <strong>{getEmployeeName(confirmAction.request)}</strong>.
            </p>

            <div className="lr-confirm-actions">
              <button
                type="button"
                className="lr-modal-secondary"
                onClick={() => setConfirmAction(null)}
                disabled={Boolean(updatingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  confirmAction.status === "Approved"
                    ? "lr-modal-approve"
                    : "lr-modal-reject"
                }
                onClick={handleStatusUpdate}
                disabled={Boolean(updatingId)}
              >
                {updatingId
                  ? "Updating..."
                  : `Confirm ${confirmAction.status}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default LeaveRequests;
