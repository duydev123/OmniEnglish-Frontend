import React from 'react'
import { LayoutList, CheckSquare, ArrowLeftRight } from 'lucide-react'
import type { SkillStat } from '../../types/reading'

interface SkillBreakdownCardProps {
  skill: SkillStat
}

export const SkillBreakdownCard: React.FC<SkillBreakdownCardProps> = ({ skill }) => {
  const getIcon = () => {
    switch (skill.iconType) {
      case 'choice':
        return <LayoutList size={18} className="text-blue-600" />
      case 'tfng':
        return <CheckSquare size={18} className="text-emerald-600" />
      case 'matching':
        return <ArrowLeftRight size={18} className="text-rose-600" />
      default:
        return <LayoutList size={18} className="text-blue-600" />
    }
  }

  const colorStyles = {
    blue: {
      bgIcon: 'bg-blue-50',
      barBg: 'bg-blue-600',
      textPercent: 'text-blue-600',
    },
    emerald: {
      bgIcon: 'bg-emerald-50',
      barBg: 'bg-emerald-600',
      textPercent: 'text-emerald-600',
    },
    rose: {
      bgIcon: 'bg-rose-50',
      barBg: 'bg-rose-600',
      textPercent: 'text-rose-600',
    },
  }

  const currentStyle = colorStyles[skill.color] || colorStyles.blue

  return (
    <div className="bg-white border border-slate-400/60 rounded-2xl p-5 shadow-glow-4side flex flex-col justify-between h-full gap-4">
      {/* Icon & Info */}
      <div className="space-y-3">
        <div className={`w-9 h-9 rounded-xl ${currentStyle.bgIcon} flex items-center justify-center shrink-0`}>
          {getIcon()}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-base">{skill.title}</h4>
          <p className="text-xs text-slate-500 font-normal mt-0.5">{skill.description}</p>
        </div>
      </div>

      {/* Progress & Stat */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-800">{skill.correctCount}/{skill.totalCount} Correct</span>
          <span className={currentStyle.textPercent}>{skill.percentage}%</span>
        </div>

        {/* Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${currentStyle.barBg} rounded-full transition-all duration-500`}
            style={{ width: `${skill.percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default SkillBreakdownCard

