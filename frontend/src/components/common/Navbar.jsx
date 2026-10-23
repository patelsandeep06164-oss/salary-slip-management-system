import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaWallet,
  FaSearch,
  FaBell,
  FaChevronDown,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

function Navbar({
  onMenuClick,
  isSidebarOpen = false,
  user = null,
  onLogout,
  onSearch,
  onProfileClick,
  onSettingsClick,
  onNotificationClick,
  notificationCount = 0,
}) {
  const [searchText, setSearchText] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const name = user?.name || "Administrator";

  const role = user?.role
    ? String(user.role).charAt(0).toUpperCase() +
      String(user.role).slice(1)
    : "Administrator";

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "AD";

  const unreadCount = Math.max(
    0,
    Number(notificationCount) || 0
  );

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    onSearch?.(searchText.trim());
  };

  const handleNotificationClick = () => {
    onNotificationClick?.();
  };

  return (
    <>
      <header className="salary-navbar">
        {/* LEFT SECTION */}
        <div className="salary-navbar-left">
          <button
            type="button"
            className="salary-menu-toggle"
            onClick={onMenuClick}
            aria-label={
              isSidebarOpen ? "Close sidebar" : "Open sidebar"
            }
            aria-expanded={isSidebarOpen}
            aria-controls="salary-slip-sidebar"
            title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <Link to="/admin/dashboard" className="salary-brand">
            <span className="salary-brand-icon">
              <FaWallet />
            </span>

            <span className="salary-brand-text">
              <strong>
                Salary<span>Flow</span>
              </strong>
              <small>PAYROLL MANAGEMENT</small>
            </span>
          </Link>
        </div>

        {/* MIDDLE SECTION */}
        <div className="salary-navbar-middle">
          <div className="salary-welcome">
            <small>ADMINISTRATION</small>
            <strong>
              Welcome back, {name.split(" ")[0]}
            </strong>
          </div>

          <form
            className="salary-search"
            onSubmit={submitSearch}
            role="search"
          >
            <FaSearch className="salary-search-icon" />

            <input
              type="search"
              placeholder="Search employees, payroll..."
              aria-label="Search employees and payroll"
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />

            <button type="submit">Search</button>
          </form>
        </div>

        {/* RIGHT SECTION */}
        <div className="salary-navbar-actions">
          {/* NOTIFICATION BELL */}
          <button
            type="button"
            className="salary-icon-button salary-notification-button"
            onClick={handleNotificationClick}
            aria-label={`${unreadCount} unread notifications`}
            title={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
          >
            <FaBell className="salary-bell-icon" />

            {unreadCount > 0 && (
              <span
                className="salary-notification-badge"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* PROFILE DROPDOWN */}
          <div className="salary-profile" ref={profileRef}>
            <button
              type="button"
              className="salary-profile-toggle"
              onClick={() =>
                setProfileOpen((open) => !open)
              }
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <span className="salary-avatar">
                {initials}
              </span>

              <span className="salary-profile-info">
                <strong>{name}</strong>
                <small>
                  <i />
                  {role}
                </small>
              </span>

              <FaChevronDown
                className={profileOpen ? "rotated" : ""}
              />
            </button>

            {profileOpen && (
              <div
                className="salary-profile-dropdown"
                role="menu"
              >
                <div className="salary-dropdown-heading">
                  <span className="salary-avatar">
                    {initials}
                  </span>

                  <span>
                    <strong>{name}</strong>
                    <small>{user?.email || role}</small>
                  </span>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onProfileClick?.();
                  }}
                >
                  <FaUser />
                  My Profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onSettingsClick?.();
                  }}
                >
                  <FaCog />
                  Settings
                </button>

                <button
                  type="button"
                  className="salary-logout"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout?.();
                  }}
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <style>{`
        .salary-navbar,
        .salary-navbar * {
          box-sizing: border-box;
        }

        .salary-navbar {
          position: sticky;
          top: 0;
          z-index: 990;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(8px, 1.4vw, 22px);
          width: 100%;
          min-height: 82px;
          padding: 12px clamp(12px, 1.8vw, 27px);
          border-bottom: 1px solid #dfebf3;
          background: linear-gradient(110deg, #fff, #f4fbff);
          box-shadow: 0 4px 20px rgba(22, 56, 83, .05);
          font-family: Inter, Arial, sans-serif;
        }

        .salary-navbar-left,
        .salary-navbar-actions,
        .salary-brand,
        .salary-profile-toggle {
          display: flex;
          align-items: center;
        }

        .salary-navbar-left {
          flex: 0 1 auto;
          min-width: 0;
          gap: 13px;
        }

        .salary-menu-toggle,
        .salary-icon-button {
          position: relative;
          display: grid;
          place-items: center;
          flex: 0 0 43px;
          width: 43px;
          height: 43px;
          border: 1px solid #dbe8f1;
          border-radius: 12px;
          background: #fff;
          color: #294c68;
          font-size: 17px;
          cursor: pointer;
          transition:
            color .2s,
            background .2s,
            border-color .2s;
        }

        .salary-menu-toggle:hover,
        .salary-icon-button:hover {
          border-color: #a9e7f0;
          background: #e9faff;
          color: #078caf;
        }

        .salary-menu-toggle:focus-visible,
        .salary-icon-button:focus-visible,
        .salary-navbar button:focus-visible,
        .salary-navbar a:focus-visible {
          outline: 3px solid rgba(6, 182, 212, .4);
          outline-offset: 2px;
        }

        .salary-brand {
          gap: 11px;
          min-width: 0;
          text-decoration: none;
        }

        .salary-brand-icon {
          display: grid;
          place-items: center;
          flex: 0 0 47px;
          width: 47px;
          height: 47px;
          border-radius: 14px;
          background: linear-gradient(135deg, #08baca, #0878e8);
          box-shadow: 0 6px 17px rgba(8, 135, 198, .2);
          color: #fff;
          font-size: 20px;
        }

        .salary-brand-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .salary-brand-text strong {
          color: #19344d;
          font-size: clamp(15px, 1.3vw, 20px);
          font-weight: 850;
          letter-spacing: -.5px;
          white-space: nowrap;
        }

        .salary-brand-text strong span {
          color: #059dbd;
        }

        .salary-brand-text small {
          color: #8097aa;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.1px;
          white-space: nowrap;
        }

        .salary-navbar-middle {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1 1 320px;
          min-width: 0;
          gap: clamp(12px, 2vw, 28px);
        }

        .salary-welcome {
          display: flex;
          flex-direction: column;
          flex: 0 0 auto;
          gap: 5px;
        }

        .salary-welcome small {
          color: #0698b8;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.4px;
        }

        .salary-welcome strong {
          color: #314b62;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .salary-search {
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(360px, 100%);
          min-width: 100px;
          height: 44px;
          padding: 0 8px 0 13px;
          border: 1px solid #dce9f2;
          border-radius: 13px;
          background: #f7fbff;
        }

        .salary-search:focus-within {
          border-color: #51c9df;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(14, 165, 199, .09);
        }

        .salary-search-icon {
          flex-shrink: 0;
          color: #8299ad;
          font-size: 14px;
        }

        .salary-search input {
          flex: 1;
          width: 0;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #24445d;
          font: inherit;
          font-size: 12px;
        }

        .salary-search input::placeholder {
          color: #8ba2b6;
        }

        .salary-search button {
          flex-shrink: 0;
          padding: 9px 12px;
          border: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, #08b6c7, #087ce4);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .salary-navbar-actions {
          flex: 0 0 auto;
          justify-content: flex-end;
          gap: clamp(8px, 1vw, 15px);
        }

        /* Small red notification count at the upper-left of the bell */
        .salary-notification-button {
          position: relative;
          overflow: visible;
        }

        .salary-bell-icon {
          display: block;
        }

        .salary-notification-badge {
          position: absolute;
          top: 2px;
          left: 2px;
          display: grid;
          place-items: center;
          min-width: 15px;
          height: 15px;
          padding: 0 3px;
          border: 1.5px solid #fff;
          border-radius: 50px;
          background: #ef4444;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          line-height: 1;
          z-index: 2;
          pointer-events: none;
          white-space: nowrap;
        }

        .salary-profile {
          position: relative;
          min-width: 0;
        }

        .salary-profile-toggle {
          gap: 9px;
          max-width: 250px;
          padding: 4px 5px;
          border: 1px solid transparent;
          border-radius: 12px;
          background: transparent;
          color: #7790a4;
          cursor: pointer;
        }

        .salary-profile-toggle:hover,
        .salary-profile-toggle[aria-expanded="true"] {
          border-color: #dcebf3;
          background: #f0faff;
        }

        .salary-avatar {
          display: grid;
          place-items: center;
          flex: 0 0 43px;
          width: 43px;
          height: 43px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0bb8c9, #0879e8);
          box-shadow: 0 5px 12px rgba(8, 135, 198, .18);
          color: #fff;
          font-size: 12px;
          font-weight: 850;
        }

        .salary-profile-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
          text-align: left;
        }

        .salary-profile-info strong {
          max-width: 150px;
          overflow: hidden;
          color: #244159;
          font-size: 12px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .salary-profile-info small {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #7f97aa;
          font-size: 10px;
        }

        .salary-profile-info small i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16b981;
        }

        .salary-profile-toggle > svg {
          flex-shrink: 0;
          font-size: 10px;
          transition: transform .2s;
        }

        .salary-profile-toggle > svg.rotated {
          transform: rotate(180deg);
        }

        .salary-profile-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          z-index: 1200;
          width: min(285px, calc(100vw - 24px));
          padding: 8px;
          border: 1px solid #dfebf3;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 18px 48px rgba(20, 53, 81, .18);
        }

        .salary-dropdown-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: -8px -8px 7px;
          padding: 14px;
          border-radius: 14px 14px 0 0;
          background: linear-gradient(120deg, #e9fbff, #f0f6ff);
        }

        .salary-dropdown-heading > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .salary-dropdown-heading strong {
          overflow-wrap: anywhere;
          color: #24445d;
          font-size: 12px;
        }

        .salary-dropdown-heading small {
          overflow-wrap: anywhere;
          color: #8297aa;
          font-size: 10px;
        }

        .salary-profile-dropdown > button {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          min-height: 42px;
          padding: 0 11px;
          border: 0;
          border-radius: 9px;
          background: #fff;
          color: #405a70;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          text-align: left;
          cursor: pointer;
        }

        .salary-profile-dropdown > button:hover {
          background: #effaff;
          color: #078caf;
        }

        .salary-profile-dropdown > button svg {
          color: #0799b9;
        }

        .salary-profile-dropdown > button.salary-logout {
          margin-top: 6px;
          border-top: 1px solid #edf1f5;
          border-radius: 0 0 9px 9px;
          color: #d73c48;
        }

        .salary-profile-dropdown > button.salary-logout svg {
          color: #d73c48;
        }

        @media (max-width: 1200px) {
          .salary-welcome {
            display: none;
          }

          .salary-navbar-middle {
            gap: 10px;
          }

          .salary-profile-info strong {
            max-width: 120px;
          }
        }

        @media (max-width: 900px) {
          .salary-navbar {
            min-height: 72px;
            gap: 10px;
            padding: 10px 14px;
          }

          .salary-navbar-middle {
            flex: 1 1 180px;
          }

          .salary-search {
            max-width: 300px;
          }

          .salary-profile-info {
            display: none;
          }

          .salary-profile-toggle {
            gap: 5px;
            padding: 3px;
          }
        }

        @media (max-width: 600px) {
          .salary-navbar {
            min-height: 64px;
            gap: 7px;
            padding: 8px 10px;
          }

          .salary-navbar-left {
            gap: 7px;
          }

          .salary-menu-toggle,
          .salary-icon-button {
            flex-basis: 36px;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            font-size: 14px;
          }

          .salary-brand {
            gap: 7px;
          }

          .salary-brand-icon {
            flex-basis: 35px;
            width: 35px;
            height: 35px;
            border-radius: 10px;
            font-size: 15px;
          }

          .salary-brand-text {
            gap: 2px;
          }

          .salary-brand-text strong {
            font-size: 14px;
          }

          .salary-brand-text small {
            font-size: 7px;
            letter-spacing: .6px;
          }

          .salary-navbar-middle {
            display: none;
          }

          .salary-navbar-actions {
            gap: 7px;
          }

          .salary-avatar {
            flex-basis: 35px;
            width: 35px;
            height: 35px;
            border-radius: 10px;
            font-size: 11px;
          }

          .salary-profile-toggle > svg {
            display: none;
          }

          .salary-notification-badge {
            top: 1px;
            left: 1px;
            min-width: 14px;
            height: 14px;
            font-size: 7px;
          }
        }

        @media (max-width: 360px) {
          .salary-navbar {
            padding-right: 6px;
            padding-left: 6px;
            gap: 5px;
          }

          .salary-navbar-left {
            gap: 5px;
          }

          .salary-menu-toggle,
          .salary-icon-button {
            flex-basis: 32px;
            width: 32px;
            height: 32px;
          }

          .salary-brand {
            gap: 5px;
          }

          .salary-brand-icon {
            flex-basis: 30px;
            width: 30px;
            height: 30px;
          }

          .salary-brand-text strong {
            font-size: 12px;
          }

          .salary-brand-text small {
            font-size: 6px;
          }

          .salary-navbar-actions {
            gap: 5px;
          }

          .salary-avatar {
            flex-basis: 31px;
            width: 31px;
            height: 31px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .salary-navbar *,
          .salary-navbar *::before,
          .salary-navbar *::after {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default Navbar;
