
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "../components/common/Sidebar";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

import { useAuthContext } from "../context/AuthContext";
import api from "../services/api";

const DESKTOP_WIDTH = 900;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication from HttpOnly cookie-based AuthContext
  const {
    user: currentUser,
    setUser,
    logout,
  } = useAuthContext();

  const [sidebarOpen, setSidebarOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth > DESKTOP_WIDTH
  );

  const [notificationCount, setNotificationCount] =
    useState(0);

  // Keep Navbar user information synchronized with AuthContext
  useEffect(() => {
    const handleProfileUpdated = (event) => {
      const updatedUser = event.detail;

      if (!updatedUser || typeof updatedUser !== "object") {
        return;
      }

      setUser({
        ...(currentUser || {}),
        ...updatedUser,
      });
    };

    window.addEventListener(
      "profile-updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "profile-updated",
        handleProfileUpdated
      );
    };
  }, [currentUser, setUser]);

  // Sidebar controls
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // GLOBAL SEARCH
  const handleSearch = useCallback(
    (query) => {
      const value = String(query || "").trim();

      // Require at least 2 characters
      if (value.length < 2) return;

      closeSidebar();

      navigate(
        `/admin/search?q=${encodeURIComponent(value)}`
      );
    },
    [navigate, closeSidebar]
  );

  // Fetch unread notification count using HttpOnly cookie
  const fetchUnreadNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotificationCount(0);
      return;
    }

    try {
      const response = await api.get(
        "/notifications?limit=1"
      );

      const data = response.data || {};

      setNotificationCount(
        Math.max(0, Number(data.unreadCount) || 0)
      );
    } catch (error) {
      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        setNotificationCount(0);
        return;
      }

      console.error(
        "Failed to fetch notifications:",
        error
      );
    }
  }, [currentUser]);

  // Initial fetch, periodic refresh and notification updates
  useEffect(() => {
    if (!currentUser) {
      setNotificationCount(0);
      return;
    }

    fetchUnreadNotifications();

    const intervalId = window.setInterval(() => {
      fetchUnreadNotifications();
    }, 15000);

    const handleFocus = () => {
      fetchUnreadNotifications();
    };

    const handleNotificationUpdate = () => {
      fetchUnreadNotifications();
    };

    window.addEventListener("focus", handleFocus);

    window.addEventListener(
      "notifications-updated",
      handleNotificationUpdate
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "notifications-updated",
        handleNotificationUpdate
      );
    };
  }, [currentUser, fetchUnreadNotifications]);

  // Update sidebar on screen resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(
        window.innerWidth > DESKTOP_WIDTH
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // Close sidebar with Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [closeSidebar]);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.innerWidth > DESKTOP_WIDTH ||
      !sidebarOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [sidebarOpen]);

  // Open notifications
  const handleNotificationClick = useCallback(() => {
    closeSidebar();
    navigate("/admin/notifications");
  }, [navigate, closeSidebar]);

  // Refresh unread count when notifications page opens
  useEffect(() => {
    if (
      location.pathname === "/admin/notifications"
    ) {
      fetchUnreadNotifications();
    }
  }, [
    location.pathname,
    fetchUnreadNotifications,
  ]);

  // Open settings
  const handleSettingsClick = useCallback(() => {
    closeSidebar();
    navigate("/admin/settings");
  }, [navigate, closeSidebar]);

  // Open Admin My Profile
  const handleProfileClick = useCallback(() => {
    closeSidebar();
    navigate("/admin/profile");
  }, [navigate, closeSidebar]);

  // Logout using backend session
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setNotificationCount(0);
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  return (
    <>
      <style>{`
        .admin-layout,
        .admin-layout * {
          box-sizing: border-box;
        }

        .admin-layout {
          --admin-bg: #f0f6fb;
          --admin-text: #19344d;

          display: flex;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: clip;
          background: var(--admin-bg);
          color: var(--admin-text);
          font-family: Inter, Arial, Helvetica, sans-serif;
        }

        :root[data-theme="dark"] .admin-layout {
          --admin-bg: #0b1220;
          --admin-text: #e2e8f0;
        }

        .admin-layout-main {
          display: flex;
          flex: 1 1 0%;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
          min-height: 100dvh;
          margin-left: 0;
          width: 100%;
          transition:
            margin-left .25s ease,
            width .25s ease;
          background: var(--admin-bg);
        }

        .admin-layout-main.sidebar-expanded {
          margin-left: 260px;
          width: calc(100% - 260px);
        }

        .admin-layout-main.sidebar-collapsed {
          margin-left: 0;
          width: 100%;
        }

        .admin-layout-content {
          flex: 1 0 auto;
          width: 100%;
          min-width: 0;
          padding: clamp(16px, 2vw, 28px);
          color: var(--admin-text);
        }

        .admin-layout-overlay {
          display: none;
        }

        @media (max-width: 900px) {
          .admin-layout-main,
          .admin-layout-main.sidebar-expanded,
          .admin-layout-main.sidebar-collapsed {
            width: 100%;
            margin-left: 0;
          }

          .admin-layout-content {
            padding: 20px 16px;
          }

          .admin-layout-overlay {
            position: fixed;
            inset: 0;
            z-index: 998;
            display: block;
            width: 100%;
            height: 100%;
            padding: 0;
            border: 0;
            background: rgba(7, 20, 36, .55);
            cursor: pointer;
          }

          .admin-layout-overlay[hidden] {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .admin-layout-content {
            padding: 14px 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-layout-main {
            transition: none;
          }
        }
      `}</style>

      <div className="admin-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        {sidebarOpen && (
          <button
            type="button"
            className="admin-layout-overlay"
            aria-label="Close navigation menu"
            onClick={closeSidebar}
          />
        )}

        <div
          className={`admin-layout-main ${
            sidebarOpen
              ? "sidebar-expanded"
              : "sidebar-collapsed"
          }`}
        >
          <Navbar
            onMenuClick={toggleSidebar}
            isSidebarOpen={sidebarOpen}
            user={currentUser}
            notificationCount={notificationCount}
            onNotificationClick={handleNotificationClick}
            onSettingsClick={handleSettingsClick}
            onProfileClick={handleProfileClick}
            onLogout={handleLogout}
            onSearch={handleSearch}
          />

          <main
            className="admin-layout-content"
            id="admin-main-content"
          >
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}

export default AdminLayout;
