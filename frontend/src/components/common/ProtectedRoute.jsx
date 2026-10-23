import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "./Loader";

function ProtectedRoute({
  children,
  isAuthenticated,
  user,
  loading = false,
  redirectTo = "/login",
}) {
  const location = useLocation();

  // Check authentication status.
  // Explicit boolean takes priority over the user object.
  const authenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean(user);

  // Show loader while authentication is being checked.
  if (loading) {
    return (
      <Loader
        fullScreen
        text="Checking your login..."
        size="large"
      />
    );
  }

  // Redirect unauthenticated users to login.
  // Preserve the requested URL so it can be restored after login.
  if (!authenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Allow authenticated users to access the protected page.
  return children;
}

export default ProtectedRoute;
