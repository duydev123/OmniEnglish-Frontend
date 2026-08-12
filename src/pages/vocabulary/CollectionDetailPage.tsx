import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit3, ArrowUpAZ, ArrowDownAZ, ChevronDown, Layers } from 'lucide-react'
import VocabLayout from '../../components/vocabulary/layout/VocabLayout'
import StatsBar from '../../components/vocabulary/detail/StatsBar'
import FilterSidebar from '../../components/vocabulary/detail/FilterSidebar'
import WordCard from '../../components/vocabulary/detail/WordCard'
import AddWordModal from '../../components/vocabulary/modals/AddWordModal'
import EditCollectionModal from '../../components/vocabulary/modals/EditCollectionModal'
import BulkEditModal from '../../components/vocabulary/modals/BulkEditModal'
import FlashcardModal from '../../components/vocabulary/flashcard/FlashcardModal'
import { useToast } from '../../components/common/Toast'
import {
  getCollection,
  updateCollectionProgress,
} from '../../services/vocabularyApi'
import type { VocabularyCollection, DetailFilter, WordStatus, WordDetail } from '../../types/vocabulary'

const WORDS_PER_PAGE = 8

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [collection, setCollection] = useState<VocabularyCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<DetailFilter>('all')
  const [showIPA, setShowIPA] = useState(true)
  const [visibleCount, setVisibleCount] = useState(WORDS_PER_PAGE)
  const [showAddWord, setShowAddWord] = useState(false)
  const [showEditCollection, setShowEditCollection] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showFlashcard, setShowFlashcard] = useState(false)
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showActionDropdown, setShowActionDropdown] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const actionDropdownRef = useRef<HTMLDivElement>(null)

  const toggleSort = () => setSortOrder(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(e.target as Node)) {
        setShowActionDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!id) return
    fetchCollection(id)
  }, [id])

  async function fetchCollection(colId: string) {
    setLoading(true)
    try {
      const data = await getCollection(colId)
      setCollection(data)
      if (data) {
        sessionStorage.setItem('vocab_active_tab', data.is_official ? 'default' : 'mine')
      }
    } catch {
      showToast('Không tìm thấy bộ từ vựng', 'error')
      navigate('/vocabulary')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUpdated = (newTitle: string, newDesc: string, newLang: string) => {
    setCollection(prev => {
      if (!prev) return prev
      return { ...prev, title: newTitle, description: newDesc, language: newLang }
    })
    showToast('Đã cập nhật bộ từ vựng!', 'success')
  }

  const handleWordUpdated = useCallback((updatedWord: WordDetail) => {
    setCollection(prev => {
      if (!prev) return prev
      return {
        ...prev,
        words_list: prev.words_list.map(w => w.id === updatedWord.id ? updatedWord : w)
      }
    })
    showToast(`✅ Đã cập nhật từ "${updatedWord.word}"!`, 'success')
  }, [showToast])

  const handleBulkWordsUpdated = useCallback((updatedWords: WordDetail[]) => {
    setCollection(prev => {
      if (!prev) return prev
      return {
        ...prev,
        words_list: updatedWords
      }
    })
    showToast(`Đã cập nhật hàng loạt ${updatedWords.length} từ vựng!`, 'success')
  }, [showToast])

  const handleFlashcardComplete = useCallback(async (
    ratings: Record<string, WordStatus>,
    studyTimeSec: number
  ) => {
    if (!collection || !id) return
    const total = collection.words_list.length
    const mastered = Object.values(ratings).filter(s => s === 'MASTERED').length
    const accuracy = total > 0 ? (mastered / total) * 100 : 0
    try {
      await updateCollectionProgress({ collection_id: id, accuracy_percentage: accuracy, study_time_seconds: studyTimeSec })
      setCollection(prev => {
        if (!prev) return prev
        return {
          ...prev,
          accuracy_percentage: accuracy,
          study_time_seconds: prev.study_time_seconds + studyTimeSec,
          words_list: prev.words_list.map(w =>
            ratings[w.id] ? { ...w, learning_status: ratings[w.id] } : w
          ),
        }
      })
      showToast(`🎉 Hoàn thành! ${mastered}/${total} từ đã thuộc`, 'success')
    } catch {
      showToast('Lưu tiến độ thất bại', 'info')
    }
    setShowFlashcard(false)
  }, [collection, id, showToast])

  if (loading) {
    return (
      <VocabLayout breadcrumbs={[{ label: 'BASIC', href: '/vocabulary' }, { label: 'VOCABULARY', href: '/vocabulary' }, { label: '...' }]}>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </VocabLayout>
    )
  }

  if (!collection) return null

  const words = collection.words_list || []
  const masteredCount = words.filter(w => w.learning_status === 'MASTERED').length
  const learningCount = words.filter(w => w.learning_status === 'LEARNING').length
  const needsReviewCount = words.filter(w => w.learning_status === 'NEEDS_REVIEW').length
  const counts = { all: words.length, mastered: masteredCount, learning: learningCount, needsReview: needsReviewCount }

  const filteredWords: WordDetail[] = filter === 'all'
    ? words
    : words.filter(w => w.learning_status === filter)

  const sortedWords = sortOrder === 'none'
    ? filteredWords
    : [...filteredWords].sort((a, b) =>
      sortOrder === 'asc'
        ? a.word.localeCompare(b.word, 'en', { sensitivity: 'base' })
        : b.word.localeCompare(a.word, 'en', { sensitivity: 'base' })
    )

  const visibleWords = sortedWords.slice(0, visibleCount)
  const hasMore = visibleCount < sortedWords.length
  const remainingCount = sortedWords.length - visibleCount

  const handleStartFlashcard = () => {
    if (filteredWords.length === 0) {
      showToast('Không có từ vựng nào thuộc trạng thái này để luyện tập!', 'warning')
      return
    }
    setShowFlashcard(true)
  }

  const flashcardCollection = collection
    ? { ...collection, words_list: filteredWords }
    : null

  return (
    <VocabLayout breadcrumbs={[
      { label: 'BASIC', href: '/vocabulary' },
      { label: 'VOCABULARY', href: '/vocabulary' },
      { label: collection.is_official ? 'BỘ TỪ VỰNG MẶC ĐỊNH' : 'BỘ TỪ VỰNG CỦA TÔI', href: '/vocabulary' },
      { label: collection.title.toUpperCase() },
    ]}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Main Page Action Bar Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/vocabulary')}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-200/60 transition-colors text-slate-700 font-bold"
              title="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1D4ED8] tracking-tight truncate">
              {collection.title}
            </h1>
          </div>

          {/* Desktop Top Bar Actions (Full 5 buttons on Web/Desktop) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {!collection.is_official && (
              <>
                <button
                  onClick={() => setShowAddWord(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold text-slate-700 bg-[#F1F5F9] border border-slate-200/60 rounded-xl hover:bg-slate-200 transition-all shadow-xs cursor-pointer text-center whitespace-nowrap"
                >
                  <Plus size={14} className="shrink-0" /> <span>Thêm từ vựng</span>
                </button>
                <button
                  onClick={() => navigate(`/vocabulary/${id}/bulk-add`)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold text-slate-700 bg-[#F1F5F9] border border-slate-200/60 rounded-xl hover:bg-slate-200 transition-all shadow-xs cursor-pointer text-center whitespace-nowrap"
                >
                  <Plus size={14} className="shrink-0" /> <span>Thêm hàng loạt</span>
                </button>
              </>
            )}
            <button
              onClick={toggleSort}
              title={
                sortOrder === 'asc'
                  ? 'Đang sắp xếp A→Z (bấm để chuyển Z→A)'
                  : sortOrder === 'desc'
                    ? 'Đang sắp xếp Z→A (bấm để về Mặc định)'
                    : 'Sắp xếp theo bảng chữ cái (bấm để xếp A→Z)'
              }
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer text-center whitespace-nowrap ${sortOrder !== 'none'
                  ? 'bg-blue-50 border border-blue-300 text-blue-700'
                  : 'bg-[#F1F5F9] border border-slate-200/60 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {sortOrder === 'desc' ? <ArrowDownAZ size={14} className="shrink-0" /> : <ArrowUpAZ size={14} className="shrink-0" />}
              <span>{sortOrder === 'desc' ? 'Z → A' : sortOrder === 'asc' ? 'A → Z' : 'Sắp xếp'}</span>
            </button>
            {!collection.is_official && (
              <>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold text-slate-700 bg-[#F1F5F9] border border-slate-200/60 rounded-xl hover:bg-slate-200 transition-all shadow-xs cursor-pointer text-center whitespace-nowrap"
                >
                  <Edit3 size={14} className="shrink-0" /> <span>Sửa hàng loạt</span>
                </button>
                <button
                  onClick={() => setShowEditCollection(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer text-center whitespace-nowrap"
                >
                  <Edit3 size={14} className="shrink-0" /> <span>Chỉnh sửa</span>
                </button>
              </>
            )}
            {collection.is_official && (
              <span className="px-3 py-2 text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl">
                Bộ mặc định (Hệ thống)
              </span>
            )}
          </div>

          {/* Mobile Responsive Actions (Compact Dropdown Menu on Mobile only) */}
          <div className="flex sm:hidden items-center gap-2 w-full justify-between" ref={actionDropdownRef}>
            {!collection.is_official ? (
              <button
                onClick={() => setShowAddWord(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap"
              >
                <Plus size={16} /> <span>Thêm từ vựng</span>
              </button>
            ) : (
              <button
                onClick={handleStartFlashcard}
                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap"
              >
                <span>Luyện Flashcard</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionDropdown(v => !v)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span>Tùy chọn</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showActionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showActionDropdown && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {!collection.is_official && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setShowAddWord(true); setShowActionDropdown(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Plus size={14} className="text-blue-600 shrink-0" />
                        <span>Thêm từ mới</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { navigate(`/vocabulary/${id}/bulk-add`); setShowActionDropdown(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Plus size={14} className="text-purple-600 shrink-0" />
                        <span>Thêm hàng loạt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setShowBulkEdit(true); setShowActionDropdown(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit3 size={14} className="text-amber-600 shrink-0" />
                        <span>Sửa hàng loạt</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => { toggleSort(); setShowActionDropdown(false) }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {sortOrder === 'desc' ? <ArrowDownAZ size={14} className="text-blue-600 shrink-0" /> : <ArrowUpAZ size={14} className="text-blue-600 shrink-0" />}
                      <span>Sắp xếp</span>
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {sortOrder === 'desc' ? 'Z → A' : sortOrder === 'asc' ? 'A → Z' : 'Mặc định'}
                    </span>
                  </button>

                  {!collection.is_official && (
                    <button
                      type="button"
                      onClick={() => { setShowEditCollection(true); setShowActionDropdown(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-t border-slate-100 pt-2 mt-1"
                    >
                      <Edit3 size={14} className="text-slate-500 shrink-0" />
                      <span>Chỉnh sửa bộ từ</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <StatsBar
          totalWords={words.length}
          masteredCount={masteredCount}
          studyTimeSeconds={collection.study_time_seconds}
          accuracyPercentage={collection.accuracy_percentage}
        />

        <div className="mt-6 flex gap-6">
          <div className="hidden lg:block w-56 shrink-0">
            <FilterSidebar
              counts={counts}
              activeFilter={filter}
              showIPA={showIPA}
              onFilterChange={f => { setFilter(f); setVisibleCount(WORDS_PER_PAGE) }}
              onToggleIPA={() => setShowIPA(v => !v)}
              onStartFlashcard={handleStartFlashcard}
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Mobile Filter & Control Bar Card */}
            <div className="lg:hidden mb-5 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4 select-none">
              {/* Row 1: Flashcard Button full width */}
              <button
                onClick={handleStartFlashcard}
                className="w-full flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-blue-800 text-white py-2.5 px-3.5 rounded-full font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Layers size={16} className="shrink-0 stroke-[2.5]" />
                <span>Luyện tập Flashcard</span>
              </button>
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phân loại từ vựng</p>
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-700">Hiện IPA</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={showIPA} onChange={() => setShowIPA(v => !v)} />
                      <div className={`block w-7 h-4 rounded-full transition-colors ${showIPA ? 'bg-[#1D4ED8]' : 'bg-slate-300'}`}></div>
                      <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${showIPA ? 'transform translate-x-3' : ''}`}></div>
                    </div>
                  </label>
                </div>

                {/* Soft Rounded Pill Dropdown Menu (Danh sách lựa chọn bo tròn pill nhất quán) */}
                <div className="relative" ref={filterDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowFilterDropdown(v => !v)}
                    className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-700">
                        {filter === 'all' ? 'Tất cả' : filter === 'MASTERED' ? 'Đã thuộc' : filter === 'LEARNING' ? 'Đang học' : 'Cần ôn tập'}
                      </span>
                      <span className="bg-[#1D4ED8] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                        {filter === 'all' ? counts.all : filter === 'MASTERED' ? counts.mastered : filter === 'LEARNING' ? counts.learning : counts.needsReview}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-30 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      {([
                        { key: 'all', label: 'Tất cả', count: counts.all },
                        { key: 'MASTERED', label: 'Đã thuộc', count: counts.mastered },
                        { key: 'LEARNING', label: 'Đang học', count: counts.learning },
                        { key: 'NEEDS_REVIEW', label: 'Cần ôn tập', count: counts.needsReview },
                      ] as { key: DetailFilter; label: string; count: number }[]).map(item => {
                        const isSelected = filter === item.key
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setFilter(item.key)
                              setVisibleCount(WORDS_PER_PAGE)
                              setShowFilterDropdown(false)
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
                                ? 'bg-[#1D4ED8] text-white shadow-sm'
                                : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <span>{item.label}</span>
                            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {item.count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Sort order toggle */}
              <button
                onClick={toggleSort}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${sortOrder !== 'none'
                  ? 'bg-blue-50 border border-blue-300 text-blue-700'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {sortOrder === 'desc'
                  ? <ArrowDownAZ size={14} className="shrink-0" />
                  : <ArrowUpAZ size={14} className="shrink-0" />}
                <span>Sắp xếp: {sortOrder === 'asc' ? 'A → Z' : sortOrder === 'desc' ? 'Z → A' : 'Mặc định'}</span>
              </button>
            </div>

            {sortedWords.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">📥</div>
                <p className="font-semibold text-slate-500">
                  {filter === 'all' ? 'Bộ từ chưa có từ nào' : 'Không có từ nào trong trạng thái này'}
                </p>
                {filter === 'all' && (
                  <button
                    onClick={() => setShowAddWord(true)}
                    className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-all"
                  >
                    + Thêm từ đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibleWords.map((word, i) => (
                    <div
                      key={word.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="animate-[fadeInUp_0.3s_ease_both]"
                    >
                      <WordCard
                        word={word}
                        showIPA={showIPA}
                        onWordUpdated={handleWordUpdated}
                        language={collection.language}
                        isOfficial={collection.is_official}
                      />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisibleCount(v => v + WORDS_PER_PAGE)}
                      className="px-6 py-2.5 text-xs font-bold text-slate-600 border border-slate-200
                        rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50
                        transition-all bg-white shadow-sm"
                    >
                      Xem thêm {remainingCount} từ khác
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-8 px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© 2024 omniEnglish Learning Platform</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      <AddWordModal
        open={showAddWord}
        onClose={() => setShowAddWord(false)}
        collections={collection ? [collection] : []}
        preselectedCollectionId={id}
        onWordAdded={async () => {
          setShowAddWord(false)
          showToast('Đã thêm từ vựng!', 'success')
          if (id) await fetchCollection(id)
        }}
      />

      <EditCollectionModal
        open={showEditCollection}
        collection={collection}
        onClose={() => setShowEditCollection(false)}
        onUpdated={handleEditUpdated}
      />

      <BulkEditModal
        open={showBulkEdit}
        collection={collection}
        onClose={() => setShowBulkEdit(false)}
        onUpdated={handleBulkWordsUpdated}
      />

      <FlashcardModal
        open={showFlashcard}
        collection={flashcardCollection}
        onClose={() => setShowFlashcard(false)}
        onSessionComplete={handleFlashcardComplete}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </VocabLayout>
  )
}
