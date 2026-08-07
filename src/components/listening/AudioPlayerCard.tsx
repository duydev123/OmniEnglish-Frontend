import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { Play, Pause, RotateCcw, RotateCw, FileText } from 'lucide-react'

interface AudioPlayerCardProps {
  clipName?: string
  duration?: string
  audioUrl?: string
  onToggleTranscript?: () => void
}

export interface AudioPlayerRef {
  seekTo: (timestamp: string) => void
}

export const AudioPlayerCard = forwardRef<AudioPlayerRef, AudioPlayerCardProps>(({
  clipName = 'Audio Clip 01',
  audioUrl,
  onToggleTranscript,
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(225)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      const onTimeUpdate = () => setCurrentTime(Math.floor(audio.currentTime))
      const onLoadedMetadata = () => setTotalSeconds(Math.floor(audio.duration))
      const onEnded = () => setIsPlaying(false)

      audio.addEventListener('timeupdate', onTimeUpdate)
      audio.addEventListener('loadedmetadata', onLoadedMetadata)
      audio.addEventListener('ended', onEnded)

      return () => {
        audio.pause()
        audio.removeEventListener('timeupdate', onTimeUpdate)
        audio.removeEventListener('loadedmetadata', onLoadedMetadata)
        audio.removeEventListener('ended', onEnded)
      }
    }
  }, [audioUrl])

  useImperativeHandle(ref, () => ({
    seekTo: (timestamp: string) => {
      if (!audioRef.current) return
      // Parse "0:45" or "01:20" to seconds
      const parts = timestamp.split(':').map(Number)
      let seconds = 0
      if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1]
      } else if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
      } else if (parts.length === 1) {
        seconds = parts[0]
      }

      audioRef.current.currentTime = seconds
      setCurrentTime(seconds)
      if (!isPlaying) {
        audioRef.current.play().catch(() => { })
        setIsPlaying(true)
      }
    }
  }))

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => { })
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setCurrentTime(val)
    if (audioRef.current) {
      audioRef.current.currentTime = val
    }
  }

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return
    const target = Math.max(0, Math.min(totalSeconds, audioRef.current.currentTime + seconds))
    audioRef.current.currentTime = target
    setCurrentTime(Math.floor(target))
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-extrabold border border-blue-200/60">
          {clipName}
        </span>

        <button
          onClick={onToggleTranscript}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <FileText size={15} />
          <span>View Transcript</span>
        </button>
      </div>

      {/* Controls Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
        {/* Buttons Row */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => handleSkip(-10)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-colors relative group"
            title="Tua lùi 10s"
          >
            <RotateCcw size={18} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black top-0.5">
              10
            </span>
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-[#1D4ED8] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
          >
            {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-full transition-colors relative group"
            title="Tua tới 10s"
          >
            <RotateCw size={18} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black top-0.5">
              10
            </span>
          </button>
        </div>

        {/* Progress Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={totalSeconds}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1D4ED8]"
          />
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalSeconds)}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default AudioPlayerCard
