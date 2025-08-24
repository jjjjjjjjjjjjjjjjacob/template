import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
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

  const baseClasses = {
    section: 'animate-on-scroll',
    card: 'animate-card-on-scroll', 
    header: 'animate-header-on-scroll',
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        baseClasses[animationType],
        isVisible && 'animate-visible',
        className
      )}
      style={{ 
        transitionDelay: delay ? `${delay}ms` : undefined,
        // Force browser to calculate initial styles
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}