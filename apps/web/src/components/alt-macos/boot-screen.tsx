import { useEffect, useState } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: '#e8e8e8' }}
    >
      <div className="mb-12">
        <svg
          width="80"
          height="96"
          viewBox="0 0 80 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M64.2 50.2c-.1-10.1 8.2-15 8.6-15.2-4.7-6.8-12-7.8-14.6-7.9-6.2-.6-12.1 3.6-15.2 3.6-3.1 0-8-3.5-13.1-3.4-6.7.1-12.9 3.9-16.4 10-7 12.1-1.8 30.1 5 40 3.3 4.8 7.3 10.2 12.5 10 5-.2 6.9-3.2 13-3.2 6 0 7.8 3.2 13.1 3.1 5.4-.1 8.8-4.9 12.1-9.7 3.8-5.6 5.4-11 5.4-11.3-.1-.1-10.4-4-10.4-15.9zM54.4 19.6c2.8-3.3 4.6-8 4.1-12.6-4 .2-8.8 2.6-11.6 6-2.6 3-4.8 7.8-4.2 12.4 4.4.3 9-2.2 11.7-5.8z"
            fill="#555"
          />
        </svg>
      </div>

      <div
        className="relative h-[12px] w-48 overflow-hidden"
        style={{
          backgroundImage: 'url(/os-x/ui/loader-rail.png)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: '12px 12px',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px rgba(120,120,120,0.18)',
        }}
      >
        <div
          className="h-full transition-[width] duration-200 ease-out"
          style={{
            width: `${progress}%`,
            backgroundImage: 'url(/os-x/ui/loader-active.png)',
            backgroundRepeat: 'repeat-x',
            backgroundSize: '12px 12px',
          }}
        />
      </div>

      <p className="mt-6 text-xs" style={{ color: '#888' }}>
        Starting Mac OS X...
      </p>
    </div>
  );
}
