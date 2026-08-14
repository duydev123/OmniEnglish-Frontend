import axios from 'axios';
import type {
  WritingPrompt,
  AIOutlineResponse,
  AICollocationsResponse,
  AISampleEssayResponse,
  WritingDraftPayload,
  WritingSubmitResponse,
  ImprovedEssaySampleResponse,
} from '../types/writing';


const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL = `${BASE_URL}/writing`;

const writingAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

writingAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const writingApi = {
  getPrompts: async (taskType?: string): Promise<WritingPrompt[]> => {
    const res = await writingAxios.get('/prompts', {
      params: taskType ? { task_type: taskType } : undefined,
    });
    return res.data;
  },

  getPromptById: async (promptId: string): Promise<WritingPrompt> => {
    const res = await writingAxios.get(`/prompts/${promptId}`);
    return res.data;
  },

  getAiAssistance: async (
    promptId: string,
    action: 'OUTLINE' | 'COLLOCATIONS' | 'SAMPLE_ESSAY',
    userNotes?: string,
    difficulty?: string
  ): Promise<AIOutlineResponse | AICollocationsResponse | AISampleEssayResponse> => {
    const res = await writingAxios.post(`/prompts/${promptId}/ai-assistance`, {
      prompt_id: promptId,
      action,
      user_notes: userNotes,
      difficulty: difficulty || 'medium',
    });
    return res.data;
  },

  saveDraft: async (payload: WritingDraftPayload) => {
    const res = await writingAxios.post('/sessions/draft', payload);
    return res.data;
  },

  submitEssay: async (payload: WritingDraftPayload): Promise<WritingSubmitResponse> => {
    if (!payload.essay_content || !payload.essay_content.trim()) {
      throw new Error('Your essay is empty. Please write your response before submitting.');
    }
    const res = await writingAxios.post('/sessions/submit', payload);
    return res.data;
  },

  getSubmissionById: async (sessionId: string): Promise<WritingSubmitResponse> => {
    const res = await writingAxios.get(`/sessions/${sessionId}`);
    return res.data;
  },

  getImprovedEssaySample: async (sessionId: string): Promise<ImprovedEssaySampleResponse> => {
    const res = await writingAxios.post(`/sessions/${sessionId}/improved-sample`);
    return res.data;
  },

  answerQuestion: async (promptId: string, question: string) => {
    const res = await writingAxios.post(`/prompts/${promptId}/answer`, {
      question: question,
    });
    return res.data;
  }
};
