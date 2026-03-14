import axios from "axios";

const PRODUCTION_API_BASE_URL =
  "/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : PRODUCTION_API_BASE_URL);

const API = axios.create({
  baseURL: API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let refreshQueue = [];

// Automatically add token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (optional: auto logout)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refreshToken");

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest?._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return refreshClient
        .post("/auth/refresh", { refreshToken })
        .then((res) => {
          const payload = res.data?.data || res.data;
          const { token: newToken, refreshToken: newRefresh } = payload || {};
          if (!newToken || !newRefresh) {
            throw new Error("Refresh failed");
          }
          localStorage.setItem("token", newToken);
          localStorage.setItem("refreshToken", newRefresh);
          API.defaults.headers.Authorization = `Bearer ${newToken}`;

          refreshQueue.forEach((p) => p.resolve(newToken));
          refreshQueue = [];

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        })
        .catch((err) => {
          refreshQueue.forEach((p) => p.reject(err));
          refreshQueue = [];
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(err);
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;