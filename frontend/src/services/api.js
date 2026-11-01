
import axios from "axios";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// CSRF token cache (not an authentication token).
let csrfToken = null;
let csrfTokenPromise = null;

// Fetch CSRF token from backend.
export const refreshCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = api
      .get("/auth/csrf-token")
      .then((response) => {
        const token = response?.data?.csrfToken;

        if (!token) {
          throw new Error("Unable to obtain CSRF token.");
        }

        csrfToken = token;
        return token;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
};

// Attach CSRF token to state-changing requests.
api.interceptors.request.use(
  async (config) => {
    const method = (config.method || "get").toLowerCase();

    const safeMethods = ["get", "head", "options"];

    if (!safeMethods.includes(method)) {
      const token = csrfToken || await refreshCsrfToken();

      config.headers = config.headers || {};
      config.headers["x-csrf-token"] = token;
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
    const message = error?.response?.data?.message || "";

    // Allow the next request to fetch a fresh CSRF token.
    if (
      status === 403 &&
      /csrf|origin/i.test(message)
    ) {
      csrfToken = null;
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
