import api from "./api";

const reportService = {
  // Dashboard report
  async getDashboard(params = {}) {
    const response = await api.get(
      "/reports/dashboard",
      { params }
    );
    return response.data;
  },

  // Employee report
  async getEmployeeReport(params = {}) {
    const response = await api.get(
      "/reports/employees",
      { params }
    );
    return response.data;
  },

  // Payroll report
  async getPayrollReport(params = {}) {
    const response = await api.get(
      "/reports/payroll",
      { params }
    );
    return response.data;
  },

  // Attendance report
  async getAttendanceReport(params = {}) {
    const response = await api.get(
      "/reports/attendance",
      { params }
    );
    return response.data;
  },

  // Leave report
  async getLeaveReport(params = {}) {
    const response = await api.get(
      "/reports/leaves",
      { params }
    );
    return response.data;
  },

  // Export employee report
  async exportEmployees(params = {}) {
    const response = await api.get(
      "/reports/employees/export",
      {
        params,
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Export payroll report
  async exportPayroll(params = {}) {
    const response = await api.get(
      "/reports/payroll/export",
      {
        params,
        responseType: "blob",
      }
    );
    return response.data;
  },

  // Export attendance report
  async exportAttendance(params = {}) {
    const response = await api.get(
      "/reports/attendance/export",
      {
        params,
        responseType: "blob",
      }
    );
    return response.data;
  },
};

export default reportService;