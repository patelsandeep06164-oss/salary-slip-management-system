import React from "react";
import { FaInbox, FaSpinner } from "react-icons/fa";

function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found.",
  rowKey = "_id",
  onRowClick,
  className = "",
}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeData = Array.isArray(data) ? data : [];

  const getRowKey = (row, index) =>
    row?.[rowKey] ?? row?.id ?? index;

  const getCellValue = (column, row, rowIndex) => {
    try {
      if (typeof column.render === "function") {
        return column.render(row, rowIndex);
      }

      if (typeof column.accessor === "function") {
        return column.accessor(row);
      }

      if (column.key) {
        return row?.[column.key];
      }

      return undefined;
    } catch (error) {
      console.error("Unable to render table cell:", error);
      return column.fallback ?? "—";
    }
  };

  return (
    <>
      <style>{`
        .it-table-wrapper,
        .it-table-wrapper * {
          box-sizing: border-box;
        }

        .it-table-wrapper {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e2eaf4;
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 5px 20px rgba(15, 40, 75, 0.04);
        }

        .it-table-scroll {
          width: 100%;
          overflow-x: auto;
          overscroll-behavior-x: contain;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }

        .it-table-scroll::-webkit-scrollbar {
          height: 7px;
        }

        .it-table-scroll::-webkit-scrollbar-track {
          background: #f8fafc;
        }

        .it-table-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .it-data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          color: #253650;
          font-size: 13px;
          text-align: left;
        }

        .it-data-table thead {
          background: #f3f7fc;
        }

        .it-data-table th {
          padding: 15px 16px;
          border-bottom: 1px solid #e2eaf4;
          color: #53647d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.65px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .it-data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #edf1f7;
          vertical-align: middle;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .it-data-table tbody tr {
          background: #ffffff;
          transition: background 0.16s ease;
        }

        .it-data-table tbody tr:hover {
          background: #f7faff;
        }

        .it-data-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .it-data-table tbody tr.it-table-clickable {
          cursor: pointer;
        }

        .it-data-table tbody tr.it-table-clickable:focus-visible {
          outline: 2px solid #1673ed;
          outline-offset: -2px;
        }

        .it-data-table th:last-child,
        .it-data-table td:last-child {
          border-right: 0;
        }

        .it-table-state-cell {
          padding: 0 !important;
        }

        .it-table-state {
          min-height: 165px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px;
          color: #718198;
          font-size: 13px;
          text-align: center;
        }

        .it-table-state strong {
          max-width: 100%;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .it-table-empty-icon {
          font-size: 29px;
          color: #a5b4c8;
        }

        .it-table-spinner {
          font-size: 25px;
          color: #0866e9;
          animation: itTableSpin 0.9s linear infinite;
        }

        @keyframes itTableSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (min-width: 769px) {
          .it-table-scroll {
            overflow-x: auto;
          }
        }

        @media (max-width: 768px) {
          .it-data-table {
            min-width: 650px;
            font-size: 12px;
          }

          .it-data-table th {
            padding: 13px 12px;
            font-size: 10px;
          }

          .it-data-table td {
            padding: 12px;
          }

          .it-table-state {
            min-height: 145px;
          }
        }

        @media (max-width: 480px) {
          .it-table-wrapper {
            border-radius: 11px;
          }

          .it-data-table {
            min-width: 600px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .it-table-spinner,
          .it-data-table tbody tr {
            animation: none;
            transition: none;
          }
        }
      `}</style>

      <div
        className={`it-table-wrapper ${className}`.trim()}
      >
        <div className="it-table-scroll">
          <table className="it-data-table">
            <thead>
              <tr>
                {safeColumns.map((column, index) => (
                  <th
                    key={column.key ?? column.header ?? index}
                    className={column.headerClassName || ""}
                    scope="col"
                    style={{
                      textAlign: column.align || "left",
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={Math.max(safeColumns.length, 1)}
                    className="it-table-state-cell"
                  >
                    <div
                      className="it-table-state"
                      role="status"
                      aria-live="polite"
                    >
                      <FaSpinner
                        className="it-table-spinner"
                        aria-hidden="true"
                      />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : safeData.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(safeColumns.length, 1)}
                    className="it-table-state-cell"
                  >
                    <div className="it-table-state">
                      <FaInbox
                        className="it-table-empty-icon"
                        aria-hidden="true"
                      />
                      <strong>{emptyMessage}</strong>
                    </div>
                  </td>
                </tr>
              ) : (
                safeData.map((row, rowIndex) => {
                  const clickable =
                    typeof onRowClick === "function";

                  return (
                    <tr
                      key={getRowKey(row, rowIndex)}
                      className={
                        clickable ? "it-table-clickable" : ""
                      }
                      onClick={
                        clickable
                          ? () => onRowClick(row)
                          : undefined
                      }
                      onKeyDown={
                        clickable
                          ? (event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                onRowClick(row);
                              }
                            }
                          : undefined
                      }
                      tabIndex={clickable ? 0 : undefined}
                    >
                      {safeColumns.map((column, columnIndex) => {
                        const value = getCellValue(
                          column,
                          row,
                          rowIndex
                        );

                        return (
                          <td
                            key={
                              column.key ??
                              column.header ??
                              columnIndex
                            }
                            className={column.cellClassName || ""}
                            style={{
                              textAlign: column.align || "left",
                              width: column.width,
                              minWidth: column.minWidth,
                            }}
                          >
                            {value ??
                              column.fallback ??
                              "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default DataTable;
