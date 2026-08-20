import axiosClient from "../configs/axios"
import type {
  SpeakingTopic,
  SpeakingPrompt,
  SpeakingSessionStart,
  SpeakingSegmentResult,
  SpeakingSessionDetail,
  SpeakingHistoryItem,
  ShadowingSentence,
  ShadowingEvaluateResponse
} from "../types/speaking"

export const speakingApi = {
  getTopics: async (page = 1, limit = 10, is_full_test?: boolean): Promise<SpeakingTopic[]> => {
    try {
      let url = `/speaking/topics?page=${page}&limit=${limit}`
      if (is_full_test !== undefined) {
        url += `&is_full_test=${is_full_test}`
      }
      const response = await axiosClient.get(url)
      return response.data?.data || response.data || []
    } catch (error: any) {
      console.error("Error fetching speaking topics:", error)
      throw error
    }
  },

  getTopicPrompts: async (topicId: string): Promise<Record<string, SpeakingPrompt[]>> => {
    try {
      const response = await axiosClient.get(`/speaking/topics/${topicId}/prompts`)
      return response.data?.data || response.data || {}
    } catch (error: any) {
      console.error("Error fetching topic prompts:", error)
      throw error
    }
  },

  startPromptSession: async (promptId: string): Promise<SpeakingSessionStart | null> => {
    try {
      const response = await axiosClient.post(`/speaking/prompts/${promptId}/start`, {}, {
        timeout: 30000
      })
      return response.data?.data || response.data
    } catch (error: any) {
      console.error("Error starting prompt session:", error)
      throw error
    }
  },

  submitSegment: async (sessionId: string, promptId: string, audioFile: Blob | File): Promise<SpeakingSegmentResult | null> => {
    try {
      const formData = new FormData()
      formData.append("prompt_id", promptId)
      formData.append("audio_file", audioFile, "recording.webm")

      const response = await axiosClient.post(`/speaking/sessions/${sessionId}/segments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        timeout: 90000 // 90s timeout for AI speech evaluation
      })
      return response.data?.data || response.data
    } catch (error: any) {
      console.error("Error submitting speaking segment:", error)
      throw error
    }
  },

  getSessionResult: async (sessionId: string): Promise<SpeakingSessionDetail | null> => {
    try {
      const response = await axiosClient.get(`/speaking/sessions/${sessionId}`, {
        timeout: 30000
      })
      return response.data?.data || response.data
    } catch (error: any) {
      console.error("Error fetching session result:", error)
      throw error
    }
  },

  getHistory: async (
    page = 1,
    limit = 10,
    topicId?: string,
    promptId?: string,
    part?: string
  ): Promise<SpeakingHistoryItem[]> => {
    try {
      let url = `/speaking/history?page=${page}&limit=${limit}`
      if (topicId) url += `&topic_id=${topicId}`
      if (promptId) url += `&prompt_id=${promptId}`
      if (part) url += `&part=${part}`

      const response = await axiosClient.get(url)
      return response.data?.data || response.data || []
    } catch (error: any) {
      console.error("Error fetching speaking history:", error)
      throw error
    }
  },

  getShadowingSentences: async (page = 1, limit = 10): Promise<ShadowingSentence[]> => {
    try {
      const response = await axiosClient.get(`/speaking/shadowing/sentences?page=${page}&limit=${limit}`)
      return response.data?.data || response.data || []
    } catch (error: any) {
      console.error("Error fetching shadowing sentences:", error)
      throw error
    }
  },

  getShadowingSentenceDetail: async (sentenceId: string): Promise<ShadowingSentence | null> => {
    try {
      const response = await axiosClient.get(`/speaking/shadowing/sentences/${sentenceId}`)
      return response.data?.data || response.data
    } catch (error: any) {
      console.error("Error fetching shadowing sentence detail:", error)
      throw error
    }
  },

  evaluateShadowing: async (sentenceId: string, audioFile: Blob | File): Promise<ShadowingEvaluateResponse | null> => {
    try {
      const formData = new FormData()
      formData.append("audio_file", audioFile, "shadowing_recording.webm")

      const response = await axiosClient.post(`/speaking/shadowing/sentences/${sentenceId}/evaluate`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        timeout: 90000 // 90s timeout for AI shadowing evaluation
      })
      return response.data?.data || response.data
    } catch (error: any) {
      console.error("Error evaluating shadowing:", error)
      throw error
    }
  }
}
