import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Fixed Left */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
