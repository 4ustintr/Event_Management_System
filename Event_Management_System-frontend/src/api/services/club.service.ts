import axiosInstance from "../axios.config";
import { Club } from "@/types/api.types";

export const clubService = {
  getClubs: async () => {
    const response = await axiosInstance.get("/clubs");
    return response.data;
  },

  getClubDetails: async (id: string) => {
    const response = await axiosInstance.get(`/clubs/${id}`);
    return response.data;
  },

  createClub: async (
    clubData: Omit<Club, "_id" | "created_at" | "updated_at">
  ) => {
    const response = await axiosInstance.post("/clubs", clubData);
    return response.data;
  },

  updateClub: async (id: string, clubData: Partial<Club>) => {
    const response = await axiosInstance.put(`/clubs/${id}`, clubData);
    return response.data;
  },

  deleteClub: async (id: string) => {
    const response = await axiosInstance.delete(`/clubs/${id}`);
    return response.data;
  },

  getClubEvents: async (clubId: string) => {
    const response = await axiosInstance.get(`/clubs/${clubId}/events`);
    return response.data;
  },

  getClubMembers: async (clubId: string) => {
    const response = await axiosInstance.get(`/clubs/${clubId}/members`);
    return response.data;
  },

  addClubMember: async (
    clubId: string,
    memberData: { user_id: string; role_in_club: string }
  ) => {
    const response = await axiosInstance.post(
      `/clubs/${clubId}/members`,
      memberData
    );
    return response.data;
  },

  removeClubMember: async (clubId: string, userId: string) => {
    const response = await axiosInstance.delete(
      `/clubs/${clubId}/members/${userId}`
    );
    return response.data;
  },

  updateMemberRole: async (clubId: string, userId: string, role: string) => {
    const response = await axiosInstance.put(
      `/clubs/${clubId}/members/${userId}`,
      { role_in_club: role }
    );
    return response.data;
  },
};
