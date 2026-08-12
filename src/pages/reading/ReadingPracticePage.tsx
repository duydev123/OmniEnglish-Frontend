import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, ArrowLeft, LogOut, CheckCircle2, BookOpen, AlertCircle, Loader2, Save } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import ReadingPassageCard from '../../components/reading/ReadingPassageCard'
import MultipleChoiceTask from '../../components/reading/MultipleChoiceTask'
import SentenceCompletionTask from '../../components/reading/SentenceCompletionTask'
import HeadingMatchingTask from '../../components/reading/HeadingMatchingTask'
import TrueFalseNotGivenTask from '../../components/reading/TrueFalseNotGivenTask'
import LearningTipCard from '../../components/reading/LearningTipCard'
import { useToast } from '../../components/common/Toast'
import type { ReadingPassageData, QuestionTask } from '../../types/reading'
import {
  getPassages,
  startReadingSession,
  saveDraft,
  submitReading,
  type ReadingSession,
} from '../../services/readingApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPassageData(session: ReadingSession): ReadingPassageData {
  return {
    id: session.session_id,
    unitTitle: 'READING',
    passageTitle: session.title,
    imageUrl: session.image_url ?? undefined,
    paragraphs: session.content
      .split('\n\n')
      .filter(Boolean)
      .map((text, i) => ({ id: `p${i + 1}`, text })),
  }
}

