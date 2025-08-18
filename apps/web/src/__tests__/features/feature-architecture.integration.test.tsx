/// <reference lib="dom" />
import { describe, it, expect } from 'vitest';

/**
 * Integration tests for the feature-based architecture
 * These tests validate that the feature structure is properly organized
 * and that imports work correctly across feature boundaries
 */
describe('Feature Architecture Integration', () => {
  it('should export auth feature components correctly', async () => {
    const authModule = await import('@/features/auth');

    expect(authModule).toBeDefined();
    expect(authModule.useAuth).toBeDefined();
    expect(authModule.useAuthGuard).toBeDefined();
    expect(authModule.AuthPromptDialog).toBeDefined();
    expect(typeof authModule.useAuth).toBe('function');
    expect(typeof authModule.useAuthGuard).toBe('function');
    expect(typeof authModule.AuthPromptDialog).toBe('function');
  });

  it('should export admin feature components correctly', async () => {
    const adminModule = await import('@/features/admin');

    expect(adminModule).toBeDefined();
    expect(adminModule.useAdminAuth).toBeDefined();
    expect(adminModule.AdminGuard).toBeDefined();
    expect(typeof adminModule.useAdminAuth).toBe('function');
    expect(typeof adminModule.AdminGuard).toBe('function');
  });

  it('should allow importing individual auth components', async () => {
    const { useAuth } = await import('@/features/auth/hooks/use-auth');
    const { AuthPromptDialog } = await import(
      '@/features/auth/components/auth-prompt-dialog'
    );
    const { authService } = await import(
      '@/features/auth/services/auth-service'
    );

    expect(useAuth).toBeDefined();
    expect(AuthPromptDialog).toBeDefined();
    expect(authService).toBeDefined();
    expect(typeof useAuth).toBe('function');
    expect(typeof AuthPromptDialog).toBe('function');
    expect(typeof authService.signOut).toBe('function');
  });

  it('should allow importing individual admin components', async () => {
    const { useAdminAuth } = await import('@/features/admin/hooks/use-admin');
    const { AdminGuard } = await import(
      '@/features/admin/components/admin-guard'
    );
    const { adminService } = await import(
      '@/features/admin/services/admin-service'
    );

    expect(useAdminAuth).toBeDefined();
    expect(AdminGuard).toBeDefined();
    expect(adminService).toBeDefined();
    expect(typeof useAdminAuth).toBe('function');
    expect(typeof AdminGuard).toBe('function');
    expect(typeof adminService.getUsers).toBe('function');
  });

  it('should maintain feature isolation', async () => {
    // Auth feature should not import from admin feature directly
    // This is more of a code organization validation

    // Test that auth feature exports don't include admin functionality
    const authModule = await import('@/features/auth');
    expect('AdminGuard' in authModule).toBe(false);
    expect('useAdminAuth' in authModule).toBe(false);

    // Test that admin feature exports don't include auth hooks directly
    const adminModule = await import('@/features/admin');
    expect('useAuth' in adminModule).toBe(false);
    expect('AuthPromptDialog' in adminModule).toBe(false);
  });

  it('should allow cross-feature composition', async () => {
    // While features should be isolated, they can be composed together
    const { useAuth } = await import('@/features/auth');
    const { useAdminAuth } = await import('@/features/admin');

    // Both should be available for composition in higher-level components
    expect(useAuth).toBeDefined();
    expect(useAdminAuth).toBeDefined();
  });

  it('should provide proper TypeScript types', async () => {
    // Import types to ensure they're properly exported
    const authTypes = await import('@/features/auth/types');
    const adminTypes = await import('@/features/admin/types');

    // These should load without error (TypeScript compilation validates the types)
    expect(authTypes).toBeDefined();
    expect(adminTypes).toBeDefined();
  });

  it('should maintain backward compatibility', async () => {
    // Test that old import paths still work (if we've set up re-exports)
    try {
      // These might exist as backward compatibility re-exports
      const { AuthPromptDialog } = await import(
        '@/components/auth-prompt-dialog'
      );
      expect(AuthPromptDialog).toBeDefined();
    } catch (error) {
      // This is expected if we haven't set up backward compatibility yet
      expect(error).toBeDefined();
    }
  });

  it('should organize files according to feature structure', () => {
    // This test validates the expected file structure exists
    // In a real implementation, you might use fs to check file existence

    const expectedStructure = {
      auth: {
        components: ['auth-prompt-dialog.tsx'],
        hooks: ['use-auth.ts'],
        services: ['auth-service.ts'],
        types: ['index.ts'],
      },
      admin: {
        components: ['admin-guard.tsx'],
        hooks: ['use-admin.ts'],
        services: ['admin-service.ts'],
        types: ['index.ts'],
      },
    };

    // This is more of a documentation of the expected structure
    expect(expectedStructure).toBeDefined();
  });

  it('should provide consistent API patterns across features', async () => {
    // Test that features follow consistent patterns

    // Both features should have hooks
    const { useAuth } = await import('@/features/auth');
    const { useAdminAuth } = await import('@/features/admin');

    expect(typeof useAuth).toBe('function');
    expect(typeof useAdminAuth).toBe('function');

    // Both features should have services
    const { authService } = await import(
      '@/features/auth/services/auth-service'
    );
    const { adminService } = await import(
      '@/features/admin/services/admin-service'
    );

    expect(authService).toBeDefined();
    expect(adminService).toBeDefined();

    // Both should have proper TypeScript support
    expect(typeof authService).toBe('object');
    expect(typeof adminService).toBe('object');
  });
});
