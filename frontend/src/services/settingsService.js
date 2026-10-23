import api from "./api";

const settingsService = {
  // ------------------------------
  // Company Settings
  // ------------------------------

  async getCompanySettings() {
    const response = await api.get("/settings/company");
    return response.data;
  },

  async updateCompanySettings(settings) {
    const response = await api.put(
      "/settings/company",
      settings
    );
    return response.data;
  },

  // ------------------------------
  // Email Settings
  // ------------------------------

  async getEmailSettings() {
    const response = await api.get("/settings/email");
    return response.data;
  },

  async updateEmailSettings(settings) {
    const response = await api.put(
      "/settings/email",
      settings
    );
    return response.data;
  },

  async testEmail(payload) {
    const response = await api.post(
      "/settings/email/test",
      payload
    );
    return response.data;
  },

  // ------------------------------
  // Payroll Settings
  // ------------------------------

  async getPayrollSettings() {
    const response = await api.get("/settings/payroll");
    return response.data;
  },

  async updatePayrollSettings(settings) {
    const response = await api.put(
      "/settings/payroll",
      settings
    );
    return response.data;
  },

  // ------------------------------
  // General Settings
  // ------------------------------

  async getAll() {
    const response = await api.get("/settings");
    return response.data;
  },

  async updateAll(settings) {
    const response = await api.put(
      "/settings",
      settings
    );
    return response.data;
  },
};

export default settingsService;