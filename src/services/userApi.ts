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

// Default fallback user data for offline / fallback mode
export const fallbackUserData: User = {
  id: "user-default-id",
  username: "",
  email: "",
  role: "user",
  avatar: "",
  proficiency_level: "A1",
  status: "Active",
  settings: {
    focus_areas: ["General English"],
    daily_word_target: 20,
    learning_mode: "Steady Growth",
    weekend_mastery: false,
    base_language: "vi-VN",
    notifications_enabled: true,
  },
  stats: {
    current_streak_days: 0,
    total_xp: 0,
    weekly_xp: 0,
    total_words_learned: 0,
    total_speaking_hours: 0,
    general_english_level: "A1",
    business_english_progress: 0,
    avg_reading_score: 0,
    avg_listening_score: 0,
    avg_speaking_score: 0,
    avg_writing_score: 0,
  },
};

export const userApi = {
  /**
   * Fetch current authenticated user profile & stats from backend GET /users/auth
   */
  async getUserProfile(): Promise<User | null> {
    try {
      const response = await axiosClient.get<any>("/users/auth");
      const data = response.data?.user || response.data;
      if (data && (data.id || data._id || data.username || data.email)) {
        return {
          ...data,
          id: data.id || data._id || "user-id",
          username: data.username || data.name || data.email?.split("@")[0] || "User",
        };
      }
      return null;
    } catch (error) {
      console.warn("Backend API auth error:", error);
      return null;
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
    return {
      ...response.data,
      token: token || "",
    };
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
    return {
      ...response.data,
      token: token || "",
    };
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
      console.error("Backend google-login error:", error);
      throw error;
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
      console.error("Backend facebook-login error:", error);
      throw error;
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
  async updateProfile(payload: {
    avatar?: string;
    username?: string;
    proficiency_level?: string;
    daily_word_target?: number;
    learning_mode?: string;
    weekend_mastery?: boolean;
    base_language?: string;
    notifications_enabled?: boolean;
  }): Promise<User> {
    const response = await axiosClient.patch<User>("/users/profile", payload);
    return response.data;
  },

  /**
   * Send Forgot Password OTP POST /users/forgot-password/send-otp
   */
  async sendForgotOTP(email: string): Promise<{ message: string }> {
    const response = await axiosClient.post<{ message: string }>("/users/forgot-password/send-otp", { email });
    return response.data;
  },

  /**
   * Verify Forgot Password OTP POST /users/forgot-password/verify-otp
   */
  async verifyForgotOTP(email: string, otpCode: string): Promise<{ message: string }> {
    const response = await axiosClient.post<{ message: string }>("/users/forgot-password/verify-otp", {
      email,
      otp_code: otpCode,
    });
    return response.data;
  },

  /**
   * Reset Password with OTP POST /users/forgot-password/reset-password
   */
  async resetPasswordWithOTP(email: string, otpCode: string, newPassword: string): Promise<{ message: string }> {
    const response = await axiosClient.post<{ message: string }>("/users/forgot-password/reset-password", {
      email,
      otp_code: otpCode,
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * Daily Check-in / Login Activity POST /users/check-in
   */
  async checkIn(): Promise<{
    status?: string;
    message?: string;
    today_checked_in?: boolean;
    streak_days?: number;
    activity_dates?: string[];
    user?: User;
  }> {
    try {
      const response = await axiosClient.post("/users/check-in");
      return response.data;
    } catch (error) {
      console.warn("Check-in API error:", error);
      return {};
    }
  },

  /**
   * Fetch user activity logs GET /users/activity-logs
   */
  async getActivityLogs(): Promise<Array<{ date_str: string; activities_count: number; xp_earned: number }>> {
    try {
      const response = await axiosClient.get("/users/activity-logs");
      return response.data?.data || response.data || [];
    } catch (error) {
      console.warn("Get activity logs error:", error);
      return [];
    }
  },
};
