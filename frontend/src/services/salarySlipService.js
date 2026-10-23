
import api from "./api";

const salarySlipService = {
  // Fetch salary slips from the backend
  async getAll(params = {}) {
    const response = await api.get("/salary-slips", {
      params,
    });

    return response.data;
  },

  // Fetch one salary slip by ID
  async getById(id) {
    const response = await api.get(
      `/salary-slips/${encodeURIComponent(id)}`
    );

    return response.data;
  },

  // Generate a salary slip for a payroll record
  async generate(data) {
    const response = await api.post("/salary-slips/generate", data);

    return response.data;
  },

  // Email a salary slip
 async email(id) {
  const response = await api.post(
    `/salary-slips/email/${encodeURIComponent(id)}`
  );

  return response.data;
},

  // Download salary slip PDF
  async downloadPdf(id) {
    const response = await api.get(
      `/salary-slips/${encodeURIComponent(id)}/download`,
      {
        responseType: "blob",
      }
    );

    return response;
  },

  // Generate and email salary slips for a month
  async generateAndEmailMonthly(month, year) {
    const response = await api.post(
      "/salary-slips/generate-and-email-monthly",
      {
        month,
        year,
      }
    );

    return response.data;
  },
};

export default salarySlipService;
