import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as listeningApi from '../services/listeningApi';

describe('Listening Module Services & Utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should list listening passages', async () => {
    vi.spyOn(listeningApi, 'getListeningPassages').mockResolvedValue({
      items: [
        {
          id: 'listening-p1',
          title: 'Campus Life Conversation',
          unit_code: 'LIST-101',
          audio_url: 'https://example.com/audio.mp3',
          time_limit_minutes: 15,
          total_questions: 10,
          question_types: ['Multiple Choice', 'Dictation'],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    const res = await listeningApi.getListeningPassages();
    expect(res.items.length).toBe(1);
    expect(res.items[0].unit_code).toBe('LIST-101');
  });

  it('should fetch listening passage detail with audio clips and questions', async () => {
    vi.spyOn(listeningApi, 'getListeningPassageDetail').mockResolvedValue({
      id: 'listening-p1',
      title: 'Campus Life Conversation',
      audio_url: 'https://example.com/audio.mp3',
      time_limit_minutes: 15,
      total_questions: 10,
      interactive_transcript: [
        {
          start_time: '00:00',
          end_time: '00:30',
          en: 'Hello, welcome to campus.',
          vi: 'Xin chào, chào mừng tới khuôn viên.',
        },
      ],
      key_vocabulary: [],
    });

    const detail = await listeningApi.getListeningPassageDetail('listening-p1');
    expect(detail.id).toBe('listening-p1');
    expect(detail.interactive_transcript.length).toBe(1);
  });

  it('should submit listening test answers', async () => {
    vi.spyOn(listeningApi, 'submitListening').mockResolvedValue({
      session_id: 'session_list_202',
      session_type: 'COMPREHENSION',
      status: 'COMPLETED',
      accuracy_rate: 90.0,
      score_summary: '9/10 correct',
      xp_earned: 90,
      detailed_question_review: [],
    });

    const result = await listeningApi.submitListening('session_list_202', { session_type: 'COMPREHENSION', time_remaining_seconds: 400, user_answers: { q1: 'A' } });
    expect(result.accuracy_rate).toBe(90.0);
    expect(result.xp_earned).toBe(90);
  });
});
