import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, FileText, Settings, ArrowLeft } from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab = 'content-cms', onSelectTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'analytics', label: 'Analytics', icon: LayoutGrid },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content-cms', label: 'Content CMS', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentTab = activeTab || (location.pathname.includes('settings') ? 'settings' : 'content-cms');

  return (
    <aside className="w-64 bg-slate-50/80 border-r border-slate-200/80 min-h-screen flex flex-col justify-between font-['Be_Vietnam_Pro'] select-none p-5 shrink-0">
      <div className="space-y-8">
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#1e50e6] tracking-tight">OmniEnglish</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Admin Suite</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectTab) onSelectTab(item.id);
                  if (item.id === 'content-cms') navigate('/admin');
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm cursor-pointer ${
                  isActive
                    ? 'bg-slate-200/80 text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-slate-900' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Exit Admin link */}
      <div className="pt-4 border-t border-slate-200/80">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Về trang người dùng</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
