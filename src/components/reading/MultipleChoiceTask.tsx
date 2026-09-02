import React, { useEffect, useState } from 'react'
import type { QuestionTask } from '../../types/reading'

interface MultipleChoiceTaskProps {
  task: QuestionTask
  selectedId?: string
  onSelect?: (optionId: string, optionText: string) => void
  onSubmitAnswers?: (selectedOptionId: string) => void
}

export const MultipleChoiceTask: React.FC<MultipleChoiceTaskProps> = ({
  task,
  selectedId,
  onSelect,
}) => {
  const options = task.mcOptions || [
    { id: 'opt1', text: 'Cloud technology' },
    { id: 'opt2', text: 'Traditional office spaces' },
    { id: 'opt3', text: 'Portable devices' },
    { id: 'opt4', text: 'International time zones' },
  ]

  const [selectedOptionId, setSelectedOptionId] = useState<string>(selectedId ?? '')

  useEffect(() => {
    setSelectedOptionId(selectedId ?? '')
  }, [selectedId])

  const handleSelect = (optionId: string, optionText: string) => {
    setSelectedOptionId(optionId)
    onSelect?.(optionId, optionText)
  }

  return (
    <div className="bg-white border border-slate-400/60 rounded-2xl p-5 sm:p-6 shadow-glow-4side flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1D4ED8] text-white font-black text-sm flex items-center justify-center shadow-xs">
          {task.taskNumber}
        </div>
        <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
      </div>

      {/* Question string */}
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        {task.mcQuestion || '1. Based on the passage, what has historically been the primary foundation of economic structure?'}
      </p>

      {/* Options Grid (2x2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id, opt.text)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 select-none ${
                isSelected
                  ? 'bg-blue-50/80 border-2 border-[#1D4ED8] text-blue-900 font-bold shadow-2xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 font-medium'
              }`}
            >
              {/* Custom Radio Circle */}
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'border-[#1D4ED8] bg-[#1D4ED8]'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              <span className="text-xs sm:text-sm">{opt.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MultipleChoiceTask

