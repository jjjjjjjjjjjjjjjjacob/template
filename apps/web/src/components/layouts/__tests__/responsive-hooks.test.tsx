/// <reference lib="dom" />
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import {
  useMobile,
  useMobilePortrait,
  useMobileLandscape,
} from '@/hooks/use-mobile';
import {
  useTablet,
  useTabletPortrait,
  useTabletLandscape,
  useDesktop,
} from '@/hooks/use-tablet';
import {
  useResponsive,
  useBreakpointUp,
  useBreakpointDown,
  useBreakpointBetween,
} from '@/hooks/use-responsive';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useMobile', () => {
  it('returns true for mobile viewport', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(true);
  });

  it('returns false for desktop viewport', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(false);
  });

  it('uses custom breakpoint', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useMobile(480));
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 479px)');
  });
});

describe('useMobilePortrait', () => {
  it('calls matchMedia with correct query', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useMobilePortrait());
    expect(mockMatchMedia).toHaveBeenCalledWith(
      '(max-width: 767px) and (orientation: portrait)'
    );
  });
});

describe('useMobileLandscape', () => {
  it('calls matchMedia with correct query', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useMobileLandscape());
    expect(mockMatchMedia).toHaveBeenCalledWith(
      '(max-width: 767px) and (orientation: landscape)'
    );
  });
});

describe('useTablet', () => {
  it('returns true for tablet viewport', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useTablet());
    expect(result.current).toBe(true);
  });

  it('uses custom breakpoints', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useTablet(768, 1200));
    expect(mockMatchMedia).toHaveBeenCalledWith(
      '(min-width: 768px) and (max-width: 1199px)'
    );
  });
});

describe('useDesktop', () => {
  it('calls matchMedia with correct query', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useDesktop());
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });
});

describe('useResponsive', () => {
  it('returns responsive state object', () => {
    // Mock multiple calls for different breakpoints
    mockMatchMedia
      .mockReturnValueOnce({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) // xs
      .mockReturnValueOnce({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) // sm
      .mockReturnValueOnce({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) // md
      .mockReturnValueOnce({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) // lg
      .mockReturnValueOnce({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) // xl
      .mockReturnValueOnce({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }); // 2xl

    const { result } = renderHook(() => useResponsive());

    expect(result.current).toHaveProperty('isMobile');
    expect(result.current).toHaveProperty('isTablet');
    expect(result.current).toHaveProperty('isDesktop');
    expect(result.current).toHaveProperty('breakpoint');
    expect(result.current).toHaveProperty('isBreakpoint');
    expect(result.current).toHaveProperty('isBreakpointUp');
    expect(result.current).toHaveProperty('isBreakpointDown');
  });
});

describe('useBreakpointUp', () => {
  it('calls matchMedia with correct query', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useBreakpointUp('lg'));
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });
});

describe('useBreakpointDown', () => {
  it('calls matchMedia with correct query', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useBreakpointDown('lg'));
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 1023px)');
  });
});

describe('useBreakpointBetween', () => {
  it('calls matchMedia with correct query', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderHook(() => useBreakpointBetween('md', 'xl'));
    expect(mockMatchMedia).toHaveBeenCalledWith(
      '(min-width: 768px) and (max-width: 1279px)'
    );
  });
});
