import axiosInstance from "../axios.config";
import { Event } from "@/types/api.types";

export const eventService = {
  getEvents: async () => {
    const response = await axiosInstance.get("/events");
    return response.data;
  },

  getEventDetails: async (id: string) => {
    const response = await axiosInstance.get(`/events/${id}`);
    return response.data.data;
  },

  createEvent: async (
    eventData: Omit<Event, "_id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post("/events", eventData);
    return response.data.data;
  },

  updateEvent: async (id: string, data: any) => {
    const response = await axiosInstance.put(`/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    const response = await axiosInstance.delete(`/events/${id}`);
    return response.data.data;
  },

  approveEvent: async (id: string) => {
    const response = await axiosInstance.post(`/events/${id}/approve`, {
      status: "approved",
      reason: "Đã được duyệt bởi admin",
    });
    return response.data;
  },

  registerForEvent: async (id: string) => {
    const response = await axiosInstance.post(`/events/${id}/register`);
    return response.data;
  },

  checkinEvent: async (eventId: string) => {
    const response = await axiosInstance.post(`/events/checkin`, { eventId });
    return response.data;
  },

  submitFeedback: async (
    eventId: string,
    data: { rating: number; comment: string }
  ) => {
    const response = await axiosInstance.post(
      `/events/${eventId}/feedback`,
      data
    );
    return response.data;
  },

  getMyEventHistory: async () => {
    const response = await axiosInstance.get("/events/my-history");
    return response.data;
  },

  sendNotification: async (eventId: string, notificationData: any) => {
    const response = await axiosInstance.post(`/notifications/send-event`, {
      event_id: eventId,
      ...notificationData,
    });
    return response.data;
  },

  getClubEvents: async (clubId: string) => {
    const response = await axiosInstance.get(`/clubs/${clubId}/events`);
    return response.data;
  },

  cancelEventRegistration: async (eventId: string) => {
    const response = await axiosInstance.delete(`/events/${eventId}/register`);
    return response.data;
  },

  uploadBanner: async (formData: FormData) => {
    const response = await axiosInstance.post("/upload/banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
