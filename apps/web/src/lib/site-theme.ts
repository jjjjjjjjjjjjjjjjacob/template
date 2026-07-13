export type SiteThemePreference = 'light' | 'dark' | 'system';

export const SITE_THEME_STORAGE_KEY = 'theme';
export const LEGACY_SITE_THEME_STORAGE_KEY = 'alt-3b-theme';

export function isSiteThemePreference(
  value: string | null
): value is SiteThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Promote the former experimental theme preference into the shared site key.
 * The old public-site choice wins once because it is the preference visitors
 * most recently saw on the now-promoted design system.
 */
export function migrateLegacySiteTheme(
  storage: ThemeStorage
): SiteThemePreference | null {
  try {
    const legacyTheme = storage.getItem(LEGACY_SITE_THEME_STORAGE_KEY);

    if (legacyTheme === 'light' || legacyTheme === 'dark') {
      storage.setItem(SITE_THEME_STORAGE_KEY, legacyTheme);
      storage.removeItem(LEGACY_SITE_THEME_STORAGE_KEY);
      return legacyTheme;
    }

    if (legacyTheme !== null) {
      storage.removeItem(LEGACY_SITE_THEME_STORAGE_KEY);
    }

    const currentTheme = storage.getItem(SITE_THEME_STORAGE_KEY);
    return isSiteThemePreference(currentTheme) ? currentTheme : null;
  } catch {
    return null;
  }
}
