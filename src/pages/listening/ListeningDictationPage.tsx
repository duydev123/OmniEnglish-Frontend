import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Lightbulb, Loader2, AlertCircle, ArrowLeft, Save, LogOut, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Check, Trash2, Eye } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import DictationAudioPlayer, { type DictationAudioPlayerRef } from '../../components/listening/DictationAudioPlayer'
import { useToast } from '../../components/common/Toast'
import {
  getListeningPassages,
  saveListeningDraft,
  startListeningSession,
  submitListening,
  type ListeningSession,
} from '../../services/listeningApi'

// Helpers for tokenizing and finding blank spots
const tokenizeSentence = (sentence: string) => {
  const regex = /([a-zA-Z0-9']+)|([^\s\w']+)|(\s+)/g
  const matches = [...sentence.matchAll(regex)]
  return matches.map(m => m[0])
}

const getBlankIndices = (tokens: string[]) => {
  const indices: number[] = []
  let wordCounter = 0
  tokens.forEach((token, idx) => {
    if (/^[a-zA-Z0-9']+$/.test(token)) {
      wordCounter++
      // Hide every 3rd word, starting from the 3rd word (wordCounter % 3 === 0)
      // Exclude very short words (length <= 2)
      const clean = token.replace(/[']/g, "")
      if (clean.length > 2 && wordCounter % 3 === 0) {
        indices.push(idx)
      }
    }
  })
  return indices
}

export default function ListeningDictationPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  
  const [session, setSession] = useState<ListeningSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Interactive sentence-by-sentence states
  const [mode, setMode] = useState<'full' | 'keywords'>('full')
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  
  // Storing answers for all sentences
  const [userTypedSentences, setUserTypedSentences] = useState<Record<number, string>>({})
  const [userBlankSentences, setUserBlankSentences] = useState<Record<number, Record<number, string>>>({})
  
  // Checking status
  const [checkedSentences, setCheckedSentences] = useState<Record<number, boolean>>({})
  const [revealedSentences, setRevealedSentences] = useState<Record<number, boolean>>({})

  const playerRef = useRef<DictationAudioPlayerRef>(null)

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

  const currentSegment = session?.interactive_transcript?.[currentSentenceIndex]
  const tokens = currentSegment ? tokenizeSentence(currentSegment.en) : []
  const blankIndices = getBlankIndices(tokens)

  // Reconstruct sentence text based on current state to send to backend on save/submit
  const reconstructSentence = (idx: number) => {
    const segment = session?.interactive_transcript?.[idx]
    if (!segment) return ''
    
    // If the user typed in full mode, return it
    if (userTypedSentences[idx] !== undefined) {
      return userTypedSentences[idx]
    }
    
    // If they typed in keywords mode, reconstruct
    const segTokens = tokenizeSentence(segment.en)
    const segBlankIndices = getBlankIndices(segTokens)
    const blanks = userBlankSentences[idx] || {}
    
    return segTokens.map((token, tokenIdx) => {
      if (segBlankIndices.includes(tokenIdx)) {
        return blanks[tokenIdx] || ''
      }
      return token
    }).join('')
  }

  const getCombinedText = () => {
    if (!session) return ''
    return session.interactive_transcript
      .map((_, idx) => reconstructSentence(idx).trim())
      .filter(Boolean)
      .join(' ')
  }

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    try {
      await saveListeningDraft(session.session_id, {
        session_type: 'DICTATION',
        user_typed_text: getCombinedText(),
      })
      showToast('Lưu nháp thành công.', 'success')
    } catch {
      showToast('Không thể lưu nháp, vui lòng thử lại', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!session) return
    setSubmitting(true)
    try {
      await submitListening(session.session_id, {
        session_type: 'DICTATION',
        user_typed_text: getCombinedText(),
      })
      showToast('Đang kiểm tra kết quả chép chính tả...', 'info')
      navigate(`/listening/result?session_id=${session.session_id}&tab=dictation`)
    } catch {
      showToast('Nộp bài thất bại, vui lòng thử lại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Clear answers for the current sentence
  const handleClearCurrent = () => {
    if (mode === 'full') {
      setUserTypedSentences(prev => ({ ...prev, [currentSentenceIndex]: '' }))
    } else {
      setUserBlankSentences(prev => ({ ...prev, [currentSentenceIndex]: {} }))
    }
    setCheckedSentences(prev => ({ ...prev, [currentSentenceIndex]: false }))
    setRevealedSentences(prev => ({ ...prev, [currentSentenceIndex]: false }))
  }

  // Show correct answer for current sentence
  const handleRevealAnswer = () => {
    if (!currentSegment) return
    setRevealedSentences(prev => ({ ...prev, [currentSentenceIndex]: !prev[currentSentenceIndex] }))
  }

  // Check current sentence
  const handleCheckCurrentSentence = () => {
    setCheckedSentences(prev => ({ ...prev, [currentSentenceIndex]: true }))
  }

  // Replay current sentence audio
  const handleReplaySegment = () => {
    if (currentSegment && playerRef.current) {
      playerRef.current.playSegment(currentSegment.start_time, currentSegment.end_time)
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

  const totalSentences = session.interactive_transcript.length

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

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1D4ED8] rounded-full transition-all duration-300" 
            style={{ width: `${((currentSentenceIndex + 1) / totalSentences) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Audio Player */}
            <DictationAudioPlayer
              ref={playerRef}
              audioUrl={session.audio_url}
              interactiveTranscript={session.interactive_transcript}
              activeSegment={currentSegment}
            />

            {/* Mode selection & Controls */}
            <div className="flex flex-col items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span>Chọn chế độ:</span>
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as 'full' | 'keywords')
                    setCheckedSentences(prev => ({ ...prev, [currentSentenceIndex]: false }))
                    setRevealedSentences(prev => ({ ...prev, [currentSentenceIndex]: false }))
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="full">Chép cả câu</option>
                  <option value="keywords">Chép từ khóa / Điền từ</option>
                </select>
              </div>

              {/* Toolbar controls */}
              <div className="flex flex-wrap items-center justify-center border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden divide-x divide-slate-100">
                <button
                  onClick={() => {
                    if (currentSentenceIndex > 0) {
                      setCurrentSentenceIndex(prev => prev - 1)
                    }
                  }}
                  disabled={currentSentenceIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Câu trước</span>
                </button>

                <button
                  onClick={handleReplaySegment}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} className="text-slate-500 animate-hover" />
                  <span>Nghe lại</span>
                </button>

                <button
                  onClick={handleCheckCurrentSentence}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Check size={16} />
                  <span>Kiểm tra</span>
                </button>

                <button
                  onClick={() => {
                    if (currentSentenceIndex < totalSentences - 1) {
                      setCurrentSentenceIndex(prev => prev + 1)
                    }
                  }}
                  disabled={currentSentenceIndex === totalSentences - 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                >
                  <span>Câu sau</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Input Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                <span>Câu {currentSentenceIndex + 1} / {totalSentences}</span>
                <span>Thời gian: {currentSegment?.start_time} - {currentSegment?.end_time}</span>
              </div>

              {/* Interactive Writing Area */}
              <div className="min-h-[120px] flex items-center justify-center p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                {mode === 'full' ? (
                  <textarea
                    value={userTypedSentences[currentSentenceIndex] || ''}
                    onChange={(e) => {
                      setUserTypedSentences(prev => ({ ...prev, [currentSentenceIndex]: e.target.value }))
                    }}
                    placeholder="Bắt đầu gõ câu bạn nghe thấy..."
                    rows={4}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent text-sm sm:text-base leading-relaxed resize-none shadow-2xs"
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-y-3 gap-x-1.5 text-slate-800 font-semibold text-sm sm:text-base leading-loose w-full">
                    {tokens.map((token, idx) => {
                      const isBlank = blankIndices.includes(idx)
                      if (!isBlank) {
                        return <span key={idx}>{token}</span>
                      }

                      const userVal = (userBlankSentences[currentSentenceIndex] || {})[idx] || ''
                      const isCorrect = userVal.trim().toLowerCase() === token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().toLowerCase()
                      const isChecked = checkedSentences[currentSentenceIndex]

                      return (
                        <input
                          key={idx}
                          type="text"
                          value={userVal}
                          onChange={(e) => {
                            setUserBlankSentences(prev => ({
                              ...prev,
                              [currentSentenceIndex]: {
                                ...(prev[currentSentenceIndex] || {}),
                                [idx]: e.target.value
                              }
                            }))
                          }}
                          placeholder="..."
                          style={{ width: `${Math.max(5, token.length) * 11}px` }}
                          className={`px-2 py-0.5 border text-center font-bold text-sm rounded-md transition-all outline-none focus:ring-2 focus:ring-blue-600 ${
                            isChecked
                              ? isCorrect
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-red-500 bg-red-50 text-red-700'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          }`}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Reveal answer block */}
              {revealedSentences[currentSentenceIndex] && currentSegment && (
                <div className="p-4 bg-green-50/55 border border-green-200/80 rounded-xl space-y-1">
                  <p className="text-xs font-extrabold text-green-800 uppercase tracking-wide">Đáp án đúng:</p>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">{currentSegment.en}</p>
                  {currentSegment.vi && (
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">{currentSegment.vi}</p>
                  )}
                </div>
              )}

              {/* Checking Feedback for Full sentence */}
              {mode === 'full' && checkedSentences[currentSentenceIndex] && currentSegment && (
                <div className="p-4 bg-blue-50/50 border border-blue-200/70 rounded-xl space-y-2">
                  <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wide">Kết quả đối chiếu:</p>
                  <div className="text-sm font-semibold text-slate-800 space-y-1 leading-relaxed">
                    <p><span className="text-slate-400 mr-1.5 font-bold">Của bạn:</span> {userTypedSentences[currentSentenceIndex] || <span className="italic text-slate-400">(Trống)</span>}</p>
                    <p><span className="text-slate-400 mr-1.5 font-bold">Đúng:</span> {currentSegment.en}</p>
                  </div>
                </div>
              )}

              {/* Bottom utilities inside card */}
              <div className="flex justify-center gap-4 border-t border-slate-100 pt-4">
                <button
                  onClick={handleClearCurrent}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Xóa hết</span>
                </button>

                <button
                  onClick={handleRevealAnswer}
                  className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    revealedSentences[currentSentenceIndex]
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Eye size={14} />
                  <span>{revealedSentences[currentSentenceIndex] ? 'Ẩn đáp án' : 'Đáp án'}</span>
                </button>
              </div>

              {/* Footer navigation and final submit */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
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
                    onClick={() => void handleFinalSubmit()}
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

          {/* Right sidebar */}
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
