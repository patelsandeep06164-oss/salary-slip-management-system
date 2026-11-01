
import api from "./api";

// User information remains in memory only.
// Authentication session is maintained by the HttpOnly cookie.
let currentUser = null;

const authService = {
  // ==========================================
  // REGISTRATION - SEND EMAIL OTP
  // ==========================================
  async sendRegistrationOtp(payload) {
    const response = await api.post(
      "/auth/registration/send-otp",
      payload
    );

    return response.data || {};
  },

  // ==========================================
  // REGISTRATION - VERIFY EMAIL OTP
  // ==========================================
  async verifyRegistrationOtp(payload) {
    const response = await api.post(
      "/auth/registration/verify-otp",
      payload
    );

    return response.data || {};
  },

  // ==========================================
  // REGISTRATION - COMPLETE REGISTRATION
  // ==========================================
  async register(payload) {
    const response = await api.post(
      "/auth/register",
      payload
    );

    return response.data || {};
  },

  // ==========================================
  // LOGIN
  // ==========================================
  async login(credentials) {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    const data = response.data || {};
    const user = data.user || data.data?.user;

    if (user) {
      currentUser = user;
    }

    return data;
  },

  // ==========================================
  // ADMIN LOGIN OTP
  // ==========================================
  async verifyAdminLoginOtp(payload) {
    const response = await api.post(
      "/auth/admin-login/verify-otp",
      payload
    );

    const data = response.data || {};
    const user = data.user || data.data?.user;

    if (user) {
      currentUser = user;
    }

    return data;
  },

  // ==========================================
  // CURRENT USER
  // ==========================================
  async getCurrentUser() {
    const response = await api.get("/auth/me");

    const data = response.data || {};
    const user = data.user || data.data?.user;

    if (user) {
      currentUser = user;
    }

    return data;
  },

  // ==========================================
  // LOGOUT
  // ==========================================
  async logout() {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } finally {
      currentUser = null;
    }
  },

  getStoredUser() {
    return currentUser;
  },

  isAuthenticated() {
    return Boolean(currentUser);
  },

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================
  async forgotPassword(email) {
    const payload =
      typeof email === "string" ? { email } : email;

    const response = await api.post(
      "/auth/forgot-password",
      payload
    );

    return response.data || {};
  },

  // ==========================================
  // VERIFY PASSWORD RESET OTP
  // ==========================================
  async verifyPasswordResetOtp(payload) {
    const response = await api.post(
      "/auth/verify-password-reset-otp",
      payload
    );

    return response.data || {};
  },

  // ==========================================
  // RESET PASSWORD
  // ==========================================
  async resetPassword(payload) {
    const response = await api.post(
      "/auth/reset-password",
      payload
    );

    return response.data || {};
  },

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================
  async changePassword(payload) {
    const response = await api.patch(
      "/auth/change-password",
      payload
    );

    return response.data || {};
  },
};

export default authService;
