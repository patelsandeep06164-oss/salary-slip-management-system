import React from "react";
import { FaSpinner } from "react-icons/fa";

function Loader({
  text = "Loading...",
  fullScreen = false,
  size = "medium",
  overlay = false,
}) {
  const validSizes = ["small", "medium", "large"];

  const safeSize = validSizes.includes(size) ? size : "medium";
  const sizeClass = `it-loader-${safeSize}`;

  const containerClasses = [
    "it-loader-container",
    fullScreen ? "it-loader-fullscreen" : "",
    overlay ? "it-loader-overlay" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{`
        .it-loader-container,
        .it-loader-container * {
          box-sizing: border-box;
        }

        .it-loader-container {
          width: 100%;
          min-width: 0;
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: transparent;
        }

        .it-loader-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 3000;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          background: #f4f7fc;
        }

        .it-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 2500;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          background: rgba(8, 25, 50, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .it-loader-fullscreen.it-loader-overlay {
          z-index: 3000;
          background: rgba(8, 25, 50, 0.4);
        }

        .it-loader-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          max-width: 100%;
        }

        .it-loader-spinner {
          display: grid;
          place-items: center;
          color: #0866e9;
          line-height: 1;
          animation: itLoaderSpin 0.85s linear infinite;
        }

        .it-loader-small {
          font-size: 20px;
        }

        .it-loader-medium {
          font-size: 34px;
        }

        .it-loader-large {
          font-size: 48px;
        }

        .it-loader-text {
          max-width: 280px;
          margin: 0;
          color: #53647d;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.6;
          text-align: center;
          overflow-wrap: anywhere;
        }

        .it-loader-fullscreen .it-loader-text,
        .it-loader-overlay .it-loader-text {
          color: #334155;
        }

        .it-loader-overlay .it-loader-content {
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 15px 45px rgba(8, 25, 50, 0.14);
        }

        @keyframes itLoaderSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .it-loader-container {
            padding: 18px;
          }

          .it-loader-content {
            gap: 11px;
          }

          .it-loader-large {
            font-size: 40px;
          }

          .it-loader-overlay .it-loader-content {
            width: min(100%, 300px);
            padding: 22px 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .it-loader-spinner {
            animation: none;
          }
        }
      `}</style>

      <div
        className={containerClasses}
        role="status"
        aria-live="polite"
        aria-label={text || "Loading"}
      >
        <div className="it-loader-content">
          <div className={`it-loader-spinner ${sizeClass}`}>
            <FaSpinner aria-hidden="true" focusable="false" />
          </div>

          {text && <p className="it-loader-text">{text}</p>}
        </div>
      </div>
    </>
  );
}

export default Loader;
