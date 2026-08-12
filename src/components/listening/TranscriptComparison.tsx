import React from 'react'
import type { DictationWordResult } from '../../services/listeningApi'

interface TranscriptComparisonProps {
  words?: DictationWordResult[]
}

export const TranscriptComparison: React.FC<TranscriptComparisonProps> = ({ words = [] }) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header Legend */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
            ≡
          </span>
          <h3 className="font-bold text-slate-900 text-base">Transcript Comparison</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Correct
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            Error
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-extrabold tracking-wider">
            DETAILED
          </span>
          <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
            DICTATION COMPARISON
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-semibold leading-relaxed">
          {words.length === 0 ? (
            <span className="text-slate-400 italic">Không có dữ liệu so sánh.</span>
          ) : (
            words.map((item, idx) => {
              const isCorrect = item.status === 'correct' || item.is_correct === true
              return (
                <React.Fragment key={idx}>
                  {isCorrect ? (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl" title="Correct word">
                      {item.word}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-1.5" title={`Expected: ${item.word}`}>
                      {item.user_word ? (
                        <span className="line-through text-rose-400">{item.user_word}</span>
                      ) : (
                        <span className="text-rose-300 italic">(missing)</span>
                      )}
                      <span className="font-extrabold text-rose-700">{item.word}</span>
                    </span>
                  )}
                </React.Fragment>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default TranscriptComparison
