import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { BreadcrumbItem } from './TopHeader';
import { useUserStore, initialUser } from '../../stores/user/useUserStore';
import { userApi } from '../../services/userApi';

interface AppLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export function AppLayout({ breadcrumbs, children }: AppLayoutProps) {
  // Mở sidebar mặc định trên desktop (>=1024px), đóng trên mobile để tránh backdrop blur
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  useEffect(() => {
    const verifyUserAuthData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(initialUser);
        navigate('/login');
        return;
      }
      try {
        const data = await userApi.getUserProfile();
        if (data && data.username && data.id) {
          setUser(data);
        } else {
          localStorage.removeItem('token');
          setUser(initialUser);
          navigate('/login');
        }
      } catch (err) {
        console.warn('Authentication data missing or invalid token. Auto logging out:', err);
        localStorage.removeItem('token');
        setUser(initialUser);
        navigate('/login');
      }
    };
    verifyUserAuthData();
  }, [navigate, setUser]);

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
        <main className="flex-1 transition-all duration-300 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
