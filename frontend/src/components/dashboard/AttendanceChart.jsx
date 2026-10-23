import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  FaCalendarCheck,
  FaUsers,
} from "react-icons/fa";

function AttendanceChart({
  data,
  loading = false,
  title = "Attendance Overview",
  subtitle = "Employee attendance summary",
}) {
  const [period, setPeriod] = useState("weekly");

  // Only use data provided by the parent component.
  // No hardcoded or demo attendance records.
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        ...item,
        day: String(item.day ?? item.label ?? `Period ${index + 1}`),
        present: Math.max(0, Number(item.present) || 0),
        late: Math.max(0, Number(item.late) || 0),
        absent: Math.max(0, Number(item.absent) || 0),
      }));
  }, [data]);

  const totals = useMemo(
    () =>
      chartData.reduce(
        (result, item) => ({
          present: result.present + item.present,
          late: result.late + item.late,
          absent: result.absent + item.absent,
        }),
        { present: 0, late: 0, absent: 0 }
      ),
    [chartData]
  );

  const hasData = chartData.some(
    (item) => item.present + item.late + item.absent > 0
  );

  return (
    <>
      <style>{`
        .attendance-chart-card,
        .attendance-chart-card * {
          box-sizing: border-box;
        }

        .attendance-chart-card {
          width: 100%;
          min-width: 0;
          padding: 22px;
          overflow: hidden;
          border: 1px solid #e2edf3;
          border-radius: 17px;
          background: linear-gradient(145deg, #ffffff, #fbfeff);
          box-shadow: 0 5px 22px rgba(18, 65, 91, .045);
          font-family: Inter, Arial, sans-serif;
        }

        .attendance-chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .attendance-chart-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .attendance-chart-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 43px;
          height: 43px;
          border: 1px solid #d8f3f6;
          border-radius: 13px;
          background: linear-gradient(135deg, #e5fbfc, #e9f3ff);
          color: #078eaf;
          font-size: 17px;
        }

        .attendance-chart-title-group h3 {
          margin: 0;
          color: #17364c;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .attendance-chart-title-group p {
          margin: 5px 0 0;
          color: #8ba1b1;
          font-size: 11px;
          line-height: 1.6;
        }

        .attendance-chart-filter {
          display: flex;
          flex-shrink: 0;
          gap: 4px;
          padding: 4px;
          border: 1px solid #e7eff4;
          border-radius: 10px;
          background: #f4f8fb;
        }

        .attendance-chart-filter button {
          min-height: 31px;
          padding: 7px 11px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: transparent;
          color: #71899a;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background .2s ease, color .2s ease;
        }

        .attendance-chart-filter button:hover {
          color: #078eaf;
        }

        .attendance-chart-filter button.active {
          border-color: #dceff5;
          background: #ffffff;
          color: #078eaf;
          box-shadow: 0 2px 6px rgba(18, 65, 91, .06);
        }

        .attendance-chart-filter button:focus-visible {
          outline: 2px solid #10aeca;
          outline-offset: 2px;
        }

        .attendance-chart-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 23px 0 10px;
        }

        .attendance-chart-summary-item {
          min-width: 0;
          padding: 13px;
          border: 1px solid #e8f0f5;
          border-radius: 12px;
          background: #fbfdff;
        }

        .attendance-chart-summary-label {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #71899b;
          font-size: 11px;
          font-weight: 600;
        }

        .attendance-chart-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 50%;
        }

        .attendance-chart-summary-value {
          display: block;
          margin-top: 9px;
          color: #17364c;
          font-size: 21px;
          font-weight: 800;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .attendance-chart-area {
          width: 100%;
          height: 285px;
          min-width: 0;
          margin-top: 17px;
        }

        .attendance-chart-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 245px;
          padding: 20px;
          color: #829aaa;
          font-size: 12px;
          line-height: 1.7;
          text-align: center;
        }

        .attendance-chart-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 49px;
          height: 49px;
          margin: 0 auto 12px;
          border: 1px solid #dceff5;
          border-radius: 15px;
          background: #effbfc;
          color: #079fba;
          font-size: 21px;
        }

        .attendance-chart-empty-title {
          margin: 0;
          color: #315166;
          font-size: 13px;
          font-weight: 750;
        }

        .attendance-chart-empty-description {
          max-width: 270px;
          margin: 5px auto 0;
          color: #8ba1b1;
          font-size: 11px;
        }

        @media (max-width: 600px) {
          .attendance-chart-card {
            padding: 16px;
            border-radius: 14px;
          }

          .attendance-chart-title-group {
            gap: 9px;
          }

          .attendance-chart-icon {
            width: 38px;
            height: 38px;
            border-radius: 11px;
            font-size: 15px;
          }

          .attendance-chart-title-group h3 {
            font-size: 14px;
          }

          .attendance-chart-title-group p {
            font-size: 10px;
          }

          .attendance-chart-filter button {
            padding: 7px 9px;
            font-size: 10px;
          }

          .attendance-chart-summary {
            gap: 7px;
            margin-top: 19px;
          }

          .attendance-chart-summary-item {
            padding: 9px;
            border-radius: 10px;
          }

          .attendance-chart-summary-label {
            gap: 5px;
            font-size: 10px;
          }

          .attendance-chart-summary-value {
            font-size: 17px;
          }

          .attendance-chart-area {
            height: 255px;
            margin-top: 13px;
          }
        }

        @media (max-width: 360px) {
          .attendance-chart-card {
            padding: 12px;
          }

          .attendance-chart-header {
            gap: 10px;
          }

          .attendance-chart-summary {
            gap: 5px;
          }

          .attendance-chart-summary-item {
            padding: 7px;
          }

          .attendance-chart-summary-label {
            font-size: 9px;
          }

          .attendance-chart-summary-value {
            font-size: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .attendance-chart-filter button {
            transition: none;
          }
        }
      `}</style>

      <section
        className="attendance-chart-card"
        aria-label={title}
        aria-busy={loading}
      >
        <div className="attendance-chart-header">
          <div className="attendance-chart-title-group">
            <div className="attendance-chart-icon" aria-hidden="true">
              <FaCalendarCheck />
            </div>

            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
          </div>

          <div
            className="attendance-chart-filter"
            role="group"
            aria-label="Attendance reporting period"
          >
            <button
              type="button"
              className={period === "weekly" ? "active" : ""}
              aria-pressed={period === "weekly"}
              onClick={() => setPeriod("weekly")}
            >
              Weekly
            </button>

            <button
              type="button"
              className={period === "monthly" ? "active" : ""}
              aria-pressed={period === "monthly"}
              onClick={() => setPeriod("monthly")}
            >
              Monthly
            </button>
          </div>
        </div>

        {loading ? (
          <div
            className="attendance-chart-state"
            role="status"
            aria-live="polite"
          >
            Loading attendance data...
          </div>
        ) : (
          <>
            <div className="attendance-chart-summary">
              <div className="attendance-chart-summary-item">
                <span className="attendance-chart-summary-label">
                  <span
                    className="attendance-chart-dot"
                    style={{ background: "#0b91e5" }}
                  />
                  Present
                </span>

                <strong className="attendance-chart-summary-value">
                  {totals.present}
                </strong>
              </div>

              <div className="attendance-chart-summary-item">
                <span className="attendance-chart-summary-label">
                  <span
                    className="attendance-chart-dot"
                    style={{ background: "#e9a23b" }}
                  />
                  Late
                </span>

                <strong className="attendance-chart-summary-value">
                  {totals.late}
                </strong>
              </div>

              <div className="attendance-chart-summary-item">
                <span className="attendance-chart-summary-label">
                  <span
                    className="attendance-chart-dot"
                    style={{ background: "#e75a70" }}
                  />
                  Absent
                </span>

                <strong className="attendance-chart-summary-value">
                  {totals.absent}
                </strong>
              </div>
            </div>

            {!hasData ? (
              <div className="attendance-chart-state">
                <div>
                  <div
                    className="attendance-chart-empty-icon"
                    aria-hidden="true"
                  >
                    <FaUsers />
                  </div>

                  <p className="attendance-chart-empty-title">
                    No attendance data available
                  </p>

                  <p className="attendance-chart-empty-description">
                    Attendance summaries will appear here when records
                    are available.
                  </p>
                </div>
              </div>
            ) : (
              <div className="attendance-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 5, left: -18, bottom: 0 }}
                    barGap={4}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid
                      stroke="#eaf1f5"
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#829aaa", fontSize: 11 }}
                      dy={10}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#829aaa", fontSize: 10 }}
                      width={34}
                    />

                    <Tooltip
                      cursor={{ fill: "#f0f9fc" }}
                      contentStyle={{
                        border: "1px solid #dcebf2",
                        borderRadius: "11px",
                        boxShadow: "0 7px 20px rgba(18,65,91,.09)",
                        fontSize: "12px",
                        padding: "10px 12px",
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{
                        fontSize: "11px",
                        paddingBottom: "15px",
                      }}
                    />

                    <Bar
                      dataKey="present"
                      name="Present"
                      fill="#0b91e5"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={25}
                    />

                    <Bar
                      dataKey="late"
                      name="Late"
                      fill="#e9a23b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={25}
                    />

                    <Bar
                      dataKey="absent"
                      name="Absent"
                      fill="#e75a70"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={25}
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

export default AttendanceChart;
