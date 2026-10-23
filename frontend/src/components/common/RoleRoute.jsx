import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "./Loader";

function RoleRoute({
  children,
  user,
  isAuthenticated,
  allowedRoles = [],
  loading = false,
  redirectTo = "/login",
  unauthorizedTo = "/unauthorized",
}) {
  const location = useLocation();

  // Determine authentication status.
  const authenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean(user);

  // Wait until authentication is verified.
  if (loading) {
    return (
      <Loader
        fullScreen
        text="Verifying access..."
        size="large"
      />
    );
  }

  // Redirect users who are not logged in.
  if (!authenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location }}
      />
    );
  }

  // Read the current user's role safely.
  const userRole = String(
    user?.role || user?.user?.role || ""
  )
    .trim()
    .toLowerCase();

  // Normalize the allowed roles.
  const permittedRoles = Array.isArray(allowedRoles)
    ? allowedRoles
        .filter((role) => role !== null && role !== undefined)
        .map((role) => String(role).trim().toLowerCase())
        .filter(Boolean)
    : [];

  // Block access when the user's role is not permitted.
  if (
    permittedRoles.length > 0 &&
    !permittedRoles.includes(userRole)
  ) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return children;
}

export default RoleRoute;
