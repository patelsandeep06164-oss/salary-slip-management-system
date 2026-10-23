import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
  adapter: "xhr",
});

// Attach authentication token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API responses and authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = error?.config?.url || "";

      // Do not clear the session for login/password recovery failures.
      const isAuthRequest =
        url.includes("/auth/login") ||
        url.includes("/auth/forgot-password") ||
        url.includes("/auth/reset-password");

      if (!isAuthRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    return Promise.reject(error);
  }
);

export function getApiError(
  error,
  fallback = "Something went wrong. Please try again."
) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.code === "ECONNABORTED") {
    return "Server response timed out. Please try again.";
  }

  if (!error?.response && error?.request) {
    return "Unable to connect to the server. Check that the backend is running.";
  }

  return error?.message || fallback;
}

export default api;