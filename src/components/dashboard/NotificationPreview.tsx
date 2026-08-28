import React from 'react';
import { Bell, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
  isRead: boolean;
}

export interface NotificationPreviewProps {
  notifications: NotificationItem[];
  onMarkRead?: (id: string | number) => void;
  onViewAll?: () => void;
  className?: string;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({
  notifications,
  onViewAll,
  className,
}) => {
  const iconMap = {
    info: <Info className="w-4 h-4 text-[#2563EB]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
    success: <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />,
  };

  return (
    <div className={cn('flex flex-col bg-white dark:bg-[#1E293B] rounded-[18px] border border-[#E5E7EB] dark:border-slate-700 p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.03),0_1px_2px_-1px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)]', className)}>
      <div className="flex items-center justify-between pb-5 border-b border-[#E5E7EB] dark:border-slate-700/80 mb-4">
        <div className="flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-[#2E7D32]" />
          <h4 className="text-[18px] font-semibold text-[#111827] dark:text-white tracking-tight">Broadcasts & Alerts</h4>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[14px] text-[#2E7D32] dark:text-emerald-400 hover:text-[#1B5E20] font-semibold cursor-pointer transition-colors"
          >
            All Messages
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center text-[14px] text-[#6B7280] dark:text-slate-400">No new notices</div>
      ) : (
        <div className="divide-y divide-[#E5E7EB] dark:divide-slate-700/80">
          {notifications.slice(0, 3).map((notif) => (
            <div key={notif.id} className="py-3.5 flex items-start gap-3">
              <div className="mt-0.5">{iconMap[notif.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-[14px] font-semibold text-[#111827] dark:text-white truncate">{notif.title}</h5>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32] flex-shrink-0 animate-pulse" />
                  )}
                </div>
                <p className="text-[13px] text-[#6B7280] dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                <span className="text-[11px] text-[#6B7280]/80 dark:text-slate-400 mt-1 block font-medium">
                  {formatDateTime(notif.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
