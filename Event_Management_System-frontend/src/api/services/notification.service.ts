import axiosInstance from "../axios.config";
import { Notification } from "@/types/api.types";

export const notificationService = {
  // Lấy danh sách thông báo
  getNotifications: async () => {
    const response = await axiosInstance.get("/notifications");
    return response.data.data;
  },

  // Lấy thông báo của user hiện tại
  getMyNotifications: async () => {
    const response = await axiosInstance.get("/notifications/my-notifications");
    return response.data.data;
  },

  // Lấy tất cả thông báo cho sinh viên
  getAllNotificationsForStudents: async (page = 1, limit = 10) => {
    const response = await axiosInstance.get(
      "/notifications/student-notifications",
      {
        params: { page, limit },
      }
    );
    return response.data.data;
  },

  // Gửi thông báo cho một sự kiện cụ thể
  sendEventNotification: async (
    eventId: string,
    notificationData: {
      title: string;
      message: string;
      type?: "update" | "announcement" | "reminder";
    }
  ) => {
    const response = await axiosInstance.post(`/notifications/send-event`, {
      event_id: eventId,
      ...notificationData,
      type: notificationData.type || "update",
    });
    return response.data.data;
  },

  createNotification: async (
    notificationData: Omit<Notification, "id" | "read" | "sent_at">
  ) => {
    const response = await axiosInstance.post(
      "/notifications",
      notificationData
    );
    return response.data.data;
  },

  deleteNotification: async (id: string) => {
    const response = await axiosInstance.delete(`/notifications/${id}`);
    return response.data.data;
  },

  sendNotificationToAllStudents: async (title: string, message: string) => {
    const response = await axiosInstance.post("/notifications", {
      title,
      message,
      type: "announcement",
      recipients: "all_students",
    });
    return response.data.data;
  },

  sendEventDeletionNotification: async (
    eventId: string,
    eventTitle: string
  ) => {
    const response = await axiosInstance.post("/notifications/send-event", {
      event_id: eventId,
      title: "Sự kiện đã bị xóa",
      message: `Sự kiện "${eventTitle}" đã bị xóa bởi CLB.`,
      type: "event_deletion",
    });
    return response.data.data;
  },

  sendEventReminder: async (eventId: string, message: string) => {
    const response = await axiosInstance.post("/notifications/reminder", {
      event_id: eventId,
      message,
    });
    return response.data.data;
  },
};
