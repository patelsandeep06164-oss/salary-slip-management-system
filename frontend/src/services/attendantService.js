import api from "./api";

const attendanceService = {
  // Get all attendance records
  async getAll(params = {}) {
    const response = await api.get("/attendance", { params });
    return response.data;
  },

  // Get attendance record by ID
  async getById(id) {
    const response = await api.get(
      `/attendance/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  // Mark attendance manually
  async markAttendance(attendanceData) {
    const response = await api.post(
      "/attendance",
      attendanceData
    );
    return response.data;
  },

  // Employee check-in
  async checkIn(payload = {}) {
    const response = await api.post(
      "/attendance/check-in",
      payload
    );
    return response.data;
  },

  // Employee check-out
  async checkOut(payload = {}) {
    const response = await api.post(
      "/attendance/check-out",
      payload
    );
    return response.data;
  },

  // Update attendance record
  async update(id, attendanceData) {
    const response = await api.put(
      `/attendance/${encodeURIComponent(id)}`,
      attendanceData
    );
    return response.data;
  },

  // Delete attendance record
  async delete(id) {
    const response = await api.delete(
      `/attendance/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  // Get attendance reports
  async getReports(params = {}) {
    const response = await api.get(
      "/attendance/reports",
      { params }
    );
    return response.data;
  },

  // Get attendance records for a specific employee
  async getEmployeeAttendance(employeeId, params = {}) {
    const response = await api.get(
      `/attendance/employee/${encodeURIComponent(employeeId)}`,
      { params }
    );
    return response.data;
  },

  // Get logged-in employee's attendance
  async getMyAttendance(params = {}) {
    const response = await api.get(
      "/attendance/me",
      { params }
    );
    return response.data;
  },
};

export default attendanceService;