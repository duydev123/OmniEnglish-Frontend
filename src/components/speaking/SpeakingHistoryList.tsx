import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { speakingApi } from '../../services/speakingApi'
import type { SpeakingHistoryItem, SpeakingSessionDetail } from '../../types/speaking'
import {
  Mic,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  ArrowRight,
  Loader2,
  Calendar,
  Zap,
  BookOpen,
  Check,
  AlertCircle,
  FileEdit,
  Play,
  Pause,
  Volume2,
  Sparkles,
  VolumeX,
  ChevronUp
} from 'lucide-react'

const PAGE_SIZE_OPTIONS = [6, 10, 20, 50]

interface SpeakingHistoryListProps {
  userId?: string
}

export const SpeakingHistoryList: React.FC<SpeakingHistoryListProps> = () => {
  const navigate = useNavigate()

  // State
  const [historyItems, setHistoryItems] = useState<SpeakingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Filters
  const [selectedPart, setSelectedPart] = useState<string>('ALL') // 'ALL', 'SHADOWING', 'PART_1', 'PART_2', 'PART_3', 'FULL_TEST'
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL') // 'ALL', 'COMPLETED', 'IN_PROGRESS'
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_score'>('newest')

  // Expanded Session Details & Audio Player state
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [sessionDetailsMap, setSessionDetailsMap] = useState<Record<string, SpeakingSessionDetail>>({})
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)

  // Audio playback state
  const [activeAudioSessionId, setActiveAudioSessionId] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch History from API
  useEffect(() => {
    let cancelled = false
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const partParam = selectedPart === 'ALL' ? undefined : selectedPart
        const res = await speakingApi.getHistory(currentPage, pageSize, undefined, undefined, partParam)

        if (cancelled) return
        setHistoryItems(res || [])
        setHasMore((res || []).length === pageSize)
      } catch (err: any) {
        if (cancelled) return
        console.error("Failed to load speaking history:", err)
        setError(err?.response?.data?.message || err?.message || "Không thể tải lịch sử làm bài Speaking")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistory()
    return () => { cancelled = true }
  }, [currentPage, pageSize, selectedPart])

  // Clean up audio playback on unmount or session change
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
        activeAudioRef.current = null
      }
    }
  }, [])

  // Reset to page 1 when filters change
  const handlePartChange = (part: string) => {
    setSelectedPart(part)
    setCurrentPage(1)
  }

  // Toggle quick view & fetch session details if not cached
  const handleToggleExpand = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null)
      if (activeAudioRef.current) {
        activeAudioRef.current.pause()
        setIsPlayingAudio(false)
      }
      return
    }

    setExpandedSessionId(sessionId)

    // Stop current audio if playing
    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      setIsPlayingAudio(false)
    }

    if (!sessionDetailsMap[sessionId]) {
      setLoadingDetailId(sessionId)
      try {
        const detail = await speakingApi.getSessionResult(sessionId)
        if (detail) {
          setSessionDetailsMap((prev) => ({ ...prev, [sessionId]: detail }))
        }
      } catch (err) {
        console.error("Failed to fetch session detail for preview:", err)
      } finally {
        setLoadingDetailId(null)
      }
    }
  }

  // Inline Audio Playback Handler
  const handleToggleInlineAudio = (e: React.MouseEvent, sessionId: string, audioUrl?: string) => {
    e.stopPropagation()
    if (!audioUrl) return

    if (activeAudioSessionId === sessionId && activeAudioRef.current) {
      if (isPlayingAudio) {
        activeAudioRef.current.pause()
        setIsPlayingAudio(false)
      } else {
        activeAudioRef.current.play().catch((err) => console.error("Audio playback error:", err))
        setIsPlayingAudio(true)
      }
      return
    }

    // Stop previous audio
    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current = null
    }

    const audio = new Audio(audioUrl)
    audio.onloadedmetadata = () => setAudioDuration(audio.duration || 0)
    audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime || 0)
    audio.onended = () => {
      setIsPlayingAudio(false)
      setAudioCurrentTime(0)
    }

    activeAudioRef.current = audio
    setActiveAudioSessionId(sessionId)
    audio.play().catch((err) => console.error("Audio playback error:", err))
    setIsPlayingAudio(true)
  }

  // Filter & Sort client side for keyword and status
  const filteredAndSortedItems = historyItems
    .filter((item) => {
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false
      }
      if (searchKeyword.trim() !== '') {
        const kw = searchKeyword.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(kw)
        const typeMatch = item.test_type?.toLowerCase().includes(kw)
        return titleMatch || typeMatch
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === 'highest_score') {
        return (b.overall_band_score || 0) - (a.overall_band_score || 0)
      }
      return 0
    })

  // Format date helper
  const formatDate = (isoString: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return isoString
    }
  }

  const formatTime = (sec: number) => {
    const s = Math.floor(sec || 0)
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`
  }

  // Render Test Type Badge
  const renderTestTypeBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'SHADOWING':
        return (
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Zap size={11} />
            SHADOWING
          </span>
        )
      case 'PART_1':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Mic size={11} />
            PART 1 • INTERVIEW
          </span>
        )
      case 'PART_2':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <BookOpen size={11} />
            PART 2 • LONG TURN
          </span>
        )
      case 'PART_3':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Mic size={11} />
            PART 3 • DISCUSSION
          </span>
        )
      case 'FULL_TEST':
        return (
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Trophy size={11} />
            FULL MOCK TEST
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
            {type || 'SPEAKING'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* FILTER BAR SECTION */}
      <div className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side space-y-4">
        {/* Top row: Part tabs selection */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          {[
            { id: 'ALL', label: 'Tất cả bài đã làm' },
            { id: 'PART_1', label: 'IELTS Part 1' },
            { id: 'PART_2', label: 'IELTS Part 2' },
            { id: 'PART_3', label: 'IELTS Part 3' },
            { id: 'SHADOWING', label: 'Shadowing' },
            { id: 'FULL_TEST', label: 'Full Mock Test' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handlePartChange(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer select-none ${
                selectedPart === tab.id
                  ? 'bg-[#1e50e6] text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bottom row: Search input, Status filter, Sort options */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề bài làm..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1e50e6] focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500 text-[11px]">Trạng thái:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL">Tất cả</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
              <span className="font-semibold text-slate-500 text-[11px]">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest_score">Điểm cao nhất</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <Loader2 className="w-9 h-9 text-[#1e50e6] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Đang tải danh sách lịch sử Speaking...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-xs font-bold text-rose-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filteredAndSortedItems.length === 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1e50e6] flex items-center justify-center mx-auto">
            <Mic className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800">Chưa có lịch sử bài làm Speaking nào</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchKeyword || selectedPart !== 'ALL' || selectedStatus !== 'ALL'
                ? "Không tìm thấy kết quả phù hợp với bộ lọc hiện tại. Thử xóa bộ lọc để tìm lại."
                : "Bạn chưa hoàn thành bài luyện tập Speaking nào. Hãy bắt đầu ngay bài luyện tập đầu tiên!"}
            </p>
          </div>
          {(searchKeyword || selectedPart !== 'ALL' || selectedStatus !== 'ALL') ? (
            <button
              onClick={() => {
                setSelectedPart('ALL')
                setSelectedStatus('ALL')
                setSearchKeyword('')
              }}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <button
              onClick={() => navigate('/practice-modules/speaking')}
              className="px-6 py-2.5 bg-[#1e50e6] text-white rounded-xl font-bold text-xs shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              Thực hành ngay
            </button>
          )}
        </div>
      )}

      {/* HISTORY CARDS LIST */}
      {!loading && !error && filteredAndSortedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAndSortedItems.map((item) => {
            const isCompleted = item.status === 'COMPLETED'
            const score = item.overall_band_score || 0
            const isExpanded = expandedSessionId === item.session_id
            const detail = sessionDetailsMap[item.session_id]
            const isLoadingDetail = loadingDetailId === item.session_id

            // Find audio URL from detail (full_session_audio_url or questions_detail[0].user_audio_url)
            const audioUrl = detail?.full_session_audio_url || detail?.questions_detail?.[0]?.user_audio_url

            return (
              <div
                key={item.session_id}
                className={`bg-white border rounded-3xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 flex flex-col justify-between space-y-4 border-slate-400/60 hover:border-blue-400 ${
                  isExpanded ? 'ring-2 ring-blue-500/20 border-blue-400' : ''
                }`}
              >
                {/* Header Row: Badge & Status */}
                <div className="flex items-center justify-between gap-3">
                  {renderTestTypeBadge(item.test_type)}

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full tracking-wider flex items-center gap-1">
                        <Check size={10} className="stroke-[3]" />
                        HOÀN THÀNH
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full tracking-wider flex items-center gap-1">
                        <FileEdit size={10} />
                        ĐANG LÀM
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3
                  onClick={() => navigate(`/speaking/result/${item.session_id}`)}
                  className="text-base font-extrabold text-slate-900 hover:text-[#1e50e6] transition-colors leading-snug line-clamp-2 cursor-pointer"
                >
                  {item.title || "Bài luyện tập Speaking"}
                </h3>

                {/* Metrics Row: Score & Date & Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    {/* Score badge */}
                    <div className="flex items-center gap-1">
                      <Trophy size={13} className={score > 0 ? "text-amber-500 fill-amber-400" : "text-slate-300"} />
                      <span className="font-extrabold text-slate-800">
                        {score > 0 ? `Band ${score.toFixed(1)}` : 'Chưa chấm'}
                      </span>
                    </div>

                    {/* Created At */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar size={12} />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions Bar: Quick Audio & AI Feedback Toggle + Full Review Link */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Toggle Inline Quick View (Listen Audio & Read AI Feedback) */}
                    <button
                      onClick={(e) => handleToggleExpand(e, item.session_id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1e50e6] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-100"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <Sparkles size={14} />}
                      <span>{isExpanded ? "Ẩn nghe nhanh" : "🔊 Nghe audio & Nhận xét AI"}</span>
                    </button>

                    {/* Full Review Page Button */}
                    <button
                      onClick={() => navigate(`/speaking/result/${item.session_id}`)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* INLINE EXPANDED QUICK VIEW: AUDIO PLAYER & AI FEEDBACK SNIPPET */}
                {isExpanded && (
                  <div className="pt-3 border-t border-blue-100 space-y-3 bg-blue-50/40 -mx-5 -mb-5 p-4 rounded-b-3xl animate-in fade-in duration-200">
                    {isLoadingDetail ? (
                      <div className="flex items-center justify-center py-4 space-y-2">
                        <Loader2 className="w-5 h-5 text-[#1e50e6] animate-spin" />
                        <span className="text-xs font-semibold text-slate-500 ml-2">Đang tải audio & nhận xét AI...</span>
                      </div>
                    ) : detail ? (
                      <div className="space-y-3">
                        {/* Audio Player Component if Audio URL exists */}
                        {audioUrl ? (
                          <div className="p-3 bg-white border border-blue-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                            <button
                              onClick={(e) => handleToggleInlineAudio(e, item.session_id, audioUrl)}
                              className="w-9 h-9 rounded-full bg-[#1e50e6] text-white flex items-center justify-center shadow-xs hover:bg-blue-700 transition cursor-pointer shrink-0"
                            >
                              {activeAudioSessionId === item.session_id && isPlayingAudio ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} className="ml-0.5" />
                              )}
                            </button>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
                                <span>
                                  {activeAudioSessionId === item.session_id ? formatTime(audioCurrentTime) : "00:00"}
                                </span>
                                <span>
                                  {activeAudioSessionId === item.session_id && audioDuration > 0
                                    ? formatTime(audioDuration)
                                    : item.duration_str || "File ghi âm"}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#1e50e6] rounded-full transition-all"
                                  style={{
                                    width: `${
                                      activeAudioSessionId === item.session_id && audioDuration > 0
                                        ? (audioCurrentTime / audioDuration) * 100
                                        : 0
                                    }%`
                                  }}
                                />
                              </div>
                            </div>

                            <Volume2 size={16} className="text-blue-600 shrink-0" />
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-semibold flex items-center gap-1.5">
                            <VolumeX size={14} />
                            <span>Chưa có file ghi âm được lưu cho lượt thi này.</span>
                          </div>
                        )}

                        {/* Transcript snippet */}
                        {detail.questions_detail?.[0]?.user_transcript && (
                          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              CÂU TRẢ LỜI CỦA BẠN (TRANSCRIPT):
                            </span>
                            <p className="text-xs text-slate-800 font-medium line-clamp-3 italic leading-relaxed">
                              "{detail.questions_detail[0].user_transcript}"
                            </p>
                          </div>
                        )}

                        {/* AI Insights & Feedback Summary */}
                        <div className="p-3 bg-[#1e50e6] text-white rounded-2xl space-y-1.5 shadow-xs">
                          <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1 text-blue-200">
                            <Sparkles size={12} />
                            NHẬN XÉT CỦA AI (AI INSIGHTS):
                          </span>
                          <div className="max-h-44 overflow-y-auto pr-2 text-xs font-medium leading-relaxed text-blue-50 whitespace-pre-wrap">
                            {detail.ai_insights_summary || "Hệ thống AI đã chấm điểm và phân tích 4 tiêu chí IELTS Speaking."}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">
                        Không thể tải thông tin chi tiết bài thi.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && !error && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
          {/* Items per page dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Hiển thị</span>
            <div className="relative">
              <div
                onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 flex items-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors select-none"
              >
                <span className="font-bold">{pageSize} bài/trang</span>
                <ChevronDown
                  size={13}
                  className="text-slate-400 transition-transform duration-200"
                  style={{ transform: showPageSizeDropdown ? 'rotate(180deg)' : 'none' }}
                />
              </div>

              {showPageSizeDropdown && (
                <div className="absolute left-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 py-1.5 overflow-hidden">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setPageSize(size)
                        setCurrentPage(1)
                        setShowPageSizeDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        pageSize === size ? 'bg-blue-50 text-[#1e50e6]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{size} bài/trang</span>
                      {pageSize === size && <Check size={13} className="text-[#1e50e6] stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-slate-400">
              • Trang {currentPage} • {filteredAndSortedItems.length} kết quả
            </span>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Trang trước</span>
            </button>

            <span className="px-3 py-1.5 bg-blue-50 text-[#1e50e6] font-extrabold rounded-xl border border-blue-100">
              Trang {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!hasMore}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Trang sau</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpeakingHistoryList
