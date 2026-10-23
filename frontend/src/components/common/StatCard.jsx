import React from "react";
import {
  FaUsers,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

function StatCard({
  title = "Total Employees",
  value = "0",
  icon: Icon = FaUsers,
  color = "blue",
  change,
  changeType = "up",
  description = "Compared to last month",
  onClick,
  loading = false,
}) {
  const colors = {
    blue: {
      background: "#eaf5ff",
      foreground: "#0878e8",
      shadow: "rgba(8, 120, 232, .13)",
    },
    green: {
      background: "#e9fbf4",
      foreground: "#07966f",
      shadow: "rgba(7, 150, 111, .12)",
    },
    orange: {
      background: "#fff4e8",
      foreground: "#e87918",
      shadow: "rgba(232, 121, 24, .12)",
    },
    purple: {
      background: "#f2edff",
      foreground: "#7854d9",
      shadow: "rgba(120, 84, 217, .12)",
    },
    red: {
      background: "#fff0f0",
      foreground: "#d9364f",
      shadow: "rgba(217, 54, 79, .12)",
    },
    teal: {
      background: "#e6fbfa",
      foreground: "#078f91",
      shadow: "rgba(7, 143, 145, .12)",
    },
  };

  const selectedColor = colors[color] || colors.blue;
  const isDown = String(changeType).toLowerCase() === "down";
  const ChangeIcon = isDown ? FaArrowDown : FaArrowUp;

  const handleKeyDown = (event) => {
    if (!onClick || loading) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <>
      <style>{`
        .pay-stat-card,
        .pay-stat-card * {
          box-sizing: border-box;
        }

        .pay-stat-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 19px;
          width: 100%;
          min-width: 0;
          min-height: 172px;
          padding: 21px;
          overflow: hidden;
          border: 1px solid #e5edf3;
          border-radius: 16px;
          background: linear-gradient(145deg, #ffffff 0%, #fcfeff 100%);
          box-shadow: 0 4px 16px rgba(19, 57, 82, .035);
          font-family: Inter, Arial, sans-serif;
          transition:
            transform .22s ease,
            border-color .22s ease,
            box-shadow .22s ease;
        }

        .pay-stat-card::before {
          position: absolute;
          top: 0;
          left: 18px;
          width: 48px;
          height: 3px;
          border-radius: 0 0 5px 5px;
          background: linear-gradient(90deg, #12bdc9, #1686ef);
          content: "";
          opacity: .85;
        }

        .pay-stat-card.clickable {
          cursor: pointer;
        }

        .pay-stat-card.clickable:hover {
          transform: translateY(-3px);
          border-color: #bde8ef;
          box-shadow: 0 11px 27px rgba(18, 101, 140, .09);
        }

        .pay-stat-card.clickable:focus-visible {
          outline: 3px solid rgba(14, 165, 194, .35);
          outline-offset: 3px;
        }

        .pay-stat-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }

        .pay-stat-card-heading {
          flex: 1;
          min-width: 0;
          padding-top: 4px;
        }

        .pay-stat-card-title {
          margin: 0;
          color: #637e91;
          font-size: 12px;
          font-weight: 650;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .pay-stat-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 45px;
          width: 45px;
          height: 45px;
          border: 1px solid rgba(255, 255, 255, .8);
          border-radius: 13px;
          font-size: 18px;
          transition: transform .22s ease;
        }

        .pay-stat-card.clickable:hover .pay-stat-card-icon {
          transform: scale(1.05);
        }

        .pay-stat-card-value {
          margin: 0;
          color: #17354b;
          font-size: clamp(24px, 2vw, 31px);
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -.7px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .pay-stat-card-bottom {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          min-width: 0;
          min-height: 20px;
          margin-top: auto;
        }

        .pay-stat-change {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          padding: 4px 7px;
          border: 1px solid transparent;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 750;
          line-height: 1.4;
          white-space: nowrap;
        }

        .pay-stat-change.up {
          border-color: #c9f2df;
          background: #edfbf4;
          color: #07865e;
        }

        .pay-stat-change.down {
          border-color: #fbd9df;
          background: #fff1f3;
          color: #d12f49;
        }

        .pay-stat-description {
          min-width: 0;
          color: #91a4b3;
          font-size: 10px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .pay-stat-skeleton {
          width: 72%;
          max-width: 190px;
          height: 31px;
          border-radius: 7px;
          background: linear-gradient(
            90deg,
            #edf3f7 25%,
            #dfeaf0 50%,
            #edf3f7 75%
          );
          background-size: 200% 100%;
          animation: pay-stat-shimmer 1.5s ease-in-out infinite;
        }

        .pay-stat-loading-text {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @keyframes pay-stat-shimmer {
          from {
            background-position: 200% 0;
          }
          to {
            background-position: -200% 0;
          }
        }

        @media (max-width: 900px) {
          .pay-stat-card {
            gap: 16px;
            min-height: 160px;
            padding: 18px;
            border-radius: 14px;
          }

          .pay-stat-card-icon {
            flex-basis: 41px;
            width: 41px;
            height: 41px;
            font-size: 16px;
          }

          .pay-stat-card-value {
            font-size: clamp(23px, 3vw, 29px);
          }
        }

        @media (max-width: 480px) {
          .pay-stat-card {
            gap: 15px;
            min-height: 148px;
            padding: 16px;
            border-radius: 12px;
          }

          .pay-stat-card-title {
            font-size: 11px;
          }

          .pay-stat-card-icon {
            flex-basis: 37px;
            width: 37px;
            height: 37px;
            border-radius: 11px;
            font-size: 15px;
          }

          .pay-stat-card-value {
            font-size: clamp(21px, 6vw, 26px);
          }

          .pay-stat-description {
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pay-stat-card,
          .pay-stat-card-icon {
            transition: none;
          }

          .pay-stat-skeleton {
            animation: none;
          }
        }
      `}</style>

      <div
        className={`pay-stat-card ${onClick ? "clickable" : ""}`}
        onClick={
          onClick && !loading
            ? (event) => onClick(event)
            : undefined
        }
        onKeyDown={handleKeyDown}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `${title}: ${loading ? "Loading" : value}` : undefined}
        aria-busy={loading}
      >
        <div className="pay-stat-card-top">
          <div className="pay-stat-card-heading">
            <p className="pay-stat-card-title">{title}</p>
          </div>

          <div
            className="pay-stat-card-icon"
            style={{
              background: selectedColor.background,
              color: selectedColor.foreground,
              boxShadow: `0 5px 13px ${selectedColor.shadow}`,
            }}
            aria-hidden="true"
          >
            <Icon />
          </div>
        </div>

        {loading ? (
          <div
            className="pay-stat-skeleton"
            role="status"
            aria-label={`Loading ${title}`}
          >
            <span className="pay-stat-loading-text">
              Loading {title}
            </span>
          </div>
        ) : (
          <h3 className="pay-stat-card-value">{value}</h3>
        )}

        <div className="pay-stat-card-bottom">
          {change !== undefined &&
            change !== null &&
            change !== "" &&
            !loading && (
              <span className={`pay-stat-change ${isDown ? "down" : "up"}`}>
                <ChangeIcon size={9} aria-hidden="true" />
                {change}
              </span>
            )}

          {description && (
            <span className="pay-stat-description">
              {description}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default StatCard;
