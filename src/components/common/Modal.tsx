import React, { useEffect } from 'react';
import { ModalProps } from '../../types/ui';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}) => {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-[#1E293B] rounded-[20px] shadow-xl border border-[#E5E7EB] dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] z-10 transition-all duration-200 transform',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-8 py-6 border-b border-[#E5E7EB] dark:border-slate-700/80 bg-[#F8FAFC]/80 dark:bg-slate-800/50 shrink-0">
            <div>
              {title && typeof title === 'string' ? (
                <h3 className="text-[20px] font-semibold text-[#111827] dark:text-white tracking-tight leading-snug">{title}</h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="px-8 py-6 overflow-y-auto flex-1 text-[15px] text-[#111827] dark:text-slate-200">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-4 border-t border-[#E5E7EB] dark:border-slate-700/80 bg-[#F8FAFC]/80 dark:bg-slate-800/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
