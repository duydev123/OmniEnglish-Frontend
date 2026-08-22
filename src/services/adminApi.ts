import axiosClient from "../configs/axios";
import type { ContentSet } from "../pages/admin/AdminCMSPage";

export interface AdminCMSStats {
  totalVocabItems: number;
  publishedSets: number;
  draftsPending: number;
}

export const adminApi = {
  async getContentSets(): Promise<ContentSet[]> {
    const response = await axiosClient.get<ContentSet[]>("/admin/cms/content-sets");
    return response.data;
  },

  async createContentSet(payload: {
    title: string;
    category: string;
    itemsCount: number;
    status: string;
    type: string;
  }): Promise<ContentSet> {
    const response = await axiosClient.post<ContentSet>("/admin/cms/content-sets", payload);
    return response.data;
  },

  async updateContentSet(
    setId: string,
    payload: {
      title?: string;
      category?: string;
      badge?: string;
      itemsCount?: number;
      status?: string;
    }
  ): Promise<ContentSet> {
    const response = await axiosClient.put<ContentSet>(`/admin/cms/content-sets/${setId}`, payload);
    return response.data;
  },

  async deleteContentSet(setId: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<{ message: string }>(`/admin/cms/content-sets/${setId}`);
    return response.data;
  },

  async getStats(): Promise<AdminCMSStats> {
    const response = await axiosClient.get<AdminCMSStats>("/admin/cms/stats");
    return response.data;
  },

  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    proficiency?: string;
  }): Promise<any[]> {
    const response = await axiosClient.get<any[]>("/admin/users", { params });
    return response.data;
  },

  async createUser(payload: {
    username: string;
    email: string;
    password?: string;
    role?: string;
    proficiency_level?: string;
    status?: string;
  }): Promise<any> {
    const response = await axiosClient.post<any>("/admin/users", payload);
    return response.data;
  },

  async updateUser(
    userId: string,
    payload: {
      username?: string;
      email?: string;
      role?: string;
      proficiency_level?: string;
      status?: string;
    }
  ): Promise<any> {
    const response = await axiosClient.put<any>(`/admin/users/${userId}`, payload);
    return response.data;
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<{ message: string }>(`/admin/users/${userId}`);
    return response.data;
  },
};
