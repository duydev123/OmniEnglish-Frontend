import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LogOut, RotateCcw, Headphones, PenTool, BookOpen, Loader2, AlertCircle, Trophy, X, CheckCircle2 } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import ReadingScoreGauge from '../../components/reading/ReadingScoreGauge'
import SkillBreakdownCard from '../../components/reading/SkillBreakdownCard'
import DetailedReviewItem from '../../components/reading/DetailedReviewItem'
import type { SkillStat, ReviewQuestionItem, ReadingPassageData } from '../../types/reading'
import { getSessionReview, type ReadingSessionReview } from '../../services/readingApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPassageData(review: ReadingSessionReview): ReadingPassageData {
  return {
    id: review.passage_id,
    unitTitle: 'READING',
    passageTitle: review.passage_title,
    paragraphs: review.passage_content
      .split('\n\n')
      .filter(Boolean)
      .map((text, i) => ({ id: `p${i + 1}`, text })),
  }
}

function scoreToIELTS(score: number, total: number): number {
  if (total === 0) return 0
  const pct = score / total
  if (pct >= 0.9) return 9
  if (pct >= 0.8) return 8
  if (pct >= 0.7) return 7
  if (pct >= 0.6) return 6
  if (pct >= 0.5) return 5
  return 4
}

function levelFromScore(score: number): string {
  if (score >= 8.5) return 'C2'
  if (score >= 7.5) return 'C1'
  if (score >= 6) return 'B2+'
  if (score >= 5) return 'B2'
  if (score >= 4) return 'B1'
  return 'A2'
}

function messageFromScore(score: number): string {
  if (score >= 8) return 'Xuất sắc! Trình độ của bạn rất cao.'
  if (score >= 7) return 'Rất tốt! Bạn đang ở mức thành thạo.'
  if (score >= 6) return 'Tốt! Tiếp tục luyện tập để cải thiện.'
  if (score >= 5) return 'Được! Hãy ôn luyện thêm những phần còn yếu.'
  return 'Cần cố gắng thêm. Hãy xem lại bài kỹ hơn nhé!'
}

function buildReviews(review: ReadingSessionReview): ReviewQuestionItem[] {
  return Object.entries(review.detailed_results).map(([questionId, result], index) => {
    let typeLabel = 'Question'
    if (/^[0-9a-fA-F]{24}$/.test(questionId)) {
      typeLabel = 'Multiple Choice'
    } else if (questionId.startsWith('blank') || questionId.includes('blank')) {
      typeLabel = 'Fill Blank'
    } else if (questionId.startsWith('tf_') || questionId.includes('tf_')) {
      typeLabel = 'T/F/NG'
    } else if (questionId.startsWith('paragraph_') || questionId.includes('paragraph')) {
      typeLabel = 'Heading Matching'
    }

    let explanationParts: string[] = []
    if (result.excerpt) {
      explanationParts.push(`📍 Đoạn trích: "${result.excerpt}"`)
    }
    if (result.explanation) {
      explanationParts.push(`💡 Giải thích: ${result.explanation}`)
    }
    const explanation = explanationParts.length > 0 ? explanationParts.join('\n\n') : undefined

    return {
      id: questionId,
      qNumber: index + 1,
      typeLabel,
      questionText: result.statement ?? `Question ${index + 1}`,
      isCorrect: result.is_correct,
      userAnswer: result.user_answer || '(Không trả lời)',
      correctAnswer: result.correct_answer,
      explanation,
      options: result.options?.map((opt, i) => ({
        id: `opt-${i}`,
        text: opt,
        isUserAnswer: opt === result.user_answer,
        isCorrectAnswer: opt === result.correct_answer
      }))
    }
  })
}

