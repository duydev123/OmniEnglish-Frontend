import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writingApi } from '../services/writingApi';

describe('Writing Module Services & Utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should format prompts list correctly', async () => {
    vi.spyOn(writingApi, 'getPrompts').mockResolvedValue([
      {
        id: 'urban-dynamics-2026',
        title: 'Urban Dynamics',
        task_type: 'WITH_GRAPH',
        task_description: 'Analyze urban development.',
        time_limit_minutes: 45,
        word_count_target: 250,
        suggested_structure: [],
        advanced_vocabulary: [],
      },
    ]);
    const prompts = await writingApi.getPrompts();
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts[0]).toHaveProperty('title');
  });

  it('should filter prompts by task_type WITH_GRAPH', async () => {
    vi.spyOn(writingApi, 'getPrompts').mockImplementation(async (type?: string) => [
      {
        id: 'urban-dynamics-2026',
        title: 'Urban Dynamics',
        task_type: 'WITH_GRAPH',
        task_description: 'Analyze urban development.',
        time_limit_minutes: 45,
        word_count_target: 250,
        suggested_structure: [],
        advanced_vocabulary: [],
      },
    ]);
    const graphPrompts = await writingApi.getPrompts('WITH_GRAPH');
    expect(graphPrompts.every((p) => p.task_type === 'WITH_GRAPH')).toBe(true);
  });

  it('should return AI Outline assistance (UC-09)', async () => {
    vi.spyOn(writingApi, 'getAiAssistance').mockResolvedValue({
      status: 'success',
      prompt_id: 'urban-dynamics-2026',
      outline: [{ title: 'Introduction', sub_points: ['Hook'] }],
    });
    const res = await writingApi.getAiAssistance('urban-dynamics-2026', 'OUTLINE');
    expect(res.status).toBe('success');
    expect(res).toHaveProperty('outline');
  });

  it('should return AI Collocations assistance (UC-10)', async () => {
    vi.spyOn(writingApi, 'getAiAssistance').mockResolvedValue({
      status: 'success',
      prompt_id: 'urban-dynamics-2026',
      suggestions: [{ category: 'Topic Vocabulary', items: ['Urban'] }],
    });
    const res = await writingApi.getAiAssistance('urban-dynamics-2026', 'COLLOCATIONS');
    expect(res.status).toBe('success');
    expect(res).toHaveProperty('suggestions');
  });

  it('should return AI Sample Essay assistance (UC-11)', async () => {
    vi.spyOn(writingApi, 'getAiAssistance').mockResolvedValue({
      status: 'success',
      prompt_id: 'urban-dynamics-2026',
      sample_title: 'Sample',
      full_text: 'Full sample essay text...',
      structure_annotations: [],
      good_practices: [],
    });
    const res = await writingApi.getAiAssistance('urban-dynamics-2026', 'SAMPLE_ESSAY');
    expect(res.status).toBe('success');
    expect(res).toHaveProperty('full_text');
  });

  it('should reject empty essay submission (UC-13 validation)', async () => {
    await expect(
      writingApi.submitEssay({
        prompt_id: 'urban-dynamics-2026',
        essay_content: '   ',
        word_count: 0,
        time_spent_seconds: 5,
      })
    ).rejects.toThrow(/empty/i);
  });

  it('should evaluate submitted essay with 4 IELTS criteria (UC-13 & UC-14)', async () => {
    vi.spyOn(writingApi, 'submitEssay').mockResolvedValue({
      session_id: 'session_demo_123',
      status: 'REVIEWED',
      prompt_id: 'urban-dynamics-2026',
      topic_title: 'Urban Dynamics',
      essay_content: 'Technology improves education.',
      word_count: 26,
      time_spent_seconds: 120,
      overall_score: 7.5,
      potential_score: 8.0,
      general_summary: 'Good essay.',
      task_achievement_score: 7.5,
      coherence_cohesion_score: 8.0,
      lexical_resource_score: 7.0,
      grammar_accuracy_score: 7.5,
      highlight_spans: [{ text: 'improves', type: 'GRAMMAR', feedback_index: 0 }],
      detailed_feedbacks: [],
      improvements_comparison: [],
      positive_feedback: [],
      actionable_next_steps: [],
      achieved_milestones: [],
    });
    const res = await writingApi.submitEssay({
      prompt_id: 'urban-dynamics-2026',
      essay_content: 'Technology improves education.',
      word_count: 26,
      time_spent_seconds: 120,
    });
    expect(res.status).toBe('REVIEWED');
    expect(res.overall_score).toBeGreaterThan(0);
    expect(res.task_achievement_score).toBeGreaterThan(0);
  });

  it('should fetch improved essay sample (UC-15)', async () => {
    vi.spyOn(writingApi, 'getImprovedEssaySample').mockResolvedValue({
      status: 'success',
      session_id: 'session_demo_123',
      original_essay: 'Original',
      improved_essay: 'Improved',
      improvements_explanation: ['Upgraded vocabulary'],
    });
    const res = await writingApi.getImprovedEssaySample('session_demo_123');
    expect(res.status).toBe('success');
    expect(res).toHaveProperty('improved_essay');
  });
});
