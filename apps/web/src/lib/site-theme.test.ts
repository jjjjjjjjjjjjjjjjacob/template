import { describe, expect, it } from 'vitest';
import {
  LEGACY_SITE_THEME_STORAGE_KEY,
  migrateLegacySiteTheme,
  SITE_THEME_STORAGE_KEY,
} from './site-theme';

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    values,
  };
}

describe('site theme migration', () => {
  it('promotes the former public-site preference and removes the old key', () => {
    const storage = createStorage({
      [SITE_THEME_STORAGE_KEY]: 'light',
      [LEGACY_SITE_THEME_STORAGE_KEY]: 'dark',
    });

    expect(migrateLegacySiteTheme(storage)).toBe('dark');
    expect(storage.values.get(SITE_THEME_STORAGE_KEY)).toBe('dark');
    expect(storage.values.has(LEGACY_SITE_THEME_STORAGE_KEY)).toBe(false);
  });

  it('keeps a valid shared preference when no legacy value exists', () => {
    const storage = createStorage({ [SITE_THEME_STORAGE_KEY]: 'system' });

    expect(migrateLegacySiteTheme(storage)).toBe('system');
    expect(storage.values.get(SITE_THEME_STORAGE_KEY)).toBe('system');
  });

  it('drops invalid legacy data without replacing a valid shared value', () => {
    const storage = createStorage({
      [SITE_THEME_STORAGE_KEY]: 'dark',
      [LEGACY_SITE_THEME_STORAGE_KEY]: 'sepia',
    });

    expect(migrateLegacySiteTheme(storage)).toBe('dark');
    expect(storage.values.has(LEGACY_SITE_THEME_STORAGE_KEY)).toBe(false);
  });
});
