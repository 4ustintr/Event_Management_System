import axiosInstance from "../axios.config";
import { User } from "@/types/api.types";

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    console.log(
      "Attempting login to:",
      `${axiosInstance.defaults.baseURL}/auth/login`
    );
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      console.log("Login response:", response.data);
      const { token, user: userData } = response.data.data;
      localStorage.setItem("token", token);
      return response;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData: Partial<User>) => {
    console.log(
      "Attempting registration to:",
      `${axiosInstance.defaults.baseURL}/auth/register`
    );
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      console.log("Registration response:", response.data);
      return response;
    } catch (error: any) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getCurrentUser: async () => {
    console.log(
      "Fetching current user from:",
      `${axiosInstance.defaults.baseURL}/auth/me`
    );
    try {
      const response = await axiosInstance.get("/auth/me");
      console.log("Current user response:", response.data);
      return response;
    } catch (error: any) {
      console.error(
        "Get current user error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  logout: async () => {
    console.log(
      "Attempting logout to:",
      `${axiosInstance.defaults.baseURL}/auth/logout`
    );
    try {
      const response = await axiosInstance.post("/auth/logout");
      console.log("Logout response:", response.data);
      return response;
    } catch (error: any) {
      console.error("Logout error:", error.response?.data || error.message);
      throw error;
    }
  },
};
