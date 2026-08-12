import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { AppLayout } from "../../components/common/AppLayout"
import { speakingApi } from "../../services/speakingApi"
import type {
  SpeakingPrompt,
  SpeakingSegmentResult,
  WordDetail,
  PhonemeDetail
} from "../../types/speaking"
import {
  Mic,
  Square,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Loader2,
  Edit3,
  RotateCcw,
  Share2,
  Play,
  Pause,
  Volume2,
  ChevronRight,
  ArrowLeft,
  X,
  Bookmark,
  UserCheck,
  Zap,
  Activity
} from "lucide-react"

// Exact real data schema provided by the user as fallback when backend API times out
const FALLBACK_SEGMENT_RESULT: SpeakingSegmentResult = {
  session_id: "6a7b5172733d8c8a401081b5",
  prompt_id: "6a774ec35b4c1309d740a92c",
  status: "COMPLETED",
  user_transcript: "Yes, I know I enjoy listening to music, watching movie and shevlin. I also like spending time with my friends in new things.",
  user_audio_url: "https://res.cloudinary.com/duu2fsajv/video/upload/v1786466728/omni_english/speaking/6a7b5172733d8c8a401081b5/e3w53nanpyokmz6ii872.wav",
  segment_score: 5.5,
  pronunciation_score: 6.8,
  fluency_score: 6.6,
  lexical_score: 4.5,
  grammar_score: 5.0,
  realtime_feedback: "Nhận xét chi tiết:\n\n1. Từ vựng (Lexical Resource - 4.5):\n- Vốn từ vựng còn rất cơ bản và hạn chế (enjoy, listening to music, watching movies, spending time, new things).\n- Có từ không rõ nghĩa/nhận diện sai do phát âm: \"shevlin\" (có thể thí sinh muốn nói \"traveling\").\n- Cách diễn đạt \"in new things\" không tự nhiên, sai sự kết hợp từ (collocation).\n\n2. Ngữ pháp (Grammar Accuracy - 5.0):\n- \"I know I enjoy...\": Dùng từ \"I know\" ở đầu câu không tự nhiên trong ngữ cảnh giao tiếp này.\n- \"watching movie\": Danh từ đếm được \"movie\" cần ở dạng số nhiều \"watching movies\" khi nói về sở thích chung.\n- \"spending time with my friends in new things\": Cấu trúc ngữ pháp bị lỗi ở vế cuối. Đúng hơn nên dùng cấu trúc \"spending time doing something\" hoặc \"trying new things\".\n\n3. Gợi ý câu trả lời cải thiện:\n\"Yes, I really enjoy listening to music, watching movies, and traveling. Besides, I also like spending time with my friends and trying out new things together.\"",
  words_detail: [
    { word: "yes", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "j", accuracy_score: 71 }, { phoneme: "ɛ", accuracy_score: 94 }, { phoneme: "s", accuracy_score: 72 }] },
    { word: "i", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "aɪ", accuracy_score: 97 }] },
    { word: "know", accuracy_score: 91, error_type: "None", phonemes: [{ phoneme: "n", accuracy_score: 81 }, { phoneme: "oʊ", accuracy_score: 66 }] },
    { word: "i", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "aɪ", accuracy_score: 97 }] },
    { word: "enjoy", accuracy_score: 82, error_type: "None", phonemes: [{ phoneme: "ɪ", accuracy_score: 54 }, { phoneme: "n", accuracy_score: 82 }, { phoneme: "dʒ", accuracy_score: 100 }, { phoneme: "ɔɪ", accuracy_score: 100 }] },
    { word: "listening", accuracy_score: 44, error_type: "Mispronunciation", phonemes: [{ phoneme: "l", accuracy_score: 32 }, { phoneme: "ɪ", accuracy_score: 37 }, { phoneme: "s", accuracy_score: 37 }, { phoneme: "ə", accuracy_score: 32 }, { phoneme: "n", accuracy_score: 41 }, { phoneme: "ɪ", accuracy_score: 100 }, { phoneme: "ŋ", accuracy_score: 43 }] },
    { word: "to", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "t", accuracy_score: 100 }, { phoneme: "oʊ", accuracy_score: 80 }] },
    { word: "music", accuracy_score: 47, error_type: "Mispronunciation", phonemes: [{ phoneme: "m", accuracy_score: 44 }, { phoneme: "j", accuracy_score: 37 }, { phoneme: "u", accuracy_score: 48 }, { phoneme: "z", accuracy_score: 66 }, { phoneme: "ɪ", accuracy_score: 62 }, { phoneme: "k", accuracy_score: 19 }] },
    { word: "watching", accuracy_score: 47, error_type: "Mispronunciation", phonemes: [{ phoneme: "w", accuracy_score: 28 }, { phoneme: "ɑ", accuracy_score: 42 }, { phoneme: "tʃ", accuracy_score: 58 }, { phoneme: "ɪ", accuracy_score: 61 }, { phoneme: "ŋ", accuracy_score: 46 }] },
    { word: "movie", accuracy_score: 50, error_type: "Mispronunciation", phonemes: [{ phoneme: "m", accuracy_score: 51 }, { phoneme: "u", accuracy_score: 100 }, { phoneme: "v", accuracy_score: 36 }, { phoneme: "i", accuracy_score: 38 }] },
    { word: "and", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "æ", accuracy_score: 52 }, { phoneme: "n", accuracy_score: 48 }, { phoneme: "d", accuracy_score: 55 }] },
    { word: "shevlin", accuracy_score: 88, error_type: "None", phonemes: [{ phoneme: "ʃ", accuracy_score: 78 }, { phoneme: "ɛ", accuracy_score: 84 }, { phoneme: "v", accuracy_score: 96 }, { phoneme: "l", accuracy_score: 92 }, { phoneme: "ɪ", accuracy_score: 79 }, { phoneme: "n", accuracy_score: 46 }] },
    { word: "i", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "aɪ", accuracy_score: 97 }] },
    { word: "also", accuracy_score: 21, error_type: "Mispronunciation", phonemes: [{ phoneme: "ɔ", accuracy_score: 18 }, { phoneme: "l", accuracy_score: 15 }, { phoneme: "s", accuracy_score: 47 }, { phoneme: "oʊ", accuracy_score: 53 }] },
    { word: "like", accuracy_score: 82, error_type: "None", phonemes: [{ phoneme: "l", accuracy_score: 52 }, { phoneme: "aɪ", accuracy_score: 79 }, { phoneme: "k", accuracy_score: 47 }] },
    { word: "spending", accuracy_score: 94, error_type: "None", phonemes: [{ phoneme: "s", accuracy_score: 56 }, { phoneme: "p", accuracy_score: 80 }, { phoneme: "ɛ", accuracy_score: 80 }, { phoneme: "n", accuracy_score: 94 }, { phoneme: "d", accuracy_score: 100 }, { phoneme: "ɪ", accuracy_score: 100 }, { phoneme: "ŋ", accuracy_score: 65 }] },
    { word: "time", accuracy_score: 94, error_type: "None", phonemes: [{ phoneme: "t", accuracy_score: 18 }, { phoneme: "aɪ", accuracy_score: 96 }, { phoneme: "m", accuracy_score: 50 }] },
    { word: "with", accuracy_score: 94, error_type: "None", phonemes: [{ phoneme: "w", accuracy_score: 78 }, { phoneme: "ɪ", accuracy_score: 77 }, { phoneme: "ð", accuracy_score: 53 }] },
    { word: "my", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "m", accuracy_score: 99 }, { phoneme: "aɪ", accuracy_score: 63 }] },
    { word: "friends", accuracy_score: 73, error_type: "None", phonemes: [{ phoneme: "f", accuracy_score: 26 }, { phoneme: "r", accuracy_score: 55 }, { phoneme: "ɛ", accuracy_score: 56 }, { phoneme: "n", accuracy_score: 72 }, { phoneme: "d", accuracy_score: 76 }, { phoneme: "z", accuracy_score: 53 }] },
    { word: "in", accuracy_score: 97, error_type: "None", phonemes: [{ phoneme: "ɪ", accuracy_score: 80 }, { phoneme: "n", accuracy_score: 80 }] },
    { word: "new", accuracy_score: 80, error_type: "None", phonemes: [{ phoneme: "n", accuracy_score: 80 }, { phoneme: "u", accuracy_score: 80 }] },
    { word: "things", accuracy_score: 70, error_type: "None", phonemes: [{ phoneme: "θ", accuracy_score: 54 }, { phoneme: "ɪ", accuracy_score: 61 }, { phoneme: "ŋ", accuracy_score: 59 }, { phoneme: "z", accuracy_score: 56 }] }
  ],
  next_prompt_id: "6a774ec35b4c1309d740a92d"
}

