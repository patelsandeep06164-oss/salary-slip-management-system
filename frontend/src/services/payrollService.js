
import api from "./api";

const payrollService = {
  // Fetch payroll records with optional filters.
  async getAll(params = {}) {
    const response = await api.get("/payroll", { params });
    return response.data;
  },

  // Fetch a single payroll record by ID.
  async getById(id) {
    if (!id) {
      throw new Error("Payroll ID is required.");
    }

    const response = await api.get(
      `/payroll/${encodeURIComponent(id)}`
    );

    return response.data;
  },

  // Generate payroll for an employee.
  async generate(payrollData = {}) {
    if (!payrollData.employeeId) {
      throw new Error("Please select an employee.");
    }

    if (
      !payrollData.month ||
      !payrollData.year
    ) {
      throw new Error("Payroll month and year are required.");
    }

    const response = await api.post(
      "/payroll/generate",
      payrollData
    );

    return response.data;
  },

  // Fetch payroll history.
  async getHistory(params = {}) {
    const response = await api.get("/payroll", { params });
    return response.data;
  },

  // Fetch payroll records for a specific employee.
  async getEmployeePayroll(employeeId, params = {}) {
    if (!employeeId) {
      throw new Error("Employee ID is required.");
    }

    const response = await api.get("/payroll", {
      params: {
        ...params,
        employee: employeeId,
      },
    });

    return response.data;
  },

  // Fetch payroll records for the logged-in employee.
  // The backend must enforce employee-level access restrictions.
  async getMyPayroll(params = {}) {
    const response = await api.get("/payroll", { params });
    return response.data;
  },

  // Mark a processed payroll as paid.
  async markAsPaid(id, paymentData = {}) {
    if (!id) {
      throw new Error("Payroll ID is required.");
    }

    const response = await api.patch(
      `/payroll/${encodeURIComponent(id)}/status`,
      {
        ...paymentData,
        status: "paid",
      }
    );

    return response.data;
  },

  // Approve/process a draft payroll.
  async approve(id, remarks = "") {
    if (!id) {
      throw new Error("Payroll ID is required.");
    }

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
