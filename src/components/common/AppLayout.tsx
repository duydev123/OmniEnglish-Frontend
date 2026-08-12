import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { BreadcrumbItem } from './TopHeader';

interface AppLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export function AppLayout({ breadcrumbs, children }: AppLayoutProps) {
  // Mở sidebar mặc định trên desktop (>=1024px), đóng trên mobile để tránh backdrop blur
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Be_Vietnam_Pro'] flex flex-col">
      {/* Full Width Top Header Bar */}
      <TopHeader 
        breadcrumbs={breadcrumbs} 
        onMenuClick={() => setSidebarOpen(prev => !prev)} 
      />
      
      <div className="flex-1 flex min-w-0 relative">
        {/* Sidebar below TopHeader */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 min-w-0 ${sidebarOpen ? 'lg:ml-60' : 'ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
