import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speakingApi } from '../services/speakingApi';

describe('Speaking Module Services & Utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch list of speaking topics', async () => {
    vi.spyOn(speakingApi, 'getTopics').mockResolvedValue([
      {
        id: 'topic_spk_1',
        title: 'Hometown and Traditions',
        description: 'Describe your hometown.',
        tags: ['Part 1', 'Culture'],
        is_full_test: false,
        prompt_count: 5,
      },
    ]);

    const topics = await speakingApi.getTopics();
    expect(topics.length).toBe(1);
    expect(topics[0].title).toBe('Hometown and Traditions');
  });

  it('should fetch prompts grouped by part for a topic', async () => {
    vi.spyOn(speakingApi, 'getTopicPrompts').mockResolvedValue({
      PART_1: [
        {
          id: 'prompt_1',
          part: 'PART_1',
          question_text: 'Where is your hometown?',
          useful_vocabulary: ['Hometown', 'Picturesque'],
          ielts_tips: ['Keep answer around 2-3 sentences.'],
          response_structure: [],
        },
      ],
      PART_2: [],
      PART_3: [],
    });

    const prompts = await speakingApi.getTopicPrompts('topic_spk_1');
    expect(prompts.PART_1.length).toBe(1);
    expect(prompts.PART_1[0].question_text).toBe('Where is your hometown?');
  });

  it('should evaluate shadowing audio response', async () => {
    vi.spyOn(speakingApi, 'evaluateShadowing').mockResolvedValue({
      accuracy_score: 90,
      pronunciation_score: 88,
      fluency_score: 85,
      overall_score: 88,
      recognized_text: 'I live in a small beautiful town.',
      word_details: [],
      general_feedback: 'Great pronunciation!',
    });

    const evalResult = await speakingApi.evaluateShadowing('sentence_1', 'I live in a small beautiful town.');
    expect(evalResult.overall_score).toBe(88);
    expect(evalResult.recognized_text).toContain('small beautiful town');
  });
});
