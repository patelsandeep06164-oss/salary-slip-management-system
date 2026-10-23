import React from "react";
import {
  FaCheckCircle,
  FaClock,
  FaSyncAlt,
  FaTimesCircle,
  FaBan,
  FaExclamationCircle,
} from "react-icons/fa";

const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    icon: FaCheckCircle,
    color: "#15803d",
    background: "#dcfce7",
    border: "#bbf7d0",
  },
  pending: {
    label: "Pending",
    icon: FaClock,
    color: "#b45309",
    background: "#fef3c7",
    border: "#fde68a",
  },
  processing: {
    label: "Processing",
    icon: FaSyncAlt,
    color: "#0369a1",
    background: "#e0f2fe",
    border: "#bae6fd",
  },
  failed: {
    label: "Failed",
    icon: FaTimesCircle,
    color: "#b91c1c",
    background: "#fee2e2",
    border: "#fecaca",
  },
  cancelled: {
    label: "Cancelled",
    icon: FaBan,
    color: "#64748b",
    background: "#f1f5f9",
    border: "#cbd5e1",
  },
  rejected: {
    label: "Rejected",
    icon: FaExclamationCircle,
    color: "#b91c1c",
    background: "#fee2e2",
    border: "#fecaca",
  },
};

function PayrollStatusBadge({
  status,
  showIcon = true,
  size = "medium",
  className = "",
}) {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  const statusKey = normalizedStatus.replace(/\s+/g, "");
  const config = STATUS_CONFIG[statusKey] || {
    label: normalizedStatus
      ? normalizedStatus.replace(/\b\w/g, (char) => char.toUpperCase())
      : "Unknown",
    icon: FaClock,
    color: "#475569",
    background: "#f1f5f9",
    border: "#cbd5e1",
  };

  const Icon = config.icon;

  const sizes = {
    small: {
      fontSize: "11px",
      padding: "4px 8px",
      iconSize: "10px",
    },
    medium: {
      fontSize: "12px",
      padding: "6px 10px",
      iconSize: "11px",
    },
    large: {
      fontSize: "13px",
      padding: "8px 12px",
      iconSize: "12px",
    },
  };

  const badgeSize = sizes[size] || sizes.medium;

  return (
    <span
      className={className}
      role="status"
      aria-label={`Payroll status: ${config.label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: badgeSize.padding,
        borderRadius: "999px",
        border: `1px solid ${config.border}`,
        background: config.background,
        color: config.color,
        fontSize: badgeSize.fontSize,
        fontWeight: 700,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
    >
      {showIcon && (
        <Icon
          size={badgeSize.iconSize}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            animation:
              statusKey === "processing"
                ? "payrollStatusSpin 1.5s linear infinite"
                : "none",
          }}
        />
      )}

      {config.label}

      <style>
        {`
          @keyframes payrollStatusSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @media (prefers-reduced-motion: reduce) {
            span svg {
              animation: none !important;
            }
          }
        `}
      </style>
    </span>
  );
}

export default PayrollStatusBadge;