function buildTasks(session: ReadingSession): QuestionTask[] {
  const tasks: QuestionTask[] = []

  session.multiple_choices.forEach((mc) => {
    tasks.push({
      id: `mc-${mc.id}`,
      taskNumber: mc.order,
      type: 'multiple_choice' as const,
      title: `Multiple Choice (Question ${mc.order})`,
      mcQuestion: mc.question_text,
      mcOptions: mc.options.map((opt, i) => ({ id: `${mc.id}-opt${i}`, text: opt })),
    })
  })

  session.fill_blanks.forEach((fb, i) => {
    tasks.push({
      id: `fb-${i}`,
      taskNumber: fb.order,
      type: 'completion' as const,
      title: `Sentence Completion (Task ${fb.order})`,
      sentenceTemplate: fb.passage_text,
      completionBlanks: fb.blanks.map((blank) => ({
        id: blank,
        label: blank,
        correctValue: '',
      })),
    })
  })

  if (session.heading_matchings) {
    session.heading_matchings.forEach((hm, i) => {
      tasks.push({
        id: `hm-${i}`,
        taskNumber: hm.order,
        type: 'matching' as const,
        title: `Heading Matching (Task ${hm.order})`,
        sentenceTemplate: hm.paragraphs.join('\n\n'),
        unassignedDefinitions: hm.headings,
      })
    })
  }

  session.true_false_not_given.forEach((tfng, i) => {
    tasks.push({
      id: `tfng-${i}`,
      taskNumber: tfng.order,
      type: 'tfng' as const,
      title: `True / False / Not Given (Task ${tfng.order})`,
      matchingPairs: tfng.statements.map((s, j) => ({
        id: `stmt-${j}`,
        term: s,
        definition: '',
      })),
    })
  })

  return tasks.sort((a, b) => a.taskNumber - b.taskNumber)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReadingPracticePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const passageId = searchParams.get('id')
  const { showToast } = useToast()

  const [session, setSession] = useState<ReadingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passageData, setPassageData] = useState<ReadingPassageData | null>(null)
  const [tasks, setTasks] = useState<QuestionTask[]>([])
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch session on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      setLoading(true)
      setError(null)

      try {
        let targetPassageId = passageId

        if (!targetPassageId) {
          const fallbackResponse = await getPassages({ page: 1, limit: 1 })
          const fallbackId = fallbackResponse.items?.[0]?.id
          if (!fallbackId) throw new Error('Không có passage nào khả dụng')
          targetPassageId = fallbackId
          setSearchParams({ id: fallbackId }, { replace: true })
        }

        const s = await startReadingSession(targetPassageId)
        if (cancelled) return

        setSession(s)
        setPassageData(buildPassageData(s))
        setTasks(buildTasks(s))
        setSecondsRemaining(s.time_remaining_seconds)
        // Restore saved answers from existing draft/session
        setUserAnswers(s.user_answers || {})
      } catch (err: unknown) {
        if (cancelled) return
        const errorMessage =
          (err as { response?: { data?: { message?: string; detail?: string } }; message?: string })?.response?.data?.message ??
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err as { message?: string })?.message ??
          'Không thể tải bài đọc'
        setError(errorMessage)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSession()
    return () => { cancelled = true }
  }, [passageId, setSearchParams])

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          showToast('Hết giờ! Đang nộp bài...', 'error')
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // ── Manual + Auto-save draft ─────────────────────────────────────────────
  const handleSaveDraft = useCallback(async (silent = false) => {
    if (!session || submitting) return
    setSaving(true)
    try {
      await saveDraft(session.session_id, {
        time_remaining_seconds: secondsRemaining,
        user_answers: userAnswers,
      })
      if (!silent) {
        showToast('Draft saved successfully.', 'success')
      }
    } catch (err: unknown) {
      if (!silent) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Lưu nháp thất bại, vui lòng thử lại'
        showToast(msg, 'error')
      }
      // silent auto-save: do nothing on error
    } finally {
      setSaving(false)
    }
  }, [session, secondsRemaining, userAnswers, submitting, showToast])

  // Auto-save every 30s
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => handleSaveDraft(true), 30_000)
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    }
  }, [userAnswers, handleSaveDraft])

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!session || submitting) return
    setSubmitting(true)
    try {
      const result = await submitReading(session.session_id, {
        time_remaining_seconds: secondsRemaining,
        user_answers: userAnswers,
      })
      showToast(`Nộp bài thành công! Điểm: ${result.score}/${result.total_questions}`, 'success')
      navigate(`/reading/result?session_id=${session.session_id}`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Nộp bài thất bại, vui lòng thử lại'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const completedCount = Object.values(userAnswers).filter((val) => val && val.trim() !== '').length
  const totalCount = session?.total_questions ?? 0
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // ── Loading / Error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }, { label: 'READING' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải bài đọc...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !passageData || !session) {
    return (
      <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }, { label: 'READING' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} className="text-red-500" />
          <p className="text-slate-700 font-semibold">{error ?? 'Không tìm thấy bài đọc'}</p>
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

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'PRACTICE MODULE', href: '/practice' },
        { label: 'READING', href: '/practice?tab=reading' },
        { label: session.title.toUpperCase() },
      ]}
    >
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4">

        {/* Page Title */}
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {session.title}
          </h1>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium ml-2">
              <Loader2 size={12} className="animate-spin" /> Đang lưu...
            </span>
          )}
        </div>

        {/* ── Sticky Progress & Timer Bar ───────────────────────────────── */}
        <div
          className="sticky top-15 z-30 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-shadow"
          style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.07)' }}
        >
          <div className="w-full sm:w-2/3 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-800">Overall Lesson Progress</span>
              <span className="text-blue-600">{progressPct}% ({completedCount}/{totalCount} Questions)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shrink-0 border ${
            secondsRemaining < 60
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-slate-50 border-slate-200/80 text-slate-700'
          }`}>
            <Clock size={16} className={secondsRemaining < 60 ? 'text-red-500' : 'text-slate-500'} />
            <span>{formatTimer(secondsRemaining)} remaining</span>
          </div>
        </div>

        {/* Main Content: Passage + Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Reading Passage */}
          <div className="lg:sticky lg:top-20">
            <ReadingPassageCard passage={passageData} />
            {session.learning_tip && <LearningTipCard tip={session.learning_tip} />}
          </div>

          {/* Right: Tasks */}
          <div className="space-y-6">
            {tasks.map((task) => {
              if (task.type === 'multiple_choice') {
                const questionKey = task.id.replace('mc-', '')
                const selectedOptionId = task.mcOptions?.find((opt) => opt.text === userAnswers[questionKey])?.id

                return (
                  <MultipleChoiceTask
                    key={task.id}
                    task={task}
                    selectedId={selectedOptionId}
                    onSelect={(_, optText) => {
                      setUserAnswers((prev) => ({ ...prev, [questionKey]: optText }))
                    }}
                  />
                )
              }

              if (task.type === 'completion') {
                return (
                  <SentenceCompletionTask
                    key={task.id}
                    task={task}
                    userAnswers={userAnswers}
                    onAnswerChange={(blankId, val) => {
                      setUserAnswers((prev) => ({ ...prev, [blankId]: val }))
                    }}
                  />
                )
              }

              if (task.type === 'matching') {
                return (
                  <HeadingMatchingTask
                    key={task.id}
                    task={task}
                    userAnswers={userAnswers}
                    onAnswerChange={(paragraphId, val) => {
                      setUserAnswers((prev) => ({ ...prev, [paragraphId]: val }))
                    }}
                  />
                )
              }

              if (task.type === 'tfng') {
                return (
                  <TrueFalseNotGivenTask
                    key={task.id}
                    task={task}
                    userAnswers={userAnswers}
                    onAnswerChange={(statementId, val) => {
                      setUserAnswers((prev) => ({ ...prev, [statementId]: val }))
                    }}
                  />
                )
              }

              return null
            })}
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay Lại</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Save Draft button — with toast feedback */}
            <button
              onClick={() => handleSaveDraft(false)}
              disabled={saving || submitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>{saving ? 'Đang lưu...' : 'Lưu nháp'}</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              <span>Thoát</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitting || saving}
              className="px-6 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs sm:text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{submitting ? 'Đang nộp...' : 'Nộp Bài'}</span>
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
