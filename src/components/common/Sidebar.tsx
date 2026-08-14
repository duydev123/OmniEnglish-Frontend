import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore, initialUser } from '../../stores/user/useUserStore'
import { clearLocalVocabCache } from '../../services/vocabularyApi'
import { useToast } from './Toast'
import { LogoutModal } from './LogoutModal'
import {
  House, BookOpen, FileText, Clock, User,
  ChevronDown, Zap, LogOut
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [basicOpen, setBasicOpen] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { user, setUser } = useUserStore()
  const { showToast } = useToast()

  const handleLogout = () => {
    localStorage.removeItem("token")
    clearLocalVocabCache()
    setUser(initialUser)
    showToast("Đã đăng xuất tài khoản!", "info")
    navigate("/login")
  }

  const isVocabActive = location.pathname.startsWith('/vocabulary')
  const isProfileActive = location.pathname.startsWith('/profile')
  const isHomeActive = location.pathname === '/'

  // Dynamic Weekly Goal calculation:
  // Fluency Push (45m/day) -> 45 * 7 = 315 mins/XP
  // Steady Growth (15m/day) -> 15 * 7 = 105 mins/XP
  const learningMode = user?.settings?.learning_mode || "Fluency Push"
  const dailyMinsTarget = learningMode === "Steady Growth" ? 15 : 45
  const weeklyGoalTarget = dailyMinsTarget * 7
  const weeklyXp = user?.stats?.weekly_xp ?? 0
  const weeklyXpPercent = Math.min(100, Math.round((weeklyXp / weeklyGoalTarget) * 100))

  const navContent = (
    <div className="flex flex-col h-full select-none justify-between">
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 text-sm font-semibold">
        {/* Home Link */}
        <button
          onClick={() => { navigate('/'); onClose?.() }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${
            isHomeActive
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <House size={18} />
          <span>Home</span>
        </button>

        {/* Basic Section (Collapsible) */}
        <div>
          <button
            onClick={() => setBasicOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <BookOpen size={18} />
              <span>Basic</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${basicOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {basicOpen && (
            <div className="ml-5 pl-3 border-l-2 border-slate-200/80 my-1 space-y-1">
              <button
                onClick={() => { navigate('/vocabulary'); onClose?.() }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
                  isVocabActive
                    ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BookOpen size={16} />
                <span>Vocabulary</span>
              </button>

              <button
                onClick={() => { navigate('/practice-modules/writing'); onClose?.() }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all cursor-pointer text-xs font-semibold"
              >
                <FileText size={16} />
                <span>Grammar</span>
              </button>
            </div>
          )}
        </div>

        {/* Practice Module */}
        <button
          onClick={() => { navigate('/practice-modules'); onClose?.() }}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            location.pathname.startsWith('/practice') ||
            location.pathname.startsWith('/listening') ||
            location.pathname.startsWith('/reading')
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-extrabold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock size={18} />
          <span>Practice Module</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => { navigate('/profile'); onClose?.() }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${
            isProfileActive
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User size={18} />
          <span>Profile</span>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold transition-all cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Footer: Goal Progress & Upgrade */}
      <div className="p-4 border-t border-slate-200/80 space-y-3 bg-white shrink-0">
        <div className="bg-blue-50/70 border border-blue-100/80 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span className="text-blue-600">Weekly Goal</span>
            <span className="font-extrabold text-blue-700">{weeklyXpPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
              style={{ width: `${weeklyXpPercent}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 text-right">
            {weeklyXp}/{weeklyGoalTarget} XP ({dailyMinsTarget * 7}m)
          </p>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1D4ED8] hover:bg-blue-800
            text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Zap size={15} className="fill-white" />
          <span>Upgrade</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] bg-white border-r border-slate-200/80
          transition-all duration-300 ${
            isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:border-r-0 overflow-hidden'
          }`}
      >
        <div className="w-64 h-full shrink-0">
          {navContent}
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  )
}

export default Sidebar