function buildSkills(review: ReadingSessionReview): SkillStat[] {
  const results = Object.entries(review.detailed_results)
  const mcResults = results.filter(([k]) => /^[0-9a-fA-F]{24}$/.test(k))
  const blankResults = results.filter(([k]) => k.startsWith('blank') || k.includes('blank'))
  const tfngResults = results.filter(([k]) => k.startsWith('tf_') || k.includes('tf_'))
  const headingResults = results.filter(([k]) => k.startsWith('paragraph_') || k.includes('paragraph'))

  const skills: SkillStat[] = []

  if (mcResults.length > 0) {
    const correct = mcResults.filter(([, r]) => r.is_correct).length
    skills.push({
      id: 's-mc',
      title: 'Multiple Choice',
      description: 'Chú ý đọc chi tiết',
      correctCount: correct,
      totalCount: mcResults.length,
      percentage: Math.round((correct / mcResults.length) * 100),
      color: 'blue',
      iconType: 'choice',
    })
  }

  if (tfngResults.length > 0) {
    const correct = tfngResults.filter(([, r]) => r.is_correct).length
    skills.push({
      id: 's-tfng',
      title: 'True / False / Not Given',
      description: 'Phân tích ngữ nghĩa',
      correctCount: correct,
      totalCount: tfngResults.length,
      percentage: Math.round((correct / tfngResults.length) * 100),
      color: 'emerald',
      iconType: 'tfng',
    })
  }

  if (blankResults.length > 0) {
    const correct = blankResults.filter(([, r]) => r.is_correct).length
    skills.push({
      id: 's-blank',
      title: 'Fill in the Blank',
      description: 'Cải thiện từ vựng',
      correctCount: correct,
      totalCount: blankResults.length,
      percentage: Math.round((correct / blankResults.length) * 100),
      color: 'rose',
      iconType: 'matching',
    })
  }

  if (headingResults.length > 0) {
    const correct = headingResults.filter(([, r]) => r.is_correct).length
    skills.push({
      id: 's-heading',
      title: 'Heading Matching',
      description: 'Tìm ý chính đoạn văn',
      correctCount: correct,
      totalCount: headingResults.length,
      percentage: Math.round((correct / headingResults.length) * 100),
      color: 'rose',
      iconType: 'matching',
    })
  }

  return skills
}

// ─── Component ───────────────────────────────────────────────────────────────

const CONTINUE_MODULES = [
  {
    id: 'm1',
    title: 'Listening Practice',
    description: 'Luyện nghe với người bản ngữ trong các tình huống thực tế.',
    category: 'listening' as const,
    href: '/listening/practice',
  },
  {
    id: 'm2',
    title: 'Writing: Task 1',
    description: 'Học cách mô tả xu hướng trong biểu đồ và bảng số liệu.',
    category: 'writing' as const,
    href: '/writing',
  },
  {
    id: 'm3',
    title: 'Vocabulary Builder',
    description: 'Nắm vững 50 từ học thuật thường dùng trong bài đọc IELTS.',
    category: 'vocabulary' as const,
    href: '/vocabulary',
  },
]

