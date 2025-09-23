import { useEffect, useRef } from 'react';
import { useSectionStore, type Section } from '@/stores/section-store';

interface UseSectionObserverProps {
  section: Section;
  element?: Element | null;
}

/**
 * Hook to automatically observe and unobserve sections for intersection tracking
 * Can be used with a ref or by passing an element directly
 */
export function useSectionObserver({
  section,
  element,
}: UseSectionObserverProps) {
  const { observeSection, unobserveSection } = useSectionStore();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targetElement = element || elementRef.current;

    if (!targetElement) return;

    // Observe the section
    observeSection(section, targetElement);

    // Cleanup on unmount or element change
    return () => {
      unobserveSection(section);
    };
  }, [section, element, observeSection, unobserveSection]);

  return elementRef;
}

/**
 * Alternative hook that automatically finds elements by section ID
 * Useful for sections that already have the correct ID in the DOM
 */
export function useSectionObserverById(section: Section) {
  const { observeSection, unobserveSection } = useSectionStore();

  useEffect(() => {
    // Add delay to allow initial DOM render to complete
    const timer = setTimeout(() => {
      let element: Element | null = null;

      if (section === 'home') {
        element = document.querySelector('[data-section="home"]');
      } else {
        element = document.getElementById(section);
      }

      if (element) {
        observeSection(section, element);
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      unobserveSection(section);
    };
  }, [section, observeSection, unobserveSection]);
}
