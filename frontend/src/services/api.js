import axios from "axios";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  "https://salary-slip-backend-rjgj.onrender.com/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach login token to API requests.
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

// Handle API errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const isAuthRequest =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export function getApiError(
  error,
  fallback = "Something went wrong. Please try again."
) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return (
      data?.message ||
      "Your session has expired. Please log in again."
    );
  }

  if (status === 403) {
    return (
      data?.message ||
      "You are not authorized to perform this action."
    );
  }

  if (status === 404) {
    return data?.message || "Requested API endpoint was not found.";
  }

  if (status >= 500) {
    return (
      data?.message ||
      "Backend server error. Please try again later."
    );
  }

  if (error?.code === "ECONNABORTED") {
    return "Server response timed out. Please try again.";
  }

  if (!error?.response && error?.request) {
    return "Cannot reach the backend. Check the backend URL, CORS settings, and network connection.";
  }

  return (
    data?.message ||
    data?.error ||
    error?.message ||
    fallback
  );
}

export default api;
