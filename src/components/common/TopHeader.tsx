import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, GraduationCap } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface TopHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  onMenuClick?: () => void
}

export const TopHeader: React.FC<TopHeaderProps> = ({ breadcrumbs }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 sticky top-0 z-40 flex items-center justify-between px-2.5 sm:px-6 font-['Be_Vietnam_Pro'] select-none w-full">
      {/* Left: omniEnglish Logo (Hero style) */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Logo (Hero style) */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer select-none hover:opacity-90 transition">
          <div className="bg-[#1e50e6] rounded-lg p-1.5 flex items-center justify-center shadow-xs">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#1e50e6] tracking-tight">OmniEnglish</span>
        </Link>
      </div>

      {/* Right: Notifications Bell & User Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Thông báo"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-extrabold shadow-xs overflow-hidden cursor-pointer ring-2 ring-blue-500/20" title="Hồ sơ cá nhân">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  )
}

export default TopHeader

