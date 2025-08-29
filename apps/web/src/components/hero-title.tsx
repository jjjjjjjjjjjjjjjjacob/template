import * as React from 'react';
import { cn } from '@/utils';
import './hero-title-animations.css';

interface HeroTitleProps {
  onComplete: () => void;
}

export function HeroTitle({ onComplete }: HeroTitleProps) {
  React.useEffect(() => {
    // Set timeout to match the total animation duration (1650ms)
    const timer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div
      className={`text-foreground flex items-center justify-center bg-transparent transition-opacity duration-1000`}
    >
      {/* Use exact same structure as hero section */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-foreground transition-colors-smooth text-4xl font-medium tracking-tight sm:text-5xl">
          {/* Container that expands from narrow to full width */}
          <div
            className={cn(
              'relative flex items-center justify-between tracking-wide',
              'hero-title-animate'
            )}
            style={{
              opacity: 0,
            }}
          >
            {/* J letter */}
            <span
              className={cn(
                'w-8px overflow-hidden whitespace-pre',
                'hero-title-j-animate'
              )}
              style={{ width: '8px' }}
            >
              <span className="inline-block">j</span>
              <span
                className={cn('hero-title-text-animate inline-block opacity-0')}
              >
                acob
              </span>
            </span>

            {/* S letter */}
            <span
              className={cn(
                'overflow-hidden whitespace-pre',
                'hero-title-s-animate'
              )}
              style={{ width: '1.25rem' }}
            >
              <span className="inline-block">s</span>
              <span
                className={cn('hero-title-text-animate inline-block opacity-0')}
              >
                tein
              </span>
            </span>
          </div>
        </h1>
      </div>
    </div>
  );
}
