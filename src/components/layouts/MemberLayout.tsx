import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavDrawer, MemberBottomNav } from './MobileNav';

export const MemberLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-sans pb-20 md:pb-0 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Nav Drawer */}
      <MobileNavDrawer />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 max-w-[1500px] w-full mx-auto space-y-4">
          {children}
        </main>
      </div>

      {/* Mobile-first bottom navigation bar for SACCO Members */}
      <MemberBottomNav />
    </div>
  );
};
