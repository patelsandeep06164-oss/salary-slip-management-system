import api from "./api";

const departmentService = {
  // Get all departments
  async getAll(params = {}) {
    const response = await api.get("/departments", { params });
    return response.data;
  },

  // Get department by ID
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

  // Delete department
  async delete(id) {
    const response = await api.delete(
      `/departments/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  // Get employees belonging to a department
  async getEmployees(id, params = {}) {
    const response = await api.get(
      `/departments/${encodeURIComponent(id)}/employees`,
      { params }
    );
    return response.data;
  },
};

export default departmentService;