import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUserStore, initialUser } from '../../stores/user/useUserStore'
import { clearLocalVocabCache } from '../../services/vocabularyApi'
import { useToast } from './Toast'
import { LogoutModal } from './LogoutModal'
import {
  House, BookOpen, FileText, Clock, User,
  ChevronDown, LogOut, Users as UsersIcon, ShieldCheck
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [adminOpen, setAdminOpen] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { user, setUser } = useUserStore()
  const isAdmin = user?.role?.toLowerCase() === 'admin'
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

  const navContent = (
    <div className="flex flex-col h-full select-none justify-between">
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 text-sm font-semibold">
        {/* Home Link */}
        <button
          onClick={() => { navigate('/'); onClose?.() }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${isHomeActive
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <House size={18} />
          <span>Home</span>
        </button>

        {/* Vocabulary Link */}
        <button
          onClick={() => { navigate('/vocabulary'); onClose?.() }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${isVocabActive
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <BookOpen size={18} />
          <span>Vocabulary</span>
        </button>

        {/* Practice Module */}
        <button
          onClick={() => { navigate('/practice-modules'); onClose?.() }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${location.pathname.startsWith('/practice') ||
              location.pathname.startsWith('/listening') ||
              location.pathname.startsWith('/reading') ||
              location.pathname.startsWith('/writing') ||
              location.pathname.startsWith('/speaking')
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Clock size={18} />
          <span>Practice Module</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => { navigate('/profile'); onClose?.() }}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer ${isProfileActive
              ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <User size={18} />
          <span>Profile</span>
        </button>

        {/* Admin Section (Collapsible - Only visible to Admin role) */}
        {isAdmin && (
          <div>
            <button
              onClick={() => setAdminOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer font-bold"
            >
              <div className="flex items-center gap-3.5">
                <ShieldCheck size={18} className="text-[#1D4ED8]" />
                <span>Admin</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {adminOpen && (
              <div className="ml-5 pl-3 border-l-2 border-slate-200/80 my-1 space-y-1">
                <button
                  onClick={() => { navigate('/admin/content-cms'); onClose?.() }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold ${location.pathname === '/admin' || location.pathname.startsWith('/admin/content-cms')
                      ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <FileText size={16} />
                  <span>Content</span>
                </button>

                <button
                  onClick={() => { navigate('/admin/users'); onClose?.() }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-xs font-semibold ${location.pathname.startsWith('/admin/users')
                      ? 'bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <UsersIcon size={16} />
                  <span>Users</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold transition-all cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside
        className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] bg-white border-r border-slate-200/80
          transition-all duration-300 ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:border-r-0 overflow-hidden'
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
