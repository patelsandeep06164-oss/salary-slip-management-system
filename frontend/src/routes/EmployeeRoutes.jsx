import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import EmployeeLayout from "../layouts/EmployeeLayout";

// Employee Dashboard
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";

// Employee Profile
import MyProfile from "../pages/employee/MyProfile";
import ChangePassword from "../pages/employee/ChangePassword";

// Leave Management
import ApplyLeave from "../pages/leave/ApplyLeave";
import MyLeaves from "../pages/leave/MyLeaves";

// Salary Slips
import SalarySlipList from "../pages/salary-slips/SalarySlipList";
import SalarySlipDetails from "../pages/salary-slips/SalarySlipDetails";
import SalaryHistory from "../pages/salary-slips/SalaryHistory";

// Not Found
import NotFound from "../pages/NotFound";

function EmployeeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<EmployeeLayout />}>
        {/* Default Employee Page */}
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={<EmployeeDashboard />}
        />

        {/* Profile */}
        <Route path="profile" element={<MyProfile />} />

        <Route
          path="change-password"
          element={<ChangePassword />}
        />

        {/* Leave Management */}
        <Route
          path="leaves"
          element={<Navigate to="leaves/my-leaves" replace />}
        />

        <Route
          path="leaves/apply"
          element={<ApplyLeave />}
        />

        <Route
          path="leaves/my-leaves"
          element={<MyLeaves />}
        />

        {/* Salary Slips */}
        <Route
          path="salary-slips"
          element={<SalarySlipList />}
        />

        <Route
          path="salary-slips/details/:id"
          element={<SalarySlipDetails />}
        />

        {/* Salary History */}
        <Route
          path="salary-history"
          element={<SalaryHistory />}
        />

        {/* Unknown Employee URL */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default EmployeeRoutes;