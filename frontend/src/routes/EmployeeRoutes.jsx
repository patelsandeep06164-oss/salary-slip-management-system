
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import EmployeeLayout from "../layouts/EmployeeLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Employee Dashboard
import EmployeeDashboard from "../pages/employee/EmployeeDashboard";

// Employee Profile
import MyProfile from "../pages/employee/MyProfile";
import ChangePassword from "../pages/employee/ChangePassword";

// Employee Attendance
import EmployeeAttendance from "../pages/employee/EmployeeAttendance";

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
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRole="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={<EmployeeDashboard />}
        />

        <Route
          path="profile"
          element={<MyProfile />}
        />

        <Route
          path="change-password"
          element={<ChangePassword />}
        />

        {/* Employee Attendance */}
        <Route
          path="attendance"
          element={<EmployeeAttendance />}
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

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default EmployeeRoutes;
