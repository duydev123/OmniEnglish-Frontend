import axiosClient from '../configs/axios'

// ============================================================
// Types matching backend DTOs
// ============================================================

export interface PassageSummary {
  id: string
  title: string
  topic: string
  time_limit_minutes: number
  total_questions: number
  image_url?: string | null
  learning_tip?: string | null
  created_at?: string | null
  question_types?: string[]
}

export interface PassageListResponse {
  items: PassageSummary[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface PassageDetail extends PassageSummary {
  content: string
}

export interface MultipleChoiceQuestion {
  id: string
  order: number
  question_text: string
  options: string[]
}

export interface HeadingMatchingQuestion {
  order: number
  headings: string[]
  paragraphs: string[]
}

export interface FillBlankQuestion {
  order: number
  passage_text: string
  blanks: string[]
  case_sensitive: boolean
}

export interface TrueFalseNotGivenQuestion {
  order: number
  statements: string[]
}

export interface ReadingSession {
  session_id: string
  title: string
  content: string
  image_url?: string | null
  learning_tip?: string | null
  completed_questions: number
  total_questions: number
  time_remaining_seconds: number
  multiple_choices: MultipleChoiceQuestion[]
  heading_matchings: HeadingMatchingQuestion[]
  fill_blanks: FillBlankQuestion[]
  true_false_not_given: TrueFalseNotGivenQuestion[]
  user_answers?: Record<string, string>
}

export interface ReadingSessionDetail {
  session_id: string
  user_id: string
  passage_id: string
  passage_title?: string | null
  completed_questions: number
  total_questions: number
  time_remaining_seconds: number
  score: number
  status: string
  user_answers: Record<string, string>
  start_at?: string | null
  updated_at?: string | null
}

export interface QuestionResult {
  is_correct: boolean
  user_answer: string
  correct_answer: string
  statement?: string | null
  options?: string[]
}

export interface ReadingSubmitResponse {
  status: string
  score: number
  total_questions: number
  accuracy_rate: number
  detailed_results: Record<string, QuestionResult>
}

export interface UserHistoryItem {
  session_id: string
  passage_id: string
  passage_title: string
  score: number
  total_questions: number
  accuracy_rate: number
  status: string
  attempt_number: number
  completed_questions?: number
  start_at?: string | null
  updated_at?: string | null
}

export interface UserHistoryListResponse {
  items: UserHistoryItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface UserReadingStats {
  total_sessions_completed: number
  average_accuracy_rate: number
  highest_score: number
  lowest_score: number
  skills_to_improve: string[]
  total_xp: number
}

export interface ReadingSessionReview {
  session_id: string
  passage_id: string
  passage_title: string
  passage_content: string
  score: number
  total_questions: number
  accuracy_rate: number
  status: string
  detailed_results: Record<string, QuestionResult>
}

export interface BookmarkVocabularyResponse {
  success: boolean
  message: string
  id: string
  session_id: string
  word: string
  context?: string | null
  created_at?: string | null
}

// ============================================================
// API Functions
// ============================================================

/**
 * Lấy danh sách passages (có phân trang + filter)
 */
export async function getPassages(params: {
  page?: number
  limit?: number
  level?: string
  topic?: string
  question_type?: string
} = {}): Promise<PassageListResponse> {
  const { data } = await axiosClient.get('/reading/passages', { params })
  return data
}

/**
 * Lấy chi tiết 1 passage
 */
export async function getPassageDetail(passageId: string): Promise<PassageDetail> {
  const { data } = await axiosClient.get(`/reading/passages/${passageId}`)
  return data
}

/**
 * Bắt đầu session làm bài reading (lấy bài + tạo session)
 */
export async function startReadingSession(passageId: string): Promise<ReadingSession> {
  const { data } = await axiosClient.get(`/reading/passages/${passageId}/start`)
  return data
}

/**
 * Lưu bản nháp (auto-save trong khi làm)
 */
export async function saveDraft(
  sessionId: string,
  payload: { time_remaining_seconds: number; user_answers: Record<string, string> }
): Promise<{ status: string; message: string }> {
  const { data } = await axiosClient.patch(`/reading/sessions/${sessionId}/draft`, payload)
  return data
}

/**
 * Nộp bài và lấy kết quả
 */
export async function submitReading(
  sessionId: string,
  payload: { time_remaining_seconds: number; user_answers: Record<string, string> }
): Promise<ReadingSubmitResponse> {
  const { data } = await axiosClient.post(`/reading/sessions/${sessionId}/submit`, payload)
  return data
}

/**
 * Lấy thông tin session (tiến độ, điểm)
 */
export async function getSessionDetail(sessionId: string): Promise<ReadingSessionDetail> {
  const { data } = await axiosClient.get(`/reading/sessions/${sessionId}`)
  return data
}

/**
 * Lấy các session đang làm dở (IN_PROGRESS) của user - dùng để check draft status
 */
export async function getInProgressSessions(
  userId: string
): Promise<UserHistoryItem[]> {
  const { data } = await axiosClient.get<UserHistoryListResponse>(
    `/reading/users/${userId}/history`,
    { params: { status: 'IN_PROGRESS', limit: 100 } }
  )
  return data.items
}

/**
 * Lấy lịch sử làm bài của user
 */
export async function getUserHistory(
  userId: string,
  params: { page?: number; limit?: number; status?: string } = {}
): Promise<UserHistoryListResponse> {
  const { data } = await axiosClient.get(`/reading/users/${userId}/history`, { params })
  return data
}

/**
 * Xóa/hủy session đang dở
 */
export async function deleteSession(sessionId: string): Promise<{ status: string; message: string }> {
  const { data } = await axiosClient.delete(`/reading/sessions/${sessionId}`)
  return data
}

/**
 * Lấy thống kê tổng quan của user
 */
export async function getUserStats(userId: string): Promise<UserReadingStats> {
  const { data } = await axiosClient.get(`/reading/users/${userId}/stats`)
  return data
}

/**
 * Review chi tiết bài đã làm
 */
export async function getSessionReview(sessionId: string): Promise<ReadingSessionReview> {
  const { data } = await axiosClient.get(`/reading/sessions/${sessionId}/review`)
  return data
}

/**
 * Bookmark từ vựng trong bài đọc
 */
export async function bookmarkVocabulary(
  sessionId: string,
  payload: { word: string; context?: string }
): Promise<BookmarkVocabularyResponse> {
  const { data } = await axiosClient.post(`/reading/sessions/${sessionId}/vocabulary`, payload)
  return data
}
