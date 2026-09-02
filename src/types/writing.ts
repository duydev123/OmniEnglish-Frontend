export type WritingTaskType = 'WITH_GRAPH' | 'WITHOUT_GRAPH';

export interface StructureGuideItem {
  section: string;
  guide: string;
  details?: string[];
}

export interface WritingPrompt {
  id: string;
  title: string;
  task_type: WritingTaskType;
  task_description: string;
  reference_image_url?: string | null;
  ref_id?: string | null;
  time_limit_minutes: number;
  word_count_target: number;
  suggested_structure: StructureGuideItem[];
  advanced_vocabulary: string[];
  user_status?: string | null;
  draft_content?: string | null;
  time_spent_seconds?: number | null;
  highest_score?: number | null;
  question_category?: string | null;
}

export interface AIOutlineSection {
  title: string;
  sub_points: string[];
}

export interface AIOutlineResponse {
  status: string;
  prompt_id: string;
  outline: AIOutlineSection[];
}

export interface AICollocationItem {
  word: string;
  basic_equivalent?: string;
  meaning?: string;
  meaning_en: string;
  meaning_vi: string;
  example: string;
}

export interface AICollocationGroup {
  category: string;
  items: AICollocationItem[];
}

export interface AICollocationsResponse {
  status: string;
  prompt_id: string;
  suggestions: AICollocationGroup[];
}

export interface AISampleEssayResponse {
  status: string;
  prompt_id: string;
  sample_title: string;
  full_text: string;
  structure_annotations: Array<{ section: string; note: string }>;
  good_practices: string[];
}

export interface WritingDraftPayload {
  prompt_id: string;
  essay_content: string;
  word_count: number;
  time_spent_seconds: number;
}

export interface HighlightSpan {
  text: string;
  type: 'GRAMMAR' | 'WORD_CHOICE' | 'COHERENCE';
  feedback_index: number;
}

export interface DetailedFeedback {
  category: string;
  original: string;
  correction: string;
  explanation: string;
  rule?: string;
  similar_examples?: string[];
}

export interface ImprovementComparison {
  category: string;
  original: string;
  improved: string;
}

export interface Milestone {
  date: string;
  title: string;
}

export interface WritingSubmitResponse {
  session_id: string;
  status: string;
  prompt_id: string;
  topic_title: string;
  essay_content: string;
  word_count: number;
  time_spent_seconds: number;
  overall_score: number;
  potential_score: number;
  general_summary: string;
  task_achievement_score: number;
  coherence_cohesion_score: number;
  lexical_resource_score: number;
  grammar_accuracy_score: number;
  highlight_spans: HighlightSpan[];
  detailed_feedbacks: DetailedFeedback[];
  improvements_comparison: ImprovementComparison[];
  positive_feedback: string[];
  actionable_next_steps: string[];
  achieved_milestones: Milestone[];
}

export interface ImprovedEssaySampleResponse {
  status: string;
  session_id: string;
  original_essay: string;
  improved_essay: string;
  improvements_explanation: string[];
}
