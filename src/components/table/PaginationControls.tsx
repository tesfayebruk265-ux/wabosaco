import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../common/Button';

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalRecords);
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2.5 px-3.5 bg-white dark:bg-[#1E293B] border-t border-[#E5E7EB] dark:border-slate-700/80 text-[12.5px] text-[#6B7280] dark:text-slate-400 select-none">
      {/* Records info */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span>
          Showing <strong className="text-[#111827] dark:text-white font-semibold">{totalRecords > 0 ? startRecord : 0}</strong> to{' '}
          <strong className="text-[#111827] dark:text-white font-semibold">{endRecord}</strong> of{' '}
          <strong className="text-[#111827] dark:text-white font-semibold">{totalRecords}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span className="text-[11.5px] font-medium text-[#6B7280]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-md px-2 py-0.5 text-[12px] font-semibold text-[#111827] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2E7D32] cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          className="px-2 py-1 min-h-[30px] min-w-[30px]"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="px-2 py-1 min-h-[30px] min-w-[30px]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        <span className="px-2.5 py-0.5 font-semibold text-[12px] text-[#111827] dark:text-white">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="px-2 py-1 min-h-[30px] min-w-[30px]"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          className="px-2 py-1 min-h-[30px] min-w-[30px]"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
