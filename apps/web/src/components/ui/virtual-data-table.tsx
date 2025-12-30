import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Settings2,
  Search,
} from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';

interface VirtualDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // Pagination props
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  // Server-side mode
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  // Virtualization config
  enableVirtualization?: boolean;
  virtualThreshold?: number;
  estimateSize?: number;
  // Sorting
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  // Filtering
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  // Selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  enableRowSelection?: boolean;
  // Export
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
  }[];
  // Styling
  className?: string;
  tableClassName?: string;
  enableBorders?: boolean;
  // Loading state
  loading?: boolean;
  // Accessibility
  'aria-label'?: string;
}

export function VirtualDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination: controlledPagination,
  onPaginationChange,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
  enableVirtualization = true,
  virtualThreshold = 100,
  estimateSize = 50,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  enableRowSelection = false,
  onExport,
  exportFormats = ['csv', 'json'],
  bulkActions = [],
  className,
  tableClassName,
  enableBorders = true,
  loading = false,
  'aria-label': ariaLabel = 'data table',
}: VirtualDataTableProps<TData, TValue>) {
  // Internal state for uncontrolled mode
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    []
  );
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('');
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 50,
    });
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Use controlled or internal state
  const sorting = controlledSorting ?? internalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;
  const globalFilter = controlledGlobalFilter ?? internalGlobalFilter;
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const pagination = controlledPagination ?? internalPagination;

  // Create selection column if enabled
  const columnsWithSelection = React.useMemo(() => {
    if (!enableRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`select row ${row.index + 1}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    };

    return [selectionColumn, ...columns];
  }, [columns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    onSortingChange: onSortingChange ?? setInternalSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalGlobalFilter,
    onRowSelectionChange: onRowSelectionChange ?? setInternalRowSelection,
    onPaginationChange: onPaginationChange ?? setInternalPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      pagination,
      columnVisibility,
    },
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount: pageCount ?? -1,
  });

  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  // Only virtualize if enabled and data exceeds threshold
  const shouldVirtualize =
    enableVirtualization && data.length > virtualThreshold;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan: 10,
    enabled: shouldVirtualize,
  });

  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);
  const hasSelection = selectedRows.length > 0;

  const handleExport = () => {
    if (onExport) {
      onExport(hasSelection ? selectedRows : data);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Global search */}
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="search all columns..."
              value={globalFilter}
              onChange={(e) =>
                onGlobalFilterChange
                  ? onGlobalFilterChange(e.target.value)
                  : setInternalGlobalFilter(e.target.value)
              }
              className="pl-9"
            />
          </div>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
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
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant ?? 'outline'}
                  size="sm"
                  onClick={() => action.action(selectedRows)}
                >
                  {action.label}
                </Button>
              ))}
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
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div
          ref={tableContainerRef}
          className={cn(
            'relative overflow-auto',
            shouldVirtualize && 'h-[600px]'
          )}
          aria-label={ariaLabel}
          role="table"
        >
          <table
            className={cn('w-full caption-bottom text-sm', tableClassName)}
          >
            <thead className="bg-muted/50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className={enableBorders ? 'border-b' : ''}
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'text-muted-foreground h-10 px-4 text-left align-middle font-light',
                        enableBorders &&
                          'border-r-muted border-r last:border-r-0',
                        header.column.getCanSort() &&
                          'hover:bg-muted/80 cursor-pointer select-none'
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            {header.column.getIsSorted() === 'asc' && (
                              <ArrowUp className="h-3 w-3" />
                            )}
                            {header.column.getIsSorted() === 'desc' && (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {!header.column.getIsSorted() && (
                              <ArrowUpDown className="h-3 w-3 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {shouldVirtualize ? (
                // Virtualized rows
                <>
                  <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    <td />
                  </tr>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
                          enableBorders ? 'border-b' : '',
                          row.getIsSelected() && 'bg-muted'
                        )}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                        }}
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              'p-4 align-middle',
                              enableBorders &&
                                'border-r-muted border-r last:border-r-0'
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </>
              ) : (
                // Regular rows
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
                      enableBorders ? 'border-b' : '',
                      row.getIsSelected() && 'bg-muted'
                    )}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'p-4 align-middle',
                          enableBorders &&
                            'border-r-muted border-r last:border-r-0'
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="border-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
                      <span className="ml-2">loading...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center"
                  >
                    no results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-light">rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-light">
            page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {enableRowSelection && (
            <div className="text-muted-foreground text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
