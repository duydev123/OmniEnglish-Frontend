import React, { useState, useEffect, useRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import { AppLayout } from "../../components/common/AppLayout"
import { speakingApi } from "../../services/speakingApi"
import { getApiErrorMessage } from "../../utils/error"
import type { ShadowingSentence, ShadowingEvaluateResponse, WordDetail } from "../../types/speaking"
import {
  Volume2,
  Settings,
  Mic,
  Square,
  Loader2,
  Sparkles,
  X,
  Info,
  Play,
  Pause,
  RotateCcw,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  Music
} from "lucide-react"

export const SpeakingShadowingPage: React.FC = () => {
  const { sentenceId } = useParams<{ sentenceId?: string }>()
  const location = useLocation()

  const passedSentence: ShadowingSentence | undefined = location.state?.sentence

  // Core State
  const [loading, setLoading] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const [sentence, setSentence] = useState<ShadowingSentence>(() => passedSentence || {
    id: sentenceId || "shadowing_1",
    target_skill: "Intonation",
    english_text: "The meticulous architectural design of the museum captured everyone's attention.",
    ipa_text: "/məˈtɪk.jə.ləs ˌɑː.kɪˈtek.tʃər.əl dɪˈzaɪn/",
    audio_url: ""
  })

  const [evaluation, setEvaluation] = useState<ShadowingEvaluateResponse | null>(null)
  const [aiFeedbackText, setAiFeedbackText] = useState<string | null>(null)
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null)

  // Original Text Audio Reader state ("Đọc đoạn gốc")
  const [isOriginalAudioPlaying, setIsOriginalAudioPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const originalAudioRef = useRef<HTMLAudioElement | null>(null)

  // Recorded Audio Player state
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isUserAudioPlaying, setIsUserAudioPlaying] = useState(false)
  const [userAudioCurrentTime, setUserAudioCurrentTime] = useState(0)
  const [userAudioDuration, setUserAudioDuration] = useState(0)

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Close settings menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  // Fetch sentence detail if ID given and state empty
  useEffect(() => {
    if (sentenceId && !location.state?.sentence) {
      const fetchDetail = async () => {
        setLoading(true)
        try {
          const detail = await speakingApi.getShadowingSentenceDetail(sentenceId)
          if (detail) {
            setSentence(detail)
          }
        } catch (err) {
          console.error("Failed to load shadowing sentence detail:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchDetail()
    }
  }, [sentenceId, location.state])

  // Play reference native audio or SpeechSynthesis reading the original text out loud
  const handleToggleOriginalAudio = () => {
    if (isOriginalAudioPlaying) {
      window.speechSynthesis.cancel()
      if (originalAudioRef.current) {
        originalAudioRef.current.pause()
        originalAudioRef.current = null
      }
      setIsOriginalAudioPlaying(false)
      return
    }

    if (sentence.audio_url) {
      if (originalAudioRef.current) {
        originalAudioRef.current.pause()
      }
      const audio = new Audio(sentence.audio_url)
      audio.playbackRate = playbackSpeed
      originalAudioRef.current = audio

      audio.onplay = () => setIsOriginalAudioPlaying(true)
      audio.onended = () => setIsOriginalAudioPlaying(false)
      audio.onerror = () => {
        setIsOriginalAudioPlaying(false)
        // Fallback to TTS if audio URL fails
        speakTextViaTTS(sentence.english_text, playbackSpeed)
      }
      audio.play().catch(() => speakTextViaTTS(sentence.english_text, playbackSpeed))
    } else {
      speakTextViaTTS(sentence.english_text, playbackSpeed)
    }
  }

  const speakTextViaTTS = (text: string, speed: number) => {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = speed

      utterance.onstart = () => setIsOriginalAudioPlaying(true)
      utterance.onend = () => setIsOriginalAudioPlaying(false)
      utterance.onerror = () => setIsOriginalAudioPlaying(false)

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.error("Speech Synthesis error:", e)
      setIsOriginalAudioPlaying(false)
    }
  }

  // Play individual word pronunciation via SpeechSynthesis
  const handlePlayWordAudio = (wordText: string) => {
    if (!wordText) return
    const clean = wordText.replace(/[^a-zA-Z']/g, "")
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = "en-US"
    window.speechSynthesis.speak(utterance)
  }

  // Audio Recording Handlers
  const startRecording = async () => {
    setEvaluationError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const localUrl = URL.createObjectURL(audioBlob)
        setUserAudioUrl(localUrl)
        await evaluateAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Microphone access error:", err)
      alert("Không thể truy cập microphone. Vui lòng cấp quyền cho trình duyệt!")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
    setIsRecording(false)
  }

  const evaluateAudio = async (audioBlob: Blob) => {
    setIsEvaluating(true)
    setEvaluationError(null)
    try {
      const res = await speakingApi.evaluateShadowing(sentence.id, audioBlob)
      if (res && res.words_detail) {
        setEvaluation(res)
        if (res.user_audio_url) {
          setUserAudioUrl(res.user_audio_url)
        }
      } else {
        throw new Error("Máy chủ không trả về dữ liệu kết quả đánh giá shadowing.")
      }
    } catch (err: any) {
      console.error("Evaluation error:", err)
      const msg = getApiErrorMessage(err, "Đã xảy ra lỗi khi máy chủ chấm điểm shadowing. Vui lòng thử lại sau.")
      setEvaluationError(msg)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleGetFeedback = async () => {
    if (!evaluation) return
    setIsFetchingFeedback(true)
    setFeedbackError(null)
    try {
      const res = await speakingApi.getShadowingFeedback(sentence.id, {
        user_transcript: evaluation.user_transcript || "",
        words_detail: evaluation.words_detail || []
      })
      if (res && res.feedback) {
        setAiFeedbackText(res.feedback)
      } else {
        throw new Error("Máy chủ không trả về nội dung feedback.")
      }
    } catch (err: any) {
      console.error("Error getting AI feedback:", err)
      const msg = getApiErrorMessage(err, "Không thể lấy feedback từ AI. Vui lòng thử lại sau!")
      setFeedbackError(msg)
    } finally {
      setIsFetchingFeedback(false)
    }
  }

  // Reset / Try Again Handler
  const handleTryAgain = () => {
    setEvaluation(null)
    setAiFeedbackText(null)
    setFeedbackError(null)
    setIsFetchingFeedback(false)
    if (userAudioUrl && userAudioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(userAudioUrl)
    }
    setUserAudioUrl(null)
    setSelectedWord(null)
    setIsUserAudioPlaying(false)
    setUserAudioCurrentTime(0)
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause()
    }
  }

  // User Audio Player Controls
  const togglePlayUserAudio = () => {
    if (!recordedAudioRef.current) return
    if (isUserAudioPlaying) {
      recordedAudioRef.current.pause()
      setIsUserAudioPlaying(false)
    } else {
      recordedAudioRef.current.play()
        .then(() => setIsUserAudioPlaying(true))
        .catch((err) => console.error("Error playing recorded audio:", err))
    }
  }

  const handleUserAudioTimeUpdate = () => {
    if (recordedAudioRef.current) {
      setUserAudioCurrentTime(recordedAudioRef.current.currentTime)
      setUserAudioDuration(recordedAudioRef.current.duration || 0)
    }
  }

  const handleUserAudioEnded = () => {
    setIsUserAudioPlaying(false)
    setUserAudioCurrentTime(0)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const renderFormattedFeedback = (rawText: string) => {
    if (!rawText) return null

    const lines = rawText.split("\n")
    const elements: React.ReactNode[] = []
    let listBuffer: React.ReactNode[] = []

    const flushList = () => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-1">
            {listBuffer}
          </ul>
        )
        listBuffer = []
      }
    }

    const parseInline = (str: string) => {
      const parts: React.ReactNode[] = []
      let lastIndex = 0
      const regex = /(\*\*(.*?)\*\*|`(.*?)`|\/([^\/\s]+)\/)/g
      let match: RegExpExecArray | null

      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(str.substring(lastIndex, match.index))
        }

        if (match[2] !== undefined) {
          // **bold**
          parts.push(
            <strong key={match.index} className="font-extrabold text-slate-900">
              {match[2]}
            </strong>
          )
        } else if (match[3] !== undefined) {
          // `code`
          parts.push(
            <code key={match.index} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded text-[11px]">
              {match[3]}
            </code>
          )
        } else if (match[4] !== undefined) {
          // /IPA/
          parts.push(
            <span key={match.index} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded text-xs border border-blue-100/80">
              /{match[4]}/
            </span>
          )
        }

        lastIndex = regex.lastIndex
      }

      if (lastIndex < str.length) {
        parts.push(str.substring(lastIndex))
      }

      return parts.length > 0 ? parts : str
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (!trimmed) {
        flushList()
        return
      }

      if (trimmed === "---") {
        flushList()
        elements.push(<hr key={index} className="my-3.5 border-slate-200" />)
        return
      }

      if (trimmed.startsWith("### ")) {
        flushList()
        elements.push(
          <div key={index} className="mt-4 mb-2 pb-1 border-b border-blue-100 flex items-center gap-2">
            <span className="w-2 h-4 bg-[#1e50e6] rounded-full shrink-0" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {parseInline(trimmed.replace(/^###\s+/, ""))}
            </h3>
          </div>
        )
        return
      }

      if (trimmed.startsWith("#### ")) {
        flushList()
        elements.push(
          <div key={index} className="mt-3 mb-1.5 p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl font-extrabold text-xs text-blue-900 flex items-center justify-between shadow-2xs">
            <span>{parseInline(trimmed.replace(/^####\s+/, ""))}</span>
          </div>
        )
        return
      }

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || /^\d+\.\s+/.test(trimmed)) {
        const content = trimmed.replace(/^(\*|-|\d+\.)\s+/, "")
        listBuffer.push(
          <li key={index} className="text-xs text-slate-700 font-medium leading-relaxed flex items-start gap-2">
            <span className="text-[#1e50e6] font-extrabold shrink-0 mt-0.5">•</span>
            <div>{parseInline(content)}</div>
          </li>
        )
        return
      }

      if (trimmed.startsWith("*Mẹo nhỏ:*") || trimmed.startsWith("Mẹo nhỏ:") || trimmed.startsWith("_Mẹo nhỏ:_")) {
        flushList()
        elements.push(
          <div key={index} className="mt-3 p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 font-medium leading-relaxed flex items-start gap-2">
            <span className="text-amber-600 font-bold shrink-0 mt-0.5">💡</span>
            <div>{parseInline(trimmed)}</div>
          </div>
        )
        return
      }

      flushList()
      elements.push(
        <p key={index} className="text-xs text-slate-700 font-medium leading-relaxed my-1">
          {parseInline(trimmed)}
        </p>
      )
    })

    flushList()

    return <div className="space-y-1">{elements}</div>
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Luyện tập", href: "/practice-modules" }, { label: "Luyện nói", href: "/practice-modules/speaking" }, { label: "Shadowing" }]}>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
          <Loader2 className="w-10 h-10 text-[#1e50e6] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Đang tải câu Shadowing...</p>
        </div>
      </AppLayout>
    )
  }

  // Target sentence split into clean words for un-evaluated state
  const rawSentenceWords = sentence.english_text.trim().split(/\s+/)

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Luyện tập", href: "/practice-modules" },
        { label: "Luyện nói", href: "/practice-modules/speaking" },
        { label: "Shadowing" }
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* EVALUATION ERROR BANNER */}
        {evaluationError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">Không thể đánh giá Shadowing</p>
                <p className="text-xs font-medium text-rose-700">{evaluationError}</p>
              </div>
            </div>
            <button
              onClick={() => setEvaluationError(null)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition shrink-0 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Header Title Bar */}
        <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              SHADOWING PRACTICE
            </h1>
          </div>

          {evaluation && (
            <button
              onClick={handleTryAgain}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw size={15} />
              <span>Thử lại (Try Again)</span>
            </button>
          )}
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Sentence Card, Recorded Audio Player, Transcript) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Shadowing Sentence Card */}
            <div className="bg-white border border-slate-400/60 rounded-3xl p-6 sm:p-8 shadow-glow-4side space-y-6 flex flex-col justify-between min-h-[420px]">
              {/* Card Top Action Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-slate-600">
                    Target Skill: {sentence.target_skill || "Intonation & Pronunciation"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleOriginalAudio()}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer border shadow-2xs ${
                      isOriginalAudioPlaying
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse"
                        : "bg-blue-50 text-[#1e50e6] border-blue-100 hover:bg-blue-100"
                    }`}
                    title="Nghe câu gốc (Read Original Text)"
                  >
                    {isOriginalAudioPlaying ? <Pause size={16} /> : <Volume2 size={16} />}
                    <span>{isOriginalAudioPlaying ? `Đang đọc (${playbackSpeed}x)` : "Đọc đoạn gốc"}</span>
                  </button>

                  {/* Settings Dropdown for Playback Speed */}
                  <div className="relative" ref={settingsMenuRef}>
                    <button
                      onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                      className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 border ${
                        showSettingsMenu
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-slate-200/80"
                      }`}
                      title="Cài đặt tốc độ đọc câu gốc"
                    >
                      <Settings size={18} />
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">
                        {playbackSpeed}x
                      </span>
                    </button>

                    {showSettingsMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Tốc độ đọc câu gốc
                        </div>
                        {[
                          { rate: 0.75, label: "0.75x (Chậm)" },
                          { rate: 1.0, label: "1.0x (Bình thường)" },
                          { rate: 1.25, label: "1.25x (Nhanh)" }
                        ].map((option) => (
                          <button
                            key={option.rate}
                            onClick={() => {
                              setPlaybackSpeed(option.rate)
                              setShowSettingsMenu(false)
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between cursor-pointer ${
                              playbackSpeed === option.rate
                                ? "bg-blue-50 text-[#1e50e6]"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{option.label}</span>
                            {playbackSpeed === option.rate && (
                              <CheckCircle2 size={14} className="text-[#1e50e6]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Center Sentence Display */}
              <div className="text-center space-y-4 max-w-3xl mx-auto py-2">
                <span className="text-xs font-extrabold tracking-widest text-slate-400 block uppercase">
                  {evaluation ? "KẾT QUẢ PHÂN TÍCH ÂM TIẾT TRÊN CÂU SHADOWING:" : "ĐỌC TO CÂU TIẾNG ANH DƯỚI ĐÂY:"}
                </span>

                {/* Sentence Display Area: Unhighlighted vs Evaluated Word Detail */}
                {!evaluation ? (
                  /* Initial State: Clean Target Sentence */
                  <div className="flex flex-wrap items-center justify-center gap-2 py-3">
                    {rawSentenceWords.map((wordStr, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 rounded-xl text-xl sm:text-2xl font-bold text-slate-800 bg-slate-50 border border-slate-200/80 shadow-2xs"
                      >
                        {wordStr}
                      </span>
                    ))}
                  </div>
                ) : (
                  /* Evaluated State: Real backend words_detail rendering Insertions, Omissions, Mispronunciations, and Correct words */
                  <div className="flex flex-wrap items-center justify-center gap-2 py-3">
                    {(evaluation.words_detail || []).map((w, index) => {
                      const isInsertion = w.error_type === "Insertion"
                      const isOmission = w.error_type === "Omission"
                      const isMispronunciation = w.error_type === "Mispronunciation" || ((w.accuracy_score ?? 0) < 60 && !isOmission && !isInsertion)

                      let chipStyle = "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                      let badgeBg = "bg-emerald-200 text-emerald-900"
                      let badgeText = `${w.accuracy_score ?? 0}%`

                      if (isInsertion) {
                        chipStyle = "bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100 ring-1 ring-purple-400/30"
                        badgeBg = "bg-purple-200 text-purple-900"
                        badgeText = `+ Dư (${w.accuracy_score ?? 0}%)`
                      } else if (isOmission) {
                        chipStyle = "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 line-through opacity-80"
                        badgeBg = "bg-amber-200 text-amber-900 no-underline inline-block"
                        badgeText = `- Thiếu`
                      } else if (isMispronunciation) {
                        chipStyle = "bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100"
                        badgeBg = "bg-rose-200 text-rose-900"
                        badgeText = `${w.accuracy_score ?? 0}%`
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedWord(w)}
                          className={`px-3 py-1.5 rounded-2xl text-lg sm:text-xl font-black border transition-all transform hover:scale-105 cursor-pointer shadow-xs flex items-center gap-1.5 ${chipStyle}`}
                          title={`Click để xem chi tiết âm tiết từ "${w.word}"`}
                        >
                          <span>{w.word}</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${badgeBg}`}>
                            {badgeText}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <p className="text-sm font-mono text-slate-500 font-semibold">
                  {sentence.ipa_text}
                </p>

                {evaluation && (
                  <p className="text-[11px] text-blue-600 font-bold flex items-center justify-center gap-1">
                    <Info size={13} />
                    <span>Nhấp vào bất kỳ từ nào để kiểm tra chi tiết ký tự phiên âm IPA</span>
                  </p>
                )}
              </div>

              {/* Color Legend Bar */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Phát âm đúng</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span>{"Phát âm sai (<60%)"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Thiếu từ (Omission)</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-700">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Dư từ (Insertion)</span>
                </div>
              </div>

              {/* Microphone / Control Action Bar */}
              <div className="flex flex-col items-center justify-center space-y-3 pt-2">
                {!evaluation ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isEvaluating}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 cursor-pointer shadow-lg ${
                      isRecording
                        ? "bg-rose-600 text-white animate-pulse shadow-rose-500/30"
                        : "bg-[#1e50e6] text-white shadow-blue-500/30 hover:bg-blue-700"
                    }`}
                  >
                    {isEvaluating ? (
                      <Loader2 size={26} className="animate-spin" />
                    ) : isRecording ? (
                      <Square size={24} />
                    ) : (
                      <Mic size={28} />
                    )}
                  </button>
                ) : (
                  /* Evaluated State: Quick Try Again action below card */
                  <button
                    onClick={handleTryAgain}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    <span>THỬ LẠI CÂU NÀY (TRY AGAIN)</span>
                  </button>
                )}

                <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                  {isEvaluating
                    ? "ĐANG AI PHÂN TÍCH..."
                    : isRecording
                    ? "ĐANG THU ÂM..."
                    : evaluation
                    ? "BẤM THỬ LẠI ĐỂ ĐỌC LẠI CÂU GỐC"
                    : "NHẤP VÀO MICRO ĐỂ ĐỌC"}
                </span>
              </div>
            </div>

            {/* Recorded User Audio Player Card */}
            {userAudioUrl && (
              <div className="bg-white border border-slate-400/60 rounded-3xl p-6 shadow-glow-4side space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Music size={16} className="text-blue-600" />
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Đoạn Audio Bạn Vừa Thu Âm (Your Recorded Audio)
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {formatTime(userAudioCurrentTime)} / {formatTime(userAudioDuration)}
                  </span>
                </div>

                <audio
                  ref={recordedAudioRef}
                  src={userAudioUrl}
                  onTimeUpdate={handleUserAudioTimeUpdate}
                  onEnded={handleUserAudioEnded}
                  onLoadedMetadata={handleUserAudioTimeUpdate}
                  className="hidden"
                />

                <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-4">
                  <button
                    onClick={togglePlayUserAudio}
                    className="w-12 h-12 rounded-full bg-[#1e50e6] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition cursor-pointer shrink-0"
                  >
                    {isUserAudioPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden relative cursor-pointer">
                      <div
                        className="h-full bg-[#1e50e6] rounded-full transition-all duration-150"
                        style={{
                          width: `${
                            userAudioDuration > 0
                              ? (userAudioCurrentTime / userAudioDuration) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium italic">
                      Nghe lại bản thu âm của bạn để so sánh với câu chuẩn
                    </p>
                  </div>
                </div>
              </div>
            )}


          </div>

          {/* Right Column (Analysis, AI Tips, History) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Real-time Analysis Scores */}
            <div className="bg-white border border-slate-400/60 rounded-3xl p-6 shadow-glow-4side space-y-5">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                Shadowing Scores (Kết quả chấm điểm)
              </h3>

              <div className="space-y-4">
                {/* Accuracy */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Độ chính xác phát âm (Accuracy)</span>
                    <span className="text-blue-600">
                      {evaluation ? `${evaluation.accuracy_score}%` : "--"}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1e50e6] rounded-full transition-all duration-500"
                      style={{ width: `${evaluation?.accuracy_score || 0}%` }}
                    />
                  </div>
                </div>

                {/* Fluency */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Độ trôi chảy & Tốc độ (Fluency)</span>
                    <span className="text-emerald-600">
                      {evaluation ? `${evaluation.fluency_score}%` : "--"}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${evaluation?.fluency_score || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ENGLISH AI TIPS */}
            <div className="bg-white border border-slate-400/60 rounded-3xl p-6 shadow-glow-4side space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600" />
                <span>AI PHÂN TÍCH LỖI (AI TIPS)</span>
              </h3>

              <div className="p-4 bg-blue-50/70 border border-blue-100/80 rounded-2xl space-y-2">
                {evaluation ? (
                  (() => {
                    const wordsList = evaluation.words_detail || []
                    const insertions = wordsList.filter((w) => w.error_type === "Insertion").length
                    const omissions = wordsList.filter((w) => w.error_type === "Omission").length
                    const mispronunciations = wordsList.filter(
                      (w) => w.error_type === "Mispronunciation" || ((w.accuracy_score ?? 0) < 60 && w.error_type !== "Omission" && w.error_type !== "Insertion")
                    ).length

                    return (
                      <div className="space-y-3">
                        <div className="space-y-1 text-xs font-medium text-slate-700 leading-relaxed">
                          {insertions > 0 && (
                            <p className="text-purple-800 font-semibold">
                              • Phát hiện <strong>{insertions} từ dư (Insertion)</strong> do bạn phát âm lặp hoặc nói thêm từ.
                            </p>
                          )}
                          {omissions > 0 && (
                            <p className="text-amber-800 font-semibold">
                              • Phát hiện <strong>{omissions} từ bị bỏ sót (Omission)</strong> chưa được đọc trong câu gốc.
                            </p>
                          )}
                          {mispronunciations > 0 && (
                            <p className="text-rose-800 font-semibold">
                              • Có <strong>{mispronunciations} từ phát âm sai (Mispronunciation)</strong> cần luyện tập lại ký tự IPA.
                            </p>
                          )}
                          {insertions === 0 && omissions === 0 && mispronunciations === 0 && (
                            <p className="text-emerald-800 font-semibold">
                              🎉 Tuyệt vời! Bạn phát âm chính xác tất cả các từ trong câu.
                            </p>
                          )}
                        </div>

                        {/* BUTTON / RESULT FOR GEMINI AI FEEDBACK */}
                        <div className="pt-2 border-t border-blue-100/80 space-y-2">
                          {aiFeedbackText ? (
                            <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1.5 shadow-2xs animate-in fade-in">
                              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={12} className="text-emerald-600 animate-pulse" />
                                Hướng dẫn chi tiết từ Gemini AI:
                              </span>
                              <div className="text-xs text-slate-800 font-medium leading-relaxed">
                                {renderFormattedFeedback(aiFeedbackText)}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={handleGetFeedback}
                              disabled={isFetchingFeedback}
                              className="w-full py-2.5 px-4 bg-[#1e50e6] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                            >
                              {isFetchingFeedback ? (
                                <>
                                  <Loader2 size={15} className="animate-spin" />
                                  <span>Gemini AI đang phân tích...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles size={15} />
                                  <span>Lấy AI Feedback Chi Tiết</span>
                                </>
                              )}
                            </button>
                          )}

                          {feedbackError && (
                            <p className="text-[11px] text-rose-600 font-semibold text-center mt-1">
                              {feedbackError}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Bắt đầu thu âm để nhận phân tích chi tiết từ AI về các từ phát âm dư, từ bỏ sót và các ký tự IPA chưa chuẩn.
                  </p>
                )}
              </div>
            </div>

            {/* PRACTICE HISTORY
            <div className="bg-white border border-slate-400/60 rounded-3xl p-6 shadow-glow-4side space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <History size={14} className="text-blue-600" />
                  <span>PRACTICE HISTORY</span>
                </h3>
                <button
                  onClick={() => navigate("/practice-modules")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">
                        {item.text}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        Score: {item.score}% • {item.time}
                      </span>
                    </div>

                    <div className={`w-2.5 h-2.5 rounded-full ${item.status === "EXCELLENT" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Interactive IPA & Phoneme Breakdown Modal */}
      {selectedWord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 capitalize">
                  {selectedWord.word}
                </h3>
                {/* Error Type Badge */}
                {selectedWord.error_type === "Insertion" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    <PlusCircle size={12} /> Lỗi: Dư từ (Insertion)
                  </span>
                ) : selectedWord.error_type === "Omission" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <MinusCircle size={12} /> Lỗi: Bỏ sót từ (Omission)
                  </span>
                ) : selectedWord.error_type === "Mispronunciation" || ((selectedWord.accuracy_score ?? 0) < 60) ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <AlertCircle size={12} /> Lỗi: Phát âm sai ({selectedWord.accuracy_score ?? 0}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={12} /> Phát âm chuẩn ({selectedWord.accuracy_score ?? 0}%)
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedWord(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Audio & Word Pronunciation Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">PRONUNCIATION AUDIO</span>
                <span className="text-base font-bold text-blue-600">{selectedWord.word}</span>
              </div>

              <button
                onClick={() => handlePlayWordAudio(selectedWord.word)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition cursor-pointer"
                title="Nghe phát âm chuẩn của từ"
              >
                <Play size={18} className="ml-0.5" />
              </button>
            </div>

            {/* Real IPA Phoneme Breakdown from Backend API */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                Backend IPA Phoneme Accuracy (Chi tiết ký tự IPA)
              </span>

              {selectedWord.phonemes && selectedWord.phonemes.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {selectedWord.phonemes.map((ph, idx) => {
                    const isPhonemeGood = ph.accuracy_score >= 60
                    return (
                      <div
                        key={idx}
                        className={`px-3.5 py-2 rounded-2xl border text-base font-mono font-black flex flex-col items-center min-w-[50px] shadow-2xs ${
                          isPhonemeGood
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-rose-50 text-rose-700 border-rose-300"
                        }`}
                      >
                        <span className="text-lg">/{ph.phoneme}/</span>
                        <span
                          className={`text-[10px] font-sans font-bold mt-0.5 ${
                            isPhonemeGood ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {ph.accuracy_score}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {selectedWord.error_type === "Omission"
                    ? "Từ này bị bỏ sót nên không có dữ liệu phát âm từng âm tiết."
                    : "Không có dữ liệu chi tiết âm tiết cho từ này."}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedWord(null)}
              className="w-full py-3 bg-[#1e50e6] text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer"
            >
              Đóng (Close)
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default SpeakingShadowingPage

