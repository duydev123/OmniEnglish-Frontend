import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as readingApi from '../services/readingApi';

describe('Reading Module Services & Utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch list of reading passages', async () => {
    vi.spyOn(readingApi, 'getPassages').mockResolvedValue({
      items: [
        {
          id: 'reading-p1',
          title: 'The Future of Renewable Energy',
          topic: 'Science',
          time_limit_minutes: 20,
          total_questions: 10,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      total_pages: 1,
    });

    const res = await readingApi.getPassages();
    expect(res.items.length).toBe(1);
    expect(res.items[0].title).toBe('The Future of Renewable Energy');
  });

  it('should fetch reading passage details with questions', async () => {
    vi.spyOn(readingApi, 'getPassageDetail').mockResolvedValue({
      passage: {
        id: 'reading-p1',
        title: 'The Future of Renewable Energy',
        content: 'Renewable energy is growing fast...',
        time_limit_minutes: 20,
        total_questions: 10,
      },
      multiple_choices: [
        {
          id: 'mc_1',
          order: 1,
          question_text: 'What is the main source?',
          options: ['Solar', 'Coal', 'Gas', 'Oil'],
        },
      ],
      heading_matchings: [],
      fill_blanks: [],
      true_false_not_given: [],
    });

    const detail = await readingApi.getPassageDetail('reading-p1');
    expect(detail.passage.id).toBe('reading-p1');
    expect(detail.multiple_choices.length).toBe(1);
  });

  it('should start a reading test session', async () => {
    vi.spyOn(readingApi, 'startReadingSession').mockResolvedValue({
      session_id: 'session_read_101',
      title: 'The Future of Renewable Energy',
      content: 'Content...',
      status: 'IN_PROGRESS',
      time_remaining_seconds: 1200,
      completed_questions: 0,
      total_questions: 10,
      user_answers: {},
    });

    const session = await readingApi.startReadingSession('reading-p1');
    expect(session.session_id).toBe('session_read_101');
    expect(session.status).toBe('IN_PROGRESS');
  });

  it('should submit reading test answers and calculate score', async () => {
    vi.spyOn(readingApi, 'submitReading').mockResolvedValue({
      session_id: 'session_read_101',
      score: 8,
      total_questions: 10,
      accuracy_rate: 80.0,
      detailed_results: {
        mc_1: { order: 1, type: 'multiple_choice', question: 'Q1', user_answer: 'Solar', correct_answer: 'Solar', is_correct: true },
      },
    });

    const result = await readingApi.submitReading('session_read_101', { time_remaining_seconds: 600, user_answers: { mc_1: 'Solar' } });
    expect(result.score).toBe(8);
    expect(result.accuracy_rate).toBe(80.0);
  });
});
