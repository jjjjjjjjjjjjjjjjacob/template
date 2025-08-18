import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { BaseLayout } from './base-layout';

export interface ContentLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /**
   * Header content
   */
  header?: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Whether to add spacing between sections
   */
  spaced?: boolean;
  /**
   * Size of spacing between sections
   */
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Maximum width for content
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  /**
   * Whether to center the content vertically
   */
  centered?: boolean;
}

const spacingClasses = {
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
  xl: 'space-y-12',
};

export function ContentLayout({
  children,
  className,
  containerClassName,
  header,
  footer,
  spaced = true,
  spacing = 'lg',
  maxWidth = '4xl',
  centered = false,
}: ContentLayoutProps) {
  return (
    <BaseLayout
      maxWidth={maxWidth}
      className={cn(centered && 'flex items-center justify-center', className)}
      containerClassName={containerClassName}
    >
      <div
        className={cn(
          'w-full',
          spaced && spacingClasses[spacing],
          centered && 'text-center'
        )}
      >
        {header && <header>{header}</header>}

        <main>{children}</main>

        {footer && <footer>{footer}</footer>}
      </div>
    </BaseLayout>
  );
}

/**
 * Content section component for consistent spacing
 */
export interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Title for the section
   */
  title?: React.ReactNode;
  /**
   * Description for the section
   */
  description?: React.ReactNode;
  /**
   * Whether to add a divider after the section
   */
  divider?: boolean;
  /**
   * Padding size for the section
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const sectionPaddingClasses = {
  none: '',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8',
  xl: 'py-12',
};

export function ContentSection({
  children,
  className,
  title,
  description,
  divider = false,
  padding = 'lg',
}: ContentSectionProps) {
  return (
    <section
      className={cn(
        sectionPaddingClasses[padding],
        divider && 'border-border mb-8 border-b pb-8',
        className
      )}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-foreground mb-2 text-2xl font-semibold">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
