import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavDrawer } from './MobileNav';

export const StaffLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-sans transition-colors duration-200">
      {/* Desktop Persistent / Collapsible Sidebar */}
      <Sidebar />

      {/* Mobile Drawer */}
      <MobileNavDrawer />

      {/* Main Execution Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
};
