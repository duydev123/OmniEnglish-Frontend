import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lightbulb, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Check, Trash2, Save, Sliders, Navigation, HelpCircle } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import DictationAudioPlayer, { type DictationAudioPlayerRef } from '../../components/listening/DictationAudioPlayer'
import { useToast } from '../../components/common/Toast'
import { getApiErrorMessage } from '../../utils/error'
import {
  getListeningPassages,
  saveListeningDraft,
  startListeningSession,
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  
  const [session, setSession] = useState<ListeningSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Interactive sentence-by-sentence states
  const [mode, setMode] = useState<'full' | 'keywords'>('full')
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  
  // Storing answers for all sentences
  const [userTypedSentences, setUserTypedSentences] = useState<Record<number, string>>({})
  const [userBlankSentences, setUserBlankSentences] = useState<Record<number, Record<number, string>>>({})
  
  // Checking status
  const [checkedSentences, setCheckedSentences] = useState<Record<number, boolean>>({})

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

        // Restore saved draft from localStorage or backend
        const draftKey = `dictation_draft_${targetPassageId}`
        const localDraft = localStorage.getItem(draftKey)
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft)
            if (parsed.typed) setUserTypedSentences(parsed.typed)
            if (parsed.blanks) setUserBlankSentences(parsed.blanks)
          } catch {
            if (startedSession.user_typed_text) {
              setUserTypedSentences({ 0: startedSession.user_typed_text })
            }
          }
        } else if (startedSession.user_typed_text) {
          setUserTypedSentences({ 0: startedSession.user_typed_text })
        }
      } catch (err: unknown) {
        if (cancelled) return
        setError(getApiErrorMessage(err, 'Không thể tải bài nghe'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSession()
    return () => {
      cancelled = true
    }
  }, [searchParams, setSearchParams])

  const getCompletedSentencesCount = () => {
    if (!session?.interactive_transcript) return 0
    let count = 0
    session.interactive_transcript.forEach((_, idx) => {
      const typed = userTypedSentences[idx]
      const blanks = userBlankSentences[idx]
      const hasTyped = typed !== undefined && typed.trim().length > 0
      const hasBlanks = blanks !== undefined && Object.values(blanks).some(v => v && v.trim().length > 0)
      if (hasTyped || hasBlanks) {
        count++
      }
    })
    return count
  }

  // Auto-save draft changes to localStorage
  useEffect(() => {
    if (session?.passage_id && (Object.keys(userTypedSentences).length > 0 || Object.keys(userBlankSentences).length > 0)) {
      const completedCount = getCompletedSentencesCount()
      const totalCount = session.interactive_transcript.length
      localStorage.setItem(`dictation_draft_${session.passage_id}`, JSON.stringify({
        typed: userTypedSentences,
        blanks: userBlankSentences,
        completed_sentences: completedCount,
        total_sentences: totalCount,
      }))
    }
  }, [session, userTypedSentences, userBlankSentences])

  const currentSegment = session?.interactive_transcript?.[currentSentenceIndex]
  const tokens = currentSegment ? tokenizeSentence(currentSegment.en) : []
  const blankIndices = getBlankIndices(tokens)

  // Reconstruct sentence text based on current state to send to backend on save draft
  const reconstructSentence = (idx: number) => {
    const segment = session?.interactive_transcript?.[idx]
    if (!segment) return ''

    if (userTypedSentences[idx] !== undefined) {
      return userTypedSentences[idx]
    }

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
      const combined = getCombinedText()
      const completedCount = getCompletedSentencesCount()
      const totalCount = session.interactive_transcript.length
      localStorage.setItem(`dictation_draft_${session.passage_id}`, JSON.stringify({
        typed: userTypedSentences,
        blanks: userBlankSentences,
        combined,
        completed_sentences: completedCount,
        total_sentences: totalCount,
      }))
      await saveListeningDraft(session.session_id, {
        session_type: 'DICTATION',
        user_typed_text: combined,
        completed_questions: completedCount,
      })
      showToast('Lưu nháp thành công.', 'success')
    } catch {
      showToast('Đã lưu nháp trình duyệt thành công.', 'success')
    } finally {
      setSaving(false)
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
      <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện nghe', href: '/practice-modules/listening' }]}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 size={40} className="text-blue-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải bài dictation...</p>
        </div>
      </AppLayout>
    )
  }

  if (error || !session) {
    return (
      <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }, { label: 'Luyện nghe', href: '/practice-modules/listening' }]}>
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
        { label: 'Luyện tập', href: '/practice-modules' },
        { label: 'Luyện nghe', href: '/practice-modules/listening' },
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

            {/* Input Card */}
            <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side space-y-6">
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
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Key Vocabulary Box */}
            <div className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side space-y-4">
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

            {/* Mode Selection Box */}
            <div className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side space-y-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-[#1D4ED8]" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">CHỌN CHẾ ĐỘ</h3>
              </div>

              <select
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as 'full' | 'keywords')
                  setCheckedSentences(prev => ({ ...prev, [currentSentenceIndex]: false }))
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent cursor-pointer shadow-2xs"
              >
                <option value="full">Chép cả câu</option>
                <option value="keywords">Chép từ khóa / Điền từ</option>
              </select>
            </div>

            {/* Navigation & Controls Box */}
            <div className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation size={18} className="text-[#1D4ED8]" />
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">THAO TÁC</h3>
                </div>
                {/* Tooltip Help Icon */}
                <div className="relative group/help cursor-pointer" title="Rê chuột để xem hướng dẫn các nút thao tác">
                  <HelpCircle size={22} className="text-[#1D4ED8] hover:scale-110 transition-transform duration-200" />
                  
                  {/* Tooltip Popup - White Theme (Enlarged) */}
                  <div className="absolute right-0 top-8 hidden group-hover/help:block bg-white text-slate-800 border border-slate-200 rounded-2xl p-5 shadow-glow-4side w-72 sm:w-80 z-50 leading-relaxed text-xs sm:text-sm">
                    <div className="flex items-center gap-2 font-extrabold text-[#1D4ED8] mb-3 border-b border-slate-100 pb-2 text-xs sm:text-sm">
                      <HelpCircle size={18} className="shrink-0" />
                      <span>Hướng dẫn các nút thao tác:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 font-medium">
                      <li className="flex items-start gap-1.5"><span className="text-[#1D4ED8] font-bold text-sm leading-none">•</span><span><b>Câu trước / sau:</b> Chuyển qua lại giữa các câu nghe.</span></li>
                      <li className="flex items-start gap-1.5"><span className="text-[#1D4ED8] font-bold text-sm leading-none">•</span><span><b>Nghe lại:</b> Phát lại âm thanh câu hiện tại.</span></li>
                      <li className="flex items-start gap-1.5"><span className="text-[#1D4ED8] font-bold text-sm leading-none">•</span><span><b>Xóa hết:</b> Xóa sạch toàn bộ văn bản đã gõ.</span></li>
                      <li className="flex items-start gap-1.5"><span className="text-[#1D4ED8] font-bold text-sm leading-none">•</span><span><b>Lưu nháp:</b> Lưu lại tiến trình gõ hiện tại.</span></li>
                      <li className="flex items-start gap-1.5"><span className="text-[#1D4ED8] font-bold text-sm leading-none">•</span><span><b>Kiểm tra:</b> Đối chiếu câu gõ với đáp án chuẩn.</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Câu trước & Câu sau in 1 row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (currentSentenceIndex > 0) {
                        setCurrentSentenceIndex(prev => prev - 1)
                      }
                    }}
                    disabled={currentSentenceIndex === 0}
                    title="Chuyển sang câu nghe phía trước"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft size={16} className="text-[#1D4ED8]" />
                    <span>Câu trước</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentSentenceIndex < totalSentences - 1) {
                        setCurrentSentenceIndex(prev => prev + 1)
                      }
                    }}
                    disabled={currentSentenceIndex === totalSentences - 1}
                    title="Chuyển sang câu nghe tiếp theo"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <span>Câu sau</span>
                    <ChevronRight size={16} className="text-[#1D4ED8]" />
                  </button>
                </div>

                <button
                  onClick={handleReplaySegment}
                  title="Phát lại đoạn âm thanh của câu hiện tại"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs group"
                >
                  <RefreshCw size={15} className="text-[#1D4ED8] group-hover:rotate-180 transition-transform duration-300" />
                  <span>Nghe lại</span>
                </button>

                <button
                  onClick={handleClearCurrent}
                  title="Xóa toàn bộ chữ đã gõ trong câu hiện tại"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Trash2 size={15} className="text-[#1D4ED8]" />
                  <span>Xóa hết</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  title="Lưu bản nháp chép chính tả vào hệ thống"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <Save size={15} className="text-[#1D4ED8]" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu nháp'}</span>
                </button>

                <button
                  onClick={handleCheckCurrentSentence}
                  title="Đối chiếu chữ bạn gõ với đáp án chuẩn của câu"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-98 mt-1"
                >
                  <Check size={16} className="text-white stroke-[2.5]" />
                  <span>Kiểm tra</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

