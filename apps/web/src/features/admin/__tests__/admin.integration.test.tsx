/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils';
import { useAdminAuth } from '../hooks/use-admin';
import { AdminGuard } from '../components/admin-guard';
import {
  setupAuthForIntegrationTest,
  testData,
} from '@/test-utils/integration-setup';

// Test component that uses the admin feature
function TestAdminComponent() {
  const { isAdmin, isModerator, hasPermission } = useAdminAuth();

  return (
    <div data-testid="admin-component">
      <div data-testid="admin-status">{isAdmin ? 'Admin' : 'Not Admin'}</div>
      <div data-testid="moderator-status">
        {isModerator ? 'Moderator' : 'Not Moderator'}
      </div>
      <div data-testid="user-read-permission">
        {hasPermission('users.read') ? 'Can read users' : 'Cannot read users'}
      </div>
      <div data-testid="user-write-permission">
        {hasPermission('users.write')
          ? 'Can write users'
          : 'Cannot write users'}
      </div>
      <div data-testid="content-moderate-permission">
        {hasPermission('content.moderate') ? 'Can moderate' : 'Cannot moderate'}
      </div>
    </div>
  );
}

// Test component with admin guard
function TestAdminGuardComponent() {
  return (
    <div>
      <AdminGuard
        permissions={['users.read']}
        fallback={<div data-testid="admin-guard-denied">Access denied</div>}
      >
        <div data-testid="admin-guard-allowed">Admin content</div>
      </AdminGuard>
    </div>
  );
}

describe('Admin Feature Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles admin user correctly', async () => {
    const authState = setupAuthForIntegrationTest('admin');

    renderWithProviders(<TestAdminComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-status')).toHaveTextContent('Admin');
      expect(screen.getByTestId('user-read-permission')).toHaveTextContent(
        'Can read users'
      );
      expect(screen.getByTestId('user-write-permission')).toHaveTextContent(
        'Can write users'
      );
      expect(
        screen.getByTestId('content-moderate-permission')
      ).toHaveTextContent('Can moderate');
    });
  });

  it('handles moderator user correctly', async () => {
    const moderatorAuth = {
      isSignedIn: true,
      isLoaded: true,
      user: testData.users.moderator(),
    };

    renderWithProviders(<TestAdminComponent />, {
      wrapperOptions: { auth: moderatorAuth },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-status')).toHaveTextContent('Not Admin');
      expect(screen.getByTestId('moderator-status')).toHaveTextContent(
        'Moderator'
      );
      expect(screen.getByTestId('user-read-permission')).toHaveTextContent(
        'Can read users'
      );
      expect(screen.getByTestId('user-write-permission')).toHaveTextContent(
        'Cannot write users'
      );
      expect(
        screen.getByTestId('content-moderate-permission')
      ).toHaveTextContent('Can moderate');
    });
  });

  it('handles regular user correctly', async () => {
    const authState = setupAuthForIntegrationTest('signed-in');

    renderWithProviders(<TestAdminComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-status')).toHaveTextContent('Not Admin');
      expect(screen.getByTestId('moderator-status')).toHaveTextContent(
        'Not Moderator'
      );
      expect(screen.getByTestId('user-read-permission')).toHaveTextContent(
        'Cannot read users'
      );
      expect(screen.getByTestId('user-write-permission')).toHaveTextContent(
        'Cannot write users'
      );
      expect(
        screen.getByTestId('content-moderate-permission')
      ).toHaveTextContent('Cannot moderate');
    });
  });

  it('handles signed-out user correctly', async () => {
    const authState = setupAuthForIntegrationTest('signed-out');

    renderWithProviders(<TestAdminComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-status')).toHaveTextContent('Not Admin');
      expect(screen.getByTestId('moderator-status')).toHaveTextContent(
        'Not Moderator'
      );
      expect(screen.getByTestId('user-read-permission')).toHaveTextContent(
        'Cannot read users'
      );
      expect(screen.getByTestId('user-write-permission')).toHaveTextContent(
        'Cannot write users'
      );
      expect(
        screen.getByTestId('content-moderate-permission')
      ).toHaveTextContent('Cannot moderate');
    });
  });

  it('admin guard allows access for admin users', async () => {
    const authState = setupAuthForIntegrationTest('admin');

    renderWithProviders(<TestAdminGuardComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-guard-allowed')).toBeInTheDocument();
      expect(screen.getByText('Admin content')).toBeInTheDocument();
      expect(
        screen.queryByTestId('admin-guard-denied')
      ).not.toBeInTheDocument();
    });
  });

  it('admin guard denies access for regular users', async () => {
    const authState = setupAuthForIntegrationTest('signed-in');

    renderWithProviders(<TestAdminGuardComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-guard-denied')).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(
        screen.queryByTestId('admin-guard-allowed')
      ).not.toBeInTheDocument();
    });
  });

  it('admin guard denies access for signed-out users', async () => {
    const authState = setupAuthForIntegrationTest('signed-out');

    renderWithProviders(<TestAdminGuardComponent />, {
      wrapperOptions: { auth: authState },
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-guard-denied')).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(
        screen.queryByTestId('admin-guard-allowed')
      ).not.toBeInTheDocument();
    });
  });
});

// Test the admin service integration
describe('Admin Service Integration', () => {
  it('should provide admin services through feature exports', async () => {
    // Test that the admin feature properly exports its services
    const { adminService } = await import('../services/admin-service');

    expect(adminService).toBeDefined();
    expect(typeof adminService.getUsers).toBe('function');
    expect(typeof adminService.updateUserRole).toBe('function');
    expect(typeof adminService.getUserStats).toBe('function');
  });

  it('should provide admin hooks through feature exports', async () => {
    // Test that the admin feature properly exports its hooks
    const { useAdminAuth } = await import('../index');

    expect(useAdminAuth).toBeDefined();
    expect(typeof useAdminAuth).toBe('function');
  });

  it('should provide admin components through feature exports', async () => {
    // Test that components are properly exported
    const { AdminGuard } = await import('../components/admin-guard');

    expect(AdminGuard).toBeDefined();
    expect(typeof AdminGuard).toBe('function');
  });

  it('should provide admin types through feature exports', async () => {
    // Test that types are properly exported (this is mainly a compilation test)
    const adminModule = await import('../types');

    // Just verify the module loads - TypeScript compilation ensures types are correct
    expect(adminModule).toBeDefined();
  });
});
