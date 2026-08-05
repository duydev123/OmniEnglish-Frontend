import React from 'react';
import { AlignLeft, CheckCircle2, GraduationCap, AlertCircle, Zap } from 'lucide-react';
import type { DetailFilter } from '../../../types/vocabulary';

interface FilterSidebarProps {
  counts: { all: number; mastered: number; learning: number; needsReview: number };
  activeFilter: DetailFilter;
  showIPA: boolean;
  onFilterChange: (f: DetailFilter) => void;
  onToggleIPA: () => void;
  onStartFlashcard: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  counts,
  activeFilter,
  showIPA,
  onFilterChange,
  onToggleIPA,
  onStartFlashcard
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm w-full sticky top-24 select-none">
      {/* ── Lọc theo trạng thái ── */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Lọc theo trạng thái</h3>
        <div className="space-y-1.5">
          {/* Tất cả từ */}
          <button 
            onClick={() => onFilterChange('all')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlignLeft size={16} /> <span>Tất cả từ</span>
            </div>
            <span className={`text-xs font-black ${activeFilter === 'all' ? 'text-white' : 'text-slate-400'}`}>
              {counts.all}
            </span>
          </button>

          {/* Đã thuộc */}
          <button 
            onClick={() => onFilterChange('MASTERED')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeFilter === 'MASTERED' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500" /> <span>Đã thuộc</span>
            </div>
            <span className="text-xs font-black text-slate-400">{counts.mastered}</span>
          </button>

          {/* Đang học */}
          <button 
            onClick={() => onFilterChange('LEARNING')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeFilter === 'LEARNING' 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap size={16} className="text-blue-500" /> <span>Đang học</span>
            </div>
            <span className="text-xs font-black text-slate-400">{counts.learning}</span>
          </button>

          {/* Cần ôn tập */}
          <button 
            onClick={() => onFilterChange('NEEDS_REVIEW')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeFilter === 'NEEDS_REVIEW' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle size={16} className="text-red-500" /> <span>Cần ôn tập</span>
            </div>
            <span className="text-xs font-black text-slate-400">{counts.needsReview}</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full mb-6" />

      {/* ── Tùy chọn hiển thị ── */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Tùy chọn hiển thị</h3>
        <label className="flex items-center justify-between cursor-pointer group py-1">
          <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">Hiện phiên âm</span>
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={showIPA} onChange={onToggleIPA} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${showIPA ? 'bg-[#1D4ED8]' : 'bg-slate-200'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showIPA ? 'transform translate-x-4' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* ── Flashcard Button ── */}
      <button 
        onClick={onStartFlashcard}
        className="w-full flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-blue-800 text-white py-3 px-4 rounded-full font-bold text-xs transition-all shadow-md shadow-blue-600/20"
      >
        <Zap size={15} className="fill-white" />
        Luyện tập Flashcard
      </button>
    </div>
  );
};

export default FilterSidebar;
