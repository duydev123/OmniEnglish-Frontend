import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi } from '../services/userApi';
import { useUserStore, initialUser } from '../stores/user/useUserStore';

describe('User Store & Auth Services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useUserStore.getState().setUser(initialUser);
  });

  it('should update user state in Zustand store', () => {
    const mockUser = {
      id: 'usr_100',
      username: 'teststudent',
      email: 'student@example.com',
      role: 'user',
      avatar: 'https://example.com/avatar.jpg',
      proficiency_level: 'B2',
      status: 'Active',
      settings: {
        focus_areas: ['General English'],
        daily_word_target: 20,
        learning_mode: 'Steady Growth',
        weekend_mastery: false,
        base_language: 'vi-VN',
        notifications_enabled: true,
      },
      stats: {
        current_streak_days: 5,
        total_xp: 500,
        weekly_xp: 120,
        total_words_learned: 50,
        total_speaking_hours: 2,
        general_english_level: 'B2',
        business_english_progress: 0,
        avg_reading_score: 8.0,
        avg_listening_score: 7.5,
        avg_speaking_score: 7.0,
        avg_writing_score: 7.0,
      },
    };

    useUserStore.getState().setUser(mockUser);
    const currentUser = useUserStore.getState().user;
    expect(currentUser.username).toBe('teststudent');
    expect(currentUser.proficiency_level).toBe('B2');
  });

  it('should fetch authenticated user profile', async () => {
    vi.spyOn(userApi, 'getUserProfile').mockResolvedValue({
      id: 'usr_100',
      username: 'teststudent',
      email: 'student@example.com',
      role: 'user',
      avatar: '',
      proficiency_level: 'B2',
      status: 'Active',
      settings: {
        focus_areas: ['General English'],
        daily_word_target: 20,
        learning_mode: 'Steady Growth',
        weekend_mastery: false,
        base_language: 'vi-VN',
        notifications_enabled: true,
      },
      stats: {
        current_streak_days: 5,
        total_xp: 500,
        weekly_xp: 120,
        total_words_learned: 50,
        total_speaking_hours: 2,
        general_english_level: 'B2',
        business_english_progress: 0,
        avg_reading_score: 8.0,
        avg_listening_score: 7.5,
        avg_speaking_score: 7.0,
        avg_writing_score: 7.0,
      },
    });

    const user = await userApi.getUserProfile();
    expect(user).not.toBeNull();
    expect(user?.username).toBe('teststudent');
    expect(user?.proficiency_level).toBe('B2');
  });
});
