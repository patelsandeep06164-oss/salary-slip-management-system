
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Authentication Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
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
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={<AdminRoutes />}
      />

      {/* Employee */}
      <Route
        path="/employee/*"
        element={<EmployeeRoutes />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
