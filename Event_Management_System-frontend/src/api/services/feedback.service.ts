import axiosInstance from "../axios.config";

export const feedbackService = {
  getAllFeedbacks: async () => {
    const response = await axiosInstance.get("/events/feedbacks/all");
    return response.data;
  },

  deleteFeedback: async (id: string) => {
    const response = await axiosInstance.delete(`/events/feedbacks/${id}`);
    return response.data;
  },
};
