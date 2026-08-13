import axiosClient from '../configs/axios'

// ============================================================
// Types matching backend DTOs
// ============================================================

export interface TranscriptSegment {
  start_time: string
  end_time: string
  en: string
  vi: string
}

export interface KeyVocabWord {
  word: string
  definition?: string
  meaning?: string
  ipa?: string
}

export interface ListeningPassageSummary {
  id: string
  title: string
  unit_code?: string
  audio_url: string
  time_limit_minutes: number
  total_questions: number
  question_types?: string[]
}

export interface ListeningPassageDetail extends ListeningPassageSummary {
  interactive_transcript: TranscriptSegment[]
  key_vocabulary: KeyVocabWord[]
  created_at?: string
}

export interface ListeningMultipleChoice {
  id: string
  order: number
  question_text: string
  options: string[]
  timestamp_clip?: string
}

export interface ListeningCompletion {
  id: string
  order: number
  template_text: string
  case_sensitive: boolean
}

export interface ListeningSession {
  session_id: string
  passage_id: string
  title: string
  unit_code?: string
  audio_url: string
  time_limit_minutes: number
  interactive_transcript: TranscriptSegment[]
  key_vocabulary: KeyVocabWord[]
  completed_questions: number
  total_questions: number
  multiple_choices: ListeningMultipleChoice[]
  completions: ListeningCompletion[]
  user_answers?: Record<string, string>
  user_typed_text?: string | null
  time_remaining_seconds?: number
}

export interface ListeningDraftResponse {
  session_id: string
  status: string
  message: string
}

export interface DictationWordResult {
  word: string
  status: 'correct' | 'wrong' | 'missing' | 'extra'
  is_correct?: boolean
  user_word?: string
  correct_word?: string
}

export type CompetencyMatrix = Record<string, number>

export interface QuestionReviewItem {
  question_id: string
  question_text: string
  is_correct: boolean
  your_answer: string
  correct_answer: string
  timestamp_clip?: string
  learning_hint?: string
  audio_url?: string
  start_time_ms?: number
  end_time_ms?: number
  segment_transcript?: string
}

export interface ListeningSubmitResponse {
  session_id: string
  session_type: string
  status: string
  accuracy_rate?: number
  score_summary?: string
  xp_earned?: number
  competency_matrix?: CompetencyMatrix
  detailed_question_review?: QuestionReviewItem[]
  words_typed?: number
  wpm?: number
  missed_contractions?: number
  transcript_comparison?: DictationWordResult[]
  spelling_tip?: string
  listening_insight?: string
  audio_url?: string
  interactive_transcript?: TranscriptSegment[]
}

// ============================================================
// API Functions
// ============================================================

/**
 * Liệt kê các passage listening để frontend chọn bài.
 */
export async function getListeningPassages(params?: { page?: number; limit?: number; question_type?: string }): Promise<{ items: ListeningPassageSummary[]; page: number; limit: number; total: number }> {
  const { data } = await axiosClient.get('/listening/passages', { params })
  return data
}

/**
 * Lấy chi tiết 1 passage listening.
 */
export async function getListeningPassageDetail(passageId: string): Promise<ListeningPassageDetail> {
  const { data } = await axiosClient.get(`/listening/passages/${passageId}`)
  return data
}

/**
 * Bắt đầu session listening (GET passage + tạo session)
 */
export async function startListeningSession(passageId: string, sessionType: 'COMPREHENSION' | 'DICTATION' = 'COMPREHENSION'): Promise<ListeningSession> {
  const { data } = await axiosClient.get(`/listening/passages/${passageId}/start`, {
    params: { session_type: sessionType }
  })
  return data
}

/**
 * Lưu nháp (COMPREHENSION hoặc DICTATION)
 */
export async function saveListeningDraft(
  sessionId: string,
  payload: {
    session_type: 'COMPREHENSION' | 'DICTATION'
    time_remaining_seconds?: number
    user_answers?: Record<string, string>
    user_typed_text?: string
  }
): Promise<ListeningDraftResponse> {
  const { data } = await axiosClient.patch(`/listening/sessions/${sessionId}/draft`, payload)
  return data
}

/**
 * Nộp bài và nhận kết quả
 */
export async function submitListening(
  sessionId: string,
  payload: {
    session_type: 'COMPREHENSION' | 'DICTATION'
    time_remaining_seconds?: number
    user_answers?: Record<string, string>
    user_typed_text?: string
  }
): Promise<ListeningSubmitResponse> {
  const { data } = await axiosClient.post(`/listening/sessions/${sessionId}/submit`, payload)
  return data
}

/**
 * Lấy nháp đã lưu
 */
export async function getListeningDraft(sessionId: string): Promise<unknown> {
  const { data } = await axiosClient.get(`/listening/sessions/${sessionId}/draft`)
  return data
}

/**
 * Lấy thông tin session listening
 */
export async function getListeningSession(sessionId: string): Promise<ListeningSubmitResponse> {
  const { data } = await axiosClient.get(`/listening/sessions/${sessionId}`)
  return data
}

export async function getInProgressListeningSessions(
  userId: string
): Promise<any[]> {
  const { data } = await axiosClient.get(
    `/listening/users/${userId}/history`,
    { params: { status: 'IN_PROGRESS', limit: 100 } }
  )
  return data.items
}

export async function getListeningHistory(
  userId: string,
  params: { page?: number; limit?: number; status?: string } = {}
): Promise<any> {
  const { data } = await axiosClient.get(`/listening/users/${userId}/history`, { params })
  return data
}
