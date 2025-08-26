import { useState, useEffect } from 'react';

export type Section = 'home' | 'projects' | 'resume';

export function useSectionTracking() {
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let currentActive: Section | null = null;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId =
              entry.target.getAttribute('data-section') || entry.target.id;
            if (
              sectionId &&
              ['home', 'projects', 'resume'].includes(sectionId)
            ) {
              currentActive = sectionId as Section;
            }
          }
        });

        setActiveSection(currentActive);
      },
      {
        threshold: 0,
        rootMargin: '-50% 0px -50% 0px',
      }
    );

    // Add delay to allow initial load to complete
    const timer = setTimeout(() => {
      const homeElement = document.querySelector('[data-section="home"]');
      const projectsElement = document.getElementById('projects');
      const resumeElement = document.getElementById('resume');

      if (homeElement) observer.observe(homeElement);
      if (projectsElement) observer.observe(projectsElement);
      if (resumeElement) observer.observe(resumeElement);
    }, 1500); // Delay after our scroll prevention ends

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (section: Section) => {
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return { activeSection, scrollToSection };
}
