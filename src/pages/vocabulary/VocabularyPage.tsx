import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, SlidersHorizontal, LayoutGrid, List
} from 'lucide-react'
import VocabLayout from '../../components/vocabulary/layout/VocabLayout'
import CollectionCard from '../../components/vocabulary/collections/CollectionCard'
import CreateCard from '../../components/vocabulary/collections/CreateCard'
import SuggestionsSection from '../../components/vocabulary/collections/SuggestionsSection'
import CreateCollectionModal from '../../components/vocabulary/modals/CreateCollectionModal'
import AddWordModal from '../../components/vocabulary/modals/AddWordModal'
import DeleteModal from '../../components/vocabulary/modals/DeleteModal'
import FlashcardModal from '../../components/vocabulary/flashcard/FlashcardModal'
import { useToast } from '../../components/common/Toast'
import {
  getCollection,
  deleteCollection,
  storeId,
  removeId,
  updateCollectionProgress,
  getMyCollections,
  getOfficialCollections,
  getCachedCollections,
} from '../../services/vocabularyApi'
import type { VocabularyCollection, WordStatus } from '../../types/vocabulary'

type DisplayMode = 'grid' | 'list'
type SortOrder = 'newest' | 'oldest' | 'az'
type TabType = 'default' | 'mine'

export default function VocabularyPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    const saved = sessionStorage.getItem('vocab_active_tab')
    return (saved === 'mine' || saved === 'default') ? saved : 'default'
  })

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab)
    sessionStorage.setItem('vocab_active_tab', tab)
  }
  const [myCollections, setMyCollections] = useState<VocabularyCollection[]>(() => getCachedCollections())
  const [officialCollections, setOfficialCollections] = useState<VocabularyCollection[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [showSortMenu, setShowSortMenu] = useState(false)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [addWordTargetId, setAddWordTargetId] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<VocabularyCollection | null>(null)
  const [flashcardTarget, setFlashcardTarget] = useState<VocabularyCollection | null>(null)

  const sortMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAllCollections()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function loadAllCollections() {
    try {
      const [officialResult, mineResult] = await Promise.allSettled([
        getOfficialCollections(),
        getMyCollections()
      ])

      if (officialResult.status === 'fulfilled') {
        setOfficialCollections(officialResult.value || [])
      }

      if (mineResult.status === 'fulfilled') {
        setMyCollections(mineResult.value || [])
      }
    } catch (err) {
      console.warn('Could not refresh collections from server:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPractice = useCallback(async (col: VocabularyCollection) => {
    if (!col.words_list || col.words_list.length === 0) {
      try {
        const fullCol = await getCollection(col.id)
        setFlashcardTarget(fullCol)
      } catch {
        showToast('Không thể tải danh sách từ vựng để luyện tập', 'error')
      }
    } else {
      setFlashcardTarget(col)
    }
  }, [showToast])

  const handleDeleteCollection = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteCollection(deleteTarget.id)
      removeId(deleteTarget.id)
      setMyCollections(prev => prev.filter(c => c.id !== deleteTarget.id))
      showToast(`Đã xóa bộ từ "${deleteTarget.title}"`, 'success')
    } catch (err) {
      showToast(`Lỗi: ${(err as Error).message}`, 'error')
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, showToast])

  const handleFlashcardComplete = useCallback(async (
    ratings: Record<string, WordStatus>,
    studyTimeSec: number
  ) => {
    if (!flashcardTarget) return
    const total = flashcardTarget.words_list.length
    const mastered = Object.values(ratings).filter(s => s === 'MASTERED').length
    const accuracy = total > 0 ? (mastered / total) * 100 : 0
    try {
      await updateCollectionProgress({
        collection_id: flashcardTarget.id,
        accuracy_percentage: accuracy,
        study_time_seconds: studyTimeSec,
      })
      setMyCollections(prev => prev.map(c =>
        c.id === flashcardTarget.id
          ? { ...c, accuracy_percentage: accuracy, study_time_seconds: c.study_time_seconds + studyTimeSec }
          : c
      ))
      showToast(`🎉 Hoàn thành! Đã thuộc ${mastered}/${total} từ`, 'success')
    } catch {
      showToast('Không thể lưu tiến độ lên server', 'info')
    }
    setFlashcardTarget(null)
  }, [flashcardTarget, showToast])

  // Select list based on active tab
  const currentList = activeTab === 'default'
    ? officialCollections
    : myCollections.filter(c => !c.is_official)

  const filtered = currentList
    .filter(c => {
      if (!c) return false
      const q = (searchQuery || '').toLowerCase()
      return (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.topic || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const titleA = a?.title || ''
      const titleB = b?.title || ''
      if (sortOrder === 'az') return titleA.localeCompare(titleB)
      if (sortOrder === 'oldest') return titleA.localeCompare(titleB)
      return titleB.localeCompare(titleA)
    })

  const sortLabels: Record<SortOrder, string> = {
    newest: 'Date created',
    oldest: 'Cũ nhất',
    az: 'A – Z',
  }

  return (
    <VocabLayout breadcrumbs={[
      { label: 'Vocabulary', href: '/vocabulary' },
      { label: activeTab === 'default' ? 'Bộ từ vựng mặc định' : 'Bộ từ vựng của tôi' },
    ]}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto font-['Be_Vietnam_Pro'] select-none">
        {/* Dynamic Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-5 tracking-tight">
          {activeTab === 'default' ? 'Bộ từ vựng mặc định' : 'Bộ từ vựng của tôi'}
        </h1>

        {/* Tab switch bar + Action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 min-h-[42px]">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 rounded-2xl border border-slate-200/60 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('default')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all text-center flex items-center justify-center min-h-[36px] whitespace-nowrap
                ${activeTab === 'default'
                  ? 'bg-white text-[#1D4ED8] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'}`}
            >
              Bộ từ vựng mặc định
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-2 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all text-center flex items-center justify-center min-h-[36px] whitespace-nowrap
                ${activeTab === 'mine'
                  ? 'bg-white text-[#1D4ED8] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'}`}
            >
              Bộ từ vựng của tôi
            </button>
          </div>

          {/* Action buttons on top right */}
          {activeTab === 'mine' && (
            <div className="w-full sm:w-auto">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-extrabold text-white
                  bg-[#1D4ED8] hover:bg-blue-800 rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Plus size={15} /> <span>Tạo bộ từ mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Outer White Box for Search & Filter Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 shadow-xs">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bộ từ vựng..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-200/80 rounded-xl bg-slate-50/80
                focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(v => !v)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200
                  rounded-xl transition-all whitespace-nowrap cursor-pointer"
              >
                <span>{sortLabels[sortOrder]}</span>
                <SlidersHorizontal size={13} />
              </button>
              {showSortMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl
                  shadow-lg z-20 overflow-hidden py-1">
                  {(['newest', 'oldest', 'az'] as SortOrder[]).map(o => (
                    <button
                      key={o}
                      onClick={() => { setSortOrder(o); setShowSortMenu(false) }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer
                        ${sortOrder === o ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {sortLabels[o]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
              <span className="text-[11px] sm:text-xs">Hiển thị:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setDisplayMode('grid')}
                  title="Grid view"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${displayMode === 'grid' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setDisplayMode('list')}
                  title="List view"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${displayMode === 'list' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Collections List Grid */}
        {loading ? (
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col items-center justify-center py-10 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <div className="w-10 h-10 mb-3 border-3 border-blue-100 border-t-[#1D4ED8] rounded-full animate-spin" />
              <p className="text-xs font-extrabold text-slate-600 animate-pulse">
                {activeTab === 'default' ? 'Đang tải bộ từ vựng mặc định...' : 'Đang tải bộ từ vựng của bạn...'}
              </p>
            </div>
            <div className={`grid gap-5 ${displayMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                  <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
                  <div className="h-2 bg-slate-100 rounded-full mb-4" />
                  <div className="h-8 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/60 border border-slate-200/80 rounded-2xl min-h-[280px] flex flex-col items-center justify-center text-center p-8 text-slate-400 mb-8">
            <div className="text-5xl mb-3">📚</div>
            <p className="font-semibold text-slate-500">
              {activeTab === 'default' ? 'Không tìm thấy bộ từ vựng mặc định nào' : 'Chưa có bộ từ vựng cá nhân nào'}
            </p>
            <div className="h-10 mt-3 flex items-center justify-center">
              {activeTab === 'mine' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 text-xs font-bold text-[#1D4ED8] border border-blue-300 rounded-xl hover:bg-blue-50 transition-all bg-white shadow-xs"
                >
                  + Tạo bộ từ đầu tiên
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid gap-5 mb-8 ${displayMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1'
            }`}>
            {filtered.map((col, i) => (
              <div
                key={col.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-[fadeInUp_0.3s_ease_both]"
              >
                <CollectionCard
                  collection={col}
                  listView={displayMode === 'list'}
                  onDelete={() => setDeleteTarget(col)}
                  onAddWord={() => { setAddWordTargetId(col.id); setShowAddWordModal(true) }}
                  onPractice={() => handleStartPractice(col)}
                  onBulkAdd={() => navigate(`/vocabulary/${col.id}/bulk-add`)}
                />
              </div>
            ))}

            {/* Render Create Card as an item in the Grid for My Collections tab */}
            {activeTab === 'mine' && displayMode === 'grid' && (
              <div className="animate-[fadeInUp_0.3s_ease_both]">
                <CreateCard onClick={() => setShowCreateModal(true)} />
              </div>
            )}
          </div>
        )}

        {/* Suggestions Banner Section at Bottom */}
        <SuggestionsSection />
      </div>

      {/* Modals */}
      <CreateCollectionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={col => {
          storeId(col.id)
          setMyCollections(prev => [col, ...prev])
          setShowCreateModal(false)
          showToast(`Đã tạo bộ từ "${col.title}"!`, 'success')
        }}
      />

      <AddWordModal
        open={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        collections={myCollections}
        preselectedCollectionId={addWordTargetId}
        onWordAdded={async (collectionId) => {
          setShowAddWordModal(false)
          showToast('Đã thêm từ vựng!', 'success')
          try {
            const updated = await getCollection(collectionId)
            setMyCollections(prev => prev.map(c => c.id === collectionId ? updated : c))
          } catch { /* ignore */ }
        }}
      />

      <DeleteModal
        open={!!deleteTarget}
        collectionTitle={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCollection}
      />

      <FlashcardModal
        open={!!flashcardTarget}
        collection={flashcardTarget}
        onClose={() => setFlashcardTarget(null)}
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
