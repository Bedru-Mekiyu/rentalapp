import { create } from "zustand";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  init: () => {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        set({ user: JSON.parse(storedUser), loading: false });
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return;
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    if (refreshToken && storedUser) {
      axios
        .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        .then((res) => {
          const payload = res.data?.data || res.data;
          const { token: newToken, refreshToken: newRefresh } = payload || {};
          if (!newToken || !newRefresh) return;
          localStorage.setItem("token", newToken);
          localStorage.setItem("refreshToken", newRefresh);
          axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          set({ user: JSON.parse(storedUser) });
        })
        .catch(() => {
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        })
        .finally(() => set({ loading: false }));
      return;
    }

    set({ loading: false });
  },
  login: async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      const payload = res.data?.data || res.data;
      const { token, refreshToken, user } = payload || {};
      if (!token || !refreshToken || !user) {
        return { success: false, message: "Invalid login response" };
      }
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      set({ user });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  },
  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          refreshToken,
        });
      } catch {
        // ignore logout failures
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    set({ user: null });
  },
}));
