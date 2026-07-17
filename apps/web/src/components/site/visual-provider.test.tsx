import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteThemeToggle } from './theme-toggle';
import {
  projectStage,
  type SiteStage,
  SiteVisualProvider,
  useSiteVisuals,
} from './visual-provider';

function SiteVisualProbe() {
  const { theme, stage, setStage } = useSiteVisuals();
  const nextStage: SiteStage = {
    variant: 'halo',
    accent: '#112233',
    accent2: '#445566',
  };

  return (
    <>
      <output data-testid="theme">{theme}</output>
      <output data-testid="stage">{stage.variant}</output>
      <button type="button" onClick={() => setStage(nextStage)}>
        change stage
      </button>
    </>
  );
}

function PassiveVisualProbe({
  onSnapshot,
}: {
  onSnapshot: (snapshot: { theme: string; accent: string }) => void;
}) {
  const { theme, stage, isReady } = useSiteVisuals();

  if (!isReady) return null;

  return (
    <MountedVisualProbe
      theme={theme}
      accent={stage.accent}
      onSnapshot={onSnapshot}
    />
  );
}

function MountedVisualProbe({
  theme,
  accent,
  onSnapshot,
}: {
  theme: string;
  accent: string;
  onSnapshot: (snapshot: { theme: string; accent: string }) => void;
}) {
  useEffect(() => {
    onSnapshot({ theme, accent });
  }, [accent, onSnapshot, theme]);

  return null;
}

function renderProvider(children: React.ReactNode) {
  return render(
    <ThemeProvider>
      <SiteVisualProvider>{children}</SiteVisualProvider>
    </ThemeProvider>
  );
}

describe('SiteVisualProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    delete document.documentElement.dataset.siteTheme;
  });

  it('provides visuals without requiring the route-specific SiteChrome', () => {
    renderProvider(<SiteVisualProbe />);

    expect(screen.getByTestId('theme')).toHaveTextContent(/light|dark/);
    expect(screen.getByTestId('stage')).toHaveTextContent('orbs');

    fireEvent.click(screen.getByRole('button', { name: 'change stage' }));
    expect(screen.getByTestId('stage')).toHaveTextContent('halo');
  });

  it('boots the dark visual palette before child passive effects mount', () => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.dataset.siteTheme = 'dark';
    const snapshots: Array<{ theme: string; accent: string }> = [];

    renderProvider(
      <PassiveVisualProbe onSnapshot={(snapshot) => snapshots.push(snapshot)} />
    );

    expect(snapshots[0]).toEqual({
      theme: 'dark',
      accent: projectStage(0, undefined, 'dark').accent,
    });
  });

  it('migrates the old theme choice into the shared public/admin preference', async () => {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('alt-3b-theme', 'dark');

    renderProvider(<SiteVisualProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });
    expect(document.documentElement.dataset.siteTheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('alt-3b-theme')).toBeNull();
  });

  it('keeps public and admin theme controls synchronized', async () => {
    localStorage.setItem('theme', 'light');

    renderProvider(
      <>
        <SiteThemeToggle className="public-toggle" />
        <SiteThemeToggle className="admin-toggle" />
      </>
    );

    const toggles = await screen.findAllByRole('button', {
      name: 'switch to dark mode',
    });
    fireEvent.click(toggles[1]);

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', { name: 'switch to light mode' })
      ).toHaveLength(2);
    });
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.dataset.siteTheme).toBe('dark');
  });
});
