import axiosInstance from "../axios.config";

export const dashboardService = {
  getStatistics: async () => {
    const response = await axiosInstance.get("/dashboard/statistics");
    return response.data;
  },

  getUpcomingEvents: async () => {
    const response = await axiosInstance.get("/dashboard/upcoming-events");
    return response.data;
  },

  getRecentRegistrations: async () => {
    const response = await axiosInstance.get("/dashboard/recent-registrations");
    return response.data;
  },

  getRecentFeedback: async () => {
    const response = await axiosInstance.get("/dashboard/recent-feedback");
    return response.data;
  },
};
