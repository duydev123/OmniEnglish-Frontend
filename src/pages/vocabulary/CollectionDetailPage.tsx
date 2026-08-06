import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit3 } from 'lucide-react'
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

  useEffect(() => {
    if (!id) return
    fetchCollection(id)
  }, [id])

  async function fetchCollection(colId: string) {
    setLoading(true)
    try {
      const data = await getCollection(colId)
      setCollection(data)
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
    showToast('✅ Đã cập nhật bộ từ vựng!', 'success')
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
    showToast(`✅ Đã cập nhật hàng loạt ${updatedWords.length} từ vựng!`, 'success')
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

  const visibleWords = filteredWords.slice(0, visibleCount)
  const hasMore = visibleCount < filteredWords.length
  const remainingCount = filteredWords.length - visibleCount

  return (
    <VocabLayout breadcrumbs={[
      { label: 'BASIC', href: '/vocabulary' },
      { label: 'VOCABULARY', href: '/vocabulary' },
      { label: 'BỘ TỪ VỰNG CỦA TÔI', href: '/vocabulary' },
      { label: collection.title.toUpperCase() },
    ]}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Main Page Action Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/vocabulary')}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/60 transition-colors text-slate-700 font-bold"
              title="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1D4ED8] tracking-tight">
              {collection.title}
            </h1>
          </div>

          {/* Top Bar Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowAddWord(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-700
                bg-[#F1F5F9] border border-slate-200/60 rounded-xl hover:bg-slate-200 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} /> Thêm từ vựng
            </button>
            <button
              onClick={() => navigate(`/vocabulary/${id}/bulk-add`)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-700
                bg-[#F1F5F9] border border-slate-200/60 rounded-xl hover:bg-slate-200 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} /> Thêm hàng loạt
            </button>
            <button
              onClick={() => setShowBulkEdit(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-700
                bg-[#F1F5F9] border border-slate-200/60 rounded-xl hover:bg-slate-200 transition-all shadow-xs cursor-pointer"
            >
              <Edit3 size={15} /> Sửa hàng loạt
            </button>
            <button
              onClick={() => setShowEditCollection(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold text-white
                bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Edit3 size={15} /> Chỉnh sửa
            </button>
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
              onStartFlashcard={() => setShowFlashcard(true)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
              {([
                { key: 'all', label: `Tất cả (${counts.all})` },
                { key: 'MASTERED', label: `Đã thuộc (${counts.mastered})` },
                { key: 'LEARNING', label: `Đang học (${counts.learning})` },
                { key: 'NEEDS_REVIEW', label: `Cần ôn (${counts.needsReview})` },
              ] as { key: DetailFilter; label: string }[]).map(item => (
                <button
                  key={item.key}
                  onClick={() => { setFilter(item.key); setVisibleCount(WORDS_PER_PAGE) }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${filter === item.key
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredWords.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">📭</div>
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
          showToast('✅ Đã thêm từ vựng!', 'success')
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
        collection={collection}
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
