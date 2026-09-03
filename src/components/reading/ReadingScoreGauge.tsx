interface ReadingScoreGaugeProps {
  score: number
  maxScore?: number
  proficiencyLevel?: string
  message?: string
}

export const ReadingScoreGauge: React.FC<ReadingScoreGaugeProps> = ({
  score = 7.5,
  maxScore = 9.0,
  proficiencyLevel = 'B2+',
  message = 'Excellent performance! You are currently at a B2+ proficiency level.',
}) => {
  const percentage = (score / maxScore) * 100
  const radius = 54
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="bg-white border border-slate-400/60 rounded-2xl p-6 shadow-glow-4side flex flex-col items-center justify-center text-center gap-4 h-full">
      {/* Circle Ring */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="text-blue-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="text-[#1D4ED8] transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{score}</span>
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
            {proficiencyLevel || 'Overall Score'}
          </span>
        </div>
      </div>

      {/* Description text */}
      <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  )
}

export default ReadingScoreGauge

