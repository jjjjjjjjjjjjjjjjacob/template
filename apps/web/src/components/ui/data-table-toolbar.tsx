import * as React from 'react';
import { type Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Settings2, Search, X } from 'lucide-react';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  // Global search
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  globalFilterPlaceholder?: string;
  // Export functionality
  onExport?: (selectedRows: TData[]) => void;
  exportFormats?: string[];
  // Bulk actions
  bulkActions?: {
    label: string;
    action: (selectedRows: TData[]) => void;
    variant?:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link';
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  // Additional filters
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  globalFilterPlaceholder = 'search all columns...',
  onExport,
  exportFormats = ['csv', 'json'],
  bulkActions = [],
  children,
  className,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);
  const hasSelection = selectedRows.length > 0;
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter;

  const handleExport = () => {
    if (onExport) {
      onExport(
        hasSelection
          ? selectedRows
          : table.getFilteredRowModel().rows.map((row) => row.original)
      );
    }
  };

  const resetFilters = () => {
    table.resetColumnFilters();
    if (onGlobalFilterChange) {
      onGlobalFilterChange('');
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 ${className || ''}`}
    >
      <div className="flex flex-1 items-center gap-2">
        {/* Global search */}
        {onGlobalFilterChange && (
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={globalFilterPlaceholder}
              value={globalFilter || ''}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Additional filters */}
        {children}

        {/* Reset filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="h-8 px-2 lg:px-3"
          >
            reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto hidden lg:flex"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {/* Bulk actions */}
        {hasSelection && bulkActions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {selectedRows.length} selected
            </span>
            {bulkActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant ?? 'outline'}
                  size="sm"
                  onClick={() => action.action(selectedRows)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Export */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {exportFormats.map((format) => (
                <DropdownMenuCheckboxItem
                  key={format}
                  onSelect={() => handleExport()}
                >
                  export as {format.toUpperCase()}
                  {hasSelection && ` (${selectedRows.length} rows)`}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
