import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  FaMoneyBillWave,
  FaChartLine,
} from "react-icons/fa";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }

  return `₹${amount}`;
}

function PayrollChart({
  data = [],
  loading = false,
  title = "Payroll Overview",
  subtitle = "Monthly salary expenditure",
}) {
  // Only use records provided by the parent component.
  // No fallback or hardcoded payroll data.
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const rawAmount = Number(item.payroll ?? item.amount);

        return {
          month: String(item.month ?? item.label ?? "").trim(),
          payroll:
            Number.isFinite(rawAmount) && rawAmount > 0
              ? rawAmount
              : 0,
        };
      })
      .filter((item) => item.month !== "");
  }, [data]);

  const summary = useMemo(() => {
    const total = normalizedData.reduce(
      (sum, item) => sum + item.payroll,
      0
    );

    const monthsWithPayroll = normalizedData.filter(
      (item) => item.payroll > 0
    );

    const average = monthsWithPayroll.length
      ? total / monthsWithPayroll.length
      : 0;

    const latest = normalizedData.length
      ? normalizedData[normalizedData.length - 1].payroll
      : 0;

    return {
      total,
      average,
      latest,
    };
  }, [normalizedData]);

  const hasData = normalizedData.some(
    (item) => item.payroll > 0
  );

  return (
    <>
      <style>{`
        .payroll-chart-card,
        .payroll-chart-card * {
          box-sizing: border-box;
        }

        .payroll-chart-card {
          width: 100%;
          min-width: 0;
          padding: 22px;
          border: 1px solid #e2eaf2;
          border-radius: 18px;
          background: linear-gradient(145deg, #ffffff, #f8fcff);
          box-shadow: 0 8px 26px rgba(15, 42, 70, 0.055);
          font-family: Inter, Arial, sans-serif;
        }

        .payroll-chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .payroll-chart-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .payroll-chart-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: linear-gradient(135deg, #dffcf8, #dbeafe);
          color: #087f8c;
          font-size: 18px;
        }

        .payroll-chart-heading h3 {
          margin: 0;
          color: #17233e;
          font-size: 16px;
          font-weight: 750;
          line-height: 1.4;
        }

        .payroll-chart-heading p {
          margin: 5px 0 0;
          color: #718198;
          font-size: 12px;
          line-height: 1.5;
        }

        .payroll-chart-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 11px;
          border: 1px solid #bceee7;
          border-radius: 9px;
          background: #e9fbf8;
          color: #087f8c;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .payroll-chart-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 24px 0 18px;
        }

        .payroll-chart-summary-item {
          min-width: 0;
          padding: 14px;
          border: 1px solid #e8eef5;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.85);
        }

        .payroll-chart-summary-label {
          display: block;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .payroll-chart-summary-value {
          display: block;
          margin-top: 9px;
          color: #17233e;
          font-size: clamp(14px, 1.5vw, 20px);
          font-weight: 750;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .payroll-chart-area {
          width: 100%;
          height: 275px;
          margin-top: 8px;
        }

        .payroll-chart-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 250px;
          padding: 20px;
          color: #7b8ba1;
          font-size: 13px;
          text-align: center;
        }

        .payroll-chart-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          margin: 0 auto 12px;
          border-radius: 16px;
          background: #eaf8fb;
          color: #078b9a;
          font-size: 23px;
        }

        .payroll-chart-state p {
          margin: 0;
          line-height: 1.7;
        }

        @media (max-width: 600px) {
          .payroll-chart-card {
            padding: 15px;
            border-radius: 15px;
          }

          .payroll-chart-heading {
            gap: 9px;
          }

          .payroll-chart-heading h3 {
            font-size: 14px;
          }

          .payroll-chart-heading p {
            font-size: 11px;
          }

          .payroll-chart-icon {
            width: 37px;
            height: 37px;
            border-radius: 10px;
            font-size: 15px;
          }

          .payroll-chart-badge {
            gap: 4px;
            padding: 6px 7px;
            font-size: 10px;
          }

          .payroll-chart-summary {
            gap: 7px;
            margin: 19px 0 14px;
          }

          .payroll-chart-summary-item {
            padding: 9px 7px;
            border-radius: 9px;
          }

          .payroll-chart-summary-label {
            font-size: 9px;
          }

          .payroll-chart-summary-value {
            margin-top: 7px;
            font-size: 13px;
          }

          .payroll-chart-area {
            height: 245px;
            margin-left: -8px;
            width: calc(100% + 8px);
          }

          .payroll-chart-state {
            min-height: 210px;
          }
        }

        @media (max-width: 360px) {
          .payroll-chart-header {
            flex-wrap: wrap;
          }

          .payroll-chart-summary {
            grid-template-columns: 1fr;
          }

          .payroll-chart-summary-item {
            padding: 11px;
          }

          .payroll-chart-summary-value {
            font-size: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .payroll-chart-card * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <section
        className="payroll-chart-card"
        aria-label={title}
      >
        <div className="payroll-chart-header">
          <div className="payroll-chart-heading">
            <div className="payroll-chart-icon">
              <FaMoneyBillWave aria-hidden="true" />
            </div>

            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>

          <span className="payroll-chart-badge">
            <FaChartLine aria-hidden="true" />
            Payroll
          </span>
        </div>

        {loading ? (
          <div
            className="payroll-chart-state"
            role="status"
            aria-live="polite"
          >
            Loading payroll chart...
          </div>
        ) : (
          <>
            <div className="payroll-chart-summary">
              <div className="payroll-chart-summary-item">
                <span className="payroll-chart-summary-label">
                  Total in Period
                </span>

                <strong className="payroll-chart-summary-value">
                  {formatCompactCurrency(summary.total)}
                </strong>
              </div>

              <div className="payroll-chart-summary-item">
                <span className="payroll-chart-summary-label">
                  Monthly Average
                </span>

                <strong className="payroll-chart-summary-value">
                  {formatCompactCurrency(summary.average)}
                </strong>
              </div>

              <div className="payroll-chart-summary-item">
                <span className="payroll-chart-summary-label">
                  Latest Month
                </span>

                <strong className="payroll-chart-summary-value">
                  {formatCompactCurrency(summary.latest)}
                </strong>
              </div>
            </div>

            {!hasData ? (
              <div className="payroll-chart-state">
                <div>
                  <div className="payroll-chart-empty-icon">
                    <FaMoneyBillWave aria-hidden="true" />
                  </div>

                  <p>
                    No payroll data available.
                    <br />
                    Generate payroll records to view this chart.
                  </p>
                </div>
              </div>
            ) : (
              <div className="payroll-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={normalizedData}
                    margin={{
                      top: 10,
                      right: 8,
                      left: -8,
                      bottom: 0,
                    }}
                    barCategoryGap="35%"
                  >
                    <CartesianGrid
                      stroke="#e8eff6"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#7b8ba1",
                        fontSize: 11,
                      }}
                      dy={10}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#7b8ba1",
                        fontSize: 10,
                      }}
                      tickFormatter={formatCompactCurrency}
                      width={55}
                    />

                    <Tooltip
                      cursor={{ fill: "#edfafa" }}
                      formatter={(value) => [
                        formatCurrency(value),
                        "Payroll",
                      ]}
                      contentStyle={{
                        border: "1px solid #dce8f1",
                        borderRadius: "11px",
                        boxShadow:
                          "0 8px 24px rgba(15,42,70,0.10)",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: "#17233e",
                        fontWeight: 700,
                        marginBottom: "5px",
                      }}
                    />

                    <Bar
                      dataKey="payroll"
                      name="Payroll"
                      fill="#0d9488"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                      activeBar={{ fill: "#2563eb" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

export default PayrollChart;
