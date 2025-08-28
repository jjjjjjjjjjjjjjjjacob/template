import * as React from 'react';
import { cn } from '@/utils';

interface HeroTitleProps {
  onComplete: () => void;
}

export function HeroTitle({ onComplete }: HeroTitleProps) {
  const [animationStage, setAnimationStage] = React.useState<
    'hidden' | 'loading' | 'expanding' | 'revealing' | 'complete'
  >('hidden');

  const hiddenDuration = 200;
  const hiddenDurationClass = `data-[state=hidden]:duration-200`;
  const loadingDuration = 50;
  const loadingDurationClass = `data-[state=loading]:duration-50`;
  const expandingDuration = 400;
  const expandingDurationClass = `data-[state=expanding]:duration-400`;
  const revealingDuration = 400;
  const revealingDurationClass = `data-[state=revealing]:duration-400`;
  const completeDuration = 800;
  const completeDurationClass = `data-[state=complete]:duration-800`;

  React.useEffect(() => {
    setAnimationStage('loading');
    // Animation sequence timing
    const timer = setTimeout(() => {
      setAnimationStage('expanding');
      const timer2 = setTimeout(() => {
        setAnimationStage('revealing');
        const timer3 = setTimeout(() => {
          return setTimeout(() => {
            setAnimationStage('complete');
            onComplete();
          }, completeDuration);
        }, revealingDuration);
        return timer3;
      }, expandingDuration);
      return timer2;
    }, loadingDuration);

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
            data-state={animationStage}
            className={cn(
              'relative flex items-center justify-between gap-[10px] tracking-wide transition-all sm:gap-4',
              'duration-800',
              'data-[state=hidden]:translate-y-[2px] data-[state=hidden]:scale-x-95 data-[state=hidden]:scale-y-0 data-[state=hidden]:gap-[1px] data-[state=hidden]:opacity-0 data-[state=hidden]:duration-200',
              'data-[state=loading]:gap-[1px] data-[state=loading]:duration-600',
              'data-[state=expanding]:gap-[1px] data-[state=expanding]:duration-600'
            )}
          >
            {/* J letter */}
            <span
              data-state={animationStage}
              className={cn(
                'w-[94px] overflow-hidden whitespace-pre transition-all duration-800',
                'sm:w-[125px]',
                'data-[state=hidden]:w-2 sm:data-[state=hidden]:w-[0.6rem]',
                'data-[state=loading]:w-2 sm:data-[state=loading]:w-[0.6rem]',
                'data-[state=expanding]:w-2 sm:data-[state=expanding]:w-[0.6rem]',
                loadingDurationClass,
                expandingDurationClass,
              )}
            >
              <span className="inline-block">j</span>
              <span
                data-state={animationStage}
                className={cn(
                  'inline-block opacity-0 transition-opacity',
                  'data-[state=complete]:opacity-100',
                  completeDurationClass,
                )}
              >
                acob
              </span>
            </span>

            {/* S letter */}
            <span
              data-state={animationStage}
              className={cn(
                'w-[78px] overflow-hidden whitespace-pre transition-all duration-800',
                'sm:w-[107px]',
                'data-[state=hidden]:w-[1.25rem] sm:data-[state=hidden]:w-6',
                'data-[state=loading]:w-[1.25rem] sm:data-[state=loading]:w-6',
                'data-[state=expanding]:w-[1.25rem] sm:data-[state=expanding]:w-6',
                loadingDurationClass,
                expandingDurationClass,
              )}
            >
              <span className="inline-block">s</span>
              <span
                data-state={animationStage}
                className={cn(
                  'inline-block opacity-0 transition-opacity',
                  'data-[state=complete]:opacity-100',
                  completeDurationClass,
                )}
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
