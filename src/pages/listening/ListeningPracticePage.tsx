import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, ArrowLeft, CheckCircle2, BookMarked, Loader2, AlertCircle, Save, Play, LogOut } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import AudioPlayerCard, { type AudioPlayerRef } from '../../components/listening/AudioPlayerCard'
import { useToast } from '../../components/common/Toast'
import { getApiErrorMessage } from '../../utils/error'
import {
  getListeningPassages,
  saveListeningDraft,
  startListeningSession,
  submitListening,
  type ListeningSession,
} from '../../services/listeningApi'

function formatTimer(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function ListeningPracticePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const audioPlayerRef = useRef<AudioPlayerRef>(null)

  const [session, setSession] = useState<ListeningSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadSession = async () => {
      setLoading(true)
      setError(null)

      try {
        let targetPassageId = searchParams.get('id')

        if (!targetPassageId) {
          const fallbackResponse = await getListeningPassages({ page: 1, limit: 1 })
          const fallbackId = fallbackResponse.items?.[0]?.id
          if (!fallbackId) {
            throw new Error('Không có bài nghe nào khả dụng')
          }
          targetPassageId = fallbackId
          setSearchParams({ id: fallbackId }, { replace: true })
        }

        const startedSession = await startListeningSession(targetPassageId, 'COMPREHENSION')
        if (cancelled) return

        setSession(startedSession)
        setAnswers(startedSession.user_answers || {})
        setSecondsRemaining(startedSession.time_remaining_seconds ?? (startedSession.time_limit_minutes * 60))
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          (err as { message?: string })?.message ??
          'Không thể tải bài nghe'
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSession()
    return () => {
      cancelled = true
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!session || secondsRemaining <= 0) return

    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          void handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [session, secondsRemaining])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      await saveListeningDraft(session.session_id, {
        session_type: 'COMPREHENSION',
        time_remaining_seconds: secondsRemaining,
        user_answers: answers,
      })
      showToast('Draft saved successfully.', 'success')
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể lưu nháp, vui lòng thử lại'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (!session || submitting) return
    setSubmitting(true)
    try {
      const result = await submitListening(session.session_id, {
        session_type: 'COMPREHENSION',
        time_remaining_seconds: secondsRemaining,
        user_answers: answers,
      })
      showToast(autoSubmit ? 'Hết giờ, hệ thống đã nộp bài' : `Nộp bài thành công! Điểm: ${result.accuracy_rate ?? 0}%`, 'success')
      navigate(`/listening/result?session_id=${session.session_id}`)
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Nộp bài thất bại, vui lòng thử lại'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const completedCount = Object.values(answers).filter((val) => val && String(val).trim() !== '').length
  const totalCount = session?.total_questions ?? 0
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const renderBlankInputs = (templateText: string) => {
    const blankIds = Array.from(templateText.matchAll(/\[([^\]]+)\]/g), (match) => match[1])

    if (blankIds.length === 0) {
      return <p className="text-sm text-slate-700">{templateText}</p>
    }

    const parts = templateText.split(/\[[^\]]+\]/g)
    return (
      <div className="flex flex-wrap gap-2 items-center text-sm text-slate-700 leading-relaxed">
        {parts.map((part, index) => (
          <span key={`${part}-${index}`} className="inline-flex items-center gap-2">
            {part}
            {index < blankIds.length && (
              <input
                key={`${blankIds[index]}-${index}`}
                type="text"
                value={answers[blankIds[index]] ?? ''}
                onChange={(e) => handleAnswerChange(blankIds[index], e.target.value)}
                className="border-b-2 border-slate-400 focus:border-blue-600 bg-transparent outline-none px-2 py-0.5 text-center font-bold text-blue-900 min-w-28"
                placeholder="..."
              />
            )}
          </span>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện nghe', href: '/practice-modules/listening' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải bài nghe...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !session) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện nghe', href: '/practice-modules/listening' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} className="text-red-500" />
          <p className="text-slate-700 font-bold">{error || 'Không tìm thấy bài nghe này!'}</p>
          <button
            onClick={() => navigate('/practice-modules/listening')}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition cursor-pointer"
          >
            Quay lại Luyện nghe
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Luyện tập', href: '/practice-modules' },
        { label: 'Luyện nghe', href: '/practice-modules/listening' },
        { label: session.unit_code ?? 'Luyện nghe' },
      ]}
    >
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
            {session.title}
          </h1>
          {session.unit_code && <p className="text-sm text-slate-500">{session.unit_code}</p>}
        </div>

        <div className="bg-white border border-slate-400/60 rounded-2xl p-4 shadow-glow-4side flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-2/3 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-800">Overall Lesson Progress</span>
              <span className="text-blue-600">{progressPercent}% ({completedCount}/{totalCount} Questions)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl text-slate-700 font-semibold text-xs sm:text-sm shrink-0">
            <Clock size={16} className="text-slate-500" />
            <span>{formatTimer(secondsRemaining)} remaining</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <AudioPlayerCard
              ref={audioPlayerRef}
              clipName={session.title}
              duration={`${session.time_limit_minutes}:00`}
              audioUrl={session.audio_url}
              onToggleTranscript={() => setShowTranscript(prev => !prev)}
            />

            {showTranscript && session.interactive_transcript?.length > 0 && (
              <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side space-y-3">
                <h3 className="font-bold text-slate-900">Interactive Transcript</h3>
                <div className="space-y-2 max-h-72 overflow-auto pr-2">
                  {session.interactive_transcript.map((item, index) => (
                    <div key={`${item.start_time}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="text-[11px] font-bold uppercase text-slate-500">{item.start_time} - {item.end_time}</p>
                      <p className="mt-1 text-slate-800">{item.en}</p>
                      <p className="mt-1 text-slate-500">{item.vi}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {session.multiple_choices?.map((question, index) => (
              <div key={question.id} className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{question.question_text}</h3>
                      <p className="text-xs text-slate-500 font-normal">Choose the best answer from the options below.</p>
                    </div>
                  </div>
                  {question.timestamp_clip && (
                    <button
                      onClick={() => audioPlayerRef.current?.seekTo(question.timestamp_clip!)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Play Clip ({question.timestamp_clip})</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 pt-2">
                  {question.options.map((opt) => {
                    const isSelected = answers[question.id] === opt
                    return (
                      <div
                        key={`${question.id}-${opt}`}
                        onClick={() => handleAnswerChange(question.id, opt)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-xs sm:text-sm font-medium ${isSelected
                          ? 'bg-blue-50/80 border-2 border-[#1D4ED8] text-blue-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                          }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-[#1D4ED8] bg-[#1D4ED8]' : 'border-slate-300'
                            }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {session.completions?.map((completion, index) => (
              <div key={completion.id} className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {session.multiple_choices.length + index + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">Complete the sentence</h3>
                    <p className="text-xs text-slate-500 font-normal">Fill in each blank using the words you heard.</p>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 leading-relaxed">
                  {renderBlankInputs(completion.template_text)}
                </div>
              </div>
            ))}

            <div className="bg-white border border-slate-400/60 rounded-2xl p-4 shadow-glow-4side flex items-center justify-between">
              <button
                onClick={() => navigate('/practice')}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Quay Lại</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{saving ? 'Đang lưu...' : 'Lưu nháp'}</span>
                </button>

                <button
                  onClick={() => navigate('/practice')}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Thoát</span>
                </button>

                <button
                  onClick={() => void handleSubmit(false)}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 disabled:opacity-70 transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Đang nộp...' : 'Nộp Bài'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side space-y-4">
              <div className="flex items-center gap-2">
                <BookMarked size={18} className="text-[#1D4ED8]" />
                <h3 className="font-bold text-slate-900 text-base">Key Vocabulary</h3>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {session.key_vocabulary?.map((word) => (
                  <div key={word.word} className="pt-2">
                    <h4 className="font-bold text-blue-900 text-xs">{word.word}</h4>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">{word.definition ?? word.meaning ?? 'Vocabulary from the passage'}</p>
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

