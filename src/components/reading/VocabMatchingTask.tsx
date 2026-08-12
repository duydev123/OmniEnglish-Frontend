import React, { useState } from 'react'
import { GripVertical } from 'lucide-react'
import type { QuestionTask } from '../../types/reading'

interface VocabMatchingTaskProps {
  task: QuestionTask
  onSave?: (matches: Record<string, string>) => void
}

export const VocabMatchingTask: React.FC<VocabMatchingTaskProps> = ({ task, onSave }) => {
  const pairs = task.matchingPairs || []
  
  // State for user assignments { termId: assignedDefinition }
  const [userMatches, setUserMatches] = useState<Record<string, string>>({
    '1': '',
    '2': '',
    '3': '',
  })

  // State for active pool of unassigned definitions
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)

  const handleSelectDefinitionForTerm = (termId: string, defText: string) => {
    const next = { ...userMatches, [termId]: defText }
    setUserMatches(next)
    onSave?.(next)
    setSelectedTerm(null)
  }

  const handleClearTerm = (termId: string) => {
    const next = { ...userMatches, [termId]: '' }
    setUserMatches(next)
    onSave?.(next)
  }

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

      {/* Terms and Definitions Grid */}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Column: TERMS */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
            Terms
          </span>
          <div className="space-y-2.5">
            {pairs.map((pair) => (
              <div
                key={pair.id}
                onClick={() => setSelectedTerm(selectedTerm === pair.id ? null : pair.id)}
                className={`p-3 bg-slate-50 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  selectedTerm === pair.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-semibold text-slate-800 text-sm">{pair.term}</span>
                <GripVertical size={16} className="text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: DEFINITIONS */}
        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
            Definitions
          </span>
          <div className="space-y-2.5">
            {pairs.map((pair) => {
              const assigned = userMatches[pair.id]
              return (
                <div
                  key={`def-${pair.id}`}
                  className={`min-h-[46px] p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all ${
                    assigned
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900 font-medium'
                      : 'bg-slate-50/60 border-dashed border-slate-300 text-slate-400'
                  }`}
                >
                  <span className="truncate">{assigned || 'Drop here'}</span>
                  {assigned && (
                    <button
                      onClick={() => handleClearTerm(pair.id)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                      title="Xóa lựa chọn"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Pool of Available Definitions */}
      <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Available Definitions (Click term above, then click a definition to match):
        </span>
        <div className="flex flex-wrap gap-2">
          {(task.unassignedDefinitions || []).map((def, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (selectedTerm) {
                  handleSelectDefinitionForTerm(selectedTerm, def)
                } else {
                  // If no term selected, assign to first empty term
                  const emptyTerm = pairs.find(p => !userMatches[p.id])
                  if (emptyTerm) {
                    handleSelectDefinitionForTerm(emptyTerm.id, def)
                  }
                }
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-2xs font-medium text-left"
            >
              {def}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VocabMatchingTask
