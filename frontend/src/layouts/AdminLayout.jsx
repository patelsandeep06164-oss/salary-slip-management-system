
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

const DESKTOP_WIDTH = 900;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

// Safely read the logged-in user from localStorage
const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return null;

    const parsedUser = JSON.parse(storedUser);

    return parsedUser?.user || parsedUser;
  } catch (error) {
    console.error("Unable to read saved user:", error);
    return null;
  }
};

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth > DESKTOP_WIDTH
  );

  const [notificationCount, setNotificationCount] =
    useState(0);

  // Logged-in user state
  const [currentUser, setCurrentUser] = useState(
    readStoredUser
  );

  // Keep Navbar user information synchronized
  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(readStoredUser());
    };

    const handleProfileUpdated = (event) => {
      const updatedUser = event.detail;

      if (!updatedUser) {
        syncUser();
        return;
      }

      setCurrentUser((previousUser) => ({
        ...(previousUser || {}),
        ...updatedUser,
      }));
    };

    window.addEventListener(
      "profile-updated",
      handleProfileUpdated
    );

    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(
        "profile-updated",
        handleProfileUpdated
      );

      window.removeEventListener("storage", syncUser);
    };
  }, []);

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

  // Fetch unread notification count from backend
  const fetchUnreadNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setNotificationCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications?limit=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setNotificationCount(0);
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Notification request failed: ${response.status}`
        );
      }

      const data = await response.json();

      setNotificationCount(
        Math.max(0, Number(data.unreadCount) || 0)
      );
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error
      );
    }
  }, []);

  // Initial fetch, periodic refresh and notification updates
  useEffect(() => {
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
  }, [fetchUnreadNotifications]);

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

  // Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");

    setCurrentUser(null);
    setNotificationCount(0);

    navigate("/login", { replace: true });
  }, [navigate]);

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
