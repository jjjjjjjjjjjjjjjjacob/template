/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { useAuth } from '../hooks/use-auth';
import {
  setupAuthForIntegrationTest,
  testData,
} from '@/test-utils/integration-setup';

// Test component that uses the auth feature
function TestAuthComponent() {
  const { isSignedIn, isLoaded, user, isOnboarded } = useAuth();

  if (!isLoaded) {
    return <div data-testid="auth-loading">Loading auth...</div>;
  }

  if (!isSignedIn) {
    return <div data-testid="auth-signed-out">Please sign in</div>;
  }

  return (
    <div data-testid="auth-signed-in">
      <p>Welcome, {user?.firstName}!</p>
      {!isOnboarded && (
        <div data-testid="onboarding-required">Complete onboarding</div>
      )}
      {isOnboarded && <div data-testid="user-onboarded">User is onboarded</div>}
    </div>
  );
}

describe('Auth Feature Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles signed-in user state correctly', async () => {
    const authState = setupAuthForIntegrationTest('signed-in');

    renderWithProviders(<TestAuthComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-signed-in')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Regular!')).toBeInTheDocument();
      expect(screen.getByTestId('user-onboarded')).toBeInTheDocument();
    });
  });

  it('handles signed-out user state correctly', async () => {
    const authState = setupAuthForIntegrationTest('signed-out');

    renderWithProviders(<TestAuthComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-signed-out')).toBeInTheDocument();
      expect(screen.getByText('Please sign in')).toBeInTheDocument();
    });
  });

  it('handles loading auth state correctly', async () => {
    const authState = setupAuthForIntegrationTest('loading');

    renderWithProviders(<TestAuthComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading auth...')).toBeInTheDocument();
    });
  });

  it('handles unboarded user correctly', async () => {
    const unboardedUser = testData.users.unboarded();
    const authState = {
      isSignedIn: true,
      isLoaded: true,
      user: unboardedUser,
    };

    renderWithProviders(<TestAuthComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-signed-in')).toBeInTheDocument();
      expect(screen.getByText('Welcome, New!')).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-required')).toBeInTheDocument();
      expect(screen.getByText('Complete onboarding')).toBeInTheDocument();
    });
  });

  it('handles admin user correctly', async () => {
    const authState = setupAuthForIntegrationTest('admin');

    renderWithProviders(<TestAuthComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-signed-in')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Admin!')).toBeInTheDocument();
      expect(screen.getByTestId('user-onboarded')).toBeInTheDocument();
    });
  });

  it('integrates with auth components properly', async () => {
    // Import auth components dynamically to test integration
    const { AuthPromptDialog } = await import(
      '../components/auth-prompt-dialog'
    );

    function TestWithAuthPrompt() {
      return (
        <div>
          <TestAuthComponent />
          <AuthPromptDialog
            open={true}
            onOpenChange={() => {}}
            message="Please sign in to continue"
          />
        </div>
      );
    }

    const authState = setupAuthForIntegrationTest('signed-out');

    renderWithProviders(<TestWithAuthPrompt />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-signed-out')).toBeInTheDocument();
      // The auth prompt dialog should also be rendered
      expect(
        screen.getByText('Please sign in to continue')
      ).toBeInTheDocument();
    });
  });
});

// Test the auth service integration
describe('Auth Service Integration', () => {
  it('should provide auth services through feature exports', async () => {
    // Test that the auth feature properly exports its services
    const { authService } = await import('../services/auth-service');

    expect(authService).toBeDefined();
    expect(typeof authService.signOut).toBe('function');
    expect(typeof authService.completeOnboarding).toBe('function');
  });

  it('should provide auth hooks through feature exports', async () => {
    // Test that the auth feature properly exports its hooks
    const { useAuth, useAuthGuard } = await import('../index');

    expect(useAuth).toBeDefined();
    expect(useAuthGuard).toBeDefined();
    expect(typeof useAuth).toBe('function');
    expect(typeof useAuthGuard).toBe('function');
  });

  it('should provide auth types through feature exports', async () => {
    // Test that types are properly exported (this is mainly a compilation test)
    const authModule = await import('../types');

    // Just verify the module loads - TypeScript compilation ensures types are correct
    expect(authModule).toBeDefined();
  });
});
