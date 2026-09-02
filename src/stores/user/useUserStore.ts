import { create } from "zustand";
import type { User, UserSettings, UserStats, UserStore } from "../../types/user";

export type { User, UserSettings, UserStats, UserStore };

export const initialUser: User = {
  token: "",
  id: "",
  username: "",
  email: "",
  role: "user",
  avarta: "",
  proficiency_level: "beginner",
  status: "active",
  settings: {
    focus_areas: [],
    daily_word_target: 0,
    learning_mode: "standard",
    weekend_mastery: false,
    base_language: "vi",
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
    overall_score: 0,
  },
};

export const useUserStore = create<UserStore>((set) => ({
  user: initialUser,
  setUser: (u: User) => set({ user: u }),
}));