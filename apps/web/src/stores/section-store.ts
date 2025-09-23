import { create } from 'zustand';

export type Section = 'home' | 'projects' | 'resume' | 'contact';

interface SectionState {
  activeSection: Section | null;
  observedElements: Map<Section, Element>;
  observer: IntersectionObserver | null;
}

interface SectionActions {
  setActiveSection: (section: Section | null) => void;
  observeSection: (section: Section, element: Element) => void;
  unobserveSection: (section: Section) => void;
  initializeObserver: () => void;
  cleanup: () => void;
}

type SectionStore = SectionState & SectionActions;

export const useSectionStore = create<SectionStore>((set, get) => ({
  // State
  activeSection: null,
  observedElements: new Map(),
  observer: null,

  // Actions
  setActiveSection: (section) => set({ activeSection: section }),

  observeSection: (section, element) => {
    const { observer, observedElements } = get();

    // Store the element reference
    observedElements.set(section, element);
    set({ observedElements: new Map(observedElements) });

    // Observe the element if observer is ready
    if (observer) {
      observer.observe(element);
    }
  },

  unobserveSection: (section) => {
    const { observer, observedElements } = get();

    const element = observedElements.get(section);
    if (element && observer) {
      observer.unobserve(element);
    }

    observedElements.delete(section);
    set({ observedElements: new Map(observedElements) });
  },

  initializeObserver: () => {
    const { observer, observedElements } = get();

    // Don't initialize if already exists
    if (observer) return;

    const newObserver = new IntersectionObserver(
      (entries) => {
        let currentActive: Section | null = null;
        let hasIntersecting = false;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hasIntersecting = true;
            const sectionId =
              entry.target.getAttribute('data-section') || entry.target.id;
            if (
              sectionId &&
              ['home', 'projects', 'resume', 'contact'].includes(sectionId)
            ) {
              currentActive = sectionId as Section;
            }
          }
        });

        if (currentActive !== null) {
          set({ activeSection: currentActive });
        } else if (!hasIntersecting) {
          set({ activeSection: null });
        }
      },
      {
        threshold: 0,
        rootMargin: '-50% 0px -50% 0px',
      }
    );

    set({ observer: newObserver });

    // Observe all already registered elements
    observedElements.forEach((element) => {
      newObserver.observe(element);
    });
  },

  cleanup: () => {
    const { observer, observedElements } = get();

    if (observer) {
      observer.disconnect();
      set({ observer: null });
    }

    observedElements.clear();
    set({ observedElements: new Map() });
  },
}));
