import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Headphones, BookOpen, Mic, PenTool, SlidersHorizontal,
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight,
  FileEdit, Zap, Loader2, FileText, Trophy, RotateCcw, Clock
} from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import { useUserStore, initialUser } from '../../stores/user/useUserStore'
import { userApi } from '../../services/userApi'
import { useToast } from '../../components/common/Toast'
import { LogoutModal } from '../../components/common/LogoutModal'
import { getPassages, getInProgressSessions, getUserHistory, type PassageSummary, type UserHistoryItem } from '../../services/readingApi'
import { getListeningPassages, getInProgressListeningSessions, getListeningHistory, type ListeningPassageSummary } from '../../services/listeningApi'
import { speakingApi } from '../../services/speakingApi'
import { writingApi } from '../../services/writingApi'
import SpeakingHistoryList from '../../components/speaking/SpeakingHistoryList'
import type { SpeakingTopic, ShadowingSentence } from '../../types/speaking'
import type { WritingPrompt } from '../../types/writing'

type ModuleCategory = 'listening' | 'reading' | 'speaking' | 'writing'

const PAGE_SIZE_OPTIONS = [6, 10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 6

function scoreToIELTSBand(score: number, total: number): number {
  if (total <= 0 || score <= 0) return 0.0
  const pct = score / total
  if (pct >= 0.9) return 9.0
  if (pct >= 0.85) return 8.5
  if (pct >= 0.8) return 8.0
  if (pct >= 0.75) return 7.5
  if (pct >= 0.7) return 7.0
  if (pct >= 0.65) return 6.5
  if (pct >= 0.6) return 6.0
  if (pct >= 0.55) return 5.5
  if (pct >= 0.5) return 5.0
  if (pct >= 0.4) return 4.5
  if (pct >= 0.3) return 4.0
  if (pct >= 0.2) return 3.5
  if (pct >= 0.1) return 2.5
  return 1.0
}

export default function PracticeModulesPage() {
  const navigate = useNavigate()
  const { category } = useParams<{ category: string }>()
  const activeTab = (category as ModuleCategory) || 'listening'
  const { showToast } = useToast()
  const { user, setUser } = useUserStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false)
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null)

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // History states for highest score checking
  const [readingHistoryMap, setReadingHistoryMap] = useState<Record<string, UserHistoryItem>>({})
  const [listeningHistoryMap, setListeningHistoryMap] = useState<Record<string, any>>({})

  // Reading state
  const [readingPassages, setReadingPassages] = useState<PassageSummary[]>([])
  const [readingLoading, setReadingLoading] = useState(false)
  const [readingError, setReadingError] = useState<string | null>(null)
  const [readingMeta, setReadingMeta] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 })
  const [draftMap, setDraftMap] = useState<Record<string, UserHistoryItem>>({})

  // Listening state
  const [listeningPassages, setListeningPassages] = useState<ListeningPassageSummary[]>([])
  const [listeningLoading, setListeningLoading] = useState(false)
  const [listeningError, setListeningError] = useState<string | null>(null)
  const [listeningMeta, setListeningMeta] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 })
  const [listeningDraftMap, setListeningDraftMap] = useState<Record<string, any>>({})

  // Writing state
  const [writingItems, setWritingItems] = useState<WritingPrompt[]>([])
  const [writingLoading, setWritingLoading] = useState(false)
  const [writingError, setWritingError] = useState<string | null>(null)
  const [writingMeta, setWritingMeta] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 })

  // Speaking state
  const [speakingSubTab, setSpeakingSubTab] = useState<'ielts' | 'shadowing' | 'history'>('ielts')
  const [speakingTopics, setSpeakingTopics] = useState<SpeakingTopic[]>([])
  const [shadowingSentences, setShadowingSentences] = useState<ShadowingSentence[]>([])
  const [speakingLoading, setSpeakingLoading] = useState(false)
  const [speakingError, setSpeakingError] = useState<string | null>(null)
  const [speakingMeta, setSpeakingMeta] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 })
  const [speakingHistoryMap, setSpeakingHistoryMap] = useState<Record<string, number>>({})

  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('All')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  const userId = user?.id

  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(initialUser)
    showToast("Đã đăng xuất tài khoản!", "info")
    navigate("/login")
  }

  // Load user profile
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token")
      if (!token && !user?.token && !user?.username) {
        navigate("/login")
        return
      }
      try {
        const data = await userApi.getUserProfile()
        if (data) {
          setUser(data)
        }
      } catch (err) {
        console.warn("Could not fetch user profile:", err)
      }
    }
    fetchUserData()
  }, [navigate, setUser, user?.token, user?.username])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(e.target as Node)) {
        setShowPageSizeDropdown(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset page on tab / filter / pageSize change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, selectedQuestionType, pageSize, speakingSubTab])

  // Fetch Reading Passages, Drafts, and History in Parallel
  useEffect(() => {
    if (activeTab !== 'reading') return
    let cancelled = false
    if (readingPassages.length === 0) setReadingLoading(true)
    setReadingError(null)

    const fetchPassagesPromise = getPassages({
      page: currentPage,
      limit: pageSize,
      question_type: selectedQuestionType === 'All' ? undefined : selectedQuestionType
    })

    const fetchDraftsPromise = userId ? getInProgressSessions(userId).catch(() => []) : Promise.resolve([])
    const fetchHistoryPromise = userId ? getUserHistory(userId, { status: 'COMPLETED', limit: 100 }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })

    Promise.all([fetchPassagesPromise, fetchDraftsPromise, fetchHistoryPromise])
      .then(([passagesRes, sessions, historyRes]) => {
        if (cancelled) return
        setReadingPassages(passagesRes.items)
        setReadingMeta({ page: passagesRes.page, limit: passagesRes.limit, total: passagesRes.total, total_pages: passagesRes.total_pages })

        const draftMapObj: Record<string, UserHistoryItem> = {}
        sessions.forEach((s) => { draftMapObj[s.passage_id] = s })
        setDraftMap(draftMapObj)

        const historyMapObj: Record<string, UserHistoryItem> = {}
        historyRes.items.forEach((s: UserHistoryItem) => {
          const existing = historyMapObj[s.passage_id]
          if (!existing || s.score > existing.score) {
            historyMapObj[s.passage_id] = s
          }
        })
        setReadingHistoryMap(historyMapObj)
      })
      .catch((err) => {
        if (cancelled) return
        setReadingError(err?.response?.data?.message ?? err?.response?.data?.detail ?? err.message ?? 'Không thể tải danh sách bài đọc')
      })
      .finally(() => { if (!cancelled) setReadingLoading(false) })

    return () => { cancelled = true }
  }, [activeTab, currentPage, pageSize, selectedQuestionType, userId])

  // Fetch Listening Passages, Drafts, and History in Parallel
  useEffect(() => {
    if (activeTab !== 'listening') return
    let cancelled = false
    if (listeningPassages.length === 0) setListeningLoading(true)
    setListeningError(null)

    const cardsPerPassage = (selectedQuestionType && selectedQuestionType !== 'All') ? 1 : 2
    const limitForPassages = Math.ceil(pageSize / cardsPerPassage)

    const fetchPassagesPromise = getListeningPassages({
      page: currentPage,
      limit: limitForPassages,
      question_type: selectedQuestionType === 'All' ? undefined : selectedQuestionType
    })

    const fetchDraftsPromise = userId ? getInProgressListeningSessions(userId).catch(() => []) : Promise.resolve([])
    const fetchHistoryPromise = userId ? getListeningHistory(userId, { status: 'COMPLETED', limit: 100 }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] })

    Promise.all([fetchPassagesPromise, fetchDraftsPromise, fetchHistoryPromise])
      .then(([passagesRes, sessions, historyRes]) => {
        if (cancelled) return
        setListeningPassages(passagesRes.items)
        const totalCards = passagesRes.total * cardsPerPassage
        setListeningMeta({
          page: currentPage,
          limit: pageSize,
          total: totalCards,
          total_pages: Math.max(1, Math.ceil(totalCards / pageSize)),
        })

        const draftMapObj: Record<string, any> = {}
        sessions.forEach((s) => {
          const key = `${s.passage_id}-${s.session_type.toLowerCase()}`
          draftMapObj[key] = s
        })
        setListeningDraftMap(draftMapObj)

        const historyMapObj: Record<string, any> = {}
        historyRes.items.forEach((s: any) => {
          const key = `${s.passage_id}-${s.session_type.toLowerCase()}`
          const existing = historyMapObj[key]
          const scoreVal = s.score || s.accuracy_rate || 0
          const existingScore = existing ? (existing.score || existing.accuracy_rate || 0) : 0
          if (!existing || scoreVal > existingScore) {
            historyMapObj[key] = s
          }
        })
        setListeningHistoryMap(historyMapObj)
      })
      .catch((err) => {
        if (cancelled) return
        setListeningError(err?.response?.data?.message ?? err?.response?.data?.detail ?? err.message ?? 'Không thể tải danh sách bài nghe')
      })
      .finally(() => { if (!cancelled) setListeningLoading(false) })

    return () => { cancelled = true }
  }, [activeTab, currentPage, pageSize, selectedQuestionType, userId])

  // Fetch Writing Prompts
  useEffect(() => {
    if (activeTab !== 'writing') return
    let cancelled = false
    if (writingItems.length === 0) setWritingLoading(true)
    setWritingError(null)

    const taskTypeParam = 
      selectedQuestionType.startsWith('Task 1') ? 'WITH_GRAPH' :
      selectedQuestionType.startsWith('Task 2') ? 'WITHOUT_GRAPH' :
      undefined;

    writingApi.getPrompts(taskTypeParam)
      .then((res) => {
        if (cancelled) return
        const startIndex = (currentPage - 1) * pageSize
        const sliced = res.slice(startIndex, startIndex + pageSize)
        setWritingItems(sliced)
        setWritingMeta({
          page: currentPage,
          limit: pageSize,
          total: res.length,
          total_pages: Math.max(1, Math.ceil(res.length / pageSize))
        })
      })
      .catch((err) => {
        if (cancelled) return
        setWritingError(err?.message || 'Không thể tải danh sách bài viết')
      })
      .finally(() => { if (!cancelled) setWritingLoading(false) })

    return () => { cancelled = true }
  }, [activeTab, currentPage, pageSize, selectedQuestionType])

  // Fetch Speaking Topics & Shadowing
  useEffect(() => {
    if (activeTab !== 'speaking') return
    let cancelled = false
    if (speakingTopics.length === 0 && shadowingSentences.length === 0) setSpeakingLoading(true)
    setSpeakingError(null)

    if (userId) {
      speakingApi.getHistory(1, 100)
        .then((history) => {
          if (cancelled) return
          const historyMapObj: Record<string, number> = {}
          history.forEach((item: any) => {
            const bandScore = item.overall_band_score || (item.accuracy_score ? scoreToIELTSBand((item.accuracy_score || 0) / 100, 1) : 0)
            if (item.topic_id && bandScore > (historyMapObj[item.topic_id] || 0)) {
              historyMapObj[item.topic_id] = bandScore
            }
            if (item.prompt_id) {
              const currentMax = historyMapObj[item.prompt_id] || 0
              historyMapObj[item.prompt_id] = Math.max(bandScore, currentMax, 0.1)
            }
          })
          setSpeakingHistoryMap(historyMapObj)
        })
        .catch(() => {})
    }

    if (speakingSubTab === 'ielts') {
      speakingApi.getTopics(currentPage, pageSize)
        .then((res) => {
          if (cancelled) return
          setSpeakingTopics(res)
          const hasMore = res.length === pageSize
          setSpeakingMeta({
            page: currentPage,
            limit: pageSize,
            total: currentPage * pageSize + (hasMore ? pageSize : 0),
            total_pages: hasMore ? currentPage + 1 : currentPage
          })
        })
        .catch((err) => {
          if (cancelled) return
          setSpeakingError(err?.message || 'Không thể tải danh sách IELTS Speaking Topics')
        })
        .finally(() => { if (!cancelled) setSpeakingLoading(false) })
    } else {
      speakingApi.getShadowingSentences(currentPage, pageSize)
        .then((res) => {
          if (cancelled) return
          setShadowingSentences(res)
          const hasMore = res.length === pageSize
          setSpeakingMeta({
            page: currentPage,
            limit: pageSize,
            total: currentPage * pageSize + (hasMore ? pageSize : 0),
            total_pages: hasMore ? currentPage + 1 : currentPage
          })
        })
        .catch((err) => {
          if (cancelled) return
          setSpeakingError(err?.message || 'Không thể tải danh sách Shadowing sentences')
        })
        .finally(() => { if (!cancelled) setSpeakingLoading(false) })
    }

    return () => { cancelled = true }
  }, [activeTab, speakingSubTab, currentPage, pageSize, userId])

  // Process Listening Cards
  let listeningCards: any[] = []
  if (activeTab === 'listening') {
    listeningPassages.forEach((item) => {
      // 1. Thẻ Comprehension (Luyện nghe hiểu)
      const compKey = `${item.id}-comprehension`
      const compCompleted = listeningHistoryMap[compKey]
      const compIsCompleted = !!compCompleted

      const compDraft = listeningDraftMap[compKey]
      const compIsDraft = !compIsCompleted && !!compDraft
      const compProgress = compIsCompleted ? 100 : (compDraft && item.total_questions > 0
        ? Math.min(100, Math.round((compDraft.completed_questions ?? 0) / item.total_questions * 100))
        : 0)
      
      listeningCards.push({
        id: `${item.id}-comp`,
        title: `${item.title} (Comprehension)`,
        subtitle: `${item.unit_code ?? 'UNIT'} • ${item.total_questions} câu hỏi • ${item.time_limit_minutes} phút`,
        category: 'listening' as const,
        progressPercentage: compProgress,
        isCompleted: compIsCompleted,
        completedSession: compCompleted,
        href: `/listening/practice?id=${item.id}`,
        question_types: item.question_types ? item.question_types.filter(t => t !== 'Dictation') : [],
        draftSession: compDraft,
        isDraft: compIsDraft,
        total_questions: item.total_questions,
      })

      // 2. Thẻ Dictation (Chép chính tả)
      const dictKey = `${item.id}-dictation`
      const dictCompleted = listeningHistoryMap[dictKey]
      const dictIsCompleted = !!dictCompleted

      const dictDraft = listeningDraftMap[dictKey]
      const dictIsDraft = !dictIsCompleted && !!dictDraft
      const dictWordCount = dictDraft?.words_typed ?? 0
      const dictTargetWords = dictDraft?.total_words || 50
      const dictProgress = dictIsCompleted ? 100 : (dictDraft && dictWordCount > 0 ? Math.min(100, Math.round((dictWordCount / dictTargetWords) * 100)) : 0)

      listeningCards.push({
        id: `${item.id}-dict`,
        title: `${item.title} (Dictation)`,
        subtitle: `${item.unit_code ?? 'UNIT'} • Chép chính tả • ${item.time_limit_minutes} phút`,
        category: 'listening' as const,
        progressPercentage: dictProgress,
        isCompleted: dictIsCompleted,
        completedSession: dictCompleted,
        href: `/listening/dictation?id=${item.id}`,
        question_types: ['Dictation'],
        draftSession: dictDraft,
        isDraft: dictIsDraft,
        total_questions: 1,
      })
    })

    if (selectedQuestionType && selectedQuestionType !== 'All') {
      listeningCards = listeningCards.filter((c) => c.question_types.includes(selectedQuestionType))
    }
  }

  // Active meta and pagination values helper
  const getActiveMeta = () => {
    switch (activeTab) {
      case 'reading': return readingMeta
      case 'listening': return listeningMeta
      case 'writing': return writingMeta
      case 'speaking': return speakingMeta
      default: return { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 }
    }
  }

  const activeMeta = getActiveMeta()
  const activeLoading = readingLoading || listeningLoading || writingLoading || speakingLoading

  const pageNumbers = Array.from({ length: Math.max(1, Math.min(5, activeMeta.total_pages)) }, (_, index) => {
    const startPage = Math.max(1, Math.min(currentPage - 2, Math.max(1, activeMeta.total_pages - 4)))
    return startPage + index
  }).filter((page) => page <= activeMeta.total_pages)

  return (
    <AppLayout breadcrumbs={[{ label: 'Luyện tập', href: '/practice-modules' }]}>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Luyện Tập
          </h1>
        </div>

        {/* Tabs & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-300/80 shadow-inner w-full md:w-auto">
            {(
              [
                { key: 'listening', label: 'Luyện Nghe (Listening)', Icon: Headphones },
                { key: 'reading', label: 'Luyện Đọc (Reading)', Icon: BookOpen },
                { key: 'speaking', label: 'Luyện Nói (Speaking)', Icon: Mic },
                { key: 'writing', label: 'Luyện Viết (Writing)', Icon: PenTool },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => { navigate(`/practice-modules/${key}`); setSelectedQuestionType('All') }}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none whitespace-nowrap ${activeTab === key
                  ? 'bg-white text-[#1D4ED8] shadow-glow-4side border border-slate-200/90 scale-[1.01]'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
              >
                <Icon size={16} className={activeTab === key ? 'text-[#1D4ED8]' : 'text-slate-400'} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Filter Dropdown (For listening, reading & writing) */}
          {(activeTab === 'reading' || activeTab === 'listening' || activeTab === 'writing') && (
            <div className="relative shrink-0" ref={typeDropdownRef}>
              <div
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="bg-white border border-slate-400/60 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-6 text-xs sm:text-sm font-bold text-slate-700 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <SlidersHorizontal size={16} className="text-[#1D4ED8]" />
                  <span>{selectedQuestionType === 'All' ? 'Lọc theo dạng câu hỏi' : `Dạng: ${selectedQuestionType}`}</span>
                </div>
                <ChevronDown size={16} className="text-slate-400 transition-transform duration-200" style={{ transform: showTypeDropdown ? 'rotate(180deg)' : 'none' }} />
              </div>
              {showTypeDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-300 rounded-2xl shadow-glow-4side z-50 py-1.5 overflow-hidden">
                  {(activeTab === 'reading'
                    ? ['All', 'Multiple Choice', 'Heading Matching', 'Fill Blank', 'T/F/NG']
                    : activeTab === 'listening'
                    ? ['All', 'Multiple Choice', 'Fill Blank', 'Dictation']
                    : [
                        'All',
                        'Task 1 (All)',
                        'Task 1: Chart / Graph',
                        'Task 1: Process Diagram',
                        'Task 1: Map',
                        'Task 2 (All)',
                        'Task 2: Opinion',
                        'Task 2: Discussion',
                        'Task 2: Problem & Solution'
                      ]
                  ).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setSelectedQuestionType(type); setShowTypeDropdown(false) }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between cursor-pointer ${selectedQuestionType === type ? 'bg-blue-50 text-[#1D4ED8] font-black' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span>{type}</span>
                      {selectedQuestionType === type && <Check size={14} className="text-[#1D4ED8] stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading Indicator for Initial Fetch */}
        {activeLoading && (activeTab === 'reading' ? readingPassages.length === 0 : activeTab === 'listening' ? listeningPassages.length === 0 : activeTab === 'writing' ? writingItems.length === 0 : (speakingTopics.length + shadowingSentences.length) === 0) && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-[#1D4ED8] animate-spin" />
            <span className="text-xs font-semibold text-slate-500">
              Đang tải danh sách bài tập từ hệ thống...
            </span>
          </div>
        )}

        {/* Error Notification */}
        {readingError && activeTab === 'reading' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {readingError}
          </div>
        )}
        {listeningError && activeTab === 'listening' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {listeningError}
          </div>
        )}
        {writingError && activeTab === 'writing' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {writingError}
          </div>
        )}
        {speakingError && activeTab === 'speaking' && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {speakingError}
          </div>
        )}

        {/* Cards Grid */}
            {activeTab === 'reading' && (
              readingPassages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {readingPassages.map((item) => {
                    const completedSession = readingHistoryMap[item.id]
                    const isCompleted = !!completedSession
                    const draft = draftMap[item.id]
                    const isDraft = !isCompleted && !!draft
                    const completedAnswers = isDraft ? (draft.completed_questions ?? 0) : 0
                    const totalQ = isDraft ? (item.total_questions || draft.total_questions || 0) : 0
                    const progressPct = isCompleted ? 100 : (draft && item.total_questions > 0
                      ? Math.min(100, Math.round((draft.completed_questions ?? 0) / item.total_questions * 100))
                      : 0)

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/reading/practice?id=${item.id}`)}
                        className={`bg-white border rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${
                          isCompleted
                            ? 'border-emerald-300/80 hover:border-emerald-400'
                            : isDraft
                            ? 'border-amber-300/80 hover:border-amber-400'
                            : 'border-slate-400/60 hover:border-blue-400'
                        }`}
                      >
                        {isCompleted ? (
                          <div className="absolute top-0 right-0">
                            <div className="bg-emerald-500 text-white text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                              <Check size={10} className="stroke-[3]" />
                              COMPLETED
                            </div>
                          </div>
                        ) : isDraft ? (
                          <div className="absolute top-0 right-0">
                            <div className="bg-amber-400 text-amber-900 text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                              <FileEdit size={10} />
                              DRAFT
                            </div>
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : isDraft
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-blue-50 text-[#1D4ED8]'
                              }`}
                            >
                              {isCompleted ? <Check size={20} className="stroke-[3]" /> : <BookOpen size={20} />}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                READING PASSAGE
                              </span>
                              <h3 className={`font-bold text-slate-900 text-base leading-snug transition-colors ${
                                isCompleted
                                  ? 'group-hover:text-emerald-600'
                                  : isDraft
                                  ? 'group-hover:text-amber-600'
                                  : 'group-hover:text-[#1D4ED8]'
                              }`}>
                                {item.title}
                              </h3>
                              <p className="text-xs text-slate-500 font-normal">
                                {item.topic} • {item.total_questions} câu hỏi • {item.time_limit_minutes} phút
                              </p>

                              {item.question_types && item.question_types.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.question_types.map((type) => (
                                    <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black tracking-wider uppercase">
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {isCompleted && completedSession && (() => {
                                const scoreVal = completedSession.score || 0
                                const totalVal = completedSession.total_questions || item.total_questions || 0
                                const bandScore = scoreToIELTSBand(scoreVal, totalVal)
                                return (
                                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                    <Trophy size={10} className="text-amber-600 fill-amber-400 shrink-0" />
                                    Highest Score: Band {bandScore.toFixed(1)} ({scoreVal}/{totalVal})
                                  </p>
                                )
                              })()}

                              {isDraft && (
                                <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                                  <FileEdit size={9} />
                                  Tiếp tục từ câu đã làm dở
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : isDraft
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'bg-blue-50 text-[#1D4ED8] hover:bg-blue-100'
                            }`}>
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            {isCompleted ? (
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md tracking-wider">
                                COMPLETED
                              </span>
                            ) : isDraft ? (
                              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md tracking-wider flex items-center gap-1">
                                <FileEdit size={9} />
                                DRAFT — {completedAnswers}/{totalQ} câu
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">Progress</span>
                            )}

                            <span className={isCompleted ? 'text-emerald-600 font-bold' : isDraft ? 'text-amber-600 font-bold' : 'text-[#1D4ED8] font-bold'}>
                              {progressPct}%
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? 'bg-emerald-500' : isDraft ? 'bg-amber-400' : 'bg-[#1D4ED8]'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài đọc nào</h3>
                  <p className="text-xs text-slate-400">Hệ thống chưa tìm thấy dữ liệu bài Reading trong cơ sở dữ liệu.</p>
                </div>
              )
            )}

            {activeTab === 'listening' && (
              listeningCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {listeningCards.map((card) => {
                    const draft = card.draftSession
                    const isDraft = card.isDraft
                    const isCompleted = card.isCompleted
                    const completedSession = card.completedSession
                    const completedAnswers = isDraft ? (draft.completed_questions ?? 0) : 0
                    const totalQ = isDraft ? (card.total_questions || draft.total_questions || 0) : 0
                    const draftPct = card.progressPercentage

                    return (
                      <div
                        key={card.id}
                        onClick={() => navigate(card.href)}
                        className={`bg-white border rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${
                          isCompleted
                            ? 'border-emerald-300/80 hover:border-emerald-400'
                            : isDraft
                            ? 'border-amber-300/80 hover:border-amber-400'
                            : 'border-slate-400/60 hover:border-blue-400'
                        }`}
                      >
                        {isCompleted ? (
                          <div className="absolute top-0 right-0">
                            <div className="bg-emerald-500 text-white text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                              <Check size={10} className="stroke-[3]" />
                              COMPLETED
                            </div>
                          </div>
                        ) : isDraft ? (
                          <div className="absolute top-0 right-0">
                            <div className="bg-amber-400 text-amber-900 text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                              <FileEdit size={10} />
                              DRAFT
                            </div>
                          </div>
                        ) : null}

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : isDraft
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-blue-50 text-[#1D4ED8]'
                              }`}
                            >
                              {isCompleted ? <Check size={20} className="stroke-[3]" /> : <Headphones size={20} />}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                LISTENING PASSAGE
                              </span>
                              <h3 className={`font-bold text-slate-900 text-base leading-snug transition-colors ${
                                isCompleted
                                  ? 'group-hover:text-emerald-600'
                                  : isDraft
                                  ? 'group-hover:text-amber-600'
                                  : 'group-hover:text-[#1D4ED8]'
                              }`}>
                                {card.title}
                              </h3>
                              <p className="text-xs text-slate-500 font-normal">{card.subtitle}</p>

                              {card.question_types && card.question_types.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {card.question_types.map((type: string) => (
                                    <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black tracking-wider uppercase">
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {isCompleted && completedSession && (() => {
                                let bandScore = 0.0
                                if (completedSession.session_type === 'DICTATION') {
                                  bandScore = scoreToIELTSBand((completedSession.accuracy_rate || 100) / 100, 1)
                                } else if (completedSession.score && (completedSession.total_questions || card.total_questions)) {
                                  bandScore = scoreToIELTSBand(completedSession.score, completedSession.total_questions || card.total_questions)
                                } else if (completedSession.accuracy_rate) {
                                  bandScore = scoreToIELTSBand(completedSession.accuracy_rate / 100, 1)
                                }
                                return (
                                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                    <Trophy size={10} className="text-amber-600 fill-amber-400 shrink-0" />
                                    Highest Score: Band {bandScore.toFixed(1)}
                                  </p>
                                )
                              })()}

                              {isDraft && (
                                <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                                  <FileEdit size={9} />
                                  Tiếp tục từ câu đã làm dở
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : isDraft
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'bg-blue-50 text-[#1D4ED8] hover:bg-blue-100'
                            }`}>
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            {isCompleted ? (
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md tracking-wider">
                                COMPLETED
                              </span>
                            ) : isDraft ? (
                              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md tracking-wider flex items-center gap-1">
                                <FileEdit size={9} />
                                {draft?.session_type === 'DICTATION' ? 'DRAFT — Dictation' : `DRAFT — ${completedAnswers}/${totalQ} câu`}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">Progress</span>
                            )}

                            <span className={isCompleted ? 'text-emerald-600 font-bold' : isDraft ? 'text-amber-600 font-bold' : 'text-[#1D4ED8] font-bold'}>
                              {draftPct}%
                            </span>
                          </div>

                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? 'bg-emerald-500' : isDraft ? 'bg-amber-400' : 'bg-[#1D4ED8]'
                              }`}
                              style={{ width: `${draftPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                  <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài nghe nào</h3>
                  <p className="text-xs text-slate-400">Hệ thống chưa tìm thấy dữ liệu bài Listening trong cơ sở dữ liệu.</p>
                </div>
              )
            )}

            {activeTab === 'writing' && (() => {
              const filteredWritingItems = writingItems.filter((item) => {
                if (!selectedQuestionType || selectedQuestionType === 'All') return true;
                if (selectedQuestionType === 'Task 1 (All)') return item.task_type === 'WITH_GRAPH';
                if (selectedQuestionType === 'Task 2 (All)') return item.task_type === 'WITHOUT_GRAPH';

                const titleLower = item.title.toLowerCase();
                const descLower = (item.task_description || '').toLowerCase();

                if (selectedQuestionType === 'Task 1: Chart / Graph') {
                  return item.task_type === 'WITH_GRAPH' && (
                    titleLower.includes('chart') || titleLower.includes('graph') || titleLower.includes('fuel') || titleLower.includes('subjects')
                  );
                }
                if (selectedQuestionType === 'Task 1: Process Diagram') {
                  return item.task_type === 'WITH_GRAPH' && (
                    titleLower.includes('process') || titleLower.includes('recycle') || titleLower.includes('collection') || descLower.includes('diagram')
                  );
                }
                if (selectedQuestionType === 'Task 1: Map') {
                  return item.task_type === 'WITH_GRAPH' && (
                    titleLower.includes('map') || titleLower.includes('redevelopment') || titleLower.includes('layout') || descLower.includes('map')
                  );
                }

                if (selectedQuestionType === 'Task 2: Opinion') {
                  return item.task_type === 'WITHOUT_GRAPH' && (
                    descLower.includes('agree or disagree') || titleLower.includes('intelligence') || titleLower.includes('diagnostics')
                  );
                }
                if (selectedQuestionType === 'Task 2: Discussion') {
                  return item.task_type === 'WITHOUT_GRAPH' && (
                    descLower.includes('discuss both views') || titleLower.includes('budget') || titleLower.includes('space')
                  );
                }
                if (selectedQuestionType === 'Task 2: Problem & Solution') {
                  return item.task_type === 'WITHOUT_GRAPH' && (
                    descLower.includes('causes') || descLower.includes('measures') || titleLower.includes('urban') || titleLower.includes('gridlock')
                  );
                }

                return true;
              });

              return filteredWritingItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredWritingItems.map((item) => {
                    const isCompleted = item.user_status === 'REVIEWED' || item.highest_score != null;
                    const isDraft = !isCompleted && item.user_status === 'DRAFT' && !!(item.draft_content && item.draft_content.trim().length > 0);
                    const categoryLabel = item.question_category || (item.task_type === 'WITH_GRAPH' ? 'TASK 1 • CHART' : 'TASK 2 • ESSAY');

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/writing/editor/${item.id}`)}
                        className={`bg-white border rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${
                          isCompleted
                            ? 'border-emerald-300/80 hover:border-emerald-400'
                            : isDraft
                            ? 'border-amber-300/80 hover:border-amber-400'
                            : 'border-slate-400/60 hover:border-purple-400'
                        }`}
                      >
                        {/* Top-Right Badges: COMPLETED / DRAFT & LÀM LẠI Button */}
                        <div className="absolute top-0 right-0 flex items-center gap-1 z-10">
                          {(isCompleted || isDraft) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/writing/editor/${item.id}?mode=reset`);
                              }}
                              title="Viết lại bài mới từ đầu"
                              className="bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black tracking-wider px-2.5 py-1 rounded-bl-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw size={10} className="stroke-[2.5]" />
                              LÀM LẠI
                            </button>
                          )}

                          {isCompleted ? (
                            <div className="bg-emerald-500 text-white text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                              <Check size={10} className="stroke-[3]" />
                              COMPLETED
                            </div>
                          ) : isDraft ? (
                            <div className="bg-amber-400 text-amber-900 text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                              <FileEdit size={10} />
                              DRAFT
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : isDraft
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {isCompleted ? <Check size={20} className="stroke-[3]" /> : <FileText size={20} />}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                                {categoryLabel}
                              </span>
                              <h3 className={`font-bold text-slate-900 text-base leading-snug transition-colors ${
                                isCompleted
                                  ? 'group-hover:text-emerald-600'
                                  : isDraft
                                  ? 'group-hover:text-amber-600'
                                  : 'group-hover:text-purple-700'
                              }`}>
                                {item.title}
                              </h3>
                              <p className="text-xs text-slate-500 font-normal">
                                Mục tiêu: {item.word_count_target}+ từ • Thời gian: {item.time_limit_minutes} phút
                              </p>

                              {/* Question Type Tag */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[9px] font-black tracking-wider uppercase">
                                  {categoryLabel.replace('TASK 1 • ', '').replace('TASK 2 • ', '')}
                                </span>
                              </div>

                              {/* Highest Score Info */}
                              {isCompleted && (
                                <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                  <Trophy size={10} className="text-amber-600 fill-amber-400 shrink-0" />
                                  Điểm cao nhất: {item.highest_score ? `Band ${item.highest_score.toFixed(1)}` : 'Band 6.0'}
                                </p>
                              )}

                              {isDraft && (
                                <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                                  <FileEdit size={9} />
                                  Tiếp tục bài viết dở dang
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : isDraft
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                            }`}>
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar & Percentage */}
                        {(() => {
                          const wordCount = (item.draft_content && item.draft_content.trim()) ? item.draft_content.trim().split(/\s+/).length : 0;
                          const targetCount = item.word_count_target || 250;
                          const writingProgress = isCompleted ? 100 : (isDraft ? Math.min(100, Math.round((wordCount / targetCount) * 100)) : 0);

                          return (
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center justify-between text-xs font-bold">
                                {isCompleted ? (
                                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md tracking-wider">
                                    ĐÃ HOÀN THÀNH
                                  </span>
                                ) : isDraft ? (
                                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md tracking-wider flex items-center gap-1">
                                    <FileEdit size={9} />
                                    BẢN NHÁP — {wordCount}/{targetCount} từ
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs font-semibold">Tiến độ</span>
                                )}

                                <span className={isCompleted ? 'text-emerald-600 font-bold' : isDraft ? 'text-amber-600 font-bold' : 'text-purple-700 font-bold'}>
                                  {writingProgress}%
                                </span>
                              </div>

                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isCompleted ? 'bg-emerald-500' : isDraft ? 'bg-amber-400' : 'bg-purple-600'
                                  }`}
                                  style={{ width: `${writingProgress}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">Chưa có bài viết nào</h3>
                  <p className="text-xs text-slate-400">Hệ thống chưa tìm thấy dữ liệu bài Writing.</p>
                </div>
              );
            })()}

            {activeTab === 'speaking' && (
              <div className="space-y-4">
                {/* Sub-tab selection for Speaking: IELTS Tests vs Shadowing vs History */}
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setSpeakingSubTab("ielts")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${speakingSubTab === "ielts"
                        ? "bg-[#1e50e6] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    IELTS Speaking Tests
                  </button>
                  <button
                    onClick={() => setSpeakingSubTab("shadowing")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${speakingSubTab === "shadowing"
                        ? "bg-[#1e50e6] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    Shadowing Practice
                  </button>
                  <button
                    onClick={() => setSpeakingSubTab("history")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${speakingSubTab === "history"
                        ? "bg-[#1e50e6] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    <Clock size={14} />
                    <span>Lịch sử bài làm</span>
                  </button>
                </div>

                {speakingSubTab === 'history' ? (
                  <SpeakingHistoryList userId={userId} />
                ) : speakingSubTab === 'ielts' ? (
                  speakingTopics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {speakingTopics.map((topic, idx) => (
                        <div
                          key={topic.id}
                          onClick={() => navigate(`/speaking/practice/topic/${topic.id}`)}
                          className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg hover:border-blue-400/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#1e50e6] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                <Mic className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1e50e6] block">
                                  SPEAKING
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {topic.is_full_test ? "Thi thử Mock Test" : "Luyện tập chủ đề"}
                                </span>
                              </div>
                            </div>

                            <button
                              aria-label="Start Speaking Test"
                              className="w-9 h-9 rounded-full bg-blue-50 text-[#1e50e6] group-hover:bg-[#1e50e6] group-hover:text-white flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#1e50e6] transition-colors leading-snug line-clamp-2">
                            {topic.title || `Speaking Authentic Test Practice ${idx + 1}`}
                          </h3>

                          {/* Highest Score Info for Speaking */}
                          {speakingHistoryMap[topic.id] > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                              <Trophy size={10} className="text-amber-600 fill-amber-400 shrink-0" />
                              Highest Score: Band {speakingHistoryMap[topic.id].toFixed(1)}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                              <span>{topic.tags?.join(" • ") || "Phần 1, 2, 3"}</span>
                              <span className="font-bold text-blue-600">{topic.prompt_count || 3} Câu hỏi</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#1e50e6] rounded-full w-0 group-hover:w-full transition-all duration-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                      <Mic className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-700">Chưa có bài nói nào</h3>
                      <p className="text-xs text-slate-400">Không tìm thấy dữ liệu chủ đề Speaking từ máy chủ.</p>
                    </div>
                  )
                ) : (
                  shadowingSentences.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      {shadowingSentences.map((sentence) => {
                        const isCompleted = speakingHistoryMap[sentence.id] !== undefined
                        const bandScore = speakingHistoryMap[sentence.id]

                        return (
                          <div
                            key={sentence.id}
                            onClick={() => navigate(`/speaking/shadowing/${sentence.id}`, { state: { sentence } })}
                            className={`bg-white border rounded-2xl p-5 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${
                              isCompleted
                                ? 'border-emerald-300/80 hover:border-emerald-400 bg-emerald-50/10'
                                : 'border-slate-400/60 hover:border-indigo-400'
                            }`}
                          >
                            {isCompleted && (
                              <div className="absolute top-0 right-0">
                                <div className="bg-emerald-500 text-white text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                                  <Check size={10} className="stroke-[3]" />
                                  COMPLETED
                                </div>
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3.5">
                                <div
                                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                    isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                  }`}
                                >
                                  {isCompleted ? <Check size={20} className="stroke-[3]" /> : <Zap size={20} />}
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                    SHADOWING PRACTICE
                                  </span>
                                  <h3 className={`font-bold text-slate-900 text-base leading-snug transition-colors line-clamp-2 italic ${
                                    isCompleted ? 'group-hover:text-emerald-600' : 'group-hover:text-indigo-600'
                                  }`}>
                                    "{sentence.english_text}"
                                  </h3>

                                  <p className="text-xs text-slate-500 font-normal">
                                    {sentence.target_skill || "Intonation & Accent"}
                                  </p>

                                  {isCompleted && (
                                    <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                      <Trophy size={10} className="text-amber-600 fill-amber-400 shrink-0" />
                                      Highest Score: {bandScore && bandScore > 0.1 ? `Band ${bandScore.toFixed(1)}` : 'Đã hoàn thành'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <button
                                aria-label="Start Shadowing"
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-xs shrink-0 ${
                                  isCompleted
                                    ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                                    : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                }`}
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                              <span>{sentence.ipa_text}</span>
                              <span className={`font-sans font-bold ${isCompleted ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {isCompleted ? 'Luyện Lại →' : 'Luyện Tập Ngay →'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
                      <Zap className="w-10 h-10 text-indigo-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-700">No Shadowing sentences available</h3>
                      <button
                        onClick={() => navigate("/speaking/shadowing")}
                        className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition"
                      >
                        Open Shadowing Tool
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

        {/* Pagination Bar */}
        {!(activeTab === 'speaking' && speakingSubTab === 'history') && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {/* Items per page dropdown */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Hiển thị</span>
              <div className="relative" ref={pageSizeDropdownRef}>
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
                  <div className="absolute left-0 bottom-full mb-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 py-1.5 overflow-hidden">
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        onClick={() => { setPageSize(size); setShowPageSizeDropdown(false) }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-between ${pageSize === size ? 'bg-blue-50 text-[#1D4ED8]' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <span>{size} bài/trang</span>
                        {pageSize === size && <Check size={13} className="text-[#1D4ED8] stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeTab === 'reading' && (
                <span className="text-slate-400">
                  • Trang {readingMeta.page}/{readingMeta.total_pages} • Tổng {readingMeta.total} bài đọc
                </span>
              )}
              {activeTab === 'listening' && (
                <span className="text-slate-400">
                  • Trang {listeningMeta.page}/{listeningMeta.total_pages} • Tổng {listeningMeta.total} bài nghe
                </span>
              )}
              {activeTab === 'writing' && (
                <span className="text-slate-400">
                  • Trang {writingMeta.page}/{writingMeta.total_pages} • Tổng {writingMeta.total} đề bài
                </span>
              )}
              {activeTab === 'speaking' && (
                <span className="text-slate-400">
                  • Trang {speakingMeta.page} • {speakingSubTab === 'ielts' ? 'Chủ đề IELTS' : 'Câu Shadowing'}
                </span>
              )}
            </div>

            {/* Page number buttons */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${currentPage === page
                    ? 'bg-[#1D4ED8] text-white shadow-xs font-black'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(activeMeta.total_pages, prev + 1))}
                disabled={currentPage >= activeMeta.total_pages}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </AppLayout>
  )
}
