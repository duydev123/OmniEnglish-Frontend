import axiosClient from "../configs/axios"

export interface ReadingPassageItem {
  id: string
  title: string
  image_url?: string
  total_questions: number
  time_limit_minutes: number
  difficulty?: string
}

export interface ListeningPassageItem {
  id: string
  title: string
  unit_code?: string
  total_questions: number
  time_limit_minutes: number
}

export const practiceApi = {
  getReadingPassages: async (page = 1, limit = 10): Promise<ReadingPassageItem[]> => {
    try {
      const response = await axiosClient.get(`/reading/passages?page=${page}&limit=${limit}`)
      return response.data || []
    } catch (error) {
      console.error("Error fetching reading passages:", error)
      return []
    }
  },

  getListeningPassages: async (page = 1, limit = 10): Promise<ListeningPassageItem[]> => {
    try {
      const response = await axiosClient.get(`/listening/passages?page=${page}&limit=${limit}`)
      return response.data || []
    } catch (error) {
      console.error("Error fetching listening passages:", error)
      return []
    }
  }
}
