import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AppLayout } from "../../components/common/AppLayout"
import { speakingApi } from "../../services/speakingApi"
import type { SpeakingSessionDetail } from "../../types/speaking"
import {
  Play,
  Pause,
  RotateCcw,
  Share2,
  Bookmark,
  Sparkles,
  TrendingUp,
  Volume2,
  BookOpen,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"

export const SpeakingResultPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SpeakingSessionDetail | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const currentTime = "00:00"
  const duration = "00:45"

  const parseSpeakingFeedback = (raw: string | undefined | null) => {
    if (!raw) return {}
    if (typeof raw === "object") return raw as any
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === "object" && parsed !== null) {
        return parsed
      }
    } catch (e) {
      // Not JSON format
    }
    return { raw_text: raw }
  }

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true)
      setError(null)
      try {
        if (sessionId) {
          const detail = await speakingApi.getSessionResult(sessionId)
          if (detail) {
            setResult(detail)
          } else {
            setError("Không tìm thấy dữ liệu kết quả bài nói từ máy chủ.")
          }
        } else {
          setError("Session ID không hợp lệ.")
        }
      } catch (err: any) {
        console.error("Failed to load session result:", err)
        setError(err?.response?.data?.message || err?.message || "Không thể kết nối tới máy chủ để tải kết quả bài nói.")
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [sessionId])

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Practice Module", href: "/practice-modules" }, { label: "Speaking" }]}>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
          <Loader2 className="w-10 h-10 text-[#1e50e6] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Generating AI Performance Analysis...</p>
        </div>
      </AppLayout>
    )
  }

  if (!result || error) {
    return (
      <AppLayout breadcrumbs={[{ label: "Practice Module", href: "/practice-modules" }, { label: "Speaking" }]}>
        <div className="p-8 text-center space-y-4 max-w-xl mx-auto my-12 bg-white border border-rose-200 rounded-3xl shadow-xs">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900">Không thể tải kết quả Speaking</h2>
          <p className="text-xs font-semibold text-rose-700">{error || "Không tìm thấy dữ liệu kết quả lượt làm bài từ máy chủ."}</p>
          <button
            onClick={() => navigate("/practice-modules")}
            className="px-6 py-2.5 bg-[#1e50e6] text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition cursor-pointer"
          >
            Quay lại Practice Modules
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "PRACTICE MODULE", href: "/practice-modules" },
        { label: "SPEAKING", href: "/practice-modules" },
        { label: `PART 1 - ${result.title.toUpperCase()}` }
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7">
        {/* Top Header Row matching Figma */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              PRACTICE MODULE &gt; SPEAKING &gt; PART 1 - {result.title.toUpperCase()}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Speaking Part 1: Result Analysis
            </h1>
            <p className="text-xs font-semibold text-slate-400">
              {result.title} • {new Date(result.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/practice-modules")}
              className="px-5 py-2.5 bg-[#1e50e6] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Practice Again</span>
            </button>

            <button className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition cursor-pointer shadow-2xs">
              <Share2 size={16} />
            </button>

            <button className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition cursor-pointer shadow-2xs">
              <Bookmark size={16} />
            </button>
          </div>
        </div>

        {/* Top Metrics Cards Row matching Figma */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Overall Score */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-2 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              OVERALL PERFORMANCE
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-blue-600 tracking-tight">
                {result.overall_band_score}
              </span>
              <span className="text-xs font-bold text-slate-400">/10</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600">
              <TrendingUp size={12} />
              <span>+{result.band_score_delta || 0.5} vs last attempt</span>
            </div>
          </div>

          {/* Pronunciation */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Pronunciation
              </span>
              <span className="text-xs font-extrabold text-slate-800">{result.pronunciation_score}/10</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(result.pronunciation_score / 10) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-blue-600 block">Excellent</span>
          </div>

          {/* Fluency */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Fluency
              </span>
              <span className="text-xs font-extrabold text-slate-800">{result.fluency_score}/10</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(result.fluency_score / 10) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 block">Stable</span>
          </div>

          {/* Vocabulary */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Vocabulary
              </span>
              <span className="text-xs font-extrabold text-slate-800">{result.lexical_score}/10</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-800 rounded-full" style={{ width: `${(result.lexical_score / 10) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-slate-700 block">High</span>
          </div>

          {/* Grammar */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Grammar
              </span>
              <span className="text-xs font-extrabold text-slate-800">{result.grammar_score}/10</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(result.grammar_score / 10) * 100}%` }} />
            </div>
            <span className="text-[10px] font-bold text-amber-600 block">Good</span>
          </div>
        </div>

        {/* Main Content Split: Left (Audio & Questions) vs Right (AI Insights & Feedback) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Main Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Audio Player Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-[#1e50e6] text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                  <span>{currentTime}</span>
                  <span>{duration}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative cursor-pointer">
                  <div className="h-full bg-[#1e50e6] rounded-full w-1/4" />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <Volume2 size={18} />
                </button>
              </div>
            </div>

            {/* Transcript Legend & Questions Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Legend bar */}
              <div className="flex items-center gap-4 text-xs font-bold border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Good Use</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Needs Improvement</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Pauses</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {result.questions_detail?.map((q, idx) => (
                  <div key={idx} className="space-y-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase text-slate-400">
                        QUESTION {idx + 1}
                      </h3>
                    </div>

                    <p className="text-sm font-extrabold text-slate-900">
                      "{q.question_text}"
                    </p>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                        CÂU TRẢ LỜI CỦA BẠN (TRANSCRIPT):
                      </span>
                      {q.user_transcript || "Chưa có dữ liệu bản bóc băng cho câu hỏi này."}
                    </div>

                    {q.sample_response && (
                      <div className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl space-y-2 border border-indigo-500/30">
                        <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                          <BookOpen size={13} />
                          GỢI Ý CÂU TRẢ LỜI MẪU HOÀN CHỈNH (BAND 8.0+ SAMPLE ANSWER):
                        </span>
                        <p className="text-xs text-indigo-100 font-medium leading-relaxed whitespace-pre-wrap">
                          {q.sample_response}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Main Column */}
          <div className="lg:col-span-4 space-y-6">
            {(() => {
              const fb = parseSpeakingFeedback(result.ai_insights_summary)

              return (
                <>
                  {/* AI Insights Summary (Blue Card) */}
                  <div className="bg-[#1e50e6] text-white rounded-3xl p-6 shadow-md space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} />
                      <span>Phân tích tổng quan (AI Insights)</span>
                    </h3>
                    <p className="text-xs font-medium leading-relaxed text-blue-100 whitespace-pre-wrap">
                      {fb.ai_insights || fb.raw_text || "Chưa có nhận xét tổng quan từ máy chủ."}
                    </p>
                  </div>

                  {/* Pronunciation Feedback */}
                  {fb.pronunciation_feedback && typeof fb.pronunciation_feedback === "object" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                        <Sparkles size={14} />
                        <span>1. Phát âm (Pronunciation)</span>
                      </h3>
                      <div className="space-y-1 text-xs text-slate-700 font-medium">
                        {fb.pronunciation_feedback.word && (
                          <p className="font-extrabold text-blue-900">• Từ chú ý: "{fb.pronunciation_feedback.word}"</p>
                        )}
                        {fb.pronunciation_feedback.issue && (
                          <p>• Lỗi: {fb.pronunciation_feedback.issue}</p>
                        )}
                        {fb.pronunciation_feedback.tip && (
                          <p className="text-blue-800 font-semibold">• Mẹo: {fb.pronunciation_feedback.tip}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grammar Feedback */}
                  {fb.grammar_feedback && typeof fb.grammar_feedback === "object" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                        <Sparkles size={14} />
                        <span>2. Ngữ pháp (Grammar)</span>
                      </h3>
                      <div className="space-y-1 text-xs text-amber-950 font-medium">
                        {fb.grammar_feedback.structure && (
                          <p className="font-bold text-amber-900">• Cấu trúc: {fb.grammar_feedback.structure}</p>
                        )}
                        {fb.grammar_feedback.issue && (
                          <p className="leading-relaxed">• Nhận xét: {fb.grammar_feedback.issue}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fluency Feedback */}
                  {fb.fluency_feedback && typeof fb.fluency_feedback === "object" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                        <Sparkles size={14} />
                        <span>3. Độ lưu loát (Fluency)</span>
                      </h3>
                      <div className="space-y-1 text-xs text-emerald-950 font-medium">
                        {fb.fluency_feedback.positive_point && (
                          <p className="font-bold text-emerald-900">• Ưu điểm: {fb.fluency_feedback.positive_point}</p>
                        )}
                        {fb.fluency_feedback.note && (
                          <p className="leading-relaxed">• Khuyến nghị: {fb.fluency_feedback.note}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Feedback */}
                  {fb.vocabulary_feedback && typeof fb.vocabulary_feedback === "object" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                        <Sparkles size={14} />
                        <span>4. Từ vựng (Vocabulary)</span>
                      </h3>
                      <div className="space-y-1 text-xs text-indigo-950 font-medium">
                        {fb.vocabulary_feedback.positive_point && (
                          <p className="font-bold text-indigo-900">• Ưu điểm: {fb.vocabulary_feedback.positive_point}</p>
                        )}
                        {fb.vocabulary_feedback.positive_detail && (
                          <p className="text-indigo-800 font-medium">• Cụm từ hay: "{fb.vocabulary_feedback.positive_detail}"</p>
                        )}
                        {fb.vocabulary_feedback.note && (
                          <p className="leading-relaxed">• Gợi ý từ nâng cao: {fb.vocabulary_feedback.note}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}

            {/* Key Strengths */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Key Strengths</span>
                </h3>

                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                  {result.percentile_rank || "Top 15% User"}
                </span>
              </div>

              <div className="space-y-3">
                {result.key_strengths?.map((strength, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      {i + 1}. {strength.title}
                    </span>
                    <p className="text-xs text-slate-500 font-medium leading-snug">
                      {strength.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Growth */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span>Areas for Growth</span>
              </h3>

              <div className="space-y-4">
                {result.areas_for_growth?.map((area, i) => (
                  <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                        {area.category}: {area.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {area.desc}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs font-mono">
                      <span className="text-rose-600 line-through font-bold">{area.incorrect}</span>
                      <span>→</span>
                      <span className="text-emerald-600 font-bold">{area.correct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Resources */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BookOpen size={14} className="text-blue-600" />
                <span>Recommended Resources</span>
              </h3>

              <div className="space-y-3">
                {result.recommended_resources?.map((res, i) => (
                  <div key={i} className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between hover:bg-blue-100/50 transition cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-blue-900 block">{res.title}</span>
                      <span className="text-[10px] text-blue-600 font-medium block">{res.desc}</span>
                    </div>
                    <ArrowRight size={14} className="text-blue-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default SpeakingResultPage
