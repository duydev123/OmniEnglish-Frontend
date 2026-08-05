import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  House, BookOpen, FileText, Clock, Monitor, User,
  ChevronDown, Zap
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [basicOpen, setBasicOpen] = useState(true)

  const isVocabActive = location.pathname.startsWith('/vocabulary')
  const isHomeActive = location.pathname === '/'

  const navContent = (
    <div className="flex flex-col h-full select-none justify-between">
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 text-xs font-bold">
        {/* Home Link */}
        <button
          onClick={() => { navigate('/'); onClose?.() }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            isHomeActive
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-extrabold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <House size={16} />
          <span>Home</span>
        </button>

        {/* Basic Section (Collapsible) */}
        <div>
          <button
            onClick={() => setBasicOpen(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={16} />
              <span>Basic</span>
            </div>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${basicOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {basicOpen && (
            <div className="ml-4 pl-3 border-l-2 border-slate-200/80 my-1 space-y-1">
              <button
                onClick={() => { navigate('/vocabulary'); onClose?.() }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all ${
                  isVocabActive
                    ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BookOpen size={15} />
                <span>Vocabulary</span>
              </button>

              <button
                onClick={() => onClose?.()}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all"
              >
                <FileText size={15} />
                <span>Grammar</span>
              </button>
            </div>
          )}
        </div>

        {/* Practice Module */}
        <button
          onClick={() => onClose?.()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all"
        >
          <Clock size={16} />
          <span>Practice Module</span>
        </button>

        {/* Computer-based Tests */}
        <button
          onClick={() => onClose?.()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all"
        >
          <Monitor size={16} />
          <span>Computer-based Tests</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onClose?.()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all"
        >
          <User size={16} />
          <span>Profile</span>
        </button>
      </div>

      {/* Footer: Goal Progress & Upgrade */}
      <div className="p-3 border-t border-slate-200/80 space-y-2.5 bg-white shrink-0">
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
            <span className="text-blue-600">Weekly Goal</span>
            <span className="font-extrabold text-blue-700">85%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
            <div className="h-full bg-[#1D4ED8] rounded-full w-[85%]" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 text-right">420/500 XP</p>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1D4ED8] hover:bg-blue-800
            text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Zap size={14} className="fill-white" />
          <span>Upgrade</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-14 left-0 bottom-0 z-30 w-60 bg-white border-r border-slate-200/80
          transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {navContent}
      </aside>
    </>
  )
}

export default Sidebar

