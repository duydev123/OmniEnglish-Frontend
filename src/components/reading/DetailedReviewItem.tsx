import React from 'react'
import { Check, X, ArrowRight } from 'lucide-react'
import type { ReviewQuestionItem } from '../../types/reading'

interface DetailedReviewItemProps {
  item: ReviewQuestionItem
  isSelected?: boolean
  onClick?: () => void
}

export const DetailedReviewItem: React.FC<DetailedReviewItemProps> = ({
  item,
  isSelected,
  onClick,
}) => {
  const isCorrect = item.isCorrect

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer space-y-4 ${
        isCorrect
          ? 'border-emerald-300 ring-1 ring-emerald-500/10 hover:border-emerald-400'
          : 'border-rose-300 ring-1 ring-rose-500/10 hover:border-rose-400'
      } ${isSelected ? 'ring-2 ring-blue-500 shadow-sm' : ''}`}
    >
      {/* Question Badge Header */}
      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isCorrect
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span>Q{item.qNumber} • {item.typeLabel}</span>
          {isCorrect ? <Check size={14} className="stroke-[3]" /> : <X size={14} className="stroke-[3]" />}
        </div>
      </div>

      {/* Question Text */}
      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
        {item.questionText}
      </h4>

      {/* Options / Answers View */}
      {item.options && item.options.length > 0 && (
        <div className="space-y-2">
          {item.options.map((opt) => {
            const isUser = opt.isUserAnswer
            const isCorrectOpt = opt.isCorrectAnswer

            if (isUser && isCorrect) {
              return (
                <div
                  key={opt.id}
                  className="bg-emerald-800 text-white font-medium p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-2xs"
                >
                  <span>{opt.text}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-100">
                    Your Answer
                  </span>
                </div>
              )
            }

            if (isUser && !isCorrect) {
              return (
                <div
                  key={opt.id}
                  className="bg-rose-700 text-white font-medium p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-2xs"
                >
                  <span>{opt.text}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-900/60 px-2 py-0.5 rounded text-rose-100">
                    Your Answer
                  </span>
                </div>
              )
            }

            if (isCorrectOpt && !isCorrect) {
              return (
                <div
                  key={opt.id}
                  className="bg-emerald-50 border border-emerald-400 text-emerald-900 font-medium p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm"
                >
                  <span>{opt.text}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 border border-emerald-300">
                    Correct Answer
                  </span>
                </div>
              )
            }

            return (
              <div
                key={opt.id}
                className="bg-slate-100/90 text-slate-700 font-normal p-3 rounded-xl text-xs sm:text-sm border border-slate-200/60"
              >
                {opt.text}
              </div>
            )
          })}
        </div>
      )}

      {/* Matching Task Pair display if any */}
      {item.matchingPairs && item.matchingPairs.length > 0 && (
        <div className="space-y-2">
          {item.matchingPairs.map((pair, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <span className="font-semibold text-slate-800">{pair.term}</span>
              <ArrowRight size={16} className="text-slate-400 shrink-0" />
              <span className="bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-medium shadow-2xs">
                {pair.definition}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Explanation Box */}
      {item.explanation && (
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 font-normal leading-relaxed">
          <strong className="font-bold text-slate-800">Explanation: </strong>
          {item.explanation}
        </div>
      )}
    </div>
  )
}

export default DetailedReviewItem
