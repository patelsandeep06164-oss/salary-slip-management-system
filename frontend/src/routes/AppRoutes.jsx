import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Authentication
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// Role Routes
import AdminRoutes from "./AdminRoutes";
import EmployeeRoutes from "./EmployeeRoutes";

// Not Found
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Default Page */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Authentication Pages */}
      <Route path="/login" element={<Login />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Admin Pages */}
      <Route
        path="/admin/*"
        element={<AdminRoutes />}
      />

      {/* Employee Pages */}
      <Route
        path="/employee/*"
        element={<EmployeeRoutes />}
      />

      {/* Page Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;