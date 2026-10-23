import React, { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

function Modal({
  isOpen = false,
  onClose,
  title = "Details",
  children,
  size = "medium",
  closeOnOverlay = true,
  showCloseButton = true,
  footer = null,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const validSizes = ["small", "medium", "large", "full"];
  const safeSize = validSizes.includes(size) ? size : "medium";

  const handleOverlayClick = (event) => {
    if (
      closeOnOverlay &&
      event.target === event.currentTarget
    ) {
      onClose?.();
    }
  };

  return createPortal(
    <>
      <style>{`
        .it-modal-overlay,
        .it-modal-overlay * {
          box-sizing: border-box;
        }

        .it-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(8, 24, 48, 0.58);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          animation: itModalFade 0.18s ease;
        }

        .it-modal-dialog {
          position: relative;
          width: 100%;
          min-width: 0;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e4eaf3;
          border-radius: 17px;
          box-shadow: 0 25px 70px rgba(10, 35, 70, 0.24);
          animation: itModalEnter 0.2s ease;
        }

        .it-modal-small {
          max-width: 420px;
        }

        .it-modal-medium {
          max-width: 620px;
        }

        .it-modal-large {
          max-width: 900px;
        }

        .it-modal-full {
          max-width: 1200px;
        }

        .it-modal-header {
          min-height: 66px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
          border-bottom: 1px solid #e9eef5;
          background: #ffffff;
        }

        .it-modal-heading {
          min-width: 0;
        }

        .it-modal-heading h2 {
          margin: 0;
          color: #142744;
          font-size: 19px;
          font-weight: 750;
          line-height: 1.4;
          letter-spacing: -0.35px;
          overflow-wrap: anywhere;
        }

        .it-modal-close {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          transition: background 0.2s ease,
                      border-color 0.2s ease,
                      color 0.2s ease;
        }

        .it-modal-close:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .it-modal-close:focus-visible {
          outline: 2px solid #0866e9;
          outline-offset: 3px;
        }

        .it-modal-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .it-modal-body {
          min-height: 0;
          padding: 24px;
          overflow-x: auto;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .it-modal-footer {
          flex-shrink: 0;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          border-top: 1px solid #e9eef5;
          background: #f8faff;
        }

        @keyframes itModalFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes itModalEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 600px) {
          .it-modal-overlay {
            align-items: center;
            padding: 12px;
          }

          .it-modal-dialog {
            max-height: calc(100vh - 24px);
            max-height: calc(100dvh - 24px);
            border-radius: 14px;
          }

          .it-modal-header {
            min-height: 58px;
            padding: 14px 16px;
          }

          .it-modal-heading h2 {
            font-size: 17px;
          }

          .it-modal-body {
            padding: 17px;
          }

          .it-modal-footer {
            padding: 13px 16px;
          }
        }

        @media (max-width: 360px) {
          .it-modal-overlay {
            padding: 8px;
          }

          .it-modal-dialog {
            max-height: calc(100vh - 16px);
            max-height: calc(100dvh - 16px);
          }

          .it-modal-header {
            padding: 12px;
          }

          .it-modal-body {
            padding: 13px;
          }

          .it-modal-footer {
            padding: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .it-modal-overlay,
          .it-modal-dialog {
            animation: none;
          }

          .it-modal-close {
            transition: none;
          }
        }
      `}</style>

      <div
        className="it-modal-overlay"
        onMouseDown={handleOverlayClick}
      >
        <section
          className={`it-modal-dialog it-modal-${safeSize}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="it-modal-header">
            <div className="it-modal-heading">
              <h2 id={titleId}>{title}</h2>
            </div>

            {showCloseButton && (
              <button
                type="button"
                className="it-modal-close"
                onClick={() => onClose?.()}
                aria-label="Close modal"
              >
                <FaTimes aria-hidden="true" />
              </button>
            )}
          </header>

          <div className="it-modal-body">{children}</div>

          {footer !== null && footer !== false && (
            <footer className="it-modal-footer">
              {footer}
            </footer>
          )}
        </section>
      </div>
    </>,
    document.body
  );
}

export default Modal;
