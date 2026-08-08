import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  className = '',
  disabled = false,
  id,
}) => {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; isUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    isUp: false,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const isUp = spaceBelow < 240 && rect.top > 240
      setCoords({
        top: isUp ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 160),
        isUp,
      })
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    function handleScrollOrResize() {
      if (open) {
        updateCoords()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open])

  const handleToggle = () => {
    if (disabled) return
    if (!open) {
      updateCoords()
    }
    setOpen((v) => !v)
  }

  const dropdownMenu = (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        top: coords.isUp ? 'auto' : `${coords.top}px`,
        bottom: coords.isUp ? `${window.innerHeight - coords.top}px` : 'auto',
      }}
      className="bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-[9999999] p-1.5 max-h-60 overflow-y-auto space-y-1 animate-in fade-in duration-150 font-['Be_Vietnam_Pro']"
    >
      {placeholder && placeholder !== '' && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            setOpen(false)
          }}
          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            value === '' ? 'bg-blue-50 text-[#1D4ED8]' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          {placeholder}
        </button>
      )}
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value)
              setOpen(false)
            }}
            className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-left shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled && ReactDOM.createPortal(dropdownMenu, document.body)}
    </div>
  )
}

export default CustomSelect
