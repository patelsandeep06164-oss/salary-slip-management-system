import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

function SearchBar({
  value = "",
  onChange = () => {},
  placeholder = "Search...",
  className = "",
  disabled = false,
  onClear,
  width = "100%",
}) {
  const hasValue = String(value ?? "").length > 0;

  const handleClear = () => {
    if (disabled) return;

    onChange("");

    if (typeof onClear === "function") {
      onClear();
    }
  };

  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <>
      <style>{`
        .pay-search,
        .pay-search * {
          box-sizing: border-box;
        }

        .pay-search {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          min-width: 0;
          font-family: Inter, Arial, sans-serif;
        }

        .pay-search-icon {
          position: absolute;
          left: 15px;
          z-index: 1;
          flex-shrink: 0;
          color: #7e98aa;
          font-size: 14px;
          pointer-events: none;
          transition: color .2s ease;
        }

        .pay-search:focus-within .pay-search-icon {
          color: #079fbe;
        }

        .pay-search-input {
          display: block;
          width: 100%;
          min-width: 0;
          height: 44px;
          padding: 0 43px 0 42px;
          border: 1px solid #dce8f0;
          border-radius: 12px;
          outline: none;
          background: #ffffff;
          color: #19364c;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          line-height: normal;
          box-shadow: 0 2px 7px rgba(25, 70, 100, .025);
          transition:
            border-color .2s ease,
            box-shadow .2s ease,
            background .2s ease;
          appearance: none;
          -webkit-appearance: none;
        }

        .pay-search-input::placeholder {
          color: #91a4b3;
          font-weight: 400;
          opacity: 1;
        }

        .pay-search-input:hover:not(:disabled) {
          border-color: #b8dce8;
        }

        .pay-search-input:focus {
          border-color: #13b4cc;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(19, 180, 204, .12);
        }

        .pay-search-input:disabled {
          background: #f3f7fa;
          color: #91a4b3;
          cursor: not-allowed;
          opacity: .75;
        }

        .pay-search-input::-webkit-search-cancel-button,
        .pay-search-input::-webkit-search-decoration {
          -webkit-appearance: none;
          appearance: none;
        }

        .pay-search-clear {
          position: absolute;
          top: 50%;
          right: 8px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          transform: translateY(-50%);
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: #71899b;
          cursor: pointer;
          transition:
            color .2s ease,
            background .2s ease,
            border-color .2s ease;
        }

        .pay-search-clear:hover {
          border-color: #d5edf4;
          background: #eafaff;
          color: #078eae;
        }

        .pay-search-clear:focus-visible {
          outline: 2px solid #0ba9c7;
          outline-offset: 2px;
        }

        .pay-search-clear:active {
          background: #d8f5fb;
        }

        @media (max-width: 480px) {
          .pay-search-input {
            height: 42px;
            padding-left: 38px;
            padding-right: 40px;
            border-radius: 10px;
            font-size: 12px;
          }

          .pay-search-icon {
            left: 13px;
            font-size: 13px;
          }

          .pay-search-clear {
            right: 6px;
            width: 27px;
            height: 27px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pay-search-icon,
          .pay-search-input,
          .pay-search-clear {
            transition: none;
          }
        }
      `}</style>

      <div
        className={`pay-search ${className}`.trim()}
        style={{
          maxWidth: width,
        }}
      >
        <FaSearch
          className="pay-search-icon"
          aria-hidden="true"
        />

        <input
          type="search"
          className="pay-search-input"
          placeholder={placeholder}
          value={value ?? ""}
          disabled={disabled}
          onChange={handleChange}
          aria-label={placeholder || "Search"}
          autoComplete="off"
        />

        {hasValue && !disabled && (
          <button
            type="button"
            className="pay-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimes size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  );
}

export default SearchBar;
