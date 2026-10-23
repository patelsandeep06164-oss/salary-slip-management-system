import React from "react";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBan,
  FaInfoCircle,
} from "react-icons/fa";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "leave-status-pending",
    icon: FaClock,
  },
  approved: {
    label: "Approved",
    className: "leave-status-approved",
    icon: FaCheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "leave-status-rejected",
    icon: FaTimesCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "leave-status-cancelled",
    icon: FaBan,
  },
  "on leave": {
    label: "On Leave",
    className: "leave-status-on-leave",
    icon: FaInfoCircle,
  },
};

function LeaveStatusBadge({
  status,
  showIcon = true,
  size = "medium",
  className = "",
}) {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const config = STATUS_CONFIG[normalizedStatus] || {
    label: normalizedStatus
      ? normalizedStatus.replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
      : "Unknown",
    className: "leave-status-default",
    icon: FaInfoCircle,
  };

  const Icon = config.icon;

  const normalizedSize = ["small", "medium", "large"].includes(size)
    ? size
    : "medium";

  return (
    <>
      <style>{`
        .leave-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          max-width: 100%;
          border: 1px solid transparent;
          border-radius: 20px;
          font-family: Inter, Arial, sans-serif;
          font-weight: 700;
          line-height: 1.4;
          white-space: nowrap;
          vertical-align: middle;
        }

        .leave-status-badge svg {
          flex-shrink: 0;
          font-size: 0.9em;
        }

        .leave-status-small {
          padding: 4px 8px;
          font-size: 10px;
        }

        .leave-status-medium {
          padding: 5px 10px;
          font-size: 11px;
        }

        .leave-status-large {
          padding: 7px 12px;
          font-size: 12px;
        }

        .leave-status-pending {
          color: #92400e;
          background: #fef3c7;
          border-color: #fde68a;
        }

        .leave-status-approved {
          color: #166534;
          background: #dcfce7;
          border-color: #bbf7d0;
        }

        .leave-status-rejected {
          color: #991b1b;
          background: #fee2e2;
          border-color: #fecaca;
        }

        .leave-status-cancelled {
          color: #475569;
          background: #f1f5f9;
          border-color: #e2e8f0;
        }

        .leave-status-on-leave {
          color: #075985;
          background: #e0f2fe;
          border-color: #bae6fd;
        }

        .leave-status-default {
          color: #087f8c;
          background: #e9fbf8;
          border-color: #bceee7;
        }
      `}</style>

      <span
        className={[
          "leave-status-badge",
          normalizedSize === "small"
            ? "leave-status-small"
            : normalizedSize === "large"
            ? "leave-status-large"
            : "leave-status-medium",
          config.className,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-label={`Leave status: ${config.label}`}
      >
        {showIcon && <Icon aria-hidden="true" />}
        <span>{config.label}</span>
      </span>
    </>
  );
}

export default LeaveStatusBadge;
