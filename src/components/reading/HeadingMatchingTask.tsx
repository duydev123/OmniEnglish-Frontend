import React from 'react'
import type { QuestionTask } from '../../types/reading'

interface HeadingMatchingTaskProps {
  task: QuestionTask
  userAnswers: Record<string, string>
  onAnswerChange?: (paragraphId: string, value: string) => void
}

export const HeadingMatchingTask: React.FC<HeadingMatchingTaskProps> = ({
  task,
  userAnswers,
  onAnswerChange,
}) => {
  const headings = task.unassignedDefinitions || [] // We will store headings list here in task
  const paragraphs = task.sentenceTemplate?.split('\n\n').filter(Boolean) || [] // We will store paragraphs list here, or custom mapping

  return (
    <div className="bg-white border border-slate-400/60 rounded-2xl p-5 sm:p-6 shadow-glow-4side flex flex-col gap-4">
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

      {/* Paragraphs and Headings dropdowns */}
      <div className="space-y-4 mt-2">
        {paragraphs.map((paraText, idx) => {
          const paragraphId = `paragraph_${idx + 1}`
          const selectedHeading = userAnswers[paragraphId] || ''

          return (
            <div key={paragraphId} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex justify-between items-start gap-4">
                <span className="px-2 py-0.5 bg-blue-50 text-[#1D4ED8] font-bold text-xs rounded-md shrink-0">
                  Paragraph {idx + 1}
                </span>
                
                {/* Heading Dropdown */}
                <select
                  value={selectedHeading}
                  onChange={(e) => onAnswerChange?.(paragraphId, e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-[240px] shadow-2xs"
                >
                  <option value="">-- Select Heading --</option>
                  {headings.map((h, hIdx) => (
                    <option key={hIdx} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-normal line-clamp-3 leading-relaxed">
                {paraText}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default HeadingMatchingTask

