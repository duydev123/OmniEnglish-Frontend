export interface SpeakingTopic {
  id: string
  title: string
  description?: string
  tags: string[]
  is_full_test: boolean
  prompt_count?: number
}

export interface ResponseStructureItem {
  step?: string
  title?: string
  description?: string
  desc?: string
}

export interface SpeakingPrompt {
  id: string
  topic_id: string
  part: "PART_1" | "PART_2" | "PART_3" | "SHADOWING" | string
  sub_topic?: string
  question_text: string
  examiner_audio_url?: string
  useful_vocabulary: string[]
  ielts_tips: string[]
  examiner_tip?: string
  response_structure: (ResponseStructureItem | string)[]
}

export interface SpeakingSessionStart {
  session_id: string
  topic_id?: string
  prompt_id?: string
  test_type: string
  status: string
  current_prompt?: SpeakingPrompt
}

export interface PhonemeDetail {
  phoneme: string
  accuracy_score: number
}

export interface WordDetail {
  word: string
  accuracy_score?: number
  error_type?: string
  start_time?: number
  end_time?: number
  phonemes?: PhonemeDetail[]
}

export interface SpeakingSegmentResult {
  session_id: string
  prompt_id: string
  status: string
  user_transcript: string
  user_audio_url?: string
  segment_score?: number
  pronunciation_score?: number
  fluency_score?: number
  lexical_score?: number
  grammar_score?: number
  realtime_feedback?: string
  words_detail: WordDetail[]
  next_prompt_id?: string
}

export interface KeyStrength {
  title: string
  desc: string
}

export interface AreaForGrowth {
  category: "PRONUNCIATION" | "GRAMMAR" | "LEXICAL" | "FLUENCY" | string
  title: string
  desc: string
  tip: string
  incorrect: string
  correct: string
}

export interface QuestionDetailReview {
  question_text: string
  user_transcript: string
  user_audio_url?: string
}

export interface Milestone {
  title: string
  tasks: string[]
}

export interface SpeakingSessionDetail {
  session_id: string
  test_type: string
  title: string
  duration_str: string
  status: string
  full_session_audio_url?: string
  overall_band_score: number
  band_score_delta: number
  percentile_rank?: string
  pronunciation_score: number
  fluency_score: number
  lexical_score: number
  grammar_score: number
  key_strengths: KeyStrength[]
  areas_for_growth: AreaForGrowth[]
  questions_detail: QuestionDetailReview[]
  ai_insights_summary?: string
  detailed_criteria_feedback?: Record<string, any>[]
  next_milestone?: Milestone
  recommended_resources: { title?: string; desc?: string; url?: string }[]
  created_at: string
}

export interface SpeakingHistoryItem {
  session_id: string
  test_type: string
  title: string
  overall_band_score: number
  duration_str: string
  status: string
  created_at: string
}

export interface ShadowingSentence {
  id: string
  target_skill: string
  english_text: string
  ipa_text: string
  audio_url?: string
}

export interface ShadowingEvaluateResponse {
  accuracy_score: number
  fluency_score: number
  user_transcript: string
  words_detail: WordDetail[]
}
