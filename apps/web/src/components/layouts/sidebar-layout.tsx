import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { BaseLayout } from './base-layout';
import { useMobile } from '@/hooks/use-mobile';

export interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /**
   * Position of the sidebar
   */
  sidebarPosition?: 'left' | 'right';
  /**
   * Width of the sidebar
   */
  sidebarWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether sidebar should be collapsible on mobile
   */
  collapsible?: boolean;
  /**
   * Whether sidebar is collapsed (controlled)
   */
  collapsed?: boolean;
  /**
   * Callback when sidebar collapse state changes
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Maximum width for the layout
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  /**
   * Gap between sidebar and main content
   */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const sidebarWidthClasses = {
  sm: 'w-48',
  md: 'w-64',
  lg: 'w-80',
  xl: 'w-96',
};

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

export function SidebarLayout({
  children,
  sidebar,
  className,
  containerClassName,
  sidebarPosition = 'left',
  sidebarWidth = 'md',
  collapsible = true,
  collapsed,
  onCollapsedChange,
  maxWidth = '7xl',
  gap = 'lg',
}: SidebarLayoutProps) {
  const isMobile = useMobile();
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);

  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;

  const handleCollapsedChange = React.useCallback(
    (newCollapsed: boolean) => {
      if (onCollapsedChange) {
        onCollapsedChange(newCollapsed);
      } else {
        setInternalCollapsed(newCollapsed);
      }
    },
    [onCollapsedChange]
  );

  // Auto-collapse on mobile if collapsible
  React.useEffect(() => {
    if (collapsible && isMobile && !isCollapsed) {
      handleCollapsedChange(true);
    }
  }, [isMobile, collapsible, isCollapsed, handleCollapsedChange]);

  const sidebarContent = (
    <aside
      className={cn(
        'flex-shrink-0 transition-all duration-300 ease-in-out',
        sidebarWidthClasses[sidebarWidth],
        isCollapsed && 'w-0 overflow-hidden',
        isMobile &&
          'bg-background border-border absolute inset-y-0 z-30 border-r',
        isMobile &&
          sidebarPosition === 'right' &&
          'right-0 border-r-0 border-l',
        !isMobile && 'relative'
      )}
    >
      <div className="h-full overflow-y-auto">{sidebar}</div>
    </aside>
  );

  const mainContent = (
    <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={() => handleCollapsedChange(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCollapsedChange(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      <BaseLayout
        maxWidth={maxWidth}
        className={cn('relative', className)}
        containerClassName={containerClassName}
      >
        <div
          className={cn(
            'flex min-h-0',
            gapClasses[gap],
            sidebarPosition === 'right' && 'flex-row-reverse'
          )}
        >
          {sidebarPosition === 'left' && sidebarContent}
          {mainContent}
          {sidebarPosition === 'right' && sidebarContent}
        </div>
      </BaseLayout>
    </>
  );
}

/**
 * Hook to manage sidebar state
 */
export function useSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const isMobile = useMobile();

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const open = React.useCallback(() => {
    setCollapsed(false);
  }, []);

  const close = React.useCallback(() => {
    setCollapsed(true);
  }, []);

  // Auto-collapse on mobile
  React.useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  return {
    collapsed,
    toggle,
    open,
    close,
    isMobile,
  };
}
