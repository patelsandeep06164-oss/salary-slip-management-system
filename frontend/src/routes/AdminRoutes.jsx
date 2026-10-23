
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";

// Dashboard
import Dashboard from "../pages/admin/Dashboard";

// Admin Profile
import MyProfile from "../pages/admin/MyProfile";

// Global Search
import SearchResults from "../pages/admin/SearchResults";

// Employee Management
import Employees from "../pages/admin/Employees";
import AddEmployee from "../pages/admin/AddEmployee";
import EditEmployee from "../pages/admin/EditEmployee";
import Departments from "../pages/admin/Departments";

// Attendance Management
import AttendanceList from "../pages/attendance/AttendanceList";
import MarkAttendance from "../pages/attendance/MarkAttendance";
import AttendanceReports from "../pages/attendance/AttendanceReports";

// Leave Management
import LeaveRequests from "../pages/leave/LeaveRequests";

// Payroll Management
import GeneratePayroll from "../pages/payroll/GeneratePayroll";
import PayrollHistory from "../pages/payroll/PayrollHistory";
import PayrollDetails from "../pages/payroll/PayrollDetails";

// Salary Slips
import SalarySlipList from "../pages/salary-slips/SalarySlipList";
import SalarySlipDetails from "../pages/salary-slips/SalarySlipDetails";
import SalaryHistory from "../pages/salary-slips/SalaryHistory";

// Reports
import PayrollReports from "../pages/reports/PayrollReports";
import EmployeeReports from "../pages/reports/EmployeeReports";

// Settings
import CompanySettings from "../pages/settings/CompanySettings";
import EmailSettings from "../pages/settings/EmailSettings";
import PayrollSettings from "../pages/settings/PayrollSettings";

// Notifications
import Notifications from "../pages/admin/Notifications";

// Not Found
import NotFound from "../pages/NotFound";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Default Admin Page */}
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin Profile */}
        <Route path="profile" element={<MyProfile />} />

        {/* Global Search */}
        <Route path="search" element={<SearchResults />} />

        {/* Employee Management */}
        <Route path="employees" element={<Employees />} />

        <Route
          path="employees/add"
          element={<AddEmployee />}
        />

        <Route
          path="employees/edit/:id"
          element={<EditEmployee />}
        />

        <Route
          path="departments"
          element={<Departments />}
        />

        {/* Attendance Management */}
        <Route
          path="attendance"
          element={<AttendanceList />}
        />

        <Route
          path="attendance/mark"
          element={<MarkAttendance />}
        />

        <Route
          path="attendance/reports"
          element={<AttendanceReports />}
        />

        {/* Leave Management */}
        <Route
          path="leaves"
          element={<LeaveRequests />}
        />

        {/* Payroll Management */}
        <Route
          path="payroll"
          element={
            <Navigate
              to="/admin/payroll/generate"
              replace
            />
          }
        />

        <Route
          path="payroll/generate"
          element={<GeneratePayroll />}
        />

        <Route
          path="payroll/history"
          element={<PayrollHistory />}
        />

        <Route
          path="payroll/details/:id"
          element={<PayrollDetails />}
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

        <Route
          path="salary-history"
          element={<SalaryHistory />}
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <Navigate
              to="/admin/reports/payroll"
              replace
            />
          }
        />

        <Route
          path="reports/payroll"
          element={<PayrollReports />}
        />

        <Route
          path="reports/employees"
          element={<EmployeeReports />}
        />

        {/* Settings */}
        <Route
          path="settings"
          element={
            <Navigate
              to="/admin/settings/company"
              replace
            />
          }
        />

        <Route
          path="settings/company"
          element={<CompanySettings />}
        />

        <Route
          path="settings/email"
          element={<EmailSettings />}
        />

        <Route
          path="settings/payroll"
          element={<PayrollSettings />}
        />

        {/* Notifications */}
        <Route
          path="notifications"
          element={<Notifications />}
        />

        {/* Unknown Admin URL */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;
