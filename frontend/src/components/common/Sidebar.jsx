
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaWallet,
  FaThLarge,
  FaUsers,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaChartBar,
  FaCog,
  FaBuilding,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";

const defaultMenuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: FaThLarge },
  { label: "Employees", path: "/admin/employees", icon: FaUsers },
  { label: "Attendance", path: "/admin/attendance", icon: FaCalendarCheck },
  { label: "Payroll", path: "/admin/payroll/history", icon: FaMoneyBillWave },
  { label: "Salary History", path: "/admin/salary-history", icon: FaWallet },
  { label: "Reports", path: "/admin/reports/payroll", icon: FaChartBar },
  { label: "Settings", path: "/admin/settings/company", icon: FaCog },
];

function Sidebar({
  isOpen = true,
  onClose = () => {},
  menuItems = defaultMenuItems,
  companyName = "Salary Slip",
  subtitle = "HR & Payroll Management",
  footerText = "Manage your workforce",
}) {
  const location = useLocation();

  const items = Array.isArray(menuItems)
    ? menuItems.filter(
        (item) =>
          item &&
          typeof item.path === "string" &&
          typeof item.label === "string"
      )
    : [];

  const isActive = (path) => {
    const current = location.pathname.replace(/\/+$/, "") || "/";
    const target = path.replace(/\/+$/, "") || "/";

    return (
      current === target ||
      (target !== "/" && current.startsWith(`${target}/`))
    );
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 900) onClose();
  };

  return (
    <>
      <style>{`
        .pay-sidebar,
        .pay-sidebar * {
          box-sizing: border-box;
        }

        .pay-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          width: 260px;
          max-width: 88vw;
          height: 100vh;
          height: 100dvh;
          overflow-x: hidden;
          overflow-y: auto;
          background:
            radial-gradient(circle at 0 0, rgba(10, 190, 211, .13), transparent 35%),
            linear-gradient(180deg, #10243b, #101b32);
          color: #fff;
          box-shadow: 8px 0 30px rgba(12, 35, 59, .12);
          transform: translateX(-105%);
          transition: transform .27s ease;
          scrollbar-width: thin;
          scrollbar-color: #36536c #102039;
        }

        .pay-sidebar.open {
          transform: translateX(0);
        }

        .pay-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 99px;
          padding: 16px 15px;
          border-bottom: 1px solid rgba(255, 255, 255, .09);
        }

        .pay-sidebar-logo {
          display: grid;
          place-items: center;
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #12c6d7, #0878e8);
          color: #fff;
          font-size: 19px;
          box-shadow: 0 6px 17px rgba(8, 155, 204, .22);
        }

        .pay-sidebar-brand-text {
          flex: 1;
          min-width: 0;
        }

        .pay-sidebar-brand-text h2 {
          margin: 0;
          overflow-wrap: anywhere;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.4;
        }

        .pay-sidebar-brand-text p {
          margin: 4px 0 0;
          color: #9db7ca;
          font-size: 10px;
          line-height: 1.5;
        }

        .pay-sidebar-close {
          display: none;
          place-items: center;
          flex: 0 0 32px;
          width: 32px;
          height: 32px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .15);
          border-radius: 9px;
          background: rgba(255, 255, 255, .08);
          color: #fff;
          cursor: pointer;
        }

        .pay-sidebar-section-label {
          padding: 25px 22px 12px;
          color: #829bb2;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .pay-sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 0 12px;
        }

        .pay-sidebar-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 46px;
          padding: 0 13px;
          overflow: hidden;
          border: 1px solid transparent;
          border-radius: 11px;
          color: #a9bbcd;
          text-decoration: none;
          font-size: 12px;
          font-weight: 650;
          transition: background .2s, color .2s, border-color .2s;
        }

        .pay-sidebar-link-icon {
          display: grid;
          place-items: center;
          flex: 0 0 20px;
          width: 20px;
          color: #8ca6bb;
          font-size: 15px;
        }

        .pay-sidebar-link:hover {
          background: rgba(255, 255, 255, .06);
          color: #fff;
        }

        .pay-sidebar-link.active {
          border-color: rgba(58, 206, 225, .17);
          background: linear-gradient(100deg, rgba(18, 184, 203, .2), rgba(8, 120, 232, .13));
          color: #fff;
        }

        .pay-sidebar-link.active::before {
          position: absolute;
          top: 9px;
          bottom: 9px;
          left: 0;
          width: 3px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(180deg, #41e0e1, #1689f5);
          content: "";
        }

        .pay-sidebar-link.active .pay-sidebar-link-icon {
          color: #42d5e4;
        }

        .pay-sidebar-link-arrow {
          flex-shrink: 0;
          margin-left: auto;
          color: #42d5e4;
          font-size: 9px;
        }

        .pay-sidebar-spacer {
          flex: 1;
          min-height: 24px;
        }

        .pay-sidebar-footer {
          margin: 15px 12px 17px;
          padding: 15px 13px;
          border: 1px solid rgba(130, 203, 224, .13);
          border-radius: 12px;
          background: rgba(255, 255, 255, .035);
        }

        .pay-sidebar-footer-icon {
          display: grid;
          place-items: center;
          width: 37px;
          height: 37px;
          margin-bottom: 11px;
          border-radius: 10px;
          background: rgba(25, 190, 211, .12);
          color: #41d5e4;
        }

        .pay-sidebar-footer p {
          margin: 0;
          color: #e5f3fa;
          font-size: 11px;
          font-weight: 750;
          line-height: 1.5;
        }

        .pay-sidebar-footer small {
          display: block;
          margin-top: 5px;
          color: #8ca6bb;
          font-size: 10px;
          line-height: 1.6;
        }

        .pay-sidebar a:focus-visible,
        .pay-sidebar button:focus-visible {
          outline: 2px solid #41d5e4;
          outline-offset: 2px;
        }

        @media (min-width: 901px) {
          .pay-sidebar {
            transform: translateX(-100%);
          }

          .pay-sidebar.open {
            transform: translateX(0);
          }
        }

        @media (max-width: 900px) {
          .pay-sidebar {
            z-index: 1001;
            width: min(290px, 86vw);
            box-shadow: 14px 0 35px rgba(8, 21, 38, .25);
          }

          .pay-sidebar-close {
            display: grid;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pay-sidebar {
            transition: none;
          }
        }
      `}</style>

      <aside
        id="salary-slip-sidebar"
        className={`pay-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="pay-sidebar-brand">
          <div className="pay-sidebar-logo" aria-hidden="true">
            <FaWallet />
          </div>

          <div className="pay-sidebar-brand-text">
            <h2>{companyName}</h2>
            <p>{subtitle}</p>
          </div>

          <button
            type="button"
            className="pay-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="pay-sidebar-section-label">Main Menu</div>

        <nav className="pay-sidebar-menu" aria-label="Admin navigation">
          {items.map((item) => {
            const Icon = item.icon || FaThLarge;
            const active = isActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact === true}
                onClick={handleLinkClick}
                className={`pay-sidebar-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="pay-sidebar-link-icon" aria-hidden="true">
                  <Icon />
                </span>

                <span>{item.label}</span>

                {active && (
                  <FaChevronRight
                    className="pay-sidebar-link-arrow"
                    aria-hidden="true"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="pay-sidebar-spacer" />

        <div className="pay-sidebar-footer">
          <div className="pay-sidebar-footer-icon" aria-hidden="true">
            <FaBuilding />
          </div>
          <p>{companyName}</p>
          <small>{footerText}</small>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
