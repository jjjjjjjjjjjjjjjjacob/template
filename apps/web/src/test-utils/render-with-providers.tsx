import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { createTestWrapper, createSimpleTestWrapper } from './test-wrapper';
import type { TestWrapperOptions } from './types';

/**
 * Custom render function that includes all providers
 * This is the main render function to use in tests
 *
 * @param ui The component to render
 * @param options Render options and test wrapper configuration
 * @returns Testing library render result
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: TestWrapperOptions;
    useSimpleWrapper?: boolean;
  } = {}
) {
  const {
    wrapperOptions = {},
    useSimpleWrapper = false,
    ...renderOptions
  } = options;

  // Choose wrapper based on whether we need router context
  const TestWrapper = useSimpleWrapper
    ? createSimpleTestWrapper(wrapperOptions)
    : createTestWrapper(wrapperOptions);

  // Override the wrapper if provided in renderOptions
  const Wrapper = renderOptions.wrapper
    ? ({ children }: { children: React.ReactNode }) => {
        const CustomWrapper = renderOptions.wrapper!;
        return (
          <CustomWrapper>
            <TestWrapper>{children}</TestWrapper>
          </CustomWrapper>
        );
      }
    : TestWrapper;

  return render(ui, {
    ...renderOptions,
    wrapper: Wrapper,
  });
}

/**
 * Render function specifically for components that don't need router
 * More performant for simple component tests
 */
export function renderComponent(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: Omit<
      TestWrapperOptions,
      'router' | 'initialPath' | 'initialSearch'
    >;
  } = {}
) {
  return renderWithProviders(ui, {
    ...options,
    useSimpleWrapper: true,
  });
}

/**
 * Render function specifically for route/page components
 * Includes full router context
 */
export function renderRoute(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: TestWrapperOptions;
  } = {}
) {
  return renderWithProviders(ui, {
    ...options,
    useSimpleWrapper: false,
  });
}

/**
 * Render function for authenticated components
 * Pre-configured with signed-in user
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: TestWrapperOptions;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  } = {}
) {
  const {
    user = { id: 'test-user-123', firstName: 'Test', lastName: 'User' },
    ...restOptions
  } = options;

  return renderWithProviders(ui, {
    ...restOptions,
    wrapperOptions: {
      ...restOptions.wrapperOptions,
      auth: {
        isSignedIn: true,
        isLoaded: true,
        user,
      },
    },
  });
}

/**
 * Render function for unauthenticated components
 * Pre-configured with signed-out user
 */
export function renderWithoutAuth(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: TestWrapperOptions;
  } = {}
) {
  return renderWithProviders(ui, {
    ...options,
    wrapperOptions: {
      ...options.wrapperOptions,
      auth: {
        isSignedIn: false,
        isLoaded: true,
        user: undefined,
      },
    },
  });
}

/**
 * Render function for testing dark mode components
 */
export function renderWithDarkTheme(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: TestWrapperOptions;
  } = {}
) {
  return renderWithProviders(ui, {
    ...options,
    wrapperOptions: {
      ...options.wrapperOptions,
      theme: 'dark',
    },
  });
}

/**
 * Render function for testing loading states
 * Pre-configured with loading auth state
 */
export function renderWithLoadingAuth(
  ui: React.ReactElement,
  options: RenderOptions & {
    wrapperOptions?: TestWrapperOptions;
  } = {}
) {
  return renderWithProviders(ui, {
    ...options,
    wrapperOptions: {
      ...options.wrapperOptions,
      auth: {
        isSignedIn: false,
        isLoaded: false,
        user: undefined,
      },
    },
  });
}
