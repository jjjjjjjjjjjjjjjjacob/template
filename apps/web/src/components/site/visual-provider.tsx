import * as React from 'react';
import type { MetaballVariant } from './metaball-stage';
import { useTheme } from '@/components/theme-provider';

export type SiteTheme = 'light' | 'dark';

export type SiteStage = {
  variant: MetaballVariant;
  accent: string;
  accent2: string;
};

export type SiteVisualContextValue = {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  stage: SiteStage;
  setStage: React.Dispatch<React.SetStateAction<SiteStage>>;
};

export const SPECIMENS: SiteStage[] = [
  { variant: 'orbs', accent: '#e4e0f0', accent2: '#f1e0e6' },
  { variant: 'strand', accent: '#dee7e1', accent2: '#ece5d4' },
  { variant: 'cluster', accent: '#e8e2d4', accent2: '#f1ddc8' },
  { variant: 'halo', accent: '#dbe4ea', accent2: '#e7e0ef' },
];

export const SPECIMENS_DARK: SiteStage[] = [
  { variant: 'orbs', accent: '#5446c0', accent2: '#8a4fb8' },
  { variant: 'strand', accent: '#2a9b85', accent2: '#4fae5c' },
  { variant: 'cluster', accent: '#c8832f', accent2: '#cc5836' },
  { variant: 'halo', accent: '#3b8fc6', accent2: '#b85590' },
];

export const DARK_TINTS_BY_SLUG: Record<
  string,
  { accent: string; accent2: string }
> = {
  'heat-tech': { accent: '#16a34a', accent2: '#de4427' },
  'the-market': { accent: '#ec4899', accent2: '#f43f5e' },
  freelance: { accent: '#10b981', accent2: '#0ea5e9' },
};

export const META_PALETTE: Record<
  SiteTheme,
  { bg: string; ink: string; intensity: number }
> = {
  light: { bg: '#efeeea', ink: '#1a1a18', intensity: 0.55 },
  dark: { bg: '#131210', ink: '#26241f', intensity: 1.15 },
};

export const DARK_DESATURATE = 0.18;

const BOOKING_STAGES: Record<SiteTheme, SiteStage> = {
  light: { variant: 'strand', accent: '#dee7e1', accent2: '#ece5d4' },
  dark: { variant: 'strand', accent: '#2a9b85', accent2: '#4fae5c' },
};

const SiteVisualContext = React.createContext<SiteVisualContextValue | null>(
  null
);

export function desaturate(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  const ch = (c: number) =>
    Math.round(c + (grey - c) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

export function projectStage(
  index: number,
  projectId: string | undefined,
  theme: SiteTheme
): SiteStage {
  const spec = SPECIMENS[index % SPECIMENS.length];
  if (theme === 'light') return spec;

  const projectTint = projectId ? DARK_TINTS_BY_SLUG[projectId] : undefined;
  const darkTint = projectTint ?? SPECIMENS_DARK[index % SPECIMENS_DARK.length];

  return {
    variant: spec.variant,
    accent: desaturate(darkTint.accent, DARK_DESATURATE),
    accent2: desaturate(darkTint.accent2, DARK_DESATURATE),
  };
}

export function bookingStage(theme: SiteTheme): SiteStage {
  return BOOKING_STAGES[theme];
}

export function useSiteVisuals() {
  const value = React.useContext(SiteVisualContext);
  if (!value) {
    throw new Error('useSiteVisuals must be used inside SiteVisualProvider');
  }
  return value;
}

export function SiteVisualProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme, setTheme: setThemePreference } = useTheme();
  const theme: SiteTheme = resolvedTheme;
  const [stage, setStage] = React.useState<SiteStage>(() =>
    projectStage(0, undefined, 'light')
  );

  React.useEffect(() => {
    document.documentElement.dataset.siteTheme = theme;
    return () => {
      delete document.documentElement.dataset.siteTheme;
    };
  }, [theme]);

  const setTheme = React.useCallback(
    (nextTheme: SiteTheme) => setThemePreference(nextTheme),
    [setThemePreference]
  );

  const contextValue = React.useMemo(
    () => ({ theme, setTheme, stage, setStage }),
    [stage, theme, setTheme]
  );

  return (
    <SiteVisualContext.Provider value={contextValue}>
      {children}
    </SiteVisualContext.Provider>
  );
}
