
import api from "./api";

const payrollService = {
  // Fetch payroll records
  async getAll(params = {}) {
    const response = await api.get("/payroll", { params });
    return response.data;
  },

  // Fetch a single payroll record
  async getById(id) {
    const response = await api.get(
      `/payroll/${encodeURIComponent(id)}`
    );
    return response.data;
  },

  // Generate payroll
  async generate(payrollData) {
    const response = await api.post(
      "/payroll/generate",
      payrollData
    );
    return response.data;
  },

  // Fetch payroll history
  async getHistory(params = {}) {
    const response = await api.get("/payroll", { params });
    return response.data;
  },

  // Fetch payroll for a specific employee
  async getEmployeePayroll(employeeId, params = {}) {
    const response = await api.get("/payroll", {
      params: {
        ...params,
        employee: employeeId,
      },
    });
    return response.data;
  },

  // Fetch logged-in employee's payroll
  async getMyPayroll(params = {}) {
    const response = await api.get("/payroll", { params });
    return response.data;
  },

  // Mark payroll as paid
  async markAsPaid(id, paymentData = {}) {
    const response = await api.patch(
      `/payroll/${encodeURIComponent(id)}/status`,
      {
        ...paymentData,
        status: "paid",
      }
    );
    return response.data;
  },

  // Approve/process payroll
  async approve(id, remarks = "") {
    const response = await api.patch(
      `/payroll/${encodeURIComponent(id)}/status`,
      {
        status: "processed",
        remarks,
      }
    );
    return response.data;
  },
};

export default payrollService;
