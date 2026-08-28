import React, { useState, useMemo } from 'react';
import { ColumnDef, SortDirection } from '../../types/table';
export type { ColumnDef, SortDirection };
import { SearchInput } from '../common/SearchInput';
import { PaginationControls } from './PaginationControls';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchableKey?: keyof T | ((item: T) => string);
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  initialPageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchableKey,
  filters,
  actions,
  initialPageSize = 15,
  emptyTitle,
  emptyDescription,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const q = searchQuery.toLowerCase().trim();
    return data.filter((item) => {
      if (searchableKey) {
        if (typeof searchableKey === 'function') {
          return searchableKey(item).toLowerCase().includes(q);
        }
        return String(item[searchableKey] || '').toLowerCase().includes(q);
      }

      // Default: check all string/number fields
      return Object.values(item).some((val) =>
        String(val || '').toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, searchableKey]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination calculation
  const totalRecords = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (columnId: string) => {
    if (sortKey !== columnId) {
      setSortKey(columnId);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  return (
    <div
      className={cn(
        'w-full bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-slate-700/80 rounded-xl overflow-hidden shadow-2xs',
        className
      )}
    >
      {/* Table Control Header (Search, Filters, Actions) */}
      {(searchPlaceholder || filters || actions) && (
        <div className="p-3 sm:p-3.5 border-b border-[#E5E7EB] dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 flex-wrap">
            {searchPlaceholder && (
              <div className="w-full sm:w-72">
                <SearchInput
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  size="sm"
                />
              </div>
            )}
            {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
          </div>
          {actions && <div className="flex items-center gap-2 self-end md:self-auto">{actions}</div>}
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-[44px] border-b border-[#E5E7EB] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/90 sticky top-0 z-10">
              {columns.map((col) => {
                const isSorted = sortKey === (col.accessorKey as string || col.id);
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.id}
                    scope="col"
                    style={{ width: col.width, minWidth: col.minWidth }}
                    className={cn(
                      'px-3.5 py-2 text-[11.5px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider select-none',
                      alignClass,
                      col.sortable ? 'cursor-pointer hover:text-[#2E7D32] dark:hover:text-emerald-400 hover:bg-[#E8F5E9]/60 dark:hover:bg-slate-700/60 transition-colors' : ''
                    )}
                    onClick={() => col.sortable && handleSort(col.accessorKey as string || col.id)}
                  >
                    <div className={cn('inline-flex items-center gap-1', col.align === 'right' ? 'justify-end w-full' : '')}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-[#2E7D32]" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-[#2E7D32]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-700/80 text-[13px]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="animate-pulse h-[48px]">
                  {columns.map((col) => (
                    <td key={`skel-col-${col.id}`} className="px-3.5 py-2.5">
                      <Skeleton height="16px" width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            ) : currentRecords.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState
                    title={emptyTitle || (searchQuery ? 'No matching records' : 'No records found')}
                    description={
                      emptyDescription ||
                      (searchQuery
                        ? `No results matched your search "${searchQuery}". Check for typos or reset filters.`
                        : 'No entries currently exist in this ledger or record set.')
                    }
                  />
                </td>
              </tr>
            ) : (
              currentRecords.map((row, idx) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors h-[48px]',
                    idx % 2 === 1 ? 'bg-[#F8FAFC]/40 dark:bg-slate-800/20' : 'bg-white dark:bg-[#1E293B]',
                    'hover:bg-[#E8F5E9]/50 dark:hover:bg-slate-800/70',
                    onRowClick ? 'cursor-pointer' : ''
                  )}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right font-semibold tabular-nums'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    const rawVal = col.accessorKey ? row[col.accessorKey] : undefined;

                    return (
                      <td key={col.id} className={cn('px-3.5 py-2 text-[#111827] dark:text-slate-200 leading-normal', alignClass)}>
                        {col.cell ? col.cell({ row, value: rawVal }) : String(rawVal ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalRecords > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
