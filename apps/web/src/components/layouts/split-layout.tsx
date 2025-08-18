import * as React from 'react';
import { cn } from '@/utils/tailwind-utils';
import { BaseLayout } from './base-layout';
import { useMobile } from '@/hooks/use-mobile';

export interface SplitLayoutProps {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  containerClassName?: string;
  /**
   * Direction of the split
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * Split ratio (0-100)
   * - 50 = equal split
   * - 30 = left/top takes 30%, right/bottom takes 70%
   */
  splitRatio?: number;
  /**
   * Gap between the split sections
   */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to reverse the order on mobile
   */
  reverseOnMobile?: boolean;
  /**
   * Whether to stack vertically on mobile (only for horizontal splits)
   */
  stackOnMobile?: boolean;
  /**
   * Maximum width for the layout
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  /**
   * Minimum height for vertical splits
   */
  minHeight?: string;
}

const gapClasses = {
  none: '',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

export function SplitLayout({
  children,
  className,
  containerClassName,
  direction = 'horizontal',
  splitRatio = 50,
  gap = 'lg',
  reverseOnMobile = false,
  stackOnMobile = true,
  maxWidth = '7xl',
  minHeight = '60vh',
}: SplitLayoutProps) {
  const isMobile = useMobile();
  const [leftChild, rightChild] = children;

  const isHorizontal = direction === 'horizontal';
  const shouldStack = isMobile && stackOnMobile && isHorizontal;
  const shouldReverse = isMobile && reverseOnMobile;

  const leftStyle = React.useMemo(() => {
    if (shouldStack) return {};
    return isHorizontal
      ? { flexBasis: `${splitRatio}%` }
      : { height: `${splitRatio}%` };
  }, [shouldStack, isHorizontal, splitRatio]);

  const rightStyle = React.useMemo(() => {
    if (shouldStack) return {};
    return isHorizontal
      ? { flexBasis: `${100 - splitRatio}%` }
      : { height: `${100 - splitRatio}%` };
  }, [shouldStack, isHorizontal, splitRatio]);

  return (
    <BaseLayout
      maxWidth={maxWidth}
      className={className}
      containerClassName={containerClassName}
    >
      <div
        className={cn(
          'flex',
          shouldStack ? 'flex-col' : isHorizontal ? 'flex-row' : 'flex-col',
          shouldReverse && 'flex-col-reverse sm:flex-row',
          gapClasses[gap],
          !isHorizontal && 'h-full'
        )}
        style={{
          minHeight: !isHorizontal ? minHeight : undefined,
        }}
      >
        <div
          className={cn('flex-shrink-0', shouldStack && 'flex-shrink')}
          style={leftStyle}
        >
          {leftChild}
        </div>

        <div
          className={cn('flex-shrink-0', shouldStack && 'flex-shrink')}
          style={rightStyle}
        >
          {rightChild}
        </div>
      </div>
    </BaseLayout>
  );
}

/**
 * Hero split layout for landing pages
 */
export interface HeroSplitLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  className?: string;
  /**
   * Background variant
   */
  variant?: 'default' | 'gradient' | 'image';
  /**
   * Background image URL (when variant is 'image')
   */
  backgroundImage?: string;
}

export function HeroSplitLayout({
  leftContent,
  rightContent,
  className,
  variant = 'default',
  backgroundImage,
}: HeroSplitLayoutProps) {
  const backgroundStyle = React.useMemo(() => {
    switch (variant) {
      case 'gradient':
        return {
          background:
            'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
        };
      case 'image':
        return backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {};
      default:
        return {};
    }
  }, [variant, backgroundImage]);

  return (
    <div
      className={cn(
        'flex min-h-screen items-center',
        variant === 'gradient' && 'text-white',
        variant === 'image' && 'relative',
        className
      )}
      style={backgroundStyle}
    >
      {variant === 'image' && <div className="absolute inset-0 bg-black/40" />}

      <SplitLayout
        maxWidth="7xl"
        className="relative z-10"
        splitRatio={60}
        stackOnMobile
      >
        {[
          <div className="flex h-full flex-col justify-center">
            {leftContent}
          </div>,
          <div className="flex h-full items-center justify-center">
            {rightContent}
          </div>,
        ]}
      </SplitLayout>
    </div>
  );
}
