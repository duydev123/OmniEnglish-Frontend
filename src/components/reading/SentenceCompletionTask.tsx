import React from 'react'
import type { QuestionTask } from '../../types/reading'

interface SentenceCompletionTaskProps {
  task: QuestionTask
  userAnswers: Record<string, string>
  onAnswerChange?: (blankId: string, value: string) => void
}

export const SentenceCompletionTask: React.FC<SentenceCompletionTaskProps> = ({
  task,
  userAnswers,
  onAnswerChange,
}) => {
  const template = task.sentenceTemplate || ''
  // Split by [________] or [blank_name] to render input fields in between
  const parts = template.split(/\[________\]|\[blank_\w+\]|\[.*?\]/g)
  const blanks = task.completionBlanks || []

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

      {/* Paragraph with inline inputs */}
      <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-5 text-slate-800 text-sm sm:text-base leading-relaxed font-normal">
        {parts.map((part, index) => {
          const blankObj = blanks[index]
          return (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && blankObj && (
                <input
                  type="text"
                  value={userAnswers[blankObj.id] || ''}
                  onChange={(e) => onAnswerChange?.(blankObj.id, e.target.value)}
                  placeholder={`(${index + 1})`}
                  className="mx-1 px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center w-32 shadow-2xs transition-all inline-block"
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default SentenceCompletionTask
