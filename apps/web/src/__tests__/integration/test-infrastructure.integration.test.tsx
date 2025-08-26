/// <reference lib="dom" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderWithProviders,
  renderComponent,
  renderWithAuth,
  renderWithoutAuth,
  renderWithDarkTheme,
  renderWithLoadingAuth,
} from '@/test-utils';
import { server, testData } from '@/test-utils/integration-setup';
import { http, HttpResponse } from 'msw';

// Simple test component for infrastructure validation
function TestComponent({ message = 'Hello Test' }: { message?: string }) {
  return (
    <div>
      <h1 data-testid="test-heading">{message}</h1>
      <button data-testid="test-button">Click me</button>
    </div>
  );
}

// Component that uses theme
function ThemedComponent() {
  return (
    <div>
      <div
        data-testid="themed-content"
        className="bg-background text-foreground"
      >
        Themed content
      </div>
    </div>
  );
}

// Component that needs auth
function AuthComponent() {
  // This would use useAuth in real implementation
  return <div data-testid="auth-component">Auth required component</div>;
}

/**
 * Integration tests for the testing infrastructure itself
 * These tests validate that our test utilities work correctly
 */
describe('Test Infrastructure Integration', () => {
  describe('Basic Rendering', () => {
    it('should render components with renderWithProviders', async () => {
      renderWithProviders(<TestComponent message="Provider Test" />);

      expect(screen.getByTestId('test-heading')).toBeInTheDocument();
      expect(screen.getByText('Provider Test')).toBeInTheDocument();
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });

    it('should render components with renderComponent', async () => {
      renderComponent(<TestComponent message="Component Test" />);

      expect(screen.getByTestId('test-heading')).toBeInTheDocument();
      expect(screen.getByText('Component Test')).toBeInTheDocument();
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });

    it('should handle user interactions', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      function InteractiveComponent() {
        return (
          <button data-testid="interactive-button" onClick={handleClick}>
            Click me
          </button>
        );
      }

      renderComponent(<InteractiveComponent />);

      const button = screen.getByTestId('interactive-button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auth State Testing', () => {
    it('should render with authenticated user', async () => {
      const user = testData.users.regular();

      renderWithAuth(<AuthComponent />, {
        user,
      });

      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('should render without authentication', async () => {
      renderWithoutAuth(<AuthComponent />);

      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });

    it('should render with loading auth state', async () => {
      renderWithLoadingAuth(<AuthComponent />);

      expect(screen.getByTestId('auth-component')).toBeInTheDocument();
    });
  });

  describe('Theme Testing', () => {
    it('should render with dark theme', async () => {
      renderWithDarkTheme(<ThemedComponent />);

      expect(screen.getByTestId('themed-content')).toBeInTheDocument();
      // In a real implementation, you might check for dark theme classes
    });

    it('should render with light theme by default', async () => {
      renderComponent(<ThemedComponent />);

      expect(screen.getByTestId('themed-content')).toBeInTheDocument();
    });
  });

  describe('MSW Integration', () => {
    it('should handle mock API responses', async () => {
      // Add a custom handler for this test
      server.use(
        http.get('/api/test', () => {
          return HttpResponse.json({ message: 'Mock API response' });
        })
      );

      // Component that makes API call
      function ApiComponent() {
        const [data, setData] = React.useState<{ message: string } | null>(
          null
        );
        const [loading, setLoading] = React.useState(false);

        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await fetch('/api/test');
            const result = await response.json();
            setData(result);
          } catch {
            // API error handling in test
          } finally {
            setLoading(false);
          }
        };

        React.useEffect(() => {
          fetchData();
        }, []);

        if (loading) return <div data-testid="api-loading">Loading...</div>;
        if (!data) return <div data-testid="api-no-data">No data</div>;

        return <div data-testid="api-data">{data.message}</div>;
      }

      renderComponent(<ApiComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('api-data')).toBeInTheDocument();
        expect(screen.getByText('Mock API response')).toBeInTheDocument();
      });
    });

    it('should handle mock API errors', async () => {
      // Add an error handler for this test
      server.use(
        http.get('/api/error-test', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // Component that handles API errors
      function ErrorApiComponent() {
        const [error, setError] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(false);

        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await fetch('/api/error-test');
            if (!response.ok) {
              throw new Error('API error');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          } finally {
            setLoading(false);
          }
        };

        React.useEffect(() => {
          fetchData();
        }, []);

        if (loading) return <div data-testid="error-loading">Loading...</div>;
        if (error) return <div data-testid="error-message">{error}</div>;

        return <div data-testid="error-success">Success</div>;
      }

      renderComponent(<ErrorApiComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('API error')).toBeInTheDocument();
      });
    });
  });

  describe('Query Client Integration', () => {
    it('should provide isolated query client for tests', async () => {
      // Component that uses React Query (simplified)
      function QueryComponent() {
        // In real implementation, this would use useQuery
        const [data] = React.useState({ test: 'query data' });

        return <div data-testid="query-component">{data.test}</div>;
      }

      renderComponent(<QueryComponent />);

      expect(screen.getByTestId('query-component')).toBeInTheDocument();
      expect(screen.getByText('query data')).toBeInTheDocument();
    });
  });

  describe('Test Data Factories', () => {
    it('should provide consistent test user data', () => {
      const user = testData.users.regular();

      expect(user).toMatchObject({
        id: 'user-regular',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
      });
    });

    it('should provide admin test user data', () => {
      const admin = testData.users.admin();

      expect(admin).toMatchObject({
        id: 'user-admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
    });

    it('should provide moderator test user data', () => {
      const moderator = testData.users.moderator();

      expect(moderator).toMatchObject({
        id: 'user-moderator',
        firstName: 'Moderator',
        lastName: 'User',
        role: 'moderator',
      });
    });

    it('should provide unboarded user data', () => {
      const unboarded = testData.users.unboarded();

      expect(unboarded).toMatchObject({
        id: 'user-unboarded',
        firstName: 'New',
        lastName: 'User',
        isOnboarded: false,
      });
    });
  });

  describe('Browser API Mocking', () => {
    it('should mock localStorage', () => {
      // localStorage should be mocked and available
      expect(localStorage).toBeDefined();
      expect(typeof localStorage.setItem).toBe('function');
      expect(typeof localStorage.getItem).toBe('function');

      localStorage.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
    });

    it('should mock matchMedia', () => {
      // matchMedia should be mocked
      expect(window.matchMedia).toBeDefined();
      expect(typeof window.matchMedia).toBe('function');

      const mediaQuery = window.matchMedia('(max-width: 768px)');
      expect(mediaQuery).toBeDefined();
      expect(typeof mediaQuery.matches).toBe('boolean');
    });

    it('should mock IntersectionObserver', () => {
      // IntersectionObserver should be mocked
      expect(IntersectionObserver).toBeDefined();
      expect(typeof IntersectionObserver).toBe('function');

      const observer = new IntersectionObserver(() => {});
      expect(observer).toBeDefined();
      expect(typeof observer.observe).toBe('function');
    });
  });
});
