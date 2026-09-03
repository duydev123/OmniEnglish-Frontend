import { useEffect, useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { RotateCcw, ArrowRight, Play, Pause, FileText, Check, X } from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import TranscriptComparison from '../../components/listening/TranscriptComparison'
import { getListeningSession, type ListeningSubmitResponse } from '../../services/listeningApi'

export default function ListeningResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const isDictation = searchParams.get('tab') === 'dictation' || location.pathname.includes('dictation-result')
  const sessionId = searchParams.get('session_id')

  const [resultTab, setResultTab] = useState<'session' | 'dictation'>(isDictation ? 'dictation' : 'session')
  const [filterMode, setFilterMode] = useState<'all' | 'mistakes'>('all')
  const [result, setResult] = useState<ListeningSubmitResponse | null>(null)
  const [loading, setLoading] = useState(Boolean(sessionId))

  // Audio Clip Playback State
  const [playingQuestionId, setPlayingQuestionId] = useState<string | null>(null)
  const [clipCurrentTime, setClipCurrentTime] = useState(0)
  const [clipDuration, setClipDuration] = useState(0)
  const [clipProgress, setClipProgress] = useState(0)
  const clipAudioRef = useRef<HTMLAudioElement | null>(null)

  // Transcript Modal State
  const [selectedTranscriptQuestion, setSelectedTranscriptQuestion] = useState<any | null>(null)

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return Number(timeStr) || 0
  }

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const playClip = (
    questionId: string,
    clipTime: string,
    audioUrl?: string,
    startTimeMs?: number,
    endTimeMs?: number
  ) => {
    const url = audioUrl || result?.audio_url
    if (!url) return

    if (clipAudioRef.current) {
      clipAudioRef.current.pause()
    }

    const startSec = (startTimeMs !== undefined && startTimeMs !== null) ? (startTimeMs / 1000.0) : parseTimeToSeconds(clipTime)
    const endSec = (endTimeMs !== undefined && endTimeMs !== null) ? (endTimeMs / 1000.0) : (startSec + 15)

    const segmentDuration = endSec - startSec
    setClipDuration(segmentDuration)
    setClipCurrentTime(0)
    setClipProgress(0)

    const audio = new Audio(url)
    clipAudioRef.current = audio
    audio.currentTime = startSec
    setPlayingQuestionId(questionId)

    const checkTime = () => {
      const current = audio.currentTime
      const segmentCurrent = Math.max(0, current - startSec)
      setClipCurrentTime(segmentCurrent)
      setClipProgress(Math.min((segmentCurrent / segmentDuration) * 100, 100))

      if (current >= endSec) {
        audio.pause()
        setPlayingQuestionId(null)
        audio.removeEventListener('timeupdate', checkTime)
      }
    }

    audio.addEventListener('timeupdate', checkTime)
    audio.addEventListener('ended', () => {
      setPlayingQuestionId(null)
    })

    audio.play().catch(err => {
      console.error("Failed to play audio clip:", err)
      setPlayingQuestionId(null)
    })
  }

  const stopClip = () => {
    if (clipAudioRef.current) {
      clipAudioRef.current.pause()
      clipAudioRef.current = null
    }
    setPlayingQuestionId(null)
    setClipCurrentTime(0)
    setClipProgress(0)
  }

  useEffect(() => {
    return () => {
      if (clipAudioRef.current) {
        clipAudioRef.current.pause()
      }
    }
  }, [])


  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    let cancelled = false
    const loadResult = async () => {
      setLoading(true)
      try {
        const res = await getListeningSession(sessionId)
        if (!cancelled) {
          setResult(res)
          setResultTab(res.session_type === 'DICTATION' ? 'dictation' : 'session')
        }
      } catch {
        if (!cancelled) setResult(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadResult()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const reviews = useMemo(() => {
    if (!result?.detailed_question_review?.length) {
      return []
    }

    return result.detailed_question_review.map((item, index) => ({
      id: `${item.question_text}-${index}`,
      qNum: index + 1,
      isCorrect: item.is_correct,
      question: item.question_text,
      userAns: item.your_answer,
      correctAns: item.correct_answer,
      clipTime: item.timestamp_clip ?? '00:00',
      hint: item.learning_hint,
      audioUrl: item.audio_url,
      startTimeMs: item.start_time_ms,
      endTimeMs: item.end_time_ms,
      segmentTranscript: item.segment_transcript,
    }))
  }, [result])

  const filteredReviews = filterMode === 'mistakes' ? reviews.filter((r) => !r.isCorrect) : reviews
  const accuracyPercent = result?.accuracy_rate ?? 0

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Luyện tập', href: '/practice-modules' },
        { label: 'Luyện nghe', href: '/practice-modules/listening' },
        { label: 'Kết quả làm bài' },
      ]}
    >
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">


        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Đang tải kết quả bài nghe...
          </div>
        ) : resultTab === 'session' ? (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Great effort!</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {result?.score_summary ?? 'Your listening session has been submitted successfully.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate('/listening/practice')}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-2xs flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  <span>Retry Quiz</span>
                </button>

                <button
                  onClick={() => navigate('/practice')}
                  className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2"
                >
                  <span>Next Lesson</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side flex flex-col items-center justify-center text-center gap-3">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" className="text-blue-100" strokeWidth="9" stroke="currentColor" fill="transparent" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      className="text-[#1D4ED8]"
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - accuracyPercent / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900">{accuracyPercent.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Overall Accuracy</h3>
                  <p className="text-xs text-slate-500 font-semibold">{result?.score_summary ?? 'Session completed'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Detailed Question Review</h2>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button onClick={() => setFilterMode('all')} className={`px-3 py-1.5 rounded-lg transition-colors ${filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}>Show All</button>
                  <button onClick={() => setFilterMode('mistakes')} className={`px-3 py-1.5 rounded-lg transition-colors ${filterMode === 'mistakes' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}>Mistakes Only</button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    Chưa có review câu hỏi cho session này.
                  </div>
                ) : (
                  filteredReviews.map((r) => (
                    <div key={r.id} className={`bg-white border rounded-2xl p-6 shadow-2xs space-y-4 ${r.isCorrect ? 'border-slate-200/90' : 'border-rose-200 bg-rose-50/10'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${r.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {r.qNum}
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${r.isCorrect ? 'bg-emerald-100/80 text-emerald-800' : 'bg-rose-100/80 text-rose-800'}`}>
                              {r.isCorrect ? <Check size={12} /> : <X size={12} />}
                              {r.isCorrect ? 'CORRECT' : 'INCORRECT'}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base">{r.question}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">YOUR ANSWER</span>
                              <span className="text-xs font-semibold text-slate-800">{r.userAns}</span>
                            </div>
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">CORRECT ANSWER</span>
                              <span className="text-xs font-bold text-emerald-900">{r.correctAns}</span>
                            </div>
                          </div>
                          {r.hint && (
                            <div className="p-4 bg-[#F8FAFC] border-l-4 border-blue-500 rounded-r-xl space-y-1 text-xs">
                              <span className="font-extrabold text-blue-900 block">LEARNING HINT</span>
                              <p className="text-slate-600 leading-relaxed">{r.hint}</p>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 mt-2">
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                              <button
                                onClick={() => {
                                  if (playingQuestionId === r.id) {
                                    stopClip()
                                  } else {
                                    playClip(r.id, r.clipTime, r.audioUrl, r.startTimeMs, r.endTimeMs)
                                  }
                                }}
                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                {playingQuestionId === r.id ? (
                                  <>
                                    <Pause size={14} fill="currentColor" />
                                    <span>STOP CLIP</span>
                                  </>
                                ) : (
                                  <>
                                    <Play size={14} fill="currentColor" />
                                    <span>REPLAY CLIP {r.startTimeMs !== undefined && r.endTimeMs !== undefined ? `(${Math.round(r.startTimeMs / 1000)}s - ${Math.round(r.endTimeMs / 1000)}s)` : `(${r.clipTime})`}</span>
                                  </>
                                )}
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => setSelectedTranscriptQuestion(r)}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                <FileText size={14} />
                                <span>VIEW TRANSCRIPT</span>
                              </button>
                            </div>

                            {playingQuestionId === r.id && (
                              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-3 mt-1 animate-fade-in">
                                <button onClick={stopClip} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
                                  <Pause size={12} fill="currentColor" />
                                </button>
                                <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden relative">
                                  <div className="h-full bg-blue-600 rounded-full transition-all duration-100" style={{ width: `${clipProgress}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-blue-700 font-mono shrink-0">
                                  {formatTime(clipCurrentTime)} / {formatTime(clipDuration)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Practice Complete</h1>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => navigate('/listening/dictation')} className="px-4 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2">
                  <RotateCcw size={16} />
                  <span>Play Again</span>
                </button>
                <button onClick={() => navigate('/practice')} className="px-5 py-2.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-2xs flex items-center gap-2">
                  <span>Next Module</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ACCURACY RATE</span>
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center"><Check size={14} className="stroke-[3]" /></div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">{accuracyPercent.toFixed(0)}%</span>
                  <span className="text-xs font-bold text-emerald-600">{accuracyPercent >= 80 ? 'Excellent' : 'Keep practicing'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1D4ED8] rounded-full" style={{ width: `${Math.min(accuracyPercent, 100)}%` }} />
                </div>
              </div>

              <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WORD COUNT</span>
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center"><FileText size={14} /></div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{result?.words_typed ?? 0}</span>
                  <span className="text-xs font-semibold text-slate-500">total words</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold pt-1">
                  <span className="text-emerald-700 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" />{result?.words_typed ?? 0} typed</span>
                  <span className="text-rose-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" />{result?.missed_contractions ?? 0} issues</span>
                </div>
              </div>
            </div>

            <TranscriptComparison words={result?.transcript_comparison} />
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedTranscriptQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1D4ED8] block mb-1">
                  Question {selectedTranscriptQuestion.qNum} • Transcript Review
                </span>
                <h3 className="font-bold text-slate-900 text-lg">
                  {selectedTranscriptQuestion.question}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTranscriptQuestion(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">ANSWERS REVIEW</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-slate-400 font-bold block mb-1">YOUR ANSWER</span>
                    <span className={`font-bold ${selectedTranscriptQuestion.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedTranscriptQuestion.userAns}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <span className="text-emerald-700 font-bold block mb-1">CORRECT ANSWER</span>
                    <span className="font-bold text-emerald-900">{selectedTranscriptQuestion.correctAns}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">QUESTION CLIP TRANSCRIPT</span>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {selectedTranscriptQuestion.segmentTranscript ? (
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-2xs">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-2">
                        <span>
                          {selectedTranscriptQuestion.startTimeMs !== undefined && selectedTranscriptQuestion.endTimeMs !== undefined
                            ? `Clip: ${formatTime(selectedTranscriptQuestion.startTimeMs / 1000)} - ${formatTime(selectedTranscriptQuestion.endTimeMs / 1000)}`
                            : 'Segment Clip'}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-black uppercase">
                          Question Audio Segment
                        </span>
                      </div>
                      <p className="text-slate-900 text-sm font-bold leading-relaxed">{selectedTranscriptQuestion.segmentTranscript}</p>
                    </div>
                  ) : result?.interactive_transcript && result.interactive_transcript.length > 0 ? (
                    result.interactive_transcript.map((seg, idx) => {
                      const segStart = parseTimeToSeconds(seg.start_time)
                      const segEnd = parseTimeToSeconds(seg.end_time)
                      const clipStart = parseTimeToSeconds(selectedTranscriptQuestion.clipTime)

                      // Highlight if the clip starts within or near this segment
                      const isHighlighted = clipStart >= segStart && clipStart <= segEnd || (Math.abs(segStart - clipStart) < 5)

                      if (!isHighlighted) return null

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl border bg-blue-50/70 border-blue-200 shadow-2xs"
                        >
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                            <span>{seg.start_time} - {seg.end_time}</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-black uppercase">
                              Answer Location
                            </span>
                          </div>
                          <p className="text-slate-900 text-sm font-bold leading-relaxed">{seg.en}</p>
                          <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-1">{seg.vi}</p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-slate-400 text-sm italic">Không tìm thấy transcript tương ứng.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedTranscriptQuestion(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

