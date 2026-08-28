import React from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (info: { row: T; value: any }) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  hideable?: boolean;
}

export interface PaginationState {
  pageIndex: number; // 1-indexed
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface TableFilterOption {
  label: string;
  value: string;
}

export interface TableFilter {
  id: string;
  label: string;
  type: 'select' | 'date-range' | 'status';
  options?: TableFilterOption[];
  defaultValue?: string;
}
