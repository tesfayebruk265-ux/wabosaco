import React from 'react';
import { ConfirmDialogProps } from '../../types/ui';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const icons = {
    destructive: <AlertCircle className="w-6 h-6 text-[#EF4444]" />,
    warning: <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />,
    primary: <HelpCircle className="w-6 h-6 text-[#16A34A]" />,
  };

  const bgIcons = {
    destructive: 'bg-rose-50 dark:bg-rose-950/50',
    warning: 'bg-amber-50 dark:bg-amber-950/50',
    primary: 'bg-[#F0FDF4] dark:bg-emerald-950/50',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={!isLoading}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${bgIcons[variant]} [&>svg]:w-8 [&>svg]:h-8`}>
          {icons[variant]}
        </div>
        <h3 className="text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-snug">{title}</h3>
        <div className="text-[16px] text-[#475569] dark:text-slate-300 mt-3 leading-relaxed max-w-md">{message}</div>

        <div className="flex items-center gap-4 mt-8 w-full">
          <Button
            variant="secondary"
            className="flex-1 min-h-[52px] text-[18px]"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            className="flex-1 min-h-[52px] text-[18px]"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
