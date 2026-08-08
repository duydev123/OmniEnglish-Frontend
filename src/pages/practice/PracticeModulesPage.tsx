import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Headphones, BookOpen, Mic, PenTool, SlidersHorizontal,
  ArrowRight, RotateCcw, Check, ChevronDown, ChevronLeft, ChevronRight,
  FileEdit
} from 'lucide-react'
import AppLayout from '../../components/common/AppLayout'
import type { ListeningPracticeCardData } from '../../types/listening'
import { getPassages, getInProgressSessions, type PassageSummary, type UserHistoryItem } from '../../services/readingApi'
import { getListeningPassages, getInProgressListeningSessions, type ListeningPassageSummary } from '../../services/listeningApi'

type ModuleCategory = 'listening' | 'reading' | 'speaking' | 'writing'

const PAGE_SIZE_OPTIONS = [6, 10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 6
const READING_USER_ID = 'test_user_001'

export default function PracticeModulesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ModuleCategory>('listening')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false)
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null)

  const [readingPassages, setReadingPassages] = useState<PassageSummary[]>([])
  const [readingLoading, setReadingLoading] = useState(false)
  const [readingError, setReadingError] = useState<string | null>(null)
  const [readingMeta, setReadingMeta] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 })

  // Draft map: passageId → UserHistoryItem (IN_PROGRESS session)
  const [draftMap, setDraftMap] = useState<Record<string, UserHistoryItem>>({})
  const [listeningDraftMap, setListeningDraftMap] = useState<Record<string, any>>({})
  const [draftLoading, setDraftLoading] = useState(false)

  const [listeningPassages, setListeningPassages] = useState<ListeningPassageSummary[]>([])
  const [listeningLoading, setListeningLoading] = useState(false)
  const [listeningError, setListeningError] = useState<string | null>(null)
  const [listeningMeta, setListeningMeta] = useState({ page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, total_pages: 1 })

  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('All')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

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
  }, [activeTab, selectedQuestionType, pageSize])

  // Fetch reading passages
  useEffect(() => {
    if (activeTab !== 'reading') return
    let cancelled = false
    setReadingLoading(true)
    setReadingError(null)

    getPassages({
      page: currentPage,
      limit: pageSize,
      question_type: selectedQuestionType === 'All' ? undefined : selectedQuestionType
    })
      .then((res) => {
        if (cancelled) return
        setReadingPassages(res.items)
        setReadingMeta({ page: res.page, limit: res.limit, total: res.total, total_pages: res.total_pages })
      })
      .catch((err) => {
        if (cancelled) return
        setReadingError(err?.response?.data?.message ?? err?.response?.data?.detail ?? err.message ?? 'Không thể tải danh sách bài đọc')
      })
      .finally(() => { if (!cancelled) setReadingLoading(false) })

    return () => { cancelled = true }
  }, [activeTab, currentPage, pageSize, selectedQuestionType])

  // Fetch in-progress sessions for reading to build draftMap
  useEffect(() => {
    if (activeTab !== 'reading') return
    let cancelled = false
    setDraftLoading(true)

    getInProgressSessions(READING_USER_ID)
      .then((sessions) => {
        if (cancelled) return
        const map: Record<string, UserHistoryItem> = {}
        sessions.forEach((s) => { map[s.passage_id] = s })
        setDraftMap(map)
      })
      .catch(() => { /* silent - draft info is optional */ })
      .finally(() => { if (!cancelled) setDraftLoading(false) })

    return () => { cancelled = true }
  }, [activeTab])

  // Fetch in-progress sessions for listening
  useEffect(() => {
    if (activeTab !== 'listening') return
    let cancelled = false
    setDraftLoading(true)

    getInProgressListeningSessions(READING_USER_ID)
      .then((sessions) => {
        if (cancelled) return
        const map: Record<string, any> = {}
        sessions.forEach((s) => {
          const key = `${s.passage_id}-${s.session_type.toLowerCase()}`
          map[key] = s
        })
        setListeningDraftMap(map)
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setDraftLoading(false) })

    return () => { cancelled = true }
  }, [activeTab])

  // Fetch listening passages
  useEffect(() => {
    if (activeTab !== 'listening') return
    let cancelled = false
    setListeningLoading(true)
    setListeningError(null)

    const cardsPerPassage = (selectedQuestionType && selectedQuestionType !== 'All') ? 1 : 2
    const limitForPassages = Math.ceil(pageSize / cardsPerPassage)

    getListeningPassages({
      page: currentPage,
      limit: limitForPassages,
      question_type: selectedQuestionType === 'All' ? undefined : selectedQuestionType
    })
      .then((res) => {
        if (cancelled) return
        setListeningPassages(res.items)
        const totalCards = res.total * cardsPerPassage
        setListeningMeta({
          page: currentPage,
          limit: pageSize,
          total: totalCards,
          total_pages: Math.max(1, Math.ceil(totalCards / pageSize)),
        })
      })
      .catch((err) => {
        if (cancelled) return
        setListeningError(err?.response?.data?.message ?? err?.response?.data?.detail ?? err.message ?? 'Không thể tải danh sách bài nghe')
      })
      .finally(() => { if (!cancelled) setListeningLoading(false) })

    return () => { cancelled = true }
  }, [activeTab, currentPage, pageSize, selectedQuestionType])

  // Build cards với draft info (Listening tạo 2 thẻ song song cho mỗi passage: Comprehension & Dictation)
  let cards: (ListeningPracticeCardData & { draftSession?: any })[] = []
  
  if (activeTab === 'listening') {
    const list: any[] = []
    listeningPassages.forEach((item) => {
      // 1. Thẻ Comprehension (Luyện nghe hiểu)
      const compDraft = listeningDraftMap[`${item.id}-comprehension`]
      const compProgress = compDraft && item.total_questions > 0
        ? Math.min(100, Math.round((compDraft.completed_questions ?? 0) / item.total_questions * 100))
        : 0
      
      list.push({
        id: `${item.id}-comp`,
        title: `${item.title} (Comprehension)`,
        subtitle: `${item.unit_code ?? 'UNIT'} • ${item.total_questions} câu hỏi • ${item.time_limit_minutes} phút`,
        category: 'listening' as const,
        progressPercentage: compProgress,
        isCompleted: false,
        href: `/listening/practice?id=${item.id}`,
        question_types: item.question_types ? item.question_types.filter(t => t !== 'Dictation') : [],
        draftSession: compDraft,
        total_questions: item.total_questions,
      })

      // 2. Thẻ Dictation (Chép chính tả)
      const dictDraft = listeningDraftMap[`${item.id}-dictation`]
      const dictProgress = dictDraft && dictDraft.words_typed > 0 ? 50 : 0 // Show 50% if there is typed content

      list.push({
        id: `${item.id}-dict`,
        title: `${item.title} (Dictation)`,
        subtitle: `${item.unit_code ?? 'UNIT'} • Chép chính tả • ${item.time_limit_minutes} phút`,
        category: 'listening' as const,
        progressPercentage: dictProgress,
        isCompleted: false,
        href: `/listening/dictation?id=${item.id}`,
        question_types: ['Dictation'],
        draftSession: dictDraft,
        total_questions: 1, // Dictation can be considered 1 task
      })
    })

    // Lọc lại các card listening dựa trên selectedQuestionType được chọn ở dropdown filter
    if (selectedQuestionType && selectedQuestionType !== 'All') {
      cards = list.filter((c) => c.question_types.includes(selectedQuestionType))
    } else {
      cards = list
    }
  } else {
    cards = readingPassages.map((item) => {
      const draft = draftMap[item.id]
      const progressPct = draft && item.total_questions > 0
        ? Math.min(100, Math.round((draft.completed_questions ?? 0) / item.total_questions * 100))
        : 0
      return {
        id: item.id,
        title: item.title,
        subtitle: `${item.topic} • ${item.total_questions} câu hỏi • ${item.time_limit_minutes} phút`,
        category: 'reading' as const,
        progressPercentage: progressPct,
        isCompleted: false,
        href: `/reading/practice?id=${item.id}`,
        question_types: item.question_types,
        draftSession: draft,
      }
    })
  }

  const activeMeta = activeTab === 'listening' ? listeningMeta : readingMeta
  const activeLoading = (activeTab === 'listening' ? listeningLoading : readingLoading) || (activeTab === 'reading' && draftLoading)
  const activeError = activeTab === 'listening' ? listeningError : readingError

  const pageNumbers = Array.from({ length: Math.max(1, Math.min(5, activeMeta.total_pages)) }, (_, index) => {
    const startPage = Math.max(1, Math.min(currentPage - 2, Math.max(1, activeMeta.total_pages - 4)))
    return startPage + index
  }).filter((page) => page <= activeMeta.total_pages)

  return (
    <AppLayout breadcrumbs={[{ label: 'PRACTICE MODULE', href: '/practice' }]}>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Practice Modules
          </h1>
        </div>

        {/* Tabs & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-200/60">
            {(
              [
                { key: 'listening', label: 'Listening', Icon: Headphones },
                { key: 'reading', label: 'Reading', Icon: BookOpen },
                { key: 'speaking', label: 'Speaking', Icon: Mic },
                { key: 'writing', label: 'Writing', Icon: PenTool },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 ${activeTab === key
                    ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Filter Dropdown */}
          <div className="relative shrink-0" ref={typeDropdownRef}>
            <div
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-6 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs cursor-pointer hover:border-slate-300"
            >
              <div className="flex items-center gap-2 text-slate-500">
                <SlidersHorizontal size={16} />
                <span>{selectedQuestionType === 'All' ? 'Filter by question type' : `Type: ${selectedQuestionType}`}</span>
              </div>
              <ChevronDown size={16} className="text-slate-400 transition-transform duration-200" style={{ transform: showTypeDropdown ? 'rotate(180deg)' : 'none' }} />
            </div>
            {showTypeDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 py-1.5 overflow-hidden">
                {(activeTab === 'reading'
                  ? ['All', 'Multiple Choice', 'Heading Matching', 'Fill Blank', 'T/F/NG']
                  : ['All', 'Multiple Choice', 'Fill Blank', 'Dictation']
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setSelectedQuestionType(type); setShowTypeDropdown(false) }}
                    className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between ${selectedQuestionType === type ? 'bg-blue-50 text-[#1D4ED8]' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <span>{type}</span>
                    {selectedQuestionType === type && <Check size={14} className="text-[#1D4ED8] stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {activeLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600">
            {activeTab === 'listening' ? 'Đang tải danh sách bài nghe từ backend...' : 'Đang tải danh sách passage từ backend...'}
          </div>
        )}

        {/* Error */}
        {activeError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {activeError}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => {
            const Icon = card.category === 'reading' ? BookOpen : Headphones
            const draft = 'draftSession' in card ? card.draftSession : undefined
            const isDraft = !!draft
            const completedAnswers = isDraft ? (draft!.completed_questions ?? 0) : 0
            const totalQ = isDraft ? (('total_questions' in card ? card.total_questions : 0) || draft!.total_questions || 0) : 0
            const draftPct = card.progressPercentage

            return (
              <div
                key={card.id}
                onClick={() => navigate(card.href)}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden group ${isDraft
                    ? 'border-amber-200 hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-blue-300'
                  }`}
              >
                {/* Draft ribbon */}
                {isDraft && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-amber-400 text-amber-900 text-[9px] font-black tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-2xl flex items-center gap-1">
                      <FileEdit size={10} />
                      DRAFT
                    </div>
                  </div>
                )}

                {/* Top Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isDraft
                          ? 'bg-amber-50 text-amber-600'
                          : card.isCompleted
                            ? 'bg-emerald-100/70 text-emerald-700'
                            : 'bg-blue-50 text-[#1D4ED8]'
                        }`}
                    >
                      {card.isCompleted ? (
                        <Check size={20} className="stroke-[3]" />
                      ) : isDraft ? (
                        <FileEdit size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        {card.category}
                      </span>
                      <h3 className={`font-bold text-slate-900 text-base leading-snug transition-colors ${isDraft ? 'group-hover:text-amber-600' : 'group-hover:text-[#1D4ED8]'
                        }`}>
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-normal">{card.subtitle}</p>

                      {'question_types' in card && card.question_types && card.question_types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {card.question_types.map((type) => (
                            <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black tracking-wider uppercase">
                              {type}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Draft progress hint */}
                      {isDraft && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                          <FileEdit size={9} />
                          Tiếp tục từ câu đã làm dở
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {card.isCompleted ? (
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <RotateCcw size={16} />
                      </div>
                    ) : isDraft ? (
                      <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Status + Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    {card.isCompleted ? (
                      <span className="px-2.5 py-0.5 bg-emerald-100/70 text-emerald-800 text-[10px] font-black rounded-md tracking-wider">
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

                    <span className={card.isCompleted ? 'text-emerald-700 font-bold' : isDraft ? 'text-amber-600 font-bold' : 'text-[#1D4ED8] font-bold'}>
                      {card.isCompleted ? '100%' : isDraft ? `${draftPct}%` : `${card.progressPercentage}%`}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${card.isCompleted ? 'bg-emerald-600' : isDraft ? 'bg-amber-400' : 'bg-[#1D4ED8]'
                        }`}
                      style={{ width: `${card.isCompleted ? 100 : isDraft ? draftPct : card.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* Items per page dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Show</span>
            <div className="relative" ref={pageSizeDropdownRef}>
              <div
                onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 flex items-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors select-none"
              >
                <span className="font-bold">{pageSize} items/page</span>
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
                      <span>{size} items/page</span>
                      {pageSize === size && <Check size={13} className="text-[#1D4ED8] stroke-[2.5]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeTab === 'reading' && (
              <span className="text-slate-400">
                • Page {readingMeta.page}/{readingMeta.total_pages} • {readingMeta.total} passages
              </span>
            )}
            {activeTab === 'listening' && (
              <span className="text-slate-400">
                • Page {listeningMeta.page}/{listeningMeta.total_pages} • {listeningMeta.total} items
              </span>
            )}
          </div>

          {/* Page number buttons */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${currentPage === page
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
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
