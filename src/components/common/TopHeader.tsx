import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface TopHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  onMenuClick?: () => void
}

export const TopHeader: React.FC<TopHeaderProps> = ({ breadcrumbs, onMenuClick }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 font-['Be_Vietnam_Pro'] select-none w-full">
      {/* Left: Hamburger + omniEnglish Logo + (Optional Breadcrumbs) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white font-black text-xs shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
          <span className="font-black text-lg text-slate-900 tracking-tight">
            omni<span className="text-[#1D4ED8]">English</span>
          </span>
        </Link>

        {/* Optional Breadcrumbs Trail */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 overflow-x-auto py-1 ml-4 pl-4 border-l border-slate-200">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              const href = crumb.href || (idx < breadcrumbs.length - 1 ? '/vocabulary' : undefined)

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300 font-normal">›</span>}
                  {!isLast && href ? (
                    <Link
                      to={href}
                      className="text-slate-400 hover:text-[#1D4ED8] transition-colors uppercase tracking-wider text-[11px] font-extrabold hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="text-slate-400 hover:text-[#1D4ED8] transition-colors uppercase tracking-wider text-[11px] font-extrabold hover:underline"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={`uppercase tracking-wider text-[11px] ${
                        isLast ? 'text-slate-700 font-black' : 'text-slate-400'
                      }`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}
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

