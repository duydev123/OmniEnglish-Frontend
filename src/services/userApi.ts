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

export interface SocialLoginPayload {
  provider: "google" | "facebook";
  email: string;
  name?: string;
  avatar?: string;
  token?: string;
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
  async login(payload: LoginPayload): Promise<User> {
    const response = await axiosClient.post<User>("/users/signin", payload);
    const token = response.data?.token || (response.data as any)?.access_token;
    if (token) {
      localStorage.setItem("token", token);
    }
    return response.data;
  },

  /**
   * Register user POST /users/signup
   */
  async register(payload: RegisterPayload): Promise<User> {
    const response = await axiosClient.post<User>("/users/signup", payload);
    const token = response.data?.token || (response.data as any)?.access_token;
    if (token) {
      localStorage.setItem("token", token);
    }
    return response.data;
  },

  /**
   * Google Login POST /users/google-login
   */
  async googleLogin(payload: SocialLoginPayload): Promise<User> {
    try {
      const response = await axiosClient.post<User>("/users/google-login", payload);
      const token = response.data?.token || (response.data as any)?.access_token;
      if (token) {
        localStorage.setItem("token", token);
      }
      return response.data;
    } catch (error) {
      console.warn("Backend google-login unavailable, using fallback user profile:", error);
      const token = "demo_google_token_" + Date.now();
      localStorage.setItem("token", token);
      return {
        ...fallbackUserData,
        username: payload.name || "Google User",
        email: payload.email || "google_user@example.com",
        avatar: payload.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
        token: token,
      };
    }
  },

  /**
   * Facebook Login POST /users/facebook-login
   */
  async facebookLogin(payload: SocialLoginPayload): Promise<User> {
    try {
      const response = await axiosClient.post<User>("/users/facebook-login", payload);
      const token = response.data?.token || (response.data as any)?.access_token;
      if (token) {
        localStorage.setItem("token", token);
      }
      return response.data;
    } catch (error) {
      console.warn("Backend facebook-login unavailable, using fallback user profile:", error);
      const token = "demo_facebook_token_" + Date.now();
      localStorage.setItem("token", token);
      return {
        ...fallbackUserData,
        username: payload.name || "Facebook User",
        email: payload.email || "facebook_user@example.com",
        avatar: payload.avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
        token: token,
      };
    }
  },

  /**
   * Change Password POST /users/change-password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await axiosClient.post<{ message: string }>("/users/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * Update Profile PATCH /users/profile
   */
  async updateProfile(payload: { avatar?: string }): Promise<User> {
    const response = await axiosClient.patch<User>("/users/profile", payload);
    return response.data;
  },
};
