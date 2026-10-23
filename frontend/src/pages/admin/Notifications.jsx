import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaSearch,
  FaSyncAlt,
  FaWallet,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaCog,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaInbox,
} from "react-icons/fa";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All notifications" },
  { value: "payroll", label: "Payroll" },
  { value: "salary-slip", label: "Salary Slips" },
  { value: "email", label: "Email" },
  { value: "system", label: "System" },
];

function getCategoryIcon(category) {
  switch (category) {
    case "payroll":
      return <FaWallet />;
    case "salary-slip":
      return <FaFileInvoiceDollar />;
    case "email":
      return <FaEnvelope />;
    default:
      return <FaCog />;
  }
}

function getTypeIcon(type) {
  switch (type) {
    case "success":
      return <FaCheckCircle />;
    case "warning":
      return <FaExclamationTriangle />;
    case "error":
      return <FaTimesCircle />;
    default:
      return <FaInfoCircle />;
  }
}

function formatDate(dateValue) {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchNotifications = useCallback(
    async (showRefresh = false, requestedPage = page) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setNotifications([]);
          setUnreadCount(0);
          setError("Your login session was not found. Please log in again.");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/notifications?page=${requestedPage}&limit=100`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Unable to load notifications (${response.status}).`
          );
        }

        const items = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        setNotifications(items);
        setUnreadCount(Math.max(0, Number(data.unreadCount) || 0));
        setPagination(
          data.pagination || {
            page: requestedPage,
            limit: 100,
            total: items.length,
            totalPages: 1,
          }
        );

        window.dispatchEvent(new Event("notifications-updated"));
      } catch (err) {
        setError(
          err.message ||
            "Notifications load nahi ho paayi. Backend server check karein."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAuthHeaders, page]
  );

  useEffect(() => {
    fetchNotifications(false, page);
  }, [fetchNotifications, page]);

  const markAsRead = async (notificationId) => {
    setProcessingId(notificationId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not mark notification as read.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId
            ? {
                ...item,
                isRead: true,
                readAt: data.notification?.readAt || new Date().toISOString(),
              }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
      setSuccessMessage("Notification marked as read.");

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      setError(err.message || "Could not update notification.");
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not mark all as read.");
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
      setSuccessMessage("All notifications marked as read.");

      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      setError(err.message || "Could not update notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchesSearch =
        !searchText ||
        String(item.title || "").toLowerCase().includes(searchText) ||
        String(item.message || "").toLowerCase().includes(searchText);

      const matchesCategory =
        category === "all" || item.category === category;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && !item.isRead) ||
        (statusFilter === "read" && item.isRead);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [notifications, search, category, statusFilter]);

  const unreadOnPage = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="notifications-page">
      <style>{`
        .notifications-page,
        .notifications-page * {
          box-sizing: border-box;
        }

        .notifications-page {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          color: #18354d;
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        .notifications-page button,
        .notifications-page input,
        .notifications-page select {
          font: inherit;
        }

        .notifications-hero {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: clamp(20px, 3vw, 32px);
          margin-bottom: 24px;
          border-radius: 22px;
          color: #fff;
          background: linear-gradient(120deg, #087fba, #12b8c7 58%, #36c9b5);
          box-shadow: 0 12px 30px rgba(8, 127, 186, .16);
        }

        .notifications-hero::after {
          content: "";
          position: absolute;
          width: 190px;
          height: 190px;
          right: 9%;
          top: -115px;
          border: 30px solid rgba(255,255,255,.09);
          border-radius: 50%;
          pointer-events: none;
        }

        .notifications-hero-content {
          position: relative;
          z-index: 1;
          min-width: 0;
        }

        .notifications-hero h1 {
          margin: 0 0 8px;
          font-size: clamp(23px, 3vw, 32px);
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -.5px;
          overflow-wrap: anywhere;
        }

        .notifications-hero p {
          margin: 0;
          color: rgba(255,255,255,.9);
          font-size: 14px;
          line-height: 1.6;
        }

        .notifications-hero-icon {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          flex: 0 0 68px;
          width: 68px;
          height: 68px;
          border: 1px solid rgba(255,255,255,.32);
          border-radius: 20px;
          background: rgba(255,255,255,.16);
          font-size: 27px;
        }

        .notifications-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .notifications-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 19px;
          border: 1px solid #e5edf5;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(30,64,95,.035);
        }

        .notifications-stat-icon {
          display: grid;
          place-items: center;
          flex: 0 0 45px;
          width: 45px;
          height: 45px;
          border-radius: 14px;
          background: #e5f8fb;
          color: #0799b5;
          font-size: 19px;
        }

        .notifications-stat-number {
          display: block;
          color: #163750;
          font-size: 25px;
          line-height: 1.2;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .notifications-stat-label {
          display: block;
          margin-top: 4px;
          color: #74879a;
          font-size: 12px;
          font-weight: 600;
        }

        .notifications-panel {
          overflow: hidden;
          border: 1px solid #e3ebf3;
          border-radius: 19px;
          background: #fff;
          box-shadow: 0 7px 24px rgba(30,64,95,.04);
        }

        .notifications-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding: 22px 24px;
          border-bottom: 1px solid #edf1f6;
        }

        .notifications-panel-heading {
          min-width: 0;
        }

        .notifications-panel-heading h2 {
          margin: 0;
          color: #173750;
          font-size: 18px;
          font-weight: 800;
        }

        .notifications-panel-heading p {
          margin: 5px 0 0;
          color: #8293a5;
          font-size: 12px;
          line-height: 1.5;
        }

        .notifications-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .notifications-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 39px;
          padding: 9px 13px;
          border: 1px solid #dce7ef;
          border-radius: 10px;
          background: #fff;
          color: #3d5c73;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s, border-color .2s, transform .2s;
        }

        .notifications-button:hover:not(:disabled) {
          border-color: #8bd9e5;
          background: #f0fbfd;
        }

        .notifications-button:active:not(:disabled) {
          transform: scale(.98);
        }

        .notifications-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .notifications-button-primary {
          border-color: transparent;
          color: #fff;
          background: linear-gradient(120deg, #0789bf, #0bb7bf);
        }

        .notifications-button-primary:hover:not(:disabled) {
          color: #fff;
          background: linear-gradient(120deg, #0676a7, #099da5);
        }

        .notifications-filters {
          display: grid;
          grid-template-columns: minmax(180px, 1.5fr) repeat(2, minmax(145px, 1fr));
          gap: 12px;
          padding: 18px 24px;
          border-bottom: 1px solid #edf1f6;
          background: #fbfdff;
        }

        .notifications-search {
          position: relative;
          min-width: 0;
        }

        .notifications-search > svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #8a9caf;
          font-size: 13px;
          pointer-events: none;
        }

        .notifications-control {
          width: 100%;
          min-width: 0;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #dfe8f0;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #24445c;
          font-size: 12px;
        }

        .notifications-search .notifications-control {
          padding-left: 36px;
        }

        .notifications-control:focus {
          border-color: #18b5c6;
          box-shadow: 0 0 0 3px rgba(24,181,198,.12);
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
        }

        .notification-item {
          display: grid;
          grid-template-columns: 45px minmax(0, 1fr) auto;
          align-items: start;
          gap: 14px;
          padding: 21px 24px;
          border-bottom: 1px solid #edf1f6;
          transition: background .2s;
        }

        .notification-item:last-child {
          border-bottom: 0;
        }

        .notification-item:hover {
          background: #fbfdff;
        }

        .notification-item.unread {
          background: #f0fbff;
        }

        .notification-item.unread:hover {
          background: #eaf8ff;
        }

        .notification-category-icon {
          position: relative;
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          border-radius: 14px;
          background: #e4f8fb;
          color: #078fb0;
          font-size: 17px;
        }

        .notification-item.unread .notification-category-icon::after {
          content: "";
          position: absolute;
          top: -3px;
          right: -3px;
          width: 10px;
          height: 10px;
          border: 2px solid #fff;
          border-radius: 50%;
          background: #ef4444;
        }

        .notification-content {
          min-width: 0;
        }

        .notification-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 7px;
        }

        .notification-title {
          margin: 0;
          color: #173750;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .notification-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .notification-status-success {
          color: #14804a;
          background: #e7f8ee;
        }

        .notification-status-warning {
          color: #a16207;
          background: #fff6d9;
        }

        .notification-status-error {
          color: #c62828;
          background: #ffeded;
        }

        .notification-status-info {
          color: #0878a3;
          background: #e5f6ff;
        }

        .notification-message {
          margin: 0;
          color: #61788c;
          font-size: 13px;
          line-height: 1.7;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 10px;
          color: #8b9bad;
          font-size: 11px;
        }

        .notification-meta-category {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          text-transform: capitalize;
        }

        .notification-item-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 100px;
        }

        .notification-read-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 34px;
          padding: 7px 10px;
          border: 1px solid #cfe6ee;
          border-radius: 9px;
          background: #fff;
          color: #087e9f;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          cursor: pointer;
        }

        .notification-read-button:hover:not(:disabled) {
          background: #e5f8fb;
        }

        .notification-read-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .notification-read-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #8394a5;
          font-size: 11px;
          white-space: nowrap;
        }

        .notifications-message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 13px 16px;
          margin: 0 24px 16px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .notifications-message-error {
          color: #a32121;
          border: 1px solid #f5c7c7;
          background: #fff1f1;
        }

        .notifications-message-success {
          color: #166534;
          border: 1px solid #bce8ca;
          background: #effcf3;
        }

        .notifications-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 230px;
          padding: 30px 20px;
          color: #8496a7;
          text-align: center;
        }

        .notifications-state-icon {
          display: grid;
          place-items: center;
          width: 60px;
          height: 60px;
          border-radius: 18px;
          color: #12a9bc;
          background: #e7f9fb;
          font-size: 24px;
        }

        .notifications-state h3 {
          margin: 0;
          color: #294960;
          font-size: 16px;
        }

        .notifications-state p {
          max-width: 390px;
          margin: 0;
          font-size: 12px;
          line-height: 1.7;
        }

        .notifications-spinner {
          animation: notifications-spin 1s linear infinite;
        }

        @keyframes notifications-spin {
          to { transform: rotate(360deg); }
        }

        .notifications-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #edf1f6;
          color: #8293a5;
          font-size: 11px;
        }

        .notifications-page :focus-visible {
          outline: 3px solid rgba(8, 153, 181, .4);
          outline-offset: 2px;
        }

        @media (max-width: 900px) {
          .notifications-hero {
            border-radius: 18px;
          }

          .notifications-stats {
            gap: 12px;
          }

          .notifications-stat {
            padding: 15px;
            gap: 10px;
          }

          .notifications-panel-header,
          .notifications-filters {
            padding-left: 18px;
            padding-right: 18px;
          }

          .notification-item {
            padding: 18px;
          }
        }

        @media (max-width: 650px) {
          .notifications-hero {
            padding: 21px 18px;
            gap: 12px;
          }

          .notifications-hero-icon {
            flex-basis: 48px;
            width: 48px;
            height: 48px;
            border-radius: 14px;
            font-size: 21px;
          }

          .notifications-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .notifications-stat {
            padding: 13px 15px;
          }

          .notifications-stat-icon {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
          }

          .notifications-stat-number {
            font-size: 21px;
          }

          .notifications-panel-header {
            align-items: flex-start;
            padding: 17px 15px;
          }

          .notifications-actions {
            width: 100%;
          }

          .notifications-actions .notifications-button {
            flex: 1 1 auto;
          }

          .notifications-filters {
            grid-template-columns: 1fr;
            padding: 14px 15px;
          }

          .notification-item {
            grid-template-columns: 38px minmax(0, 1fr);
            gap: 11px;
            padding: 16px 13px;
          }

          .notification-category-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            font-size: 15px;
          }

          .notification-item-actions {
            grid-column: 2;
            justify-content: flex-start;
            min-width: 0;
            margin-top: -1px;
          }

          .notifications-message {
            margin-left: 13px;
            margin-right: 13px;
          }

          .notifications-footer {
            padding: 14px;
          }
        }

        @media (max-width: 380px) {
          .notifications-hero h1 {
            font-size: 22px;
          }

          .notifications-hero p {
            font-size: 12px;
          }

          .notifications-button {
            padding: 8px 10px;
            font-size: 11px;
          }

          .notifications-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .notifications-page *,
          .notifications-page *::before,
          .notifications-page *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <section className="notifications-hero">
        <div className="notifications-hero-content">
          <h1>Notifications</h1>
          <p>
            Keep track of payroll activity, salary slips, email updates and
            important system events.
          </p>
        </div>
        <div className="notifications-hero-icon" aria-hidden="true">
          <FaBell />
        </div>
      </section>

      <section className="notifications-stats" aria-label="Notification summary">
        <div className="notifications-stat">
          <div className="notifications-stat-icon">
            <FaBell />
          </div>
          <div>
            <span className="notifications-stat-number">{pagination.total}</span>
            <span className="notifications-stat-label">Total notifications</span>
          </div>
        </div>

        <div className="notifications-stat">
          <div className="notifications-stat-icon">
            <FaEnvelope />
          </div>
          <div>
            <span className="notifications-stat-number">{unreadCount}</span>
            <span className="notifications-stat-label">Unread notifications</span>
          </div>
        </div>

        <div className="notifications-stat">
          <div className="notifications-stat-icon">
            <FaCheckDouble />
          </div>
          <div>
            <span className="notifications-stat-number">
              {Math.max(0, pagination.total - unreadCount)}
            </span>
            <span className="notifications-stat-label">Read notifications</span>
          </div>
        </div>
      </section>

      <section className="notifications-panel">
        <div className="notifications-panel-header">
          <div className="notifications-panel-heading">
            <h2>Recent activity</h2>
            <p>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                : "You are all caught up."}
            </p>
          </div>

          <div className="notifications-actions">
            <button
              type="button"
              className="notifications-button"
              onClick={() => fetchNotifications(true, page)}
              disabled={refreshing || loading}
            >
              <FaSyncAlt className={refreshing ? "notifications-spinner" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              className="notifications-button notifications-button-primary"
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || markingAll}
            >
              <FaCheckDouble />
              {markingAll ? "Updating..." : "Mark all as read"}
            </button>
          </div>
        </div>

        <div className="notifications-filters">
          <label className="notifications-search">
            <FaSearch />
            <input
              type="search"
              className="notifications-control"
              placeholder="Search notifications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search notifications"
            />
          </label>

          <label>
            <span className="sr-only" />
            <select
              className="notifications-control"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only" />
            <select
              className="notifications-control"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by read status"
            >
              <option value="all">All statuses</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="notifications-message notifications-message-error" role="alert">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="notifications-message notifications-message-success" role="status">
            <FaCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="notifications-state">
            <FaSyncAlt className="notifications-spinner" size={24} />
            <h3>Loading notifications...</h3>
            <p>Please wait while we fetch the latest updates.</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-state">
            <div className="notifications-state-icon">
              <FaInbox />
            </div>
            <h3>
              {notifications.length === 0
                ? "No notifications yet"
                : "No matching notifications"}
            </h3>
            <p>
              {notifications.length === 0
                ? "Payroll and email notifications will appear here when the backend creates them."
                : "Try changing your search text or filters."}
            </p>
            {notifications.length > 0 && (
              <button
                type="button"
                className="notifications-button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setStatusFilter("all");
                }}
              >
                <FaFilter />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((item) => (
              <article
                key={item._id}
                className={`notification-item ${item.isRead ? "read" : "unread"}`}
              >
                <div className="notification-category-icon" aria-hidden="true">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3 className="notification-title">
                      {item.title || "Notification"}
                    </h3>

                    <span
                      className={`notification-status notification-status-${
                        ["success", "warning", "error"].includes(item.type)
                          ? item.type
                          : "info"
                      }`}
                    >
                      {getTypeIcon(item.type)}
                      {item.type || "info"}
                    </span>

                    {!item.isRead && (
                      <span className="notification-status notification-status-info">
                        New
                      </span>
                    )}
                  </div>

                  <p className="notification-message">
                    {item.message || "No additional details."}
                  </p>

                  <div className="notification-meta">
                    <span className="notification-meta-category">
                      {getCategoryIcon(item.category)}
                      {String(item.category || "system").replace("-", " ")}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>

                <div className="notification-item-actions">
                  {item.isRead ? (
                    <span className="notification-read-label">
                      <FaCheck />
                      Read
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() => markAsRead(item._id)}
                      disabled={processingId === item._id || markingAll}
                    >
                      <FaCheck />
                      {processingId === item._id ? "Saving..." : "Mark as read"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="notifications-footer">
          <span>
            Showing {filteredNotifications.length} of {pagination.total} notifications
          </span>
          <span>Unread: {unreadOnPage}</span>
        </div>
      </section>
    </div>
  );
}

export default Notifications;