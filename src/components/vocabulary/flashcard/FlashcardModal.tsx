import React, { useState, useEffect, useCallback } from 'react'
import {
  X, Zap, Settings, Volume2, ArrowLeft, ArrowRight,
  CheckCircle2, Frown, Check, Sliders, Shuffle, Edit3
} from 'lucide-react'
import type { VocabularyCollection, WordDetail, WordStatus } from '../../../types/vocabulary'
import { updateWordStatus } from '../../../services/vocabularyApi'
import EditWordModal from '../modals/EditWordModal'
import { speakText } from '../../../utils/tts'

interface FlashcardModalProps {
  open: boolean
  collection: VocabularyCollection | null
  onClose: () => void
  onSessionComplete: (ratings: Record<string, WordStatus>, studyTimeSec: number) => void
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  open,
  collection,
  onClose,
  onSessionComplete,
}) => {
  const [words, setWords] = useState<WordDetail[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [ratings, setRatings] = useState<Record<string, WordStatus>>({})
  const [startTime, setStartTime] = useState<number>(0)
  const [isFinished, setIsFinished] = useState(false)
  const [streak] = useState(12)

  // Edit Word State
  const [editingWord, setEditingWord] = useState<WordDetail | null>(null)

  // Settings State
  const [showSettings, setShowSettings] = useState(false)
  const [autoSpeech, setAutoSpeech] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [startWithDefinition, setStartWithDefinition] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)

  useEffect(() => {
    if (open && collection) {
      const list = collection.words_list ? [...collection.words_list] : []
      setWords(list)
      setCurrentIndex(0)
      setIsFlipped(startWithDefinition)
      setRatings({})
      setStartTime(Date.now())
      setIsFinished(false)
    }
  }, [open, collection, startWithDefinition])

  // Text to speech
  const speakWord = useCallback((text: string, e?: React.MouseEvent) => {
    speakText(text, collection?.language, speechRate, e)
  }, [collection?.language, speechRate])

  // Auto speech on card change
  useEffect(() => {
    if (autoSpeech && words[currentIndex] && !isFlipped) {
      speakWord(words[currentIndex].word)
    }
  }, [currentIndex, autoSpeech, isFlipped, words, speakWord])

  const handleShuffle = () => {
    if (words.length > 0) {
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      setWords(shuffled)
      setCurrentIndex(0)
      setIsFlipped(startWithDefinition)
      setIsShuffled(true)
    }
  }

  const handleRating = useCallback((status: 'MASTERED' | 'NEEDS_REVIEW') => {
    if (!words[currentIndex] || !collection) return
    const wordId = words[currentIndex].id
    setRatings(prev => ({ ...prev, [wordId]: status }))

    if (!collection.id.startsWith('650000000000')) {
      updateWordStatus({ collection_id: collection.id, word_id: wordId, status }).catch(console.error)
    }

    if (currentIndex < words.length - 1) {
      setIsFlipped(startWithDefinition)
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200)
    } else {
      setIsFinished(true)
    }
  }, [currentIndex, words, collection, startWithDefinition])

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(startWithDefinition)
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleNextOnly = () => {
    if (currentIndex < words.length - 1) {
      setIsFlipped(startWithDefinition)
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleFinish = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    onSessionComplete(ratings, timeSpent)
    onClose()
  }

  const handleWordUpdated = (updated: WordDetail) => {
    setWords(prev => prev.map(w => w.id === updated.id ? updated : w))
    if (collection && collection.words_list) {
      collection.words_list = collection.words_list.map(w => w.id === updated.id ? updated : w)
    }
    setEditingWord(null)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!open || isFinished || showSettings || !!editingWord) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setIsFlipped(prev => !prev)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextOnly()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleRating('MASTERED')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        handleRating('NEEDS_REVIEW')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, isFinished, showSettings, editingWord, handlePrev, handleNextOnly, handleRating, onClose])

  if (!open || !collection) return null

  // Finish summary view
  if (isFinished) {
    const timeSpentSec = Math.floor((Date.now() - startTime) / 1000)
    const mins = Math.floor(timeSpentSec / 60)
    const secs = timeSpentSec % 60
    const totalCount = words.length
    const masteredCount = Object.values(ratings).filter(s => s === 'MASTERED').length

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-[2px]">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-black text-slate-800 mb-1">Tuyệt vời!</h2>
          <p className="text-slate-500 text-xs mb-5">Bạn đã hoàn thành phiên luyện tập</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-left">
              <div className="text-[11px] text-emerald-600 font-bold mb-0.5">Đã thuộc</div>
              <div className="text-xl font-black text-emerald-700">{masteredCount} / {totalCount}</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 text-left">
              <div className="text-[11px] text-blue-600 font-bold mb-0.5">Thời gian</div>
              <div className="text-xl font-black text-blue-700">{mins}:{secs.toString().padStart(2, '0')}</div>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-blue-500/20"
          >
            Hoàn thành
          </button>
        </div>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  if (!currentWord) return null

  const progressPct = words.length > 0 ? Math.round(((currentIndex + 1) / words.length) * 100) : 0
  const masteredCount = Object.values(ratings).filter(s => s === 'MASTERED').length
  const needsReviewCount = Object.values(ratings).filter(s => s === 'NEEDS_REVIEW').length

  const photoUrl = currentWord.image_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 font-['Be_Vietnam_Pro'] overflow-y-auto select-none">
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-[#1D4ED8] text-sm sm:text-base leading-snug truncate">
              {collection.title}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">
              Practice Session • {currentIndex + 1}/{words.length} words
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Edit Word Button */}
          <button
            onClick={() => setEditingWord(currentWord)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
            title="Sửa từ vựng này"
          >
            <Edit3 size={13} className="text-[#1D4ED8]" />
            <span className="hidden xs:inline">Sửa từ</span>
          </button>

          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] sm:text-[11px] font-black rounded-full border border-slate-200">
            <Zap size={12} className="fill-[#1D4ED8] text-[#1D4ED8]" />
            <span>STREAK: {streak}</span>
          </div>
          <button 
            onClick={() => setShowSettings(v => !v)}
            className={`p-1.5 rounded-xl transition-all ${showSettings ? 'bg-blue-50 text-[#1D4ED8]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            title="Tùy chỉnh Flashcard"
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* ── Main Body Content (Container max-w-4xl) ── */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Progress Bar */}
          <div className="mb-3 sm:mb-5">
            <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-black text-[#1D4ED8] uppercase tracking-wider mb-1">
              <span>PROGRESS</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1D4ED8] rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Flashcard Card + Right Stats Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Center 3D Perspective Flashcard Container (8 cols) */}
            <div className="md:col-span-8 flex items-center justify-center [perspective:1200px]">
              {/* 3D Flip Card Inner Box */}
              <div
                onClick={() => setIsFlipped(v => !v)}
                className={`w-full min-h-[260px] sm:min-h-[350px] relative cursor-pointer rounded-3xl transition-transform duration-700 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* ── FRONT FACE (rotateY 0deg) ── */}
                <div
                  className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/60
                    p-5 sm:p-8 flex flex-col items-center justify-between [backface-visibility:hidden] [webkit-backface-visibility:hidden]"
                >
                  <div className="w-full h-2" />

                  <div className="flex flex-col items-center justify-center text-center my-auto">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-3 sm:mb-4 tracking-tight">
                      {currentWord.word}
                    </h2>

                    <button
                      onClick={(e) => speakWord(currentWord.word, e)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100/90 hover:bg-blue-200 text-[#1D4ED8] flex items-center justify-center transition-colors shadow-sm"
                      title="Phát âm"
                    >
                      <Volume2 size={20} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-widest uppercase pb-1">
                    TOUCH TO REVEAL DEFINITION
                  </p>
                </div>

                {/* ── BACK FACE (rotateY 180deg) ── */}
                <div
                  className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/60
                    p-4 sm:p-8 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] [webkit-backface-visibility:hidden] overflow-y-auto"
                >
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Header row with fixed height so MEANING and EXAMPLE remain at a locked Y-position */}
                      <div className="min-h-[112px] sm:min-h-[144px] flex items-start justify-between gap-3 sm:gap-4 mb-3">
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                              {currentWord.word}
                            </h2>
                            {currentWord.word_type && (
                              <span className="px-2.5 py-0.5 bg-blue-100/90 text-[#1D4ED8] text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-wider">
                                {currentWord.word_type}
                              </span>
                            )}
                          </div>
                          {currentWord.ipa && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm font-medium">
                              <span>/{currentWord.ipa.replace(/\//g,'')}/</span>
                              <button
                                onClick={(e) => speakWord(currentWord.word, e)}
                                className="text-slate-400 hover:text-[#1D4ED8] transition-colors"
                              >
                                <Volume2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Larger Square Photo Image Box */}
                        {currentWord.image_url && (
                          <div className="w-28 h-28 sm:w-36 sm:h-36 aspect-square rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                            <img
                              src={photoUrl}
                              alt={currentWord.word}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 my-2 sm:my-3" />

                      {/* Meaning */}
                      <div className="mb-2 sm:mb-3">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                          MEANING
                        </span>
                        <p className="text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed">
                          {currentWord.meaning}
                        </p>
                      </div>

                      {/* Example */}
                      {currentWord.example_sentence && (
                        <div>
                          <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                            EXAMPLE
                          </span>
                          <div className="bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100">
                            <p className="text-slate-600 text-xs italic">
                              "{currentWord.example_sentence}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Stats (4 cols) */}
            <div className="md:col-span-4 space-y-3">
              {/* Trạng thái card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                  TRẠNG THÁI
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      <span>Đã thuộc</span>
                    </div>
                    <span className="font-black text-emerald-600 text-sm">{masteredCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-500 text-[10px] font-black flex items-center justify-center">!</span>
                      <span>Cần ôn tập</span>
                    </div>
                    <span className="font-black text-red-500 text-sm">{needsReviewCount}</span>
                  </div>
                </div>
              </div>

              {/* Daily Goal card */}
              <div className="bg-gradient-to-br from-[#1D4ED8] to-blue-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden hidden md:block">
                <h3 className="font-bold text-base mb-1">Daily Goal</h3>
                <p className="text-blue-100 text-[11px] leading-relaxed mb-3">
                  Complete 50 more words to reach your goal!
                </p>
                <div className="w-full h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Controls & Decision Buttons ── */}
        <div className="mt-3 sm:mt-4">
          {/* Navigation row: Quay lại | Dots | Tiếp theo */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {words.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex % 5 ? 'bg-[#1D4ED8] scale-110' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNextOnly}
              className="flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:text-blue-800 transition-colors"
            >
              Tiếp theo <ArrowRight size={14} />
            </button>
          </div>

          {/* Decision Buttons (Chưa thuộc / Đã thuộc) - Responsive 2 columns on all devices */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-w-4xl mx-auto">
            {/* Chưa thuộc */}
            <button
              onClick={() => handleRating('NEEDS_REVIEW')}
              className="group bg-white hover:bg-red-50/50 border-2 border-red-200 hover:border-red-400
                rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-center transition-all shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-0.5"
            >
              <Frown size={20} className="text-red-500 mb-0.5 group-hover:scale-110 transition-transform" />
              <span className="font-extrabold text-red-600 text-sm sm:text-base">Chưa thuộc</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold hidden sm:inline">Sẽ ôn lại sớm</span>
            </button>

            {/* Đã thuộc */}
            <button
              onClick={() => handleRating('MASTERED')}
              className="group bg-white hover:bg-emerald-50/50 border-2 border-emerald-200 hover:border-emerald-400
                rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-center transition-all shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-0.5"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                <Check size={14} strokeWidth={3} />
              </div>
              <span className="font-extrabold text-emerald-600 text-sm sm:text-base">Đã thuộc</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold hidden sm:inline">Đã nhớ kỹ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit Word Modal ── */}
      <EditWordModal
        open={!!editingWord}
        word={editingWord}
        onClose={() => setEditingWord(null)}
        onUpdated={handleWordUpdated}
      />

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-[2px]">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sliders size={16} className="text-[#1D4ED8]" /> Tùy chỉnh Flashcard
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Volume2 size={15} className="text-blue-500" />
                  <span>Tự động phát âm</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoSpeech} 
                    onChange={e => setAutoSpeech(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1D4ED8]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <Shuffle size={15} className="text-purple-500" />
                  <span>Trộn ngẫu nhiên từ</span>
                </div>
                <button
                  onClick={handleShuffle}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                    isShuffled ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isShuffled ? 'Đã trộn' : 'Trộn từ'}
                </button>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span>Mặt xem trước</span>
                <select
                  value={startWithDefinition ? 'definition' : 'word'}
                  onChange={e => setStartWithDefinition(e.target.value === 'definition')}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="word">Thuật ngữ (Từ mới)</option>
                  <option value="definition">Định nghĩa (Nghĩa)</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span>Tốc độ đọc giọng nói</span>
                <select
                  value={speechRate}
                  onChange={e => setSpeechRate(parseFloat(e.target.value))}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value={0.75}>Chậm (0.75x)</option>
                  <option value={1.0}>Bình thường (1.0x)</option>
                  <option value={1.25}>Nhanh (1.25x)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-5 py-2 bg-[#1D4ED8] hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Áp dụng tùy chỉnh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlashcardModal
