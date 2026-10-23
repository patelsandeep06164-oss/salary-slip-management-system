import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaHome,
  FaSearch,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .not-found-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 18px;
          font-family: Arial, Helvetica, sans-serif;
          background:
            radial-gradient(circle at top left, #dbeafe 0%, transparent 35%),
            radial-gradient(circle at bottom right, #e0e7ff 0%, transparent 35%),
            #f8fafc;
          overflow: hidden;
        }

        .not-found-card {
          width: 100%;
          max-width: 650px;
          padding: 50px 35px;
          text-align: center;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          animation: notFoundAppear 0.6s ease;
        }

        .not-found-icon {
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #2563eb;
          background: #eff6ff;
          border-radius: 22px;
          font-size: 30px;
        }

        .not-found-number {
          margin: 0;
          font-size: clamp(90px, 17vw, 150px);
          line-height: 1;
          font-weight: 900;
          letter-spacing: -8px;
          color: #2563eb;
          text-shadow: 4px 5px 0 #dbeafe;
        }

        .not-found-title {
          margin: 24px 0 12px;
          color: #0f172a;
          font-size: clamp(23px, 5vw, 32px);
          font-weight: 800;
        }

        .not-found-description {
          max-width: 430px;
          margin: 0 auto;
          color: #64748b;
          font-size: 15px;
          line-height: 1.8;
        }

        .not-found-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .not-found-button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 20px;
          border: 1px solid transparent;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .not-found-primary {
          color: #ffffff;
          background: #2563eb;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.2);
        }

        .not-found-primary:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }

        .not-found-secondary {
          color: #334155;
          background: #ffffff;
          border-color: #cbd5e1;
        }

        .not-found-secondary:hover {
          color: #2563eb;
          border-color: #2563eb;
          background: #eff6ff;
          transform: translateY(-2px);
        }

        .not-found-footer {
          margin-top: 35px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 12px;
        }

        @keyframes notFoundAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .not-found-page {
            padding: 18px 12px;
          }

          .not-found-card {
            padding: 35px 20px;
            border-radius: 18px;
          }

          .not-found-number {
            letter-spacing: -4px;
          }

          .not-found-actions {
            flex-direction: column;
          }

          .not-found-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .not-found-card {
            animation: none;
          }

          .not-found-button {
            transition: none;
          }
        }
      `}</style>

      <main className="not-found-page">
        <section className="not-found-card">
          <div className="not-found-icon">
            <FaExclamationTriangle />
          </div>

          <h1 className="not-found-number">404</h1>

          <h2 className="not-found-title">
            Oops! Page Not Found
          </h2>

          <p className="not-found-description">
            The page you are looking for may have been moved,
            deleted, or the URL may be incorrect. Please check
            the address or return to a valid page.
          </p>

          <div className="not-found-actions">
            <button
              type="button"
              className="not-found-button not-found-secondary"
              onClick={handleGoBack}
            >
              <FaArrowLeft />
              Go Back
            </button>

            <Link
              to="/login"
              className="not-found-button not-found-primary"
            >
              <FaHome />
              Go to Login
            </Link>
          </div>

          <div className="not-found-footer">
            HR &amp; Payroll Management System
          </div>
        </section>
      </main>
    </>
  );
}