export default function ReadingResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [review, setReview] = useState<ReadingSessionReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeQuestionId, setActiveQuestionId] = useState<string>('')
  const [selectedModalQuestion, setSelectedModalQuestion] = useState<ReviewQuestionItem | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Không có session_id trong URL')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getSessionReview(sessionId)
      .then((data) => {
        if (cancelled) return
        setReview(data)
        const firstKey = Object.keys(data.detailed_results)[0]
        if (firstKey) setActiveQuestionId(firstKey)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.detail ?? err.message ?? 'Không thể tải kết quả')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [sessionId])

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }, { label: 'READING' }, { label: 'KẾT QUẢ' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải kết quả...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !review) {
    return (
      <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }, { label: 'READING' }, { label: 'KẾT QUẢ' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} className="text-red-500" />
          <p className="text-slate-700 font-semibold">{error ?? 'Không tìm thấy kết quả'}</p>
          <button
            onClick={() => navigate('/practice')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition"
          >
            Quay lại Practice Hub
          </button>
        </div>
      </AppLayout>
    )
  }

  const passageData = buildPassageData(review)
  const reviews = buildReviews(review)
  const skills = buildSkills(review)
  const ieltsScore = scoreToIELTS(review.score, review.total_questions)
  const level = levelFromScore(ieltsScore)
  const message = messageFromScore(ieltsScore)

  return (<>
    <AppLayout
      breadcrumbs={[
        { label: 'PRACTICE MODULE', href: '/practice' },
        { label: 'READING', href: '/practice?tab=reading' },
        { label: 'KẾT QUẢ' },
      ]}
    >
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy size={28} className="text-amber-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Hoàn thành bài luyện tập!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {review.passage_title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-2xs flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>Thoát</span>
            </button>

            <button
              onClick={() => navigate('/practice?tab=reading')}
              className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2"
            >
              <RotateCcw size={16} />
              <span>Thử lại</span>
            </button>
          </div>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ReadingScoreGauge
              score={ieltsScore}
              proficiencyLevel={level}
              message={message}
            />
          </div>
          {skills.map((skill) => (
            <SkillBreakdownCard key={skill.id} skill={skill} />
          ))}
        </div>

        {/* Detailed Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Chi tiết đánh giá
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Đúng
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                Sai
              </span>
            </div>
          </div>

          <div className="bg-slate-100/70 border border-slate-200/90 rounded-2xl p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Passage */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4 max-h-[600px] overflow-y-auto">
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight">
                {passageData.passageTitle}
              </h3>
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                {passageData.paragraphs.map((p) => (
                  <p key={p.id}>{p.text}</p>
                ))}
              </div>
            </div>

            {/* Right: Question reviews */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {reviews.map((item) => (
                <DetailedReviewItem
                  key={item.id}
                  item={item}
                  isSelected={activeQuestionId === item.id}
                  onClick={() => {
                    setActiveQuestionId(item.id)
                    setSelectedModalQuestion(item)
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Tiếp tục học
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {CONTINUE_MODULES.map((mod) => {
              const Icon =
                mod.category === 'listening'
                  ? Headphones
                  : mod.category === 'writing'
                    ? PenTool
                    : BookOpen
              const iconColor =
                mod.category === 'listening'
                  ? 'text-blue-600'
                  : mod.category === 'writing'
                    ? 'text-indigo-600'
                    : 'text-teal-600'

              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.href)}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                    <Icon size={20} className={iconColor} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-[#1D4ED8] transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal mt-1 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>

    {/* ─── Question Detail Modal ─────────────────────────────────────────── */}
    {selectedModalQuestion && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setSelectedModalQuestion(null)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />

        {/* Panel */}
        <div
          className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b ${selectedModalQuestion.isCorrect ? 'border-emerald-100' : 'border-rose-100'
            }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedModalQuestion.isCorrect
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
                }`}>
                {selectedModalQuestion.isCorrect
                  ? <CheckCircle2 size={18} className="stroke-[2.5]" />
                  : <X size={18} className="stroke-[2.5]" />
                }
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Q{selectedModalQuestion.qNumber} • {selectedModalQuestion.typeLabel}
                </span>
                <span className={`text-xs font-black uppercase tracking-wide ${selectedModalQuestion.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                  {selectedModalQuestion.isCorrect ? 'Đúng' : 'Sai'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedModalQuestion(null)}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Question text */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Câu hỏi</p>
              <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {selectedModalQuestion.questionText}
              </p>
            </div>

            {/* Options if available */}
            {selectedModalQuestion.options && selectedModalQuestion.options.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Các lựa chọn</p>
                <div className="space-y-2">
                  {selectedModalQuestion.options.map((opt) => {
                    const isUser = opt.isUserAnswer
                    const isCorrectOpt = opt.isCorrectAnswer

                    let cls = 'bg-slate-50 border-slate-200 text-slate-700'
                    let badge = null

                    if (isCorrectOpt && isUser) {
                      cls = 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      badge = <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg shrink-0">Đúng & của bạn</span>
                    } else if (isCorrectOpt) {
                      cls = 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      badge = <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg shrink-0">Đáp án đúng</span>
                    } else if (isUser) {
                      cls = 'bg-rose-50 border-rose-300 text-rose-800'
                      badge = <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg shrink-0">Câu của bạn</span>
                    }

                    return (
                      <div key={opt.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs sm:text-sm font-medium ${cls}`}>
                        <span>{opt.text}</span>
                        {badge}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Plain user/correct answer for fill blank & heading */}
            {(!selectedModalQuestion.options || selectedModalQuestion.options.length === 0) && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Câu trả lời của bạn</p>
                  <p className={`text-sm font-bold ${selectedModalQuestion.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                    {selectedModalQuestion.userAnswer || '(Không trả lời)'}
                  </p>
                </div>
                {!selectedModalQuestion.isCorrect && selectedModalQuestion.correctAnswer && (
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Đáp án đúng</p>
                    <p className="text-sm font-bold text-emerald-800">{selectedModalQuestion.correctAnswer}</p>
                  </div>
                )}
              </div>
            )}

            {/* Explanation & Excerpt */}
            {selectedModalQuestion.explanation && (
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-600 font-normal leading-relaxed whitespace-pre-line">
                {selectedModalQuestion.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>)
}
