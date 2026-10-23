import React from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisH,
} from "react-icons/fa";

function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  totalItems,
  pageSize,
}) {
  const safeTotalPages = Math.max(
    1,
    Math.floor(Number(totalPages) || 1)
  );

  const safeCurrentPage = Math.min(
    Math.max(1, Math.floor(Number(currentPage) || 1)),
    safeTotalPages
  );

  const hasRecordInfo =
    totalItems !== undefined &&
    Number.isFinite(Number(totalItems)) &&
    pageSize !== undefined &&
    Number.isFinite(Number(pageSize)) &&
    Number(pageSize) > 0;

  const safeTotalItems = hasRecordInfo
    ? Math.max(0, Math.floor(Number(totalItems)))
    : null;

  const safePageSize = hasRecordInfo
    ? Math.floor(Number(pageSize))
    : null;

  const startItem =
    hasRecordInfo && safeTotalItems > 0
      ? (safeCurrentPage - 1) * safePageSize + 1
      : 0;

  const endItem =
    hasRecordInfo && safeTotalItems > 0
      ? Math.min(
          safeCurrentPage * safePageSize,
          safeTotalItems
        )
      : 0;

  const getPages = () => {
    if (safeTotalPages <= 5) {
      return Array.from(
        { length: safeTotalPages },
        (_, index) => index + 1
      );
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, "right", safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 2) {
      return [
        1,
        "left",
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      "left",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "right",
      safeTotalPages,
    ];
  };

  const handlePageChange = (page) => {
    if (
      Number.isInteger(page) &&
      page >= 1 &&
      page <= safeTotalPages &&
      page !== safeCurrentPage
    ) {
      onPageChange(page);
    }
  };

  if (safeTotalPages <= 1 && !hasRecordInfo) {
    return null;
  }

  return (
    <>
      <style>{`
        .pay-pagination,
        .pay-pagination * {
          box-sizing: border-box;
        }

        .pay-pagination {
          width: 100%;
          min-width: 0;
          padding: 17px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          color: #647b8d;
          font-family: Inter, Arial, sans-serif;
        }

        .pay-pagination-info {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          font-size: 12px;
          line-height: 1.7;
          color: #7890a2;
        }

        .pay-pagination-info strong {
          color: #1b3a52;
          font-weight: 800;
        }

        .pay-pagination-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: nowrap;
          gap: 5px;
        }

        .pay-page-button {
          min-width: 36px;
          height: 36px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #dce9f1;
          border-radius: 10px;
          background: #ffffff;
          color: #4d687d;
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            color .2s ease,
            background .2s ease,
            border-color .2s ease,
            box-shadow .2s ease,
            transform .2s ease;
        }

        .pay-page-button:hover:not(:disabled) {
          border-color: #62d0df;
          background: #effcff;
          color: #078fae;
          transform: translateY(-1px);
        }

        .pay-page-button.active {
          border-color: transparent;
          background: linear-gradient(135deg, #0bb7c7, #0878e8);
          color: #ffffff;
          box-shadow: 0 5px 13px rgba(8, 137, 198, .23);
        }

        .pay-page-button.active:hover {
          background: linear-gradient(135deg, #079eaf, #0668d1);
          color: #ffffff;
        }

        .pay-page-button:disabled {
          border-color: #e8eef3;
          background: #f8fafc;
          color: #b5c2cc;
          opacity: .8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .pay-page-button:focus-visible {
          outline: 2px solid #08a9c5;
          outline-offset: 3px;
        }

        .pay-page-ellipsis {
          width: 22px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #94a9b8;
          font-size: 11px;
        }

        .pay-pagination-summary {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pay-pagination-summary-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0bb7a4;
          box-shadow: 0 0 0 3px rgba(11, 183, 164, .10);
        }

        @media (max-width: 700px) {
          .pay-pagination {
            padding: 15px 0;
            gap: 12px;
          }

          .pay-pagination-info {
            font-size: 11px;
          }

          .pay-pagination-controls {
            gap: 4px;
          }

          .pay-page-button {
            min-width: 33px;
            height: 34px;
            padding: 0 8px;
            border-radius: 9px;
            font-size: 11px;
          }

          .pay-page-ellipsis {
            width: 16px;
          }
        }

        @media (max-width: 480px) {
          .pay-pagination {
            justify-content: center;
          }

          .pay-pagination-info {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .pay-pagination-controls {
            max-width: 100%;
            gap: 3px;
          }

          .pay-page-button {
            min-width: 30px;
            height: 32px;
            padding: 0 6px;
          }

          .pay-page-ellipsis {
            width: 13px;
          }
        }

        @media (max-width: 340px) {
          .pay-pagination-controls {
            gap: 2px;
          }

          .pay-page-button {
            min-width: 27px;
            height: 30px;
            padding: 0 5px;
            font-size: 10px;
          }

          .pay-page-ellipsis {
            width: 10px;
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pay-page-button {
            transition: none;
          }
        }
      `}</style>

      <div className="pay-pagination">
        <div className="pay-pagination-info" aria-live="polite">
          {hasRecordInfo ? (
            <>
              <span className="pay-pagination-summary-dot" />
              Showing{" "}
              <strong>
                {startItem}–{endItem}
              </strong>{" "}
              of <strong>{safeTotalItems}</strong> records
            </>
          ) : (
            <>
              Page <strong>{safeCurrentPage}</strong> of{" "}
              <strong>{safeTotalPages}</strong>
            </>
          )}
        </div>

        <nav
          className="pay-pagination-controls"
          aria-label="Pagination"
        >
          <button
            type="button"
            className="pay-page-button"
            aria-label="Previous page"
            title="Previous page"
            disabled={safeCurrentPage === 1}
            onClick={() =>
              handlePageChange(safeCurrentPage - 1)
            }
          >
            <FaChevronLeft aria-hidden="true" size={10} />
          </button>

          {getPages().map((page, index) => {
            if (page === "left" || page === "right") {
              return (
                <span
                  key={`${page}-${index}`}
                  className="pay-page-ellipsis"
                  aria-hidden="true"
                >
                  <FaEllipsisH />
                </span>
              );
            }

            const isActive = safeCurrentPage === page;

            return (
              <button
                key={page}
                type="button"
                className={`pay-page-button ${
                  isActive ? "active" : ""
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            className="pay-page-button"
            aria-label="Next page"
            title="Next page"
            disabled={safeCurrentPage === safeTotalPages}
            onClick={() =>
              handlePageChange(safeCurrentPage + 1)
            }
          >
            <FaChevronRight aria-hidden="true" size={10} />
          </button>
        </nav>
      </div>
    </>
  );
}

export default Pagination;
