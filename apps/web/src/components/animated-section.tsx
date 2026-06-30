import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils';
import { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animationType?: 'section' | 'card' | 'header';
  delay?: number;
}

export function AnimatedSection({
  children,
  className = '',
  animationType = 'section',
  delay = 0,
}: AnimatedSectionProps) {
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const baseClasses = {
    section:
      'data-[visible=false]:translate-y-[40px] data-[visible=false]:scale-98 data-[visible=false]:opacity-0 duration-800',
    card: 'data-[visible=false]:translate-y-[24px] data-[visible=false]:scale-95 data-[visible=false]:opacity-0 duration-600',

    header:
      'data-[visible=false]:translate-y-[10px] data-[visible=false]:scale-102 data-[visible=false]:opacity-0 duration-300',
  };

  return (
    <div
      ref={elementRef}
      data-visible={isVisible}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      className={cn('transition-all', baseClasses[animationType], className)}
    >
      {children}
    </div>
  );
}
