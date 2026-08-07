import React from 'react'
import type { QuestionTask } from '../../types/reading'

interface TrueFalseNotGivenTaskProps {
  task: QuestionTask
  userAnswers: Record<string, string>
  onAnswerChange?: (statementId: string, value: string) => void
}

export const TrueFalseNotGivenTask: React.FC<TrueFalseNotGivenTaskProps> = ({
  task,
  userAnswers,
  onAnswerChange,
}) => {
  const statements = task.matchingPairs || []
  const options = ['TRUE', 'FALSE', 'NOT GIVEN']

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white font-black text-sm flex items-center justify-center shadow-xs">
          {task.taskNumber}
        </div>
        <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
      </div>

      {task.description && (
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          {task.description}
        </p>
      )}

      {/* Statements List */}
      <div className="space-y-4 mt-2">
        {statements.map((stmt, idx) => {
          const statementId = `tf_${task.taskNumber}_${idx}`
          const selectedValue = userAnswers[statementId] || ''

          return (
            <div key={stmt.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 space-y-2.5">
              <div className="flex gap-2">
                <span className="text-xs font-bold text-slate-400 shrink-0">Q{idx + 1}.</span>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {stmt.term}
                </p>
              </div>

              {/* Radio Group */}
              <div className="flex flex-wrap gap-2.5 pl-6">
                {options.map((opt) => {
                  const isSelected = selectedValue.toUpperCase() === opt

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onAnswerChange?.(statementId, opt)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-[#1D4ED8] text-blue-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TrueFalseNotGivenTask
