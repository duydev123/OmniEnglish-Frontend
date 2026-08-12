// TopHeader.tsx - Đã sửa

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, GraduationCap } from 'lucide-react';
import { useUserStore } from '../../stores/user/useUserStore';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface TopHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ breadcrumbs = [], onMenuClick }) => {
  const { user } = useUserStore();
  const username = user?.username || 'User';
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1D4ED8&color=fff&size=128`;
  const avatarUrl = user?.avatar || user?.avarta || defaultAvatar;

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 sticky top-0 z-40 flex items-center justify-between px-2.5 sm:px-6 font-['Be_Vietnam_Pro'] select-none w-full">
      {/* Left: omniEnglish Logo (Hero style) */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#1e50e6] tracking-tight">OmniEnglish</span>
        </Link>
        
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-2 border-l border-slate-200 pl-3">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <Link to={b.href} className="hover:text-blue-600 font-bold transition">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-600 font-bold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      {/* Right: Notifications Bell & User Avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Thông báo"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-extrabold shadow-xs overflow-hidden cursor-pointer ring-2 ring-blue-500/20"
          title="Hồ sơ cá nhân"
        >
          <img
            src={avatarUrl}
            alt={`${username} Avatar`}
            className="w-full h-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
};

export default TopHeader;