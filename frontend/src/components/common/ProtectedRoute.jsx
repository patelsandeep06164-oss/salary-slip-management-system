import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import Loader from "./Loader";
import { useAuth } from "../../hooks/useAuth";

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  // Wait until backend session verification is complete.
  if (loading) {
    return (
      <Loader
        fullScreen
        text="Checking your login..."
        size="large"
      />
    );
  }

  // User must be authenticated.
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Only Admin and Employee roles are allowed.
  const currentRole = String(role || "")
    .trim()
    .toLowerCase();

  if (!["admin", "employee"].includes(currentRole)) {
    return <Navigate to="/login" replace />;
  }

  // Prevent one role from accessing another role's pages.
  if (currentRole !== allowedRole) {
    const correctDashboard =
      currentRole === "admin"
        ? "/admin/dashboard"
        : "/employee/dashboard";

    return (
      <Navigate
        to={correctDashboard}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;