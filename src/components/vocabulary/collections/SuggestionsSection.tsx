import React from 'react'
import { MapPin, BookOpen, ArrowRight, Star, ShieldCheck } from 'lucide-react'

export const SuggestionsSection: React.FC = () => {
  return (
    <section className="bg-[#E8EDFB] rounded-3xl p-6 sm:p-8 font-['Be_Vietnam_Pro'] select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gợi ý cho bạn
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            Các bộ từ vựng phổ biến đang được cộng đồng omniEnglish theo học.
          </p>
        </div>

        <a
          href="#"
          className="text-[#1D4ED8] font-extrabold text-xs hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
        >
          Xem tất cả gợi ý <ArrowRight size={14} />
        </a>
      </div>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Travel & Tourism */}
        <div className="bg-white rounded-2xl p-5 border border-slate-400/60 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 flex items-start gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-[#1D4ED8] flex items-center justify-center shrink-0">
            <MapPin size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Travel & Tourism
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
              Học các từ vựng thiết yếu khi đi du lịch nước ngoài và sân bay.
            </p>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600">
                <Star size={13} className="fill-emerald-500 text-emerald-500" /> Popular
              </span>
              <span>•</span>
              <span>34.2k Học viên</span>
            </div>
          </div>
        </div>

        {/* Card 2: Oxford 3000™ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-400/60 shadow-glow-4side hover:shadow-glow-4side-lg transition-all duration-300 flex items-start gap-4 cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-[#1D4ED8] flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base text-slate-900 mb-1">
              Oxford 3000™
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
              3000 từ vựng quan trọng nhất trong tiếng Anh theo Oxford.
            </p>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1 text-blue-600">
                <ShieldCheck size={14} className="text-blue-600" /> Verified
              </span>
              <span>•</span>
              <span>156k Học viên</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SuggestionsSection
