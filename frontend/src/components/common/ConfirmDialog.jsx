import React from "react";
import {
  FaExclamationTriangle,
  FaTimes,
  FaTrashAlt,
  FaCheck,
} from "react-icons/fa";

function ConfirmDialog({
  isOpen = false,
  title = "Are you sure?",
  message = "Do you want to continue with this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "danger",
  loading = false,
}) {
  if (!isOpen) return null;

  const isDanger = type === "danger";

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onCancel?.();
    }
  };

  return (
    <div
      className="it-confirm-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="it-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="it-confirm-title"
        aria-describedby="it-confirm-message"
      >
        <button
          type="button"
          className="it-confirm-close"
          onClick={onCancel}
          disabled={loading}
          aria-label="Close dialog"
        >
          <FaTimes />
        </button>

        <div className={`it-confirm-icon ${isDanger ? "danger" : "primary"}`}>
          {isDanger ? <FaExclamationTriangle /> : <FaCheck />}
        </div>

        <h2 id="it-confirm-title">{title}</h2>

        <p id="it-confirm-message">{message}</p>

        <div className="it-confirm-actions">
          <button
            type="button"
            className="it-confirm-cancel"
            onClick={() => {
              if (!loading) {
                onCancel?.();
              }
            }}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`it-confirm-submit ${isDanger ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              "Please wait..."
            ) : isDanger ? (
              <>
                <FaTrashAlt /> {confirmText}
              </>
            ) : (
              <>
                <FaCheck /> {confirmText}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .it-confirm-overlay,
        .it-confirm-overlay * {
          box-sizing: border-box;
        }

        .it-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(8, 24, 48, 0.58);
          backdrop-filter: blur(4px);
          animation: itConfirmFade 0.18s ease;
        }

        .it-confirm-dialog {
          position: relative;
          width: 100%;
          max-width: 430px;
          padding: 32px 28px 26px;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e5ebf4;
          border-radius: 20px;
          box-shadow: 0 24px 70px rgba(10, 35, 70, 0.22);
          animation: itConfirmPop 0.22s ease;
        }

        .it-confirm-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 9px;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
        }

        .it-confirm-icon {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          border-radius: 20px;
          font-size: 25px;
        }

        .it-confirm-icon.danger {
          color: #dc2626;
          background: #fef2f2;
        }

        .it-confirm-icon.primary {
          color: #075fe4;
          background: #eaf2ff;
        }

        .it-confirm-dialog h2 {
          margin: 0 0 10px;
          color: #10233f;
          font-size: 22px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .it-confirm-dialog p {
          margin: 0 auto 27px;
          max-width: 330px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .it-confirm-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .it-confirm-actions button {
          min-height: 44px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .it-confirm-cancel {
          flex: 1;
          border: 1px solid #dce5f0;
          background: #ffffff;
          color: #475569;
        }

        .it-confirm-cancel:hover {
          background: #f8fafc;
        }

        .it-confirm-submit {
          flex: 1;
          border: 1px solid transparent;
          color: #ffffff;
        }

        .it-confirm-submit.danger {
          background: #dc2626;
        }

        .it-confirm-submit.danger:hover {
          background: #b91c1c;
        }

        .it-confirm-submit.primary {
          background: #0866e9;
        }

        .it-confirm-submit.primary:hover {
          background: #0754c7;
        }

        .it-confirm-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes itConfirmFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes itConfirmPop {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .it-confirm-dialog {
            padding: 30px 19px 21px;
            border-radius: 16px;
          }

          .it-confirm-dialog h2 {
            font-size: 19px;
          }

          .it-confirm-actions {
            flex-direction: column-reverse;
          }

          .it-confirm-actions button {
            width: 100%;
            min-height: 46px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .it-confirm-overlay,
          .it-confirm-dialog {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default ConfirmDialog;
