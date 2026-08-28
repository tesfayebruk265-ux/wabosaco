import React, { createContext, useContext, useState, useEffect } from 'react';
import { BreadcrumbItem } from '../types/navigation';
import { ROUTES } from '../constants/routes';
import { useAuth } from './AuthProvider';

interface NavigationContextType {
  currentPath: string;
  navigate: (path: string) => void;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isStaff } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Preserve initial public path or default strictly to Public Home
    const path = window.location.pathname;
    if (path && path !== '' && path !== '/') {
      return path;
    }
    return ROUTES.PUBLIC.HOME;
  });
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const navigate = (path: string) => {
    setCurrentPath(path);
    setIsMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        navigate,
        breadcrumbs,
        setBreadcrumbs,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileDrawerOpen,
        setIsMobileDrawerOpen,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
