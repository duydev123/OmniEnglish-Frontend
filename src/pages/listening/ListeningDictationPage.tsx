import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lightbulb, Loader2, AlertCircle, ArrowLeft, Save, LogOut, CheckCircle2 } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import DictationAudioPlayer from '../../components/listening/DictationAudioPlayer'
import { useToast } from '../../components/common/Toast'
import {
  getListeningPassages,
  saveListeningDraft,
  startListeningSession,
  submitListening,
  type ListeningSession,
} from '../../services/listeningApi'

export default function ListeningDictationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const [dictationText, setDictationText] = useState('')
  const [session, setSession] = useState<ListeningSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)

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

        const startedSession = await startListeningSession(targetPassageId, 'DICTATION')
        if (cancelled) return
        setSession(startedSession)
        setDictationText(startedSession.user_typed_text || '')
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

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      await saveListeningDraft(session.session_id, {
        session_type: 'DICTATION',
        user_typed_text: dictationText,
      })
      showToast('Draft saved successfully.', 'success')
    } catch {
      showToast('Không thể lưu nháp, vui lòng thử lại', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCheckAnswer = async () => {
    if (!session) return
    setSubmitting(true)
    try {
      await submitListening(session.session_id, {
        session_type: 'DICTATION',
        user_typed_text: dictationText,
      })
      showToast('Đang kiểm tra kết quả chép chính tả...', 'info')
      navigate(`/listening/result?session_id=${session.session_id}&tab=dictation`)
    } catch {
      showToast('Nộp bài thất bại, vui lòng thử lại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }, { label: 'LISTENING' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải bài dictation...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !session) {
    return (
      <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }, { label: 'LISTENING' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} className="text-red-500" />
          <p className="text-slate-700 font-semibold">{error ?? 'Không tìm thấy bài nghe'}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'PRACTICE MODULE', href: '/practice' },
        { label: 'LISTENING', href: '/practice?tab=listening' },
        { label: session.title },
      ]}
    >
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          {session.title}
        </h1>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1D4ED8] rounded-full w-[45%]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <DictationAudioPlayer
              audioUrl={session.audio_url}
              interactiveTranscript={session.interactive_transcript}
            />

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
              <textarea
                value={dictationText}
                onChange={(e) => setDictationText(e.target.value)}
                placeholder="Bắt đầu gõ những gì bạn nghe thấy..."
                rows={6}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent text-sm sm:text-base leading-relaxed resize-none shadow-2xs"
              />
              <div className="flex items-center justify-between pt-2">
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
                    onClick={() => void handleCheckAnswer()}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 disabled:opacity-70 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>{submitting ? 'Đang nộp...' : 'Nộp Bài'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-[#1D4ED8]" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">KEY VOCABULARY</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {session.key_vocabulary?.slice(0, 5).map((word) => (
                  <span key={word.word} className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold border border-blue-100/80 shadow-2xs">
                    {word.word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
