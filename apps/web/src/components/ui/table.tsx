import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    variant?: 'default' | 'striped' | 'bordered';
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        'w-full caption-bottom text-sm',
        variant === 'striped' && '[&_tbody_tr:nth-child(odd)]:bg-muted/50',
        variant === 'bordered' && 'border-border border',
        className
      )}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    sticky?: boolean;
  }
>(({ className, sticky = false, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      '[&_tr]:border-b',
      sticky &&
        'bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 backdrop-blur',
      className
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'bg-muted/50 border-t font-light [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    variant?: 'default' | 'selected' | 'hover';
    clickable?: boolean;
  }
>(({ className, variant = 'default', clickable = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'data-[state=selected]:bg-muted border-b transition-colors',
      variant === 'hover' && 'hover:bg-muted/50',
      variant === 'selected' && 'bg-muted',
      clickable && 'hover:bg-muted/50 cursor-pointer',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean;
    sorted?: 'asc' | 'desc' | false;
    align?: 'left' | 'center' | 'right';
  }
>(({ className, sortable = false, align = 'left', ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'text-muted-foreground h-12 px-4 font-light [&:has([role=checkbox])]:pr-0',
      align === 'left' && 'text-left',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      sortable && 'hover:text-foreground cursor-pointer select-none',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    align?: 'left' | 'center' | 'right';
    variant?: 'default' | 'numeric' | 'action';
  }
>(({ className, align = 'left', variant = 'default', ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 [&:has([role=checkbox])]:pr-0',
      align === 'left' && 'text-left',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      variant === 'numeric' && 'text-right font-mono',
      variant === 'action' && 'w-[100px]',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('text-muted-foreground mt-4 text-sm', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// Compound components for common patterns
const TableEmpty = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    colSpan?: number;
    message?: string;
    icon?: React.ReactNode;
  }
>(
  (
    {
      className,
      colSpan,
      message = 'no data available',
      icon,
      align,
      ...props
    },
    ref
  ) => (
    <TableRow>
      <TableCell
        ref={ref}
        colSpan={colSpan}
        align={align as 'left' | 'center' | 'right'}
        className={cn('h-24 text-center', className)}
        {...props}
      >
        <div className="text-muted-foreground flex flex-col items-center justify-center space-y-2">
          {icon}
          <span>{message}</span>
        </div>
      </TableCell>
    </TableRow>
  )
);
TableEmpty.displayName = 'TableEmpty';

const TableLoading = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    colSpan?: number;
    message?: string;
  }
>(({ className, colSpan, message = 'loading...', align, ...props }, ref) => (
  <TableRow>
    <TableCell
      ref={ref}
      colSpan={colSpan}
      align={align as 'left' | 'center' | 'right'}
      className={cn('h-24 text-center', className)}
      {...props}
    >
      <div className="flex items-center justify-center space-x-2">
        <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
        <span className="text-muted-foreground">{message}</span>
      </div>
    </TableCell>
  </TableRow>
));
TableLoading.displayName = 'TableLoading';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
  TableLoading,
};
