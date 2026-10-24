
import api from "./api";

const attendanceService = {
  // Get attendance records from MongoDB
  async getAll(params = {}) {
    const response = await api.get("/attendance", { params });
    return response.data;
  },

  // Mark attendance manually
  async markAttendance(attendanceData) {
    const response = await api.post("/attendance", attendanceData);
    return response.data;
  },

  // Employee check-in
  async checkIn(payload = {}) {
    const response = await api.post("/attendance/check-in", payload);
    return response.data;
  },

  // Employee check-out
  async checkOut(payload = {}) {
    const response = await api.patch("/attendance/check-out", payload);
    return response.data;
  },

  // Get monthly attendance summary
  async getMonthlySummary(params = {}) {
    const response = await api.get("/attendance/summary", { params });
    return response.data;
  },
};

export default attendanceService;
