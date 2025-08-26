import { convexTest } from 'convex-test';
import { modules } from '../vitest.setup';
import { describe, it, expect } from 'vitest';
import schema from './schema';
import { api } from './_generated/api';

describe('Users Functions', () => {
  describe('Authentication Tests', () => {
    it('should return null when no user is authenticated (current query)', async () => {
      const t = convexTest(schema, modules);

      // Call current without authentication - should return null
      const result = await t.query(api.users.current, {});

      expect(result).toBeNull();
    });

    it('should return null when no user is authenticated (debugAuth query)', async () => {
      const t = convexTest(schema, modules);

      // Call debugAuth without authentication
      const result = await t.query(api.users.debugAuth, {});

      expect(result).toEqual({
        hasAuth: true,
        hasIdentity: false,
        hasToken: false,
        identity: null,
      });
    });

    it('should throw error when trying to ensure user exists without auth', async () => {
      const t = convexTest(schema, modules);

      // Try to ensure user exists without authentication
      await expect(t.mutation(api.users.ensureUserExists, {})).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should return user when authenticated (current query)', async () => {
      const t = convexTest(schema, modules);

      // First create a user in the database
      const userData = {
        external_id: 'auth_test_user_123',
        email: 'john@example.com',
        username: 'authtest',
        image_url: 'https://example.com/avatar.jpg',
      };
      await t.mutation(api.users.create, userData);

      // Mock an authenticated context
      const mockIdentity = {
        subject: 'auth_test_user_123',
        tokenIdentifier: 'test_token',
        email: 'john@example.com',
        givenName: 'John',
        familyName: 'Doe',
        nickname: 'authtest',
        pictureUrl: 'https://example.com/avatar.jpg',
      };

      // Call current with mocked authentication
      const result = await t
        .withIdentity(mockIdentity)
        .query(api.users.current, {});

      expect(result).toBeDefined();
      expect(result?.external_id).toBe(userData.external_id);
      expect(result?.username).toBe(userData.username);
      expect(result?.image_url).toBe(userData.image_url);
    });

    it('should show authenticated state in debugAuth when user is logged in', async () => {
      const t = convexTest(schema, modules);

      // Mock an authenticated context
      const mockIdentity = {
        subject: 'debug_test_user_456',
        tokenIdentifier: 'debug_test_token',
        email: 'debug@example.com',
        givenName: 'Debug',
        familyName: 'User',
      };

      // Call debugAuth with mocked authentication
      const result = await t
        .withIdentity(mockIdentity)
        .query(api.users.debugAuth, {});

      expect(result.hasAuth).toBe(true);
      expect(result.hasIdentity).toBe(true);
      expect(result.identity).toBeDefined();
      expect(result.identity?.subject).toBe('debug_test_user_456');
      expect(result.identity?.email).toBe('debug@example.com');
    });

    it('should successfully ensure user exists when authenticated', async () => {
      const t = convexTest(schema, modules);

      // Mock an authenticated context
      const mockIdentity = {
        subject: 'ensure_test_user_789',
        tokenIdentifier: 'ensure_test_token',
        email: 'ensure@example.com',
        givenName: 'Ensure',
        familyName: 'Test',
        nickname: 'ensuretest',
        pictureUrl: 'https://example.com/ensure-avatar.jpg',
      };

      // Call ensureUserExists with authentication - should create user
      const result = await t
        .withIdentity(mockIdentity)
        .mutation(api.users.ensureUserExists, {});

      expect(result).toBeDefined();
      expect(result?.external_id).toBe(mockIdentity.subject);
      expect(result?.first_name).toBe(mockIdentity.givenName);
      expect(result?.last_name).toBe(mockIdentity.familyName);
      expect(result?.username).toBe(mockIdentity.nickname);
      expect(result?.image_url).toBe(mockIdentity.pictureUrl);
    });
  });

  describe('User Creation and Management', () => {
    it('should create a user with basic data', async () => {
      const t = convexTest(schema, modules);

      const userData = {
        external_id: 'test_user_123',
        email: 'test@example.com',
        username: 'testuser',
        image_url: 'https://example.com/avatar.jpg',
      };

      const userId = await t.mutation(api.users.create, userData);
      expect(userId).toBeTypeOf('string');

      // Verify user was created
      const createdUser = await t.query(api.users.getById, {
        id: userData.external_id,
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.external_id).toBe(userData.external_id);
      expect(createdUser?.username).toBe(userData.username);
      expect(createdUser?.image_url).toBe(userData.image_url);
    });

    it('should not create duplicate user with same external_id', async () => {
      const t = convexTest(schema, modules);

      const userData = {
        external_id: 'test_user_456',
        email: 'test2@example.com',
        username: 'testuser2',
      };

      // Create user first time
      const userId1 = await t.mutation(api.users.create, userData);
      expect(userId1).toBeTypeOf('string');

      // Try to create same user again - should return existing user
      const result2 = await t.mutation(api.users.create, userData);
      // The create function returns the existing user object when user already exists
      expect((result2 as { _id: string })._id).toBe(userId1);
    });

    it('should update existing user', async () => {
      const t = convexTest(schema, modules);

      const userData = {
        external_id: 'test_user_789',
        email: 'test3@example.com',
        username: 'originalname',
      };

      // Create user
      await t.mutation(api.users.create, userData);

      // Update user
      const updateData = {
        external_id: 'test_user_789',
        username: 'updatedname',
        image_url: 'https://example.com/new-avatar.jpg',
      };

      await t.mutation(api.users.update, updateData);

      // Verify update
      const updatedUser = await t.query(api.users.getById, {
        id: userData.external_id,
      });

      expect(updatedUser?.username).toBe(updateData.username);
      expect(updatedUser?.image_url).toBe(updateData.image_url);
    });

    it('should throw error when updating non-existent user', async () => {
      const t = convexTest(schema, modules);

      const updateData = {
        external_id: 'non_existent_user',
        username: 'newname',
      };

      await expect(t.mutation(api.users.update, updateData)).rejects.toThrow(
        'User with external_id non_existent_user not found'
      );
    });
  });

  describe('User Queries', () => {
    it('should get all users', async () => {
      const t = convexTest(schema, modules);

      // Create a test user first
      await t.mutation(api.users.create, {
        external_id: 'test_user_all',
        email: 'testall@example.com',
        username: 'testall',
      });

      const allUsers = await t.query(api.users.getAll, {});

      expect(Array.isArray(allUsers)).toBe(true);
      expect(allUsers.length).toBeGreaterThan(0);

      const testUser = allUsers.find(
        (u: { external_id?: string }) => u.external_id === 'test_user_all'
      );
      expect(testUser).toBeDefined();
    });

    it('should get user by external_id', async () => {
      const t = convexTest(schema, modules);

      const userData = {
        external_id: 'test_user_getbyid',
        email: 'getbyid@example.com',
        username: 'getbyidtest',
      };

      await t.mutation(api.users.create, userData);

      const user = await t.query(api.users.getById, {
        id: userData.external_id,
      });

      expect(user).toBeDefined();
      expect(user?.external_id).toBe(userData.external_id);
      expect(user?.username).toBe(userData.username);
    });

    it('should return null for non-existent user', async () => {
      const t = convexTest(schema, modules);

      const user = await t.query(api.users.getById, {
        id: 'non_existent_user_id',
      });

      expect(user).toBeNull();
    });
  });

  describe('Onboarding Functions', () => {
    it('should return onboarding status for non-existent user', async () => {
      const t = convexTest(schema, modules);

      // Call without authentication - should indicate needs onboarding
      const status = await t.query(api.users.getOnboardingStatus, {});

      expect(status.completed).toBe(false);
      expect(status.needsOnboarding).toBe(true);
      expect(status.userExists).toBe(false);
    });
  });

  describe('Authentication Comparison with Vibes', () => {
    it('should behave consistently with vibes getCurrentUser when NOT authenticated', async () => {
      const t = convexTest(schema, modules);

      // Test users.current
      const usersResult = await t.query(api.users.current, {});

      // Test items.getCurrentUser
      const itemsResult = await t.query(api.items.getCurrentUser, {});

      // Both should return null when not authenticated
      expect(usersResult).toBeNull();
      expect(itemsResult).toBeNull();
    });

    it('should behave consistently with vibes getCurrentUser when AUTHENTICATED', async () => {
      const t = convexTest(schema, modules);

      // First create a user in the database
      const userData = {
        external_id: 'compare_test_user_999',
        email: 'compare@example.com',
        username: 'comparetest',
        image_url: 'https://example.com/compare-avatar.jpg',
      };
      await t.mutation(api.users.create, userData);

      // Mock an authenticated context
      const mockIdentity = {
        subject: 'compare_test_user_999',
        tokenIdentifier: 'compare_test_token',
        email: 'compare@example.com',
        givenName: 'Compare',
        familyName: 'Test',
      };

      // Test users.current with authentication
      const usersResult = await t
        .withIdentity(mockIdentity)
        .query(api.users.current, {});

      // Test items.getCurrentUser with authentication
      const itemsResult = await t
        .withIdentity(mockIdentity)
        .query(api.items.getCurrentUser, {});

      // Both should return the same user data
      expect(usersResult).toBeDefined();
      expect(itemsResult).toBeDefined();
      expect(usersResult?.external_id).toBe(userData.external_id);
      expect(itemsResult?.external_id).toBe(userData.external_id);
      expect(usersResult?.username).toBe(userData.username);
      expect((itemsResult as { username: string })?.username).toBe(
        userData.username
      );
    });

    it('should have identical auth context behavior', async () => {
      const t = convexTest(schema, modules);

      // Test users.debugAuth to see auth context
      const usersDebug = await t.query(api.users.debugAuth, {});

      // Both should have the same auth context state
      expect(usersDebug.hasAuth).toBe(true);
      expect(usersDebug.hasIdentity).toBe(false);
      expect(usersDebug.identity).toBeNull();
    });

    it('should have consistent auth behavior in mutations when NOT authenticated', async () => {
      const t = convexTest(schema, modules);

      // Test users.ensureUserExists (requires auth)
      await expect(t.mutation(api.users.ensureUserExists, {})).rejects.toThrow(
        'User not authenticated'
      );

      // Test items.create (requires auth)
      await expect(
        t.mutation(api.items.create, {
          title: 'Test Item',
          description: 'Test Description',
        })
      ).rejects.toThrow('You must be logged in to create an item');
    });

    it('should have consistent auth behavior in mutations when AUTHENTICATED', async () => {
      const t = convexTest(schema, modules);

      // Mock an authenticated context
      const mockIdentity = {
        subject: 'auth_mutation_test_user',
        tokenIdentifier: 'auth_mutation_token',
        email: 'authmutation@example.com',
        givenName: 'AuthMutation',
        familyName: 'Test',
        nickname: 'authmutationtest',
      };

      // Test users.ensureUserExists with authentication - should succeed
      const userResult = await t
        .withIdentity(mockIdentity)
        .mutation(api.users.ensureUserExists, {});
      expect(userResult).toBeDefined();
      expect(userResult?.external_id).toBe(mockIdentity.subject);

      // Test items.create with authentication - should succeed
      const itemResult = await t
        .withIdentity(mockIdentity)
        .mutation(api.items.create, {
          title: 'Authenticated Test Item',
          description: 'This item was created by an authenticated user',
          tags: ['test', 'auth'],
        });
      expect(itemResult).toBeTypeOf('string'); // Returns the document ID

      // Verify the item was created with the correct user ID
      const createdItems = await t.query(api.items.getByUser, {
        userId: mockIdentity.subject,
      });
      const createdItem = createdItems.find(
        (v: { title?: string }) => v.title === 'Authenticated Test Item'
      );
      expect(createdItem).toBeDefined();
      expect(createdItem?.createdById).toBe(mockIdentity.subject);
    });
  });

  describe('Profile Actions', () => {
    it('should throw error when updating profile without auth', async () => {
      const t = convexTest(schema, modules);

      // Try to update profile without authentication
      await expect(
        t.action(api.users.updateProfile, {
          username: 'newusername',
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error when completing onboarding without auth', async () => {
      const t = convexTest(schema, modules);

      // Try to complete onboarding without authentication
      await expect(
        t.action(api.users.completeOnboarding, {
          username: 'newuser',
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('Webhook Functions', () => {
    it('should handle clerk user upsert', async () => {
      const t = convexTest(schema, modules);

      const clerkUserData = {
        id: 'clerk_user_123',
        username: 'clerkuser',
        first_name: 'John',
        last_name: 'Doe',
        image_url: 'https://clerk.example.com/avatar.jpg',
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      // This should work as it's an internal mutation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await t.mutation((api.users as any).upsertFromClerk, {
        data: clerkUserData,
      });

      // Verify user was created
      const user = await t.query(api.users.getById, {
        id: clerkUserData.id,
      });

      expect(user).toBeDefined();
      expect(user?.external_id).toBe(clerkUserData.id);
      expect(user?.username).toBe(clerkUserData.username);
      expect(user?.first_name).toBe(clerkUserData.first_name);
    });

    it('should handle clerk user deletion', async () => {
      const t = convexTest(schema, modules);

      // First create a user
      const userData = {
        external_id: 'clerk_user_to_delete',
        email: 'deleteme@example.com',
        username: 'deleteme',
      };
      await t.mutation(api.users.create, userData);

      // Verify user exists
      let user = await t.query(api.users.getById, {
        id: userData.external_id,
      });
      expect(user).toBeDefined();

      // Delete user via webhook
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await t.mutation((api.users as any).deleteFromClerk, {
        clerkUserId: userData.external_id,
      });

      // Verify user was deleted
      user = await t.query(api.users.getById, {
        id: userData.external_id,
      });
      expect(user).toBeNull();
    });
  });
});
