import { create } from "zustand";

export interface UserSettings {
  focus_areas: string[];
  daily_word_target: number;
  learning_mode: string;
  weekend_mastery: boolean;
  base_language: string;
  notifications_enabled: boolean;
}

export interface UserStats {
  current_streak_days: number;
  total_xp: number;
  weekly_xp: number;
  total_words_learned: number;
  total_speaking_hours: number;
  general_english_level: string;
  business_english_progress: number;
  avg_reading_score: number;
  avg_listening_score: number;
  avg_speaking_score: number;
  avg_writing_score: number;
}

export interface User {
  username: string;
  email: string;
  role: string;
  id: string;
  avarta?: string;
  proficiency_level: string;
  status: string;
  settings: UserSettings;
  stats: UserStats;
  token?: string;
}

export interface UserStore {
  user: User;
  setUser: (u : User) => void;
}

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
  },
};

export const useUserStore = create<UserStore>((set) => ({
  user: initialUser,
  setUser: (u: User) => set({ user: u }),
}));
