import axiosInstance from "../axios.config";
import { User } from "@/types/api.types";

export const userService = {
  getUsers: async (params?: { role?: string }) => {
    const response = await axiosInstance.get("/users", { params });
    return response.data;
  },

  getUserDetails: async (id: string) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (
    userData: Omit<User, "_id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post("/users", userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await axiosInstance.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },

  getUserEvents: async (userId: string) => {
    const response = await axiosInstance.get(`/users/${userId}/events`);
    return response.data;
  },

  getUserClubs: async (userId: string) => {
    const response = await axiosInstance.get(`/users/${userId}/clubs`);
    return response.data;
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await axiosInstance.put(`/users/${userId}/role`, { role });
    return response.data;
  },

  updateUserPassword: async (
    userId: string,
    passwordData: { current_password: string; new_password: string }
  ) => {
    const response = await axiosInstance.put(
      `/users/${userId}/password`,
      passwordData
    );
    return response.data;
  },

  getUserNotifications: async (userId: string) => {
    const response = await axiosInstance.get(`/users/${userId}/notifications`);
    return response.data;
  },

  markNotificationAsRead: async (userId: string, notificationId: string) => {
    const response = await axiosInstance.put(
      `/users/${userId}/notifications/${notificationId}/read`
    );
    return response.data;
  },

  deleteNotification: async (userId: string, notificationId: string) => {
    const response = await axiosInstance.delete(
      `/users/${userId}/notifications/${notificationId}`
    );
    return response.data;
  },
};
