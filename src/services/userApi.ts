import axiosClient from "../configs/axios";
import type { User } from "../stores/user/useUserStore";

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  role: string;
}

// Fallback demo user data for offline / fallback mode
export const fallbackUserData: User = {
  id: "demo-user-123",
  username: "Alex",
  email: "alex@omnienglish.com",
  role: "user",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
  proficiency_level: "B1",
  status: "Active",
  settings: {
    focus_areas: ["General English", "IELTS Academic"],
    daily_word_target: 30,
    learning_mode: "Steady Growth",
    weekend_mastery: true,
    base_language: "vi-VN",
    notifications_enabled: true,
  },
  stats: {
    current_streak_days: 15,
    total_xp: 2850,
    weekly_xp: 420,
    total_words_learned: 240,
    total_speaking_hours: 12.5,
    general_english_level: "B2",
    business_english_progress: 45.0,
    avg_reading_score: 7.0,
    avg_listening_score: 6.5,
    avg_speaking_score: 6.0,
    avg_writing_score: 6.5,
  },
};

export const userApi = {
  /**
   * Fetch current authenticated user profile & stats from backend GET /users/auth
   */
  async getUserProfile(): Promise<User> {
    try {
      const response = await axiosClient.get<User>("/users/auth");
      if (response.data && response.data.username) {
        return response.data;
      }
      return fallbackUserData;
    } catch (error) {
      console.warn("Backend API unavailable, using local profile fallback:", error);
      return fallbackUserData;
    }
  },

  /**
   * Login user POST /users/signin
   */
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const response = await axiosClient.post<TokenResponse>("/users/signin", payload);
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },

  /**
   * Register user POST /users/signup
   */
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const response = await axiosClient.post<TokenResponse>("/users/signup", payload);
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },
};
