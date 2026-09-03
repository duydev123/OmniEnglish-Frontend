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
  overall_score?: number;
  avg_band_score?: number;
  reading_progress_pct?: number;
  listening_progress_pct?: number;
  speaking_progress_pct?: number;
  writing_progress_pct?: number;
}

export interface User {
  username: string;
  email: string;
  role: string;
  id: string;
  avatar?: string;
  avarta?: string;
  proficiency_level: string;
  status: string;
  settings: UserSettings;
  stats: UserStats;
  token?: string;
  created_at?: string;
}

export interface UserData {
  username: string;
  email: string;
  password: string;
}

export interface UserStore {
  user: User;
  setUser: (u: User) => void;
}
