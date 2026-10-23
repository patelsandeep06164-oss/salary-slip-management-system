import React, { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaUserCircle,
  FaCalendarCheck,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaLock,
  FaTimes,
} from "react-icons/fa";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/employee/dashboard",
    icon: <FaThLarge />,
    end: true,
  },
  {
    label: "My Profile",
    path: "/employee/profile",
    icon: <FaUserCircle />,
  },
  {
    label: "Attendance",
    path: "/employee/attendance",
    icon: <FaCalendarCheck />,
  },
  {
    label: "Apply Leave",
    path: "/employee/leaves/apply",
    icon: <FaCalendarAlt />,
  },
  {
    label: "My Leaves",
    path: "/employee/leaves/my-leaves",
    icon: <FaCalendarAlt />,
  },
  {
    label: "Payroll History",
    path: "/employee/salary-history",
    icon: <FaMoneyBillWave />,
  },
  {
    label: "Salary Slips",
    path: "/employee/salary-slips",
    icon: <FaFileInvoiceDollar />,
  },
  {
    label: "Change Password",
    path: "/employee/change-password",
    icon: <FaLock />,
  },
];

function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((previous) => !previous);
  }, []);

  // Close the mobile sidebar after navigating to another page.
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // Prevent background scrolling and support closing with Escape.
  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen, closeSidebar]);

  // Automatically close the drawer when switching back to desktop width.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        closeSidebar();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [closeSidebar]);

  return (
    <>
      <style>{`
        .employee-layout,
        .employee-layout * {
          box-sizing: border-box;
        }

        .employee-layout {
          --employee-sidebar-width: 260px;
          --employee-primary: #0284c7;
          --employee-blue: #2563eb;
          --employee-text: #1e293b;
          --employee-muted: #64748b;
          --employee-border: #e2e8f0;

          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          color: var(--employee-text);
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(34, 211, 238, 0.07),
              transparent 28%
            ),
            #f3f8fd;
          font-family: Arial, Helvetica, sans-serif;
        }

        .employee-layout-sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 1000;
          width: var(--employee-sidebar-width);
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          background: rgba(255, 255, 255, 0.97);
          border-right: 1px solid var(--employee-border);
          box-shadow: 4px 0 24px rgba(15, 23, 42, 0.035);
          transition: transform 0.25s ease;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .employee-layout-brand {
          min-height: 78px;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px 17px;
          border-bottom: 1px solid #edf2f7;
        }

        .employee-layout-brand-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #06b6d4, #2563eb);
          border-radius: 13px;
          font-size: 19px;
          box-shadow: 0 5px 13px rgba(37, 99, 235, 0.19);
        }

        .employee-layout-brand-copy {
          min-width: 0;
          flex: 1;
        }

        .employee-layout-brand h2 {
          margin: 0;
          color: #0f172a;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.45px;
          white-space: nowrap;
        }

        .employee-layout-brand p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
        }

        .employee-layout-close {
          width: 34px;
          height: 34px;
          display: none;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          cursor: pointer;
          font-size: 15px;
        }

        .employee-layout-close:hover {
          color: #dc2626;
          background: #fef2f2;
        }

        .employee-layout-nav-title {
          margin: 24px 20px 11px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.25px;
          text-transform: uppercase;
        }

        .employee-layout-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 0 12px 24px;
        }

        .employee-layout-link {
          position: relative;
          min-height: 45px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 13px;
          color: #64748b;
          border: 1px solid transparent;
          border-radius: 11px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }

        .employee-layout-link svg {
          width: 17px;
          flex-shrink: 0;
          font-size: 16px;
        }

        .employee-layout-link:hover {
          color: #0369a1;
          background: #f0f9ff;
          border-color: #e0f2fe;
        }

        .employee-layout-link.active {
          color: #0369a1;
          background: linear-gradient(
            110deg,
            #e0f7ff 0%,
            #eaf1ff 100%
          );
          border-color: #ccecff;
          font-weight: 700;
        }

        .employee-layout-link.active::before {
          content: "";
          position: absolute;
          top: 10px;
          bottom: 10px;
          left: -1px;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #06b6d4, #2563eb);
        }

        .employee-layout-main {
          min-height: 100vh;
          min-height: 100dvh;
          min-width: 0;
          margin-left: var(--employee-sidebar-width);
          display: flex;
          flex-direction: column;
        }

        .employee-layout-content {
          flex: 1;
          min-width: 0;
          width: 100%;
          padding: 26px;
        }

        .employee-layout-overlay {
          display: none;
        }

        @media (max-width: 1100px) {
          .employee-layout-content {
            padding: 22px 18px;
          }
        }

        @media (max-width: 900px) {
          .employee-layout-sidebar {
            width: min(290px, 86vw);
            transform: translateX(-105%);
            visibility: hidden;
            pointer-events: none;
          }

          .employee-layout-sidebar.open {
            transform: translateX(0);
            visibility: visible;
            pointer-events: auto;
          }

          .employee-layout-brand {
            padding-right: 13px;
          }

          .employee-layout-close {
            display: inline-flex;
          }

          .employee-layout-main {
            margin-left: 0;
            width: 100%;
          }

          .employee-layout-content {
            padding: 20px 16px;
          }

          .employee-layout-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 999;
            width: 100%;
            height: 100%;
            padding: 0;
            border: 0;
            background: rgba(15, 23, 42, 0.48);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            cursor: pointer;
          }
        }

        @media (max-width: 480px) {
          .employee-layout-content {
            padding: 16px 12px;
          }

          .employee-layout-brand {
            min-height: 70px;
          }

          .employee-layout-nav-title {
            margin-top: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .employee-layout-sidebar,
          .employee-layout-link {
            transition: none;
          }
        }
      `}</style>

      <div className="employee-layout">
        {sidebarOpen && (
          <button
            type="button"
            className="employee-layout-overlay"
            aria-label="Close navigation menu"
            onClick={closeSidebar}
          />
        )}

        <aside
          id="employee-navigation"
          className={`employee-layout-sidebar ${
            sidebarOpen ? "open" : ""
          }`}
          aria-label="Employee navigation"
          aria-hidden={sidebarOpen ? undefined : undefined}
        >
          <div className="employee-layout-brand">
            <div className="employee-layout-brand-icon" aria-hidden="true">
              <FaMoneyBillWave />
            </div>

            <div className="employee-layout-brand-copy">
              <h2>Salary Slip</h2>
              <p>Employee Portal</p>
            </div>

            <button
              type="button"
              className="employee-layout-close"
              aria-label="Close sidebar"
              onClick={closeSidebar}
            >
              <FaTimes />
            </button>
          </div>

          <p className="employee-layout-nav-title">Employee Menu</p>

          <nav className="employee-layout-nav">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={Boolean(item.end)}
                className={({ isActive }) =>
                  `employee-layout-link${isActive ? " active" : ""}`
                }
                onClick={closeSidebar}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="employee-layout-main">
          <Navbar
            onMenuClick={toggleSidebar}
          />

          <main className="employee-layout-content">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}

export default EmployeeLayout;
