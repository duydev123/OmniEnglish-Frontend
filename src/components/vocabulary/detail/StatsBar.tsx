import React from 'react'
import { Star, Timer, TrendingUp } from 'lucide-react'

interface StatsBarProps {
  totalWords: number
  masteredCount: number
  studyTimeSeconds: number
  accuracyPercentage: number
  lastStudied?: string
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalWords,
  masteredCount,
  studyTimeSeconds = 0,
  accuracyPercentage = 0,
  lastStudied,
}) => {
  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 phút'
    const mins = Math.floor(seconds / 60)
    const hrs = Math.floor(mins / 60)
    if (hrs > 0) {
      const remMins = mins % 60
      return remMins > 0 ? `${hrs} giờ ${remMins} phút` : `${hrs} giờ`
    }
    return `${mins} phút`
  }

  const progressPct = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0
  const realAccuracy = Math.round(accuracyPercentage > 0 ? accuracyPercentage : progressPct)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 select-none font-['Be_Vietnam_Pro']">
      {/* Card 1: Tiến độ tổng quát */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100/70 text-[#1D4ED8] rounded-xl flex items-center justify-center shrink-0">
          <Star size={22} className="fill-[#1D4ED8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 mb-0.5">Tiến độ tổng quát</p>
          <p className="text-lg font-black text-slate-900">
            {masteredCount}/{totalWords} từ đã thuộc
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 2: Thời gian học bộ này */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100/70 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <Timer size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 mb-0.5">Thời gian học bộ này</p>
          <p className="text-lg font-black text-slate-900">{formatTime(studyTimeSeconds)}</p>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
            {lastStudied ? `LẦN CUỐI: ${lastStudied}` : studyTimeSeconds > 0 ? 'ĐÃ CÓ THỜI GIAN HỌC' : 'CHƯA BẮT ĐẦU HỌC'}
          </p>
        </div>
      </div>

      {/* Card 3: Điểm Mastery */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100/70 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
          <TrendingUp size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 mb-0.5">Điểm Mastery</p>
          <p className="text-lg font-black text-slate-900">
            {realAccuracy}% Accuracy
          </p>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
            TỈ LỆ HOÀN THÀNH: {progressPct}%
          </p>
        </div>
      </div>
    </div>
  )
}

export default StatsBar
