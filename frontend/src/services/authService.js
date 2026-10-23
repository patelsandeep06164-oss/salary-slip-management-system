import api from "./api";

const authService = {
  // Login
  async login(credentials) {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    const data = response.data || {};
    const user = data.user || data.data?.user;
    const token =
      data.token ||
      data.accessToken ||
      data.data?.token ||
      data.data?.accessToken;

    if (token) {
      localStorage.setItem("token", token);
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    return data;
  },

  // Get current logged-in user
  async getCurrentUser() {
    const response = await api.get("/auth/me");
    const data = response.data || {};
    const user = data.user || data.data?.user;

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    return data;
  },

  // Logout
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Read stored user safely
  getStoredUser() {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Check whether a token exists
  isAuthenticated() {
    return Boolean(localStorage.getItem("token"));
  },

  // Forgot password
  async forgotPassword(email) {
    const payload =
      typeof email === "string" ? { email } : email;

    const response = await api.post(
      "/auth/forgot-password",
      payload
    );

    return response.data;
  },

  // Reset password
  async resetPassword(payload) {
    const response = await api.post(
      "/auth/reset-password",
      payload
    );

    return response.data;
  },

  // Change password for logged-in user
  async changePassword(payload) {
    const response = await api.patch(
      "/auth/change-password",
      payload
    );

    return response.data;
  },
};

export default authService;