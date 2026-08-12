import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Plus, Play, Trash2, MoreVertical, BookOpen, Edit3 } from 'lucide-react'
import type { VocabularyCollection } from '../../../types/vocabulary'

interface CollectionCardProps {
  collection: VocabularyCollection
  listView?: boolean
  onDelete: () => void
  onAddWord: () => void
  onPractice: () => void
  onBulkAdd: () => void
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  listView = false,
  onDelete,
  onAddWord,
  onPractice,
  onBulkAdd,
}) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const wordCount = collection.total_words ?? collection.words_list?.length ?? 0
  const masteredPct = Math.round(collection.accuracy_percentage ?? 0)

  // Mastery status badge color
  const getBadgeColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-600'
    if (pct >= 30) return 'text-blue-600'
    return 'text-[#1D4ED8]'
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 70) return 'bg-emerald-500'
    if (pct >= 30) return 'bg-[#1D4ED8]'
    return 'bg-[#1D4ED8]'
  }

  if (listView) {
    return (
      <div
        onClick={() => navigate(`/vocabulary/${collection.id}`)}
        className="group relative bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 hover:shadow-lg
          hover:border-blue-400/80 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none min-h-[90px]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-[#1D4ED8] transition-colors leading-snug break-words">
              {collection.title}
            </h3>
            {collection.is_official && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-600 rounded-md shrink-0">
                Hệ thống
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
            {collection.description || 'Chưa có mô tả cho bộ từ này.'}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-left sm:text-right shrink-0">
            <div className="flex items-center gap-1 text-xs font-black text-slate-700 whitespace-nowrap">
              <BookOpen size={13} className="text-slate-400 shrink-0" />
              <span>{wordCount} Từ</span>
            </div>
            <span className={`text-xs font-black whitespace-nowrap ${getBadgeColor(masteredPct)}`}>
              {masteredPct}% Đã thuộc
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={onPractice}
              className="px-4 py-2 sm:py-2.5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all whitespace-nowrap cursor-pointer"
            >
              Luyện tập ngay
            </button>
            <button
              onClick={() => navigate(`/vocabulary/${collection.id}`)}
              className="p-2 sm:p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all shrink-0 cursor-pointer"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate(`/vocabulary/${collection.id}`)}
      className="group relative bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 hover:shadow-xl
        hover:border-blue-400/80 transition-all duration-200 cursor-pointer flex flex-col justify-between
        min-h-[290px] sm:h-[310px] w-full select-none overflow-hidden"
    >
      {/* Top Header & Description Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Title + 3-dots Menu */}
        <div className="flex items-start justify-between gap-2 mb-2 shrink-0">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover:text-[#1D4ED8] transition-colors leading-snug tracking-tight flex-1 break-words">
            {collection.title}
          </h3>

          {!collection.is_official && (
            <div className="relative shrink-0" ref={menuRef} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                  <button
                    onClick={() => { setShowMenu(false); navigate(`/vocabulary/${collection.id}`) }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye size={14} /> Xem chi tiết
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onAddWord() }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={14} /> Thêm từ vựng
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onBulkAdd() }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 size={14} /> Thêm hàng loạt
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onPractice() }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Play size={14} /> Luyện Flashcard
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => { setShowMenu(false); onDelete() }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Xóa bộ từ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Description Box with fixed height constraint */}
        <div className="h-[60px] sm:h-[64px] overflow-y-auto pr-1 text-xs text-slate-400 font-medium leading-relaxed custom-scrollbar shrink-0">
          {collection.description || 'Chưa có mô tả cho bộ từ này.'}
        </div>
      </div>

      {/* Stats row & Progress Bar & Bottom Actions (Fixed position at bottom) */}
      <div className="shrink-0 pt-2">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-2">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <BookOpen size={14} className="text-slate-400 shrink-0" />
            <span>{wordCount} Từ</span>
          </div>
          <span className={`text-xs font-black whitespace-nowrap ${getBadgeColor(masteredPct)}`}>
            {masteredPct}% Đã thuộc
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4 sm:mb-5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(masteredPct)}`}
            style={{ width: `${Math.max(masteredPct, 5)}%` }}
          />
        </div>

        {/* Bottom Actions Row: Practice Now + Eye icon button */}
        <div className="flex items-center gap-2.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onPractice}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl sm:rounded-2xl
              font-extrabold text-xs transition-all shadow-md shadow-blue-500/20 text-center whitespace-nowrap cursor-pointer"
          >
            Luyện tập ngay
          </button>
          <button
            onClick={() => navigate(`/vocabulary/${collection.id}`)}
            className="w-9 h-9 sm:w-11 sm:h-11 border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl
              flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all shrink-0 cursor-pointer"
            title="Xem chi tiết"
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}

export default CollectionCard
