import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteChrome } from './chrome';
import { SiteThemeToggle } from './theme-toggle';
import { SiteVisualProvider } from './visual-provider';

const stageMounts = vi.hoisted(() => ({ nextId: 0 }));

vi.mock('./metaball-stage', async () => {
  const React = await import('react');

  return {
    MetaballStage: () => {
      const [mountId] = React.useState(() => ++stageMounts.nextId);
      return <div data-testid="metaball-stage" data-mount-id={mountId} />;
    },
  };
});

describe('SiteChrome', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('theme', 'light');
    stageMounts.nextId = 0;
    document.documentElement.classList.remove('light', 'dark');
    delete document.documentElement.dataset.siteTheme;
  });

  it('remounts the canvas instead of lerping its background across themes', async () => {
    render(
      <ThemeProvider>
        <SiteVisualProvider>
          <SiteChrome>
            <SiteThemeToggle />
          </SiteChrome>
        </SiteVisualProvider>
      </ThemeProvider>
    );

    const initialStage = await screen.findByTestId('metaball-stage');
    const initialMountId = initialStage.dataset.mountId;

    fireEvent.click(
      screen.getByRole('button', { name: 'switch to dark mode' })
    );

    await waitFor(() => {
      expect(screen.getByTestId('metaball-stage').dataset.mountId).not.toBe(
        initialMountId
      );
    });
  });
});
