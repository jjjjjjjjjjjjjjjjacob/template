import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  debounceMs?: number;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  debounceMs = 150,
}: UseIntersectionObserverProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (entry.isIntersecting) {
          // Small delay to ensure initial styles are applied before transition
          timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            timeoutRef.current = null;
          }, 50);

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          // Debounce hiding to prevent flickering when element is on viewport edge
          timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            timeoutRef.current = null;
          }, debounceMs);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, debounceMs]);

  return { elementRef, isVisible };
}