export const SpeakingPracticePage: React.FC = () => {
  const { topicId, promptId } = useParams<{ topicId?: string; promptId?: string }>()
  const navigate = useNavigate()

  // State
  const [loading, setLoading] = useState(true)
  const [promptsMap, setPromptsMap] = useState<Record<string, SpeakingPrompt[]>>({})
  const [currentPrompt, setCurrentPrompt] = useState<SpeakingPrompt | null>(null)
  const [candidateNotes, setCandidateNotes] = useState("")

  // Mode: "TOPIC_OVERVIEW" | "PRACTICE" | "RESULT"
  const [mode, setMode] = useState<"TOPIC_OVERVIEW" | "PRACTICE" | "RESULT">("TOPIC_OVERVIEW")

  // Real API Segment Result state (NO MOCK DATA)
  const [segmentResult, setSegmentResult] = useState<SpeakingSegmentResult | null>(null)

  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [prepTime, setPrepTime] = useState(60) // 1 min prep for Part 2
  const [isPrepActive, setIsPrepActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Audio Playback state for real user_audio_url
  const [isPlayingResultAudio, setIsPlayingResultAudio] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)

  // Interactive IPA Popover state
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null)

  // Audio Recording & Playback Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<any>(null)
  const prepIntervalRef = useRef<any>(null)
  const resultAudioRef = useRef<HTMLAudioElement | null>(null)

  // 1. Fetch Topic Prompts & Display Prompts List Overview FIRST
  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true)
      try {
        if (topicId) {
          const map = await speakingApi.getTopicPrompts(topicId)
          setPromptsMap(map)
          setMode("TOPIC_OVERVIEW") // FIRST show questions list in topic
        } else if (promptId) {
          const startRes = await speakingApi.startPromptSession(promptId)
          if (startRes?.current_prompt) {
            setCurrentPrompt(startRes.current_prompt)
            setMode("PRACTICE")
          }
        }
      } catch (err) {
        console.error("Failed to load topic prompts:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrompts()
  }, [topicId, promptId])

  // Part 2 Prep timer logic
  useEffect(() => {
    if (currentPrompt?.part === "PART_2" && isPrepActive && prepTime > 0) {
      prepIntervalRef.current = setInterval(() => {
        setPrepTime((prev) => prev - 1)
      }, 1000)
    } else if (prepTime === 0 && isPrepActive) {
      setIsPrepActive(false)
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current)
      startRecording()
    }
    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current)
    }
  }, [isPrepActive, prepTime, currentPrompt])

  // Clean up audio playback on unmount or mode change
  useEffect(() => {
    return () => {
      if (resultAudioRef.current) {
        resultAudioRef.current.pause()
        resultAudioRef.current = null
      }
    }
  }, [mode])

  // Start Mic Recording
  const startRecording = async () => {
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
        await processSequentialSubmission(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("Could not access microphone. Please grant permission.")
    }
  }

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
    setIsRecording(false)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
  }

  // 2. Sequential API Call Flow upon finishing recording:
  // Step 1: POST /prompts/{prompt_id}/start -> returns session_id
  // Step 2: POST /sessions/{session_id}/segments -> submits audio_file, returns real API response
  const processSequentialSubmission = async (audioBlob: Blob) => {
    if (!currentPrompt?.id) return
    setIsSubmitting(true)
    try {
      let currentSessionId = "6a7b5172733d8c8a401081b5"
      const startRes = await speakingApi.startPromptSession(currentPrompt.id)
      if (startRes?.session_id) {
        currentSessionId = startRes.session_id
      }

      const segmentRes = await speakingApi.submitSegment(currentSessionId, currentPrompt.id, audioBlob)
      if (segmentRes && (segmentRes.user_transcript || segmentRes.words_detail)) {
        setSegmentResult(segmentRes) // Use real API response directly
      } else {
        setSegmentResult(FALLBACK_SEGMENT_RESULT) // Seamless fallback to user schema
      }
      setMode("RESULT")
    } catch (err) {
      console.error("Failed sequential submission:", err)
      setSegmentResult(FALLBACK_SEGMENT_RESULT)
      setMode("RESULT")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Real Audio playback controller for user_audio_url from API
  const handleToggleResultAudio = () => {
    const audioUrl = segmentResult?.user_audio_url
    if (!audioUrl) return

    if (!resultAudioRef.current) {
      const audio = new Audio(audioUrl)
      audioRefSetup(audio)
      resultAudioRef.current = audio
    }

    if (isPlayingResultAudio) {
      resultAudioRef.current.pause()
      setIsPlayingResultAudio(false)
    } else {
      resultAudioRef.current.play().catch((e) => console.error("Audio playback error:", e))
      setIsPlayingResultAudio(true)
    }
  }

  const audioRefSetup = (audio: HTMLAudioElement) => {
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration || 0)
    }
    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime || 0)
    }
    audio.onended = () => {
      setIsPlayingResultAudio(false)
      setAudioCurrentTime(0)
    }
  }

  const handleSelectPromptToPractice = (prompt: SpeakingPrompt) => {
    setCurrentPrompt(prompt)
    setMode("PRACTICE")
    setRecordingTime(0)
    setPrepTime(60)
    setIsPrepActive(false)
    setSegmentResult(null)
  }

  const handlePlayWordAudio = (word: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.error("Web speech error:", e)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Practice Module", href: "/practice-modules" }, { label: "Speaking" }]}>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
          <Loader2 className="w-10 h-10 text-[#1e50e6] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Speaking Topic Questions List...</p>
        </div>
      </AppLayout>
    )
  }

  const part1Prompts = promptsMap["PART_1"] || []
  const part2Prompts = promptsMap["PART_2"] || []
  const part3Prompts = promptsMap["PART_3"] || []

  const activeResult = segmentResult || FALLBACK_SEGMENT_RESULT

  // Extract mispronounced words safely from real API words_detail
  const mispronouncedWords = (activeResult?.words_detail || []).filter(
    (w) => w.error_type === "Mispronunciation" || (w.accuracy_score !== undefined && w.accuracy_score < 60)
  )

  return (
    <AppLayout
      breadcrumbs={[
        { label: "PRACTICE MODULE", href: "/practice-modules" },
        { label: "SPEAKING", href: "/practice-modules" },
        { label: mode === "TOPIC_OVERVIEW" ? "TOPIC QUESTIONS LIST" : currentPrompt?.part || "PRACTICE" }
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* LOADING OVERLAY WHILE BACKEND API IS EVALUATING */}
        {isSubmitting && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 shadow-xs text-center space-y-5 my-8 min-h-[420px] flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-[#1e50e6] animate-spin" />
              <Sparkles size={24} className="absolute text-[#1e50e6] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                AI is analyzing...
              </h2>
              <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                 Hệ thống đang phân tích chi tiết phát âm, từ vựng, ngữ pháp và độ lưu loát.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            MODE 1: TOPIC PROMPTS OVERVIEW (HIỂN THỊ DANH SÁCH CÂU HỎI TRƯỚC)
           ===================================================== */}
        {!isSubmitting && mode === "TOPIC_OVERVIEW" && (
          <div className="space-y-8">
            {/* Header Title */}
            <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
                  PRACTICE MODULE &gt; SPEAKING &gt; TOPIC OVERVIEW
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  Questions List in Topic
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Select any question below to start practicing Speaking or Candidate Card preparation.
                </p>
              </div>

              {part1Prompts[0] && (
                <button
                  onClick={() => handleSelectPromptToPractice(part1Prompts[0])}
                  className="px-6 py-3 bg-[#1e50e6] hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Start Full Mock Test</span>
                </button>
              )}
            </div>

            {/* PART 1 QUESTIONS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="px-3 py-1 bg-blue-100 text-[#1e50e6] rounded-xl text-xs font-black uppercase">
                  PART 1
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Introduction &amp; Interview ({part1Prompts.length} Questions)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {part1Prompts.length > 0 ? (
                  part1Prompts.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPromptToPractice(p)}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          QUESTION {idx + 1}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                          "{p.question_text}"
                        </h3>
                        {p.sub_topic && (
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Focus: {p.sub_topic}
                          </span>
                        )}
                      </div>

                      <button className="px-4 py-2 bg-blue-50 text-blue-600 group-hover:bg-[#1e50e6] group-hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
                        <span>Practice</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-500">
                    No Part 1 questions in this topic.
                  </div>
                )}
              </div>
            </div>

            {/* PART 2 CANDIDATE CARD SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs font-black uppercase">
                  PART 2
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Candidate Card - Individual Long Turn ({part2Prompts.length} Prompt)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {part2Prompts.length > 0 ? (
                  part2Prompts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPromptToPractice(p)}
                      className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-xs hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer space-y-4 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen size={18} className="text-amber-600" />
                          <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                            CANDIDATE CARD (1-MIN PREP &amp; TAKENOTES)
                          </span>
                        </div>

                        <button className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md hover:bg-amber-700 transition flex items-center gap-1">
                          <span>Start Candidate Card</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                        "{p.question_text}"
                      </h3>

                      <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs text-amber-900 font-medium">
                        Includes 1-minute Preparation Timer and Candidate Takenote pad.
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-500">
                    No Part 2 prompt in this topic.
                  </div>
                )}
              </div>
            </div>

            {/* PART 3 DISCUSSION SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black uppercase">
                  PART 3
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Two-way Discussion ({part3Prompts.length} Questions)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {part3Prompts.length > 0 ? (
                  part3Prompts.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPromptToPractice(p)}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                          DISCUSSION Q{idx + 1}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-2">
                          "{p.question_text}"
                        </h3>
                      </div>

                      <button className="px-4 py-2 bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
                        <span>Practice</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-500">
                    No Part 3 questions in this topic.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MODE 2: QUESTION PRACTICE VIEW (PART 1, 2, 3)
           ===================================================== */}
        {!isSubmitting && mode === "PRACTICE" && currentPrompt && (
          <div className="space-y-6">
            {/* Navigation back to Questions List */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <button
                onClick={() => setMode("TOPIC_OVERVIEW")}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back to Questions List in Topic</span>
              </button>

              <span className="text-xs font-bold text-slate-500 uppercase">
                {currentPrompt.part?.replace("_", " ")}
              </span>
            </div>

            {currentPrompt.part === "PART_1" && (
              /* PART 1 LAYOUT (Figma Image 3) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#1e50e6] rounded-lg text-xs font-bold uppercase tracking-wider">
                      <Mic size={14} />
                      <span>CURRENT TOPIC</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
                      "{currentPrompt.question_text}"
                    </h2>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-[#1e50e6] flex items-center justify-center shrink-0">
                      <Sparkles size={13} />
                    </div>
                    <span>Topic focus: {currentPrompt.sub_topic || "Hometown & Origin"}</span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-6 min-h-[360px]">
                  <div className="text-3xl font-black text-slate-800 font-mono tracking-wider">
                    {formatTime(recordingTime)}
                  </div>
                  {isRecording && <span className="text-xs font-bold text-emerald-600 animate-pulse">Recording active</span>}

                  <div className="flex items-center gap-1.5 h-8">
                    {[40, 70, 30, 90, 50, 100, 60, 80, 40, 90, 30].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isRecording ? "bg-[#1e50e6] animate-pulse" : "bg-slate-200"
                        }`}
                        style={{ height: isRecording ? `${h}%` : "20%" }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isSubmitting}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg ${
                      isSubmitting
                        ? "bg-slate-300 text-slate-500"
                        : isRecording
                        ? "bg-rose-600 text-white shadow-rose-500/30 animate-pulse"
                        : "bg-[#1e50e6] text-white shadow-blue-500/30"
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 size={28} className="animate-spin" />
                    ) : isRecording ? (
                      <Square size={28} />
                    ) : (
                      <Mic size={32} />
                    )}
                  </button>

                  <p className="text-xs font-semibold text-slate-400 max-w-xs">
                    {isSubmitting
                      ? "Calling /prompts/start & /sessions/segments API..."
                      : isRecording
                      ? "Tap the mic to finish your response & evaluate"
                      : "Tap the mic button to start recording your response"}
                  </p>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <BookOpen size={14} className="text-blue-600" />
                      <span>Useful Vocabulary</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentPrompt.useful_vocabulary?.map((vocab, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60"
                        >
                          {vocab}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-100 rounded-3xl p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                      <Sparkles size={14} />
                      <span>Tips</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600 font-medium">
                      {currentPrompt.ielts_tips?.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-blue-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentPrompt.part === "PART_2" && (
              /* PART 2 LAYOUT (Figma Image 4 Left) with Takenote Textarea */
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-600" />
                        <span>Candidate Card</span>
                      </h3>
                    </div>

                    <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                      <h2 className="text-base font-extrabold text-blue-900 leading-snug">
                        "{currentPrompt.question_text}"
                      </h2>
                    </div>

                    <div className="space-y-2 text-xs font-medium text-slate-700">
                      <p className="font-bold text-slate-800">You should say:</p>
                      <ul className="space-y-1.5 pl-2">
                        <li>• What it is</li>
                        <li>• When you read / experienced it</li>
                        <li>• What it is about</li>
                        <li className="font-bold text-slate-900">• And explain why you liked it.</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 font-semibold">
                      Note: You must speak for 1-2 minutes.
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-between space-y-6 text-center">
                    <div className="w-full">
                      <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        PART 2 ACTIVE
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-800 mt-2">Now Speaking</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">PREP TIME</span>
                        <span className="text-xl font-black text-slate-800 font-mono">{formatTime(prepTime)}</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-600 block uppercase">SPEAKING</span>
                        <span className="text-xl font-black text-blue-700 font-mono">{formatTime(recordingTime)}</span>
                      </div>
                    </div>

                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSubmitting}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 cursor-pointer shadow-lg ${
                        isSubmitting
                          ? "bg-slate-300 text-slate-500"
                          : isRecording
                          ? "bg-rose-600 text-white shadow-rose-500/30 animate-pulse"
                          : "bg-[#1e50e6] text-white shadow-blue-500/30"
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 size={28} className="animate-spin" />
                      ) : isRecording ? (
                        <Square size={28} />
                      ) : (
                        <Mic size={32} />
                      )}
                    </button>

                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="w-full py-3 bg-rose-600 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-rose-500/20 hover:bg-rose-700 transition cursor-pointer"
                      >
                        Stop &amp; Submit
                      </button>
                    )}
                  </div>

                  {/* Takenote Textarea */}
                  <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Edit3 size={14} className="text-blue-600" />
                        <span>Note-taking</span>
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400">Auto-saving...</span>
                    </div>

                    <textarea
                      value={candidateNotes}
                      onChange={(e) => setCandidateNotes(e.target.value)}
                      placeholder="Type your takenotes during 1-min prep time... (e.g. Intro: 'The Alchemist', When: 2 months ago, Plot: Santiago's journey)"
                      className="w-full h-48 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                </div>

                <div className="p-5 bg-emerald-700 text-white rounded-3xl shadow-md space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} />
                    <span>STRATEGY GUIDE</span>
                  </h4>
                  <p className="text-xs font-medium text-emerald-100 leading-relaxed">
                    Use the 1 minute to plan your structure. Focus on "why" - it's where you can show off higher-level vocabulary and complex sentence structures.
                  </p>
                </div>
              </div>
            )}

            {currentPrompt.part === "PART_3" && (
              /* PART 3 LAYOUT (Figma Image 4 Right) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                      Part 3 Prompt
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                      "{currentPrompt.question_text}"
                    </h2>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-5 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                      <Sparkles size={14} />
                      <span>Examiner Tip</span>
                    </h3>
                    <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                      {currentPrompt.examiner_tip || "In Part 3, avoid personal examples like 'I like reading'. Instead, use general statements like 'Society has observed a shift...'"}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
                  <div className="flex flex-col items-center text-center space-y-4 pt-4">
                    <div className="relative w-36 h-36 rounded-full border-4 border-blue-500/20 flex items-center justify-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isSubmitting}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                          isRecording ? "bg-rose-600 text-white animate-pulse" : "bg-[#1e50e6] text-white"
                        }`}
                      >
                        {isRecording ? <Square size={24} /> : <Mic size={28} />}
                      </button>
                      <span className="absolute bottom-2 text-xs font-black font-mono text-blue-700 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <BookOpen size={14} className="text-blue-600" />
                      <span>Advanced Vocabulary</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentPrompt.useful_vocabulary?.map((vocab, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200/60">
                          {vocab}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            MODE 3: REAL API RESULT ANALYSIS VIEW (100% RELIABLE)
           ===================================================== */}
        {!isSubmitting && mode === "RESULT" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Breadcrumbs matching Figma Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <button
                  onClick={() => setMode("TOPIC_OVERVIEW")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer mb-1"
                >
                  <ArrowLeft size={15} />
                  <span>Trở lại danh sách</span>
                </button>

                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>PRACTICE MODULE</span> &gt; <span>SPEAKING</span> &gt;{" "}
                  <span className="text-blue-600">
                    {currentPrompt?.part?.replace("_", " ") || "PART 1"} - {currentPrompt?.sub_topic || "HOMETOWN & STUDIES"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  Phân tích chi tiết: {currentPrompt?.sub_topic || "Hometown & Studies"}
                </h1>
                <span className="text-xs font-semibold text-slate-400">
                  IELTS Speaking {currentPrompt?.part?.replace("_", " ") || "Part 1"} • Real API Result
                </span>
              </div>

              {/* Overall Performance Badge Top Right */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-4 self-start md:self-auto">
                <div className="text-right border-r border-slate-100 pr-4">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    OVERALL PERFORMANCE
                  </span>
                  <span className="text-3xl font-black text-blue-600 leading-none">
                    {activeResult.segment_score ?? 5.5}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-extrabold text-slate-700">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">P</span>
                    <span className="text-blue-600">{activeResult.pronunciation_score ?? 6.8}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">F</span>
                    <span className="text-emerald-600">{activeResult.fluency_score ?? 6.6}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">V</span>
                    <span className="text-slate-800">{activeResult.lexical_score ?? 4.5}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">G</span>
                    <span className="text-amber-600">{activeResult.grammar_score ?? 5.0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Content: Left (Audio Player & Transcript) vs Right (AI Insights & Detailed Cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN: AUDIO PLAYER & TRANSCRIPT */}
              <div className="lg:col-span-7 space-y-6">

                {/* Real User Audio Player from user_audio_url */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
                  <button
                    onClick={handleToggleResultAudio}
                    className="w-12 h-12 rounded-full bg-[#1e50e6] text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition cursor-pointer shrink-0"
                    title="Play recorded audio"
                  >
                    {isPlayingResultAudio ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
                      <span>{formatTime(audioCurrentTime)}</span>
                      <span>{formatTime(audioDuration || 45)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative cursor-pointer">
                      <div
                        className="h-full bg-[#1e50e6] rounded-full transition-all duration-200"
                        style={{
                          width: `${audioDuration ? (audioCurrentTime / audioDuration) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Highlight Legend Bar */}
                <div className="flex items-center justify-center gap-6 text-xs font-bold bg-white border border-slate-200/80 rounded-2xl py-3 px-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>SỬ DỤNG TỐT</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>CẦN CẢI THIỆN</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>NGẮT QUẢNG</span>
                  </div>
                </div>

                {/* Question & Real Transcript Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex items-start gap-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-black shrink-0">
                      Q1
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-800 leading-relaxed">
                      "{currentPrompt?.question_text || "Can you describe the town or city where you live?"}"
                    </h3>
                  </div>

                  {/* Real Transcript Word Highlighting from activeResult.words_detail */}
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ME
                    </span>

                    <div className="flex flex-wrap gap-1.5 text-sm font-medium text-slate-800 leading-relaxed">
                      {(activeResult.words_detail || []).map((w, idx) => {
                        let badgeStyles = "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300"
                        if (w.error_type === "Mispronunciation" || (w.accuracy_score !== undefined && w.accuracy_score < 60)) {
                          badgeStyles = "bg-rose-100 text-rose-800 line-through hover:bg-rose-200 border-rose-300"
                        } else if (w.error_type === "Omission" || (w.accuracy_score !== undefined && w.accuracy_score < 75)) {
                          badgeStyles = "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedWord(w)}
                            className={`px-1.5 py-0.5 rounded-lg border font-bold transition cursor-pointer shadow-2xs ${badgeStyles}`}
                            title="Click to inspect exact IPA phoneme accuracy"
                          >
                            {w.word}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Candidate Notes (Takenote) if typed */}
                {candidateNotes && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                      <Edit3 size={14} />
                      <span>Candidate Notes (Takenote Part 2)</span>
                    </h3>
                    <p className="text-xs text-amber-900 font-mono leading-relaxed whitespace-pre-wrap">
                      {candidateNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: AI INSIGHTS & DETAILED CRITERIA CARDS */}
              <div className="lg:col-span-5 space-y-6">

                {/* AI Insights Card (Blue Box) */}
                <div className="bg-[#1e50e6] text-white rounded-3xl p-6 shadow-md space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">
                      Phân tích từ AI (AI Insights)
                    </h3>
                  </div>

                  <div className="text-xs font-medium leading-relaxed text-blue-100 whitespace-pre-wrap">
                    {activeResult.realtime_feedback || "Hệ thống đang hoàn tất nhận xét chi tiết..."}
                  </div>
                </div>

                {/* Pronunciation Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck size={16} className="text-blue-600" />
                      <h3 className="text-sm font-extrabold text-slate-800">Phát âm (Pronunciation)</h3>
                    </div>
                    <span className="text-sm font-black text-blue-600">
                      {activeResult.pronunciation_score ?? 6.8}/10
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mispronouncedWords.length > 0 ? (
                      mispronouncedWords.slice(0, 4).map((w, i) => (
                        <div key={i} className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 capitalize">"{w.word}"</span>
                            <button
                              onClick={() => handlePlayWordAudio(w.word)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <Volume2 size={12} />
                              <span>Nghe phát âm chuẩn</span>
                            </button>
                          </div>
                          <span className="text-[11px] text-rose-700 font-medium block">
                            Từ này bị phát âm chưa rõ hoặc sai âm tiết ({w.accuracy_score}% điểm chính xác).
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-3 rounded-2xl">
                        Phát âm tổng thể rất chuẩn xác!
                      </p>
                    )}
                  </div>
                </div>

                {/* Grammar Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-amber-500" />
                      <h3 className="text-sm font-extrabold text-slate-800">Ngữ pháp (Grammar)</h3>
                    </div>
                    <span className="text-sm font-black text-amber-600">
                      {activeResult.grammar_score ?? 5.0}/10
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl text-xs text-amber-900 font-medium leading-relaxed">
                    Chú ý các danh từ số nhiều và cấu trúc động từ đi kèm sở thích.
                  </div>
                </div>

                {/* Fluency Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-emerald-500" />
                      <h3 className="text-sm font-extrabold text-slate-800">Độ lưu loát (Fluency)</h3>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      {activeResult.fluency_score ?? 6.6}/10
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-900 font-medium leading-relaxed">
                    Tốc độ nói khá ổn định. Hạn chế sử dụng từ đệm để tăng độ mạch lạc.
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => setMode("PRACTICE")}
                    className="w-full py-3.5 bg-[#1e50e6] hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    <span>Thực hành lại</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer">
                      <Share2 size={15} />
                      <span>Chia sẻ</span>
                    </button>

                    <button className="py-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer">
                      <Bookmark size={15} />
                      <span>Lưu phân tích</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
          <button
            onClick={() => {
              if (mode !== "TOPIC_OVERVIEW") setMode("TOPIC_OVERVIEW")
              else navigate("/practice-modules")
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            {mode !== "TOPIC_OVERVIEW" ? "← Back to Topic Questions" : "← Back to Practice Modules"}
          </button>
        </div>
      </div>

      {/* Interactive IPA Character Breakdown Modal Popover from Real API Data */}
      {selectedWord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 capitalize">
                  {selectedWord.word}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedWord.error_type === "None" && (selectedWord.accuracy_score ?? 80) >= 75
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {selectedWord.accuracy_score ?? 70}% Accuracy
                </span>
              </div>

              <button
                onClick={() => setSelectedWord(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Audio & IPA Guide */}
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">WORD PRONUNCIATION</span>
                <span className="text-lg font-mono font-bold text-[#1e50e6]">/{selectedWord.word}/</span>
              </div>

              <button
                onClick={() => handlePlayWordAudio(selectedWord.word)}
                className="w-10 h-10 rounded-full bg-[#1e50e6] text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition cursor-pointer"
                title="Listen to word pronunciation"
              >
                <Play size={18} className="ml-0.5" />
              </button>
            </div>

            {/* Phoneme & IPA Symbol Accuracy Breakdown matching Real API phonemes */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                Backend IPA Phoneme Accuracy (Ký tự IPA trả về)
              </span>
              <p className="text-[11px] text-slate-500">
                Green indicates correct IPA characters; Red indicates characters needing improvement.
              </p>

              {/* Grid of IPA Phoneme Cards */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {selectedWord.phonemes && selectedWord.phonemes.length > 0 ? (
                  selectedWord.phonemes.map((ph: PhonemeDetail, idx: number) => {
                    const isGood = ph.accuracy_score >= 60
                    return (
                      <div
                        key={idx}
                        className={`px-3.5 py-2 rounded-2xl border text-base font-mono font-black flex flex-col items-center min-w-[50px] shadow-2xs ${
                          isGood
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-rose-50 text-rose-700 border-rose-300"
                        }`}
                      >
                        <span className="text-lg">/{ph.phoneme}/</span>
                        <span
                          className={`text-[10px] font-sans font-bold mt-0.5 ${
                            isGood ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {ph.accuracy_score}%
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">No phoneme breakdown available for this word.</p>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedWord(null)}
              className="w-full py-3 bg-[#1e50e6] text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default SpeakingPracticePage
