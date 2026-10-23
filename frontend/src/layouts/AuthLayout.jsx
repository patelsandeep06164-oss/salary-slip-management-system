import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

function AuthLayout() {
  const location = useLocation();

  return (
    <>
      <style>{`
        .auth-layout,
        .auth-layout * {
          box-sizing: border-box;
        }

        .auth-layout {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          color: #172554;
          font-family: Arial, Helvetica, sans-serif;
          background:
            radial-gradient(
              circle at 8% 8%,
              rgba(34, 211, 238, 0.17),
              transparent 34%
            ),
            radial-gradient(
              circle at 92% 85%,
              rgba(59, 130, 246, 0.14),
              transparent 35%
            ),
            linear-gradient(135deg, #f4fbff 0%, #eef6ff 50%, #f8fbff 100%);
        }

        .auth-layout-header {
          position: relative;
          z-index: 2;
          width: 100%;
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.78);
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.025);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .auth-layout-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0;
          color: #0284c7;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.8px;
          text-align: center;
        }

        .auth-layout-brand-mark {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #ffffff;
          font-size: 20px;
          background: linear-gradient(135deg, #06b6d4, #2563eb);
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.2);
        }

        .auth-layout-brand-text {
          color: #0f172a;
        }

        .auth-layout-brand-text span {
          color: #0284c7;
        }

        .auth-layout-content {
          flex: 1;
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 22px;
        }

        .auth-layout-footer {
          width: 100%;
          padding: 18px 16px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          line-height: 1.7;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.58);
        }

        .auth-layout-footer p {
          margin: 0;
        }

        .auth-layout-footer a {
          color: #0284c7;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .auth-layout-footer a:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        @media (min-width: 1200px) {
          .auth-layout-content {
            padding: 42px 28px;
          }
        }

        @media (max-width: 768px) {
          .auth-layout-header {
            min-height: 68px;
          }

          .auth-layout-content {
            padding: 28px 18px;
          }
        }

        @media (max-width: 480px) {
          .auth-layout-header {
            min-height: 60px;
            padding: 11px 12px;
          }

          .auth-layout-brand {
            gap: 7px;
            font-size: 21px;
            letter-spacing: -0.5px;
          }

          .auth-layout-brand-mark {
            width: 33px;
            height: 33px;
            border-radius: 10px;
            font-size: 17px;
          }

          .auth-layout-content {
            padding: 22px 12px;
          }

          .auth-layout-footer {
            padding: 13px 10px;
            font-size: 11px;
          }
        }

        @media (max-height: 650px) and (min-width: 769px) {
          .auth-layout-content {
            align-items: flex-start;
            padding-top: 24px;
            padding-bottom: 24px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-layout-footer a {
            transition: none;
          }
        }
      `}</style>

      <div className="auth-layout">
        <header className="auth-layout-header">
          <Link
            to="/login"
            className="auth-layout-brand"
            aria-label="Salary Slip home"
            style={{ textDecoration: "none" }}
          >
            <span className="auth-layout-brand-mark" aria-hidden="true">
              ₹
            </span>

            <span className="auth-layout-brand-text">
              Salary <span>Slip</span>
            </span>
          </Link>
        </header>

        <main className="auth-layout-content" key={location.pathname}>
          <Outlet />
        </main>

        <footer className="auth-layout-footer">
          <p>
            © {new Date().getFullYear()} Salary Slip Management System.
            All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
}

export default AuthLayout;
