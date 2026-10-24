import api from "./api";

const departmentService = {
  // Get departments from MongoDB backend
  async getAll(params = {}) {
    const response = await api.get("/departments", { params });

    return response.data;
  },

  // Get one department
  async getById(id) {
    const response = await api.get(
      `/departments/${encodeURIComponent(id)}`
    );

    return response.data;
  },

  // Create department
  async create(departmentData) {
    const response = await api.post(
      "/departments",
      departmentData
    );

    return response.data;
  },

  // Update department
  async update(id, departmentData) {
    const response = await api.put(
      `/departments/${encodeURIComponent(id)}`,
      departmentData
    );

    return response.data;
  },

  // Deactivate department using existing backend route
  async deactivate(id) {
    const response = await api.patch(
      `/departments/${encodeURIComponent(id)}/deactivate`
    );

    return response.data;
  },

  // Reactivate department
  async reactivate(id) {
    const response = await api.put(
      `/departments/${encodeURIComponent(id)}`,
      { isActive: true }
    );

    return response.data;
  },
};

export default departmentService;