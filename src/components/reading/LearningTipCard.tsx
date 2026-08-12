import React from 'react'
import { Lightbulb } from 'lucide-react'

interface LearningTipCardProps {
  title?: string
  tip?: string
}

export const LearningTipCard: React.FC<LearningTipCardProps> = ({
  title = 'Learning Tip',
  tip = 'Look for context clues like "collaborate" and "platforms" to find keywords in the reading passage for sentence completion.',
}) => {
  return (
    <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
      <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
        <Lightbulb size={20} />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-emerald-900 text-xs sm:text-sm tracking-tight">{title}</h4>
        <p className="text-xs sm:text-sm text-emerald-800/90 font-normal leading-relaxed">{tip}</p>
      </div>
    </div>
  )
}

export default LearningTipCard
