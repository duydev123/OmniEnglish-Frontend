import React, { useState, useRef, useEffect } from 'react'
import type { TranscriptSegment } from '../../services/listeningApi'
import { ChevronDown, Pause, Play, RotateCcw, RotateCw } from 'lucide-react'

interface DictationAudioPlayerProps {
  audioUrl?: string
  onSpeedChange?: (speed: string) => void
  interactiveTranscript?: TranscriptSegment[]
  activeSegment?: TranscriptSegment
}

export interface DictationAudioPlayerRef {
  playSegment: (start: string, end: string) => void
}

const parseTimeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

export const DictationAudioPlayer = React.forwardRef<DictationAudioPlayerRef, DictationAudioPlayerProps>(
  ({ audioUrl, onSpeedChange, interactiveTranscript = [], activeSegment }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [activeTab, setActiveTab] = useState<'dictation' | 'transcript'>('dictation')
    const [playbackSpeed, setPlaybackSpeed] = useState('1.0x')
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [repeatEnabled, setRepeatEnabled] = useState(false)
    const repeatEnabledRef = useRef(repeatEnabled)

    useEffect(() => {
      repeatEnabledRef.current = repeatEnabled
    }, [repeatEnabled])

    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const [currentTime, setCurrentTime] = useState(0)
    const [totalSeconds, setTotalSeconds] = useState(150)
    const speedDropdownRef = React.useRef<HTMLDivElement>(null)
    const segmentTimeoutRef = React.useRef<any>(null)

    React.useImperativeHandle(ref, () => ({
      playSegment: (start: string, end: string) => {
        if (!audioRef.current) return
        if (segmentTimeoutRef.current) {
          clearTimeout(segmentTimeoutRef.current)
        }
        const startSec = parseTimeToSeconds(start)
        const endSec = parseTimeToSeconds(end)
        audioRef.current.currentTime = startSec
        audioRef.current.play().catch(() => {})
        setIsPlaying(true)

        if (!repeatEnabledRef.current) {
          const durationMs = Math.max(100, (endSec - startSec) * 1000)
          segmentTimeoutRef.current = setTimeout(() => {
            if (audioRef.current && !repeatEnabledRef.current) {
              audioRef.current.pause()
              setIsPlaying(false)
            }
          }, durationMs)
        }
      }
    }))

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(event.target as Node)) {
        setShowSpeedDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      const onTimeUpdate = () => {
        if (activeSegment) {
          const startSec = parseTimeToSeconds(activeSegment.start_time)
          const endSec = parseTimeToSeconds(activeSegment.end_time)
          const current = audio.currentTime
          
          if (current < startSec) {
            audio.currentTime = startSec
            setCurrentTime(0)
          } else if (current >= endSec) {
            if (repeatEnabledRef.current) {
              audio.currentTime = startSec
              audio.play().catch(() => {})
              setIsPlaying(true)
              setCurrentTime(0)
            } else {
              audio.pause()
              audio.currentTime = startSec
              setIsPlaying(false)
              setCurrentTime(0)
            }
          } else {
            setCurrentTime(Math.floor(current - startSec))
          }
        } else {
          setCurrentTime(Math.floor(audio.currentTime))
        }
      }
      const onLoadedMetadata = () => {
        if (activeSegment) {
          const startSec = parseTimeToSeconds(activeSegment.start_time)
          const endSec = parseTimeToSeconds(activeSegment.end_time)
          setTotalSeconds(endSec - startSec)
        } else {
          setTotalSeconds(Math.floor(audio.duration))
        }
      }
      const onEnded = () => {
        if (repeatEnabledRef.current) {
          if (activeSegment) {
            const startSec = parseTimeToSeconds(activeSegment.start_time)
            audio.currentTime = startSec
          } else {
            audio.currentTime = 0
          }
          audio.play().catch(() => {})
          setIsPlaying(true)
        } else {
          setIsPlaying(false)
        }
      }

      audio.addEventListener('timeupdate', onTimeUpdate)
      audio.addEventListener('loadedmetadata', onLoadedMetadata)
      audio.addEventListener('ended', onEnded)

      // Initialize rate from state
      audio.playbackRate = parseFloat(playbackSpeed)

      return () => {
        audio.pause()
        audio.removeEventListener('timeupdate', onTimeUpdate)
        audio.removeEventListener('loadedmetadata', onLoadedMetadata)
        audio.removeEventListener('ended', onEnded)
      }
    }
  }, [audioUrl, activeSegment])

  // Reset currentTime to start of new segment when activeSegment changes
  React.useEffect(() => {
    if (audioRef.current && activeSegment) {
      audioRef.current.pause()
      setIsPlaying(false)
      const startSec = parseTimeToSeconds(activeSegment.start_time)
      const endSec = parseTimeToSeconds(activeSegment.end_time)
      audioRef.current.currentTime = startSec
      setCurrentTime(0)
      setTotalSeconds(endSec - startSec)
    }
  }, [activeSegment])

  const togglePlay = () => {
    if (!audioRef.current) return
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      if (activeSegment) {
        const startSec = parseTimeToSeconds(activeSegment.start_time)
        const endSec = parseTimeToSeconds(activeSegment.end_time)
        if (audio.currentTime >= endSec || audio.currentTime < startSec) {
          audio.currentTime = startSec
        }
      }
      audio.play().catch(() => { })
      setIsPlaying(true)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return
    if (activeSegment) {
      const startSec = parseTimeToSeconds(activeSegment.start_time)
      const endSec = parseTimeToSeconds(activeSegment.end_time)
      const target = Math.max(startSec, Math.min(endSec, audioRef.current.currentTime + seconds))
      audioRef.current.currentTime = target
      setCurrentTime(Math.floor(target - startSec))
    } else {
      const target = Math.max(0, Math.min(totalSeconds, audioRef.current.currentTime + seconds))
      audioRef.current.currentTime = target
      setCurrentTime(Math.floor(target))
    }
  }

  const handleSpeedSelect = (speed: string) => {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(speed)
    }
    onSpeedChange?.(speed)
  }

  // Simulated waveform bar heights
  const bars = [
    25, 45, 60, 30, 80, 95, 40, 75, 85, 50, 90, 65, 30, 70, 85, 40, 60, 100, 80,
    55, 35, 90, 75, 45, 60, 80, 50, 30, 65, 85, 40, 75, 90, 60, 45, 30, 70, 85,
  ]

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm">
      {/* Sub-header Tabs & Settings bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50 gap-3 rounded-t-2xl">
        {/* Left Tabs */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('dictation')}
            className={`pb-1 transition-colors relative cursor-pointer ${activeTab === 'dictation'
              ? 'text-[#1D4ED8] font-extrabold border-b-2 border-[#1D4ED8]'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Dictation
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-1 transition-colors relative cursor-pointer ${activeTab === 'transcript'
              ? 'text-[#1D4ED8] font-extrabold border-b-2 border-[#1D4ED8]'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Full transcript
          </button>
        </div>

        {/* Right Controls (Repeat toggle only - Vietnamese dropdown removed) */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="text-slate-600 font-bold text-xs">Repeat</span>
          <button
            onClick={() => setRepeatEnabled(!repeatEnabled)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${repeatEnabled ? 'bg-[#1D4ED8]' : 'bg-slate-300'
              }`}
            title={repeatEnabled ? 'Đang bật tự động lặp lại đoạn audio' : 'Nhấp để bật tự động lặp lại đoạn audio'}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${repeatEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Waveform Player Section */}
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-6">
          {/* Big Play Button */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-[#1D4ED8] hover:bg-blue-700 text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
          </button>

          {/* Waveform Visualization */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
            {/* Waveform Bars */}
            <div className="h-14 flex items-center gap-1 overflow-hidden px-1 bg-slate-50/80 rounded-xl border border-slate-100 p-2">
              {bars.map((h, i) => {
                const ratio = currentTime / (totalSeconds || 1)
                const isPlayed = i / bars.length < ratio
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all ${isPlayed ? 'bg-[#1D4ED8]' : 'bg-slate-300/80'
                      }`}
                    style={{ height: `${h}%` }}
                  />
                )
              })}
            </div>
          </div>

          {/* Speed Selector */}
          <div className="shrink-0 relative" ref={speedDropdownRef}>
            <button
              onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-200 cursor-pointer"
            >
              <span>{playbackSpeed}</span>
              <ChevronDown size={14} />
            </button>
            {showSpeedDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[100] py-1 min-w-[70px]">
                {['0.75x', '1.0x', '1.25x', '1.5x'].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      handleSpeedSelect(s)
                      if (audioRef.current) {
                        audioRef.current.playbackRate = parseFloat(s)
                      }
                      setShowSpeedDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-1 text-xs font-semibold hover:bg-blue-50 cursor-pointer ${playbackSpeed === s ? 'text-[#1D4ED8] font-bold' : 'text-slate-700'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Seek buttons */}
        <div className="flex justify-center items-center gap-6 pt-1 text-xs font-semibold text-slate-600">
          <button onClick={() => handleSkip(-5)} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
            <RotateCcw size={15} />
            <span>Back 5s</span>
          </button>
          <button onClick={() => handleSkip(5)} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
            <RotateCw size={15} />
            <span>Forward 5s</span>
          </button>
        </div>
      </div>

      {/* Interactive Transcript Panel khi activeTab === 'transcript' */}
      {activeTab === 'transcript' && (
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 space-y-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-950 text-sm">Interactive Transcript</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black tracking-wider uppercase">
              Bilingual
            </span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {interactiveTranscript.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No transcript available for this passage.</p>
            ) : (
              interactiveTranscript.map((line, idx) => (
                <div key={idx} className="p-3 bg-white border border-slate-200/90 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                    {line.start_time} - {line.end_time}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">{line.en}</p>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{line.vi}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default DictationAudioPlayer
