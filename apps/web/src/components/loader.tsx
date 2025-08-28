import * as React from 'react';
import { cn } from '@/utils';

interface LoaderProps {
  onComplete: () => void;
}

export function Loader({ onComplete }: LoaderProps) {
  const [animationStage, setAnimationStage] = React.useState<
    'hidden' | 'loading' | 'expanding' | 'revealing' | 'complete'
  >('hidden');

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
          }, 1000);
        }, 1000);
        return timer3;
      });
      return timer2;
    }, 1000);

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
              'relative flex items-center justify-between gap-1 transition-all duration-1200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] sm:gap-2',
              'data-[state=*]:opacity-100 data-[state=expanding]:gap-[1px] data-[state=hidden]:opacity-0 sm:data-[state=expanding]:gap-[2px]'
            )}
          >
            {/* J letter */}
            <span
              data-state={animationStage}
              className={cn(
                'w-23 overflow-hidden whitespace-pre transition-all duration-1000',
                'sm:w-30',
                'data-[state=hidden]:w-2 sm:data-[state=hidden]:w-[0.6rem]',
                'data-[state=loading]:w-2 sm:data-[state=loading]:w-[0.6rem]',
                'data-[state=expanding]:w-2 sm:data-[state=expanding]:w-[0.6rem]'
              )}
            >
              <span className="inline-block">j</span>
              <span
                data-state={animationStage}
                className={cn(
                  'inline-block opacity-0 transition-opacity duration-1000',
                  'data-[state=complete]:opacity-100'
                )}
              >
                acob
              </span>
            </span>

            {/* S letter */}
            <span
              data-state={animationStage}
              className={cn(
                'w-20 overflow-hidden whitespace-pre transition-all duration-1000',
                'sm:w-[6.5rem]',
                'data-[state=hidden]:w-5 sm:data-[state=hidden]:w-6',
                'data-[state=loading]:w-5 sm:data-[state=loading]:w-6',
                'data-[state=expanding]:w-5 sm:data-[state=expanding]:w-6'
              )}
            >
              <span className="inline-block">s</span>
              <span
                data-state={animationStage}
                className={cn(
                  'inline-block opacity-0 transition-opacity duration-1000',
                  'data-[state=complete]:opacity-100'
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
