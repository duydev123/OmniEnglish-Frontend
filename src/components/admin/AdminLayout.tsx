import React, { useState } from 'react';
import { Search, Bell, HelpCircle, User as UserIcon } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { useUserStore } from '../../stores/user/useUserStore';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'content-cms',
  onSelectTab,
  searchQuery = '',
  onSearchChange,
}) => {
  const adminName = user?.username || 'Admin';
  const adminRole = 'System Admin';

  return (
    <div className="min-h-screen bg-slate-100/70 font-['Be_Vietnam_Pro'] flex text-slate-800">
      {/* Left Sidebar */}
      <AdminSidebar activeTab={activeTab} onSelectTab={onSelectTab} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          {/* Search Input */}
          <div className="flex-1 max-w-xl">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search logs, admins, or actions..."
                className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-800 text-xs sm:text-sm pl-10 pr-4 py-2 rounded-xl border border-slate-200/60 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all duration-200 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Right Controls: Notifications, Help & Profile */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Bell Icon */}
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white"></span>
            </button>

            {/* Help Icon */}
            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" aria-label="Help">
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-slate-200/80 mx-1"></div>

            {/* Admin Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-snug">{adminName}</p>
                <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">{adminRole}</p>
              </div>

              {/* User Avatar Circle */}
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 border border-blue-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Admin Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Child Content Container */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
