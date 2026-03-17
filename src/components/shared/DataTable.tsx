import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc';

interface SortState {
  key: string;
  direction: SortDirection;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sort]);

  const renderSortIcon = (columnKey: string) => {
    if (sort?.key !== columnKey) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
    }
    return sort.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-[#f89020]" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-[#f89020]" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                  column.sortable
                    ? 'cursor-pointer select-none hover:text-[#0a1f44]'
                    : ''
                }`}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1.5">
                  <span>{column.header}</span>
                  {column.sortable && renderSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-100 ${
                  rowIndex % 2 === 1 ? 'bg-gray-50/50' : ''
                } ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-[#f89020]/5'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-[#0a1f44]"
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
