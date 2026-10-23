import api from "./api";

const leaveService = {
  // Get all leave records
  async getAll(params = {}) {
    const response = await api.get("/leaves", { params });
    return response.data;
  },

  // Get leave by ID
  async getById(id) {
    const response = await api.get(
      `/leaves/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  // Apply for leave
  async applyLeave(leaveData) {
    const response = await api.post("/leaves", leaveData);
    return response.data;
  },

  // Update leave request
  async update(id, leaveData) {
    const response = await api.put(
      `/leaves/${encodeURIComponent(id)}`,
      leaveData
    );
    return response.data;
  },

  // Cancel leave request
  async cancel(id) {
    const response = await api.patch(
      `/leaves/${encodeURIComponent(id)}/cancel`
    );
    return response.data;
  },

  // Approve leave request
  async approve(id, remarks = "") {
    const response = await api.patch(
      `/leaves/${encodeURIComponent(id)}/approve`,
      { remarks }
    );
    return response.data;
  },

  // Reject leave request
  async reject(id, remarks = "") {
    const response = await api.patch(
      `/leaves/${encodeURIComponent(id)}/reject`,
      { remarks }
    );
    return response.data;
  },

  // Delete leave request
  async delete(id) {
    const response = await api.delete(
      `/leaves/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  // Get logged-in employee's leave requests
  async getMyLeaves(params = {}) {
    const response = await api.get("/leaves/me", { params });
    return response.data;
  },

  // Get a specific employee's leave requests
  async getEmployeeLeaves(employeeId, params = {}) {
    const response = await api.get(
      `/leaves/employee/${encodeURIComponent(employeeId)}`,
      { params }
    );
    return response.data;
  },
};

export default leaveService;