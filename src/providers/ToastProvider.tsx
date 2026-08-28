import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types/ui';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div 
        id="toast-notifications-container"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D] shadow-lg shadow-emerald-950/5',
            error: 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C] shadow-lg shadow-rose-950/5',
            warning: 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309] shadow-lg shadow-amber-950/5',
            info: 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1] shadow-lg shadow-sky-950/5',
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />,
            info: <Info className="w-5 h-5 text-[#0EA5E9] flex-shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-lg border shadow-md transition-all duration-200 ${bgColors[toast.type]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{icons[toast.type]}</div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 p-1 -mr-1 -mt-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-400"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
