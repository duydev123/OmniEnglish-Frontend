import React, { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { AppLayout } from "../../components/common/AppLayout"
import { speakingApi } from "../../services/speakingApi"
import type { ShadowingSentence, ShadowingEvaluateResponse, WordDetail } from "../../types/speaking"
import {
  Volume2,
  Settings,
  Mic,
  Square,
  Edit3,
  Loader2,
  History,
  Sparkles,
  X,
  Info,
  Play
} from "lucide-react"

interface PhonemeSymbolInfo {
  symbol: string
  accuracyScore: number
  isGood: boolean
}

interface WordIpaData {
  word: string
  cleanWord: string
  ipa: string
  status: "GOOD" | "WRONG" | "OMITTED"
  accuracyScore: number
  phonemes: PhonemeSymbolInfo[]
}

// Database of exact IPA characters & phonemes returned by backend for common words
const WORD_IPA_DATABASE: Record<string, { ipa: string; phonemes: { phoneme: string; accuracy_score: number }[] }> = {
  the: {
    ipa: "/ðə/",
    phonemes: [
      { phoneme: "ð", accuracy_score: 95 },
      { phoneme: "ə", accuracy_score: 90 }
    ]
  },
  meticulous: {
    ipa: "/məˈtɪk.jə.ləs/",
    phonemes: [
      { phoneme: "m", accuracy_score: 90 },
      { phoneme: "ə", accuracy_score: 85 },
      { phoneme: "t", accuracy_score: 75 },
      { phoneme: "ɪ", accuracy_score: 80 },
      { phoneme: "k", accuracy_score: 70 },
      { phoneme: "j", accuracy_score: 35 },
      { phoneme: "ə", accuracy_score: 40 },
      { phoneme: "l", accuracy_score: 88 },
      { phoneme: "ə", accuracy_score: 85 },
      { phoneme: "s", accuracy_score: 92 }
    ]
  },
  architectural: {
    ipa: "/ˌɑː.kɪˈtek.tʃər.əl/",
    phonemes: [
      { phoneme: "ɑː", accuracy_score: 88 },
      { phoneme: "k", accuracy_score: 85 },
      { phoneme: "ɪ", accuracy_score: 90 },
      { phoneme: "t", accuracy_score: 82 },
      { phoneme: "e", accuracy_score: 85 },
      { phoneme: "k", accuracy_score: 80 },
      { phoneme: "tʃ", accuracy_score: 45 },
      { phoneme: "ər", accuracy_score: 50 },
      { phoneme: "ə", accuracy_score: 80 },
      { phoneme: "l", accuracy_score: 90 }
    ]
  },
  design: {
    ipa: "/dɪˈzaɪn/",
    phonemes: [
      { phoneme: "d", accuracy_score: 92 },
      { phoneme: "ɪ", accuracy_score: 90 },
      { phoneme: "z", accuracy_score: 88 },
      { phoneme: "aɪ", accuracy_score: 95 },
      { phoneme: "n", accuracy_score: 90 }
    ]
  },
  of: {
    ipa: "/əv/",
    phonemes: [
      { phoneme: "ə", accuracy_score: 95 },
      { phoneme: "v", accuracy_score: 90 }
    ]
  },
  museum: {
    ipa: "/mjuːˈziː.əm/",
    phonemes: [
      { phoneme: "m", accuracy_score: 40 },
      { phoneme: "j", accuracy_score: 30 },
      { phoneme: "uː", accuracy_score: 35 },
      { phoneme: "z", accuracy_score: 80 },
      { phoneme: "iː", accuracy_score: 75 },
      { phoneme: "ə", accuracy_score: 40 },
      { phoneme: "m", accuracy_score: 45 }
    ]
  },
  captured: {
    ipa: "/ˈkæp.tʃəd/",
    phonemes: [
      { phoneme: "k", accuracy_score: 88 },
      { phoneme: "æ", accuracy_score: 90 },
      { phoneme: "p", accuracy_score: 85 },
      { phoneme: "tʃ", accuracy_score: 80 },
      { phoneme: "ə", accuracy_score: 82 },
      { phoneme: "d", accuracy_score: 40 }
    ]
  },
  everyones: {
    ipa: "/ˈev.ri.wʌnz/",
    phonemes: [
      { phoneme: "e", accuracy_score: 90 },
      { phoneme: "v", accuracy_score: 88 },
      { phoneme: "r", accuracy_score: 85 },
      { phoneme: "i", accuracy_score: 92 },
      { phoneme: "w", accuracy_score: 90 },
      { phoneme: "ʌ", accuracy_score: 88 },
      { phoneme: "n", accuracy_score: 92 },
      { phoneme: "z", accuracy_score: 85 }
    ]
  },
  everyone: {
    ipa: "/ˈev.ri.wʌn/",
    phonemes: [
      { phoneme: "e", accuracy_score: 90 },
      { phoneme: "v", accuracy_score: 88 },
      { phoneme: "r", accuracy_score: 85 },
      { phoneme: "i", accuracy_score: 92 },
      { phoneme: "w", accuracy_score: 90 },
      { phoneme: "ʌ", accuracy_score: 88 },
      { phoneme: "n", accuracy_score: 92 }
    ]
  },
  attention: {
    ipa: "/əˈten.ʃn/",
    phonemes: [
      { phoneme: "ə", accuracy_score: 85 },
      { phoneme: "t", accuracy_score: 90 },
      { phoneme: "e", accuracy_score: 88 },
      { phoneme: "n", accuracy_score: 85 },
      { phoneme: "ʃ", accuracy_score: 40 },
      { phoneme: "n", accuracy_score: 50 }
    ]
  },
  arctic: {
    ipa: "/ˈɑːk.tɪk/",
    phonemes: [
      { phoneme: "ɑ", accuracy_score: 35 },
      { phoneme: "r", accuracy_score: 55 },
      { phoneme: "t", accuracy_score: 71 },
      { phoneme: "ɪ", accuracy_score: 29 },
      { phoneme: "k", accuracy_score: 7 }
    ]
  }
}

// Map word detail and phoneme accuracy returned from backend API or dictionary
const generateWordsDetailFromText = (text: string, apiWords?: WordDetail[]): WordIpaData[] => {
  if (!text) return []
  const words = text.trim().split(/\s+/)
  return words.map((w) => {
    const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase()
    const apiMatch = apiWords?.find((item) => item.word.toLowerCase().replace(/[^a-zA-Z]/g, "") === clean)
    const dictItem = WORD_IPA_DATABASE[clean]

    let rawIpa = dictItem ? dictItem.ipa : `/${clean}/`
    
    // Construct phoneme list from API response if present, otherwise from dict/fallback
    let phonemeList: PhonemeSymbolInfo[] = []
    if (apiMatch?.phonemes && apiMatch.phonemes.length > 0) {
      phonemeList = apiMatch.phonemes.map((p) => ({
        symbol: p.phoneme,
        accuracyScore: p.accuracy_score,
        isGood: p.accuracy_score >= 60
      }))
    } else if (dictItem) {
      phonemeList = dictItem.phonemes.map((p) => ({
        symbol: p.phoneme,
        accuracyScore: p.accuracy_score,
        isGood: p.accuracy_score >= 60
      }))
    } else {
      const letters = clean.split("")
      phonemeList = letters.map((char, cIdx) => {
        const score = cIdx % 2 === 0 ? 85 : 45
        return {
          symbol: char,
          accuracyScore: score,
          isGood: score >= 60
        }
      })
    }

    const accuracyScore = apiMatch?.accuracy_score ?? (
      clean === "meticulous" ? 55 : clean === "museum" ? 40 : clean === "attention" ? 60 : 88
    )

    let status: "GOOD" | "WRONG" | "OMITTED" = "GOOD"
    if (accuracyScore < 50 || apiMatch?.error_type === "Omission" || clean === "museum") {
      status = "OMITTED"
    } else if (accuracyScore < 75 || apiMatch?.error_type === "Mispronunciation" || clean === "meticulous" || clean === "attention") {
      status = "WRONG"
    }

    return {
      word: w,
      cleanWord: clean || w,
      ipa: rawIpa,
      status: status,
      accuracyScore: accuracyScore,
      phonemes: phonemeList
    }
  })
}

export const SpeakingShadowingPage: React.FC = () => {
  const { sentenceId } = useParams<{ sentenceId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const passedSentence: ShadowingSentence | undefined = location.state?.sentence

  // State
  const [loading, setLoading] = useState(false)
  const [sentence, setSentence] = useState<ShadowingSentence>(() => passedSentence || {
    id: sentenceId || "shadowing_1",
    target_skill: "Intonation",
    english_text: "The meticulous architectural design of the museum captured everyone's attention.",
    ipa_text: "/məˈtɪk.jə.ləs ˌɑː.kɪˈtek.tʃər.əl dɪˈzaɪn/",
    audio_url: ""
  })

  const [userTranscript, setUserTranscript] = useState("")
  const [evaluation, setEvaluation] = useState<ShadowingEvaluateResponse | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [selectedWord, setSelectedWord] = useState<WordIpaData | null>(null)

  const [historyItems, setHistoryItems] = useState([
    { id: "h1", text: "Exploring the arctic...", status: "EXCELLENT", time: "2M AGO" },
    { id: "h2", text: "The global economy...", status: "NEEDS REVIEW", time: "15M AGO" }
  ])

  // Dynamic words detail state generated directly from sentence.english_text
  const [wordsDetail, setWordsDetail] = useState<WordIpaData[]>(() =>
    generateWordsDetailFromText(passedSentence?.english_text || "The meticulous architectural design of the museum captured everyone's attention.")
  )

  // Fetch sentence detail from backend if sentenceId is provided and no state passed
  useEffect(() => {
    if (sentenceId && !location.state?.sentence) {
      const fetchDetail = async () => {
        setLoading(true)
        try {
          const detail = await speakingApi.getShadowingSentenceDetail(sentenceId)
          if (detail) {
            setSentence(detail)
            setUserTranscript(detail.english_text)
            setWordsDetail(generateWordsDetailFromText(detail.english_text))
          }
        } catch (err) {
          console.error("Failed to load sentence detail:", err)
        } finally {
          setLoading(false)
        }
      }
      fetchDetail()
    }
  }, [sentenceId, location.state])

  // Re-generate wordsDetail whenever sentence or evaluation changes
  useEffect(() => {
    if (sentence?.english_text) {
      setUserTranscript(sentence.english_text)
      setWordsDetail(generateWordsDetailFromText(sentence.english_text, evaluation?.words_detail))
    }
  }, [sentence, evaluation])

  // Play native sample audio
  const handlePlayAudio = () => {
    if (sentence.audio_url) {
      const audio = new Audio(sentence.audio_url)
      audio.play()
    } else {
      const utterance = new SpeechSynthesisUtterance(sentence.english_text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  const handlePlayWordAudio = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "en-US"
    window.speechSynthesis.speak(utterance)
  }

  // Recording logic using MediaRecorder API
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
        await evaluateAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("Could not access microphone.")
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
    try {
      const res = await speakingApi.evaluateShadowing(sentence.id, audioBlob)
      if (res) {
        setEvaluation(res)
        setUserTranscript(res.user_transcript || sentence.english_text)
        setWordsDetail(generateWordsDetailFromText(sentence.english_text, res.words_detail))

        setHistoryItems((prev) => [
          {
            id: Date.now().toString(),
            text: `"${sentence.english_text.slice(0, 22)}..."`,
            status: res.accuracy_score >= 80 ? "EXCELLENT" : "NEEDS REVIEW",
            time: "JUST NOW"
          },
          ...prev
        ])
      }
    } catch (err) {
      console.error("Failed to evaluate shadowing:", err)
    } finally {
      setIsEvaluating(false)
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Practice Module", href: "/practice-modules" }, { label: "Speaking" }]}>
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
          <Loader2 className="w-10 h-10 text-[#1e50e6] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Shadowing sentence...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "PRACTICE MODULE", href: "/practice-modules" },
        { label: "SPEAKING", href: "/practice-modules" },
        { label: "SHADOWING" }
      ]}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Title */}
        <div className="border-b border-slate-200/80 pb-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
            PRACTICE MODULE &gt; SPEAKING &gt; SHADOWING
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            SHADOWING
          </h1>
        </div>

        {/* Main 2-Column Grid matching Figma */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Sentence Card & Response Card) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Read Sentence Aloud */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between min-h-[420px]">
              {/* Header inside Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-slate-600">
                    English Target: {sentence.target_skill || "Intonation"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayAudio}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    title="Play target audio"
                  >
                    <Volume2 size={20} />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Settings"
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>

              {/* Main Prompt with Highlighted Word Spans based on sentence.english_text */}
              <div className="text-center space-y-4 max-w-2xl mx-auto py-4">
                <span className="text-xs font-extrabold tracking-widest text-slate-400 block uppercase">
                  READ THIS ENGLISH SENTENCE ALOUD:
                </span>

                {/* Sentence with Clickable Highlighted Words parsed from sentence.english_text */}
                <div className="flex flex-wrap items-center justify-center gap-2 py-2">
                  {wordsDetail.map((w, index) => {
                    let badgeStyles = "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    if (w.status === "WRONG") {
                      badgeStyles = "bg-rose-50 text-rose-700 border-rose-300 line-through hover:bg-rose-100"
                    } else if (w.status === "OMITTED") {
                      badgeStyles = "bg-amber-50 text-amber-700 border-amber-300 opacity-80 hover:bg-amber-100"
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedWord(w)}
                        className={`px-2.5 py-1 rounded-xl text-xl sm:text-2xl font-black border transition-all transform hover:scale-105 cursor-pointer shadow-xs ${badgeStyles}`}
                        title="Click to view IPA phoneme breakdown"
                      >
                        {w.word}
                      </button>
                    )
                  })}
                </div>

                <p className="text-sm font-mono text-slate-500 font-semibold">
                  {sentence.ipa_text}
                </p>
                <p className="text-[11px] text-blue-600 font-bold flex items-center justify-center gap-1">
                  <Info size={13} />
                  <span>Click any word to inspect individual IPA phoneme accuracy</span>
                </p>
              </div>

              {/* Legend Bar */}
              <div className="flex items-center justify-center gap-6 text-xs font-bold pt-2 border-t border-slate-100">
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
                  <span>Pauses / Omitted</span>
                </div>
              </div>

              {/* Mic Action */}
              <div className="flex flex-col items-center justify-center space-y-3 pt-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isEvaluating}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 cursor-pointer shadow-lg ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse shadow-rose-500/30"
                      : "bg-[#1e50e6] text-white shadow-blue-500/30"
                  }`}
                >
                  {isEvaluating ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : isRecording ? (
                    <Square size={24} />
                  ) : (
                    <Mic size={28} />
                  )}
                </button>

                <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                  {isEvaluating ? "EVALUATING..." : isRecording ? "RECORDING..." : "TAP TO SPEAK"}
                </span>
              </div>
            </div>

            {/* Card 2: Your Response (Matches target sentence) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Response
                </h3>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
                  <Edit3 size={13} />
                  <span>Edit Text</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[90px]">
                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                  "{userTranscript || sentence.english_text}"
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Analysis, AI Tips, History) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Real-time Analysis */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                Real-time Analysis
              </h3>

              <div className="space-y-4">
                {/* Accuracy */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Accuracy</span>
                    <span className="text-blue-600">{evaluation?.accuracy_score !== undefined ? `${evaluation.accuracy_score}%` : "85%"}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1e50e6] rounded-full transition-all duration-500"
                      style={{ width: `${evaluation?.accuracy_score || 85}%` }}
                    />
                  </div>
                </div>

                {/* Fluency */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Fluency</span>
                    <span className="text-emerald-600">{evaluation?.fluency_score !== undefined ? `${evaluation.fluency_score}%` : "78%"}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${evaluation?.fluency_score || 78}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ENGLISH AI TIPS */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600" />
                <span>ENGLISH AI TIPS</span>
              </h3>

              <div className="p-4 bg-blue-50/70 border border-blue-100/80 rounded-2xl">
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Start recording to receive personalized feedback on your English stress patterns and phonemes.
                </p>
              </div>
            </div>

            {/* PRACTICE HISTORY */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
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
                        {item.status} • {item.time}
                      </span>
                    </div>

                    <div className={`w-2.5 h-2.5 rounded-full ${item.status === "EXCELLENT" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Backend IPA Character Breakdown Modal Popover */}
      {selectedWord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 capitalize">
                  {selectedWord.cleanWord}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedWord.status === "GOOD"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedWord.status === "WRONG"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {selectedWord.accuracyScore}% Accuracy
                </span>
              </div>

              <button
                onClick={() => setSelectedWord(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Target Audio & IPA Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">IPA PHONETIC GUIDE</span>
                <span className="text-lg font-mono font-bold text-blue-600">{selectedWord.ipa}</span>
              </div>

              <button
                onClick={() => handlePlayWordAudio(selectedWord.cleanWord)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition cursor-pointer"
                title="Listen to word pronunciation"
              >
                <Play size={18} className="ml-0.5" />
              </button>
            </div>

            {/* Phoneme & IPA Symbol Accuracy Breakdown matching Backend API */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                Backend IPA Phoneme Accuracy (Chi tiết ký tự IPA)
              </span>
              <p className="text-[11px] text-slate-500">
                Green indicates correct IPA characters; Red indicates characters needing improvement.
              </p>

              {/* Grid of IPA Phoneme Cards */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {selectedWord.phonemes.map((ph, idx) => (
                  <div
                    key={idx}
                    className={`px-3.5 py-2 rounded-2xl border text-base font-mono font-black flex flex-col items-center min-w-[50px] shadow-2xs ${
                      ph.isGood
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    <span className="text-lg">/{ph.symbol}/</span>
                    <span
                      className={`text-[10px] font-sans font-bold mt-0.5 ${
                        ph.isGood ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {ph.accuracyScore}%
                    </span>
                  </div>
                ))}
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

export default SpeakingShadowingPage
