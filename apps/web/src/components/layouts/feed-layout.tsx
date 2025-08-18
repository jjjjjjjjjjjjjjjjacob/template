import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { BaseLayout } from './base-layout';
import { useResponsive } from '@/hooks/use-responsive';

export interface FeedLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /**
   * Layout type for the feed
   * - 'masonry': Dynamic masonry layout with variable heights
   * - 'grid': Fixed grid layout with equal heights
   * - 'list': Single column list layout
   */
  variant?: 'masonry' | 'grid' | 'list';
  /**
   * Number of columns for grid layouts
   */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /**
   * Gap between items
   */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to show a sidebar
   */
  sidebar?: React.ReactNode;
  /**
   * Sidebar position
   */
  sidebarPosition?: 'left' | 'right';
  /**
   * Header content above the feed
   */
  header?: React.ReactNode;
  /**
   * Footer content below the feed
   */
  footer?: React.ReactNode;
  /**
   * Maximum width for the layout
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const getColumnClasses = (columns: number) => {
  const colMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  return colMap[columns] || 'grid-cols-1';
};

export function FeedLayout({
  children,
  className,
  containerClassName,
  variant = 'grid',
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  sidebar,
  sidebarPosition = 'right',
  header,
  footer,
  maxWidth = '7xl',
}: FeedLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Determine current column count based on screen size
  const currentColumns = React.useMemo(() => {
    if (isMobile) return columns.mobile || 1;
    if (isTablet) return columns.tablet || 2;
    if (isDesktop) return columns.desktop || 3;
    return 3;
  }, [isMobile, isTablet, isDesktop, columns]);

  const feedClasses = React.useMemo(() => {
    const baseClasses = cn(gapClasses[gap]);

    switch (variant) {
      case 'masonry':
        // CSS columns for masonry layout
        return cn(
          baseClasses,
          'columns-1 md:columns-2 lg:columns-3 xl:columns-4',
          '[&>*]:break-inside-avoid [&>*]:mb-4'
        );
      case 'grid':
        return cn(
          'grid',
          baseClasses,
          getColumnClasses(currentColumns),
          `sm:${getColumnClasses(columns.mobile || 1)}`,
          `md:${getColumnClasses(columns.tablet || 2)}`,
          `lg:${getColumnClasses(columns.desktop || 3)}`
        );
      case 'list':
        return cn('flex flex-col', gapClasses[gap]);
      default:
        return baseClasses;
    }
  }, [variant, gap, currentColumns, columns]);

  const mainContent = (
    <div className="min-w-0 flex-1">
      {header && <div className="mb-6">{header}</div>}

      <div className={feedClasses}>{children}</div>

      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );

  const sidebarContent = sidebar && (
    <aside className={cn('w-64 flex-shrink-0', isMobile && 'mb-6 w-full')}>
      {sidebar}
    </aside>
  );

  return (
    <BaseLayout
      maxWidth={maxWidth}
      className={cn('bg-background', className)}
      containerClassName={containerClassName}
    >
      <div
        className={cn(
          'flex gap-8',
          isMobile && 'flex-col gap-4',
          sidebarPosition === 'left' && 'flex-row-reverse'
        )}
      >
        {sidebarPosition === 'left' && sidebarContent}
        {mainContent}
        {sidebarPosition === 'right' && sidebarContent}
      </div>
    </BaseLayout>
  );
}

/**
 * Feed item component for consistent spacing and styling
 */
export interface FeedItemProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether the item should have a border
   */
  bordered?: boolean;
  /**
   * Whether the item should have a background
   */
  background?: boolean;
  /**
   * Padding size for the item
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Border radius for the item
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingItemClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

export function FeedItem({
  children,
  className,
  bordered = false,
  background = false,
  padding = 'md',
  rounded = 'lg',
}: FeedItemProps) {
  return (
    <div
      className={cn(
        'transition-all duration-200',
        bordered && 'border-border border',
        background && 'bg-card',
        paddingItemClasses[padding],
        roundedClasses[rounded],
        'hover:shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
