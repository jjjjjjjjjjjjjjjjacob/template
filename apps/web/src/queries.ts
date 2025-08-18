// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  convexQuery,
  useConvexMutation,
  useConvexAction,
} from '@convex-dev/react-query';
import { api } from '@template/convex';
// import { useAuth } from '@clerk/tanstack-react-start';

// template QUERIES

// Query to get all items (simple version for performance)
export function useItems() {
  return useQuery({
    ...convexQuery(api.items.getAllSimple, {}),
  });
}

// Query to get paginated items with full details
export function useItemsPaginated(
  limit?: number,
  options?: { enabled?: boolean; cursor?: string }
) {
  return useQuery({
    ...convexQuery(api.items.getAll, {
      limit,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false,
  });
}

// Query to get an item by ID
export function useItem(id: string) {
  return useQuery({
    ...convexQuery(api.items.getById, { id }),
    enabled: !!id,
  });
}

// Query to get items by user
export function useUserItems(userId: string) {
  return useQuery({
    ...convexQuery(api.items.getByUser, { userId }),
    enabled: !!userId,
  });
}

// Query to get items a user has reacted to
export function useUserReactedItems(userId: string) {
  return useQuery({
    ...convexQuery(api.items.getUserRatedItems, { userId }),
    enabled: !!userId,
  });
}


// Mutation to create an item
export function useCreateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.items.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}




// Query to get all users
export function useUsers() {
  return useQuery({
    ...convexQuery(api.users.getAll, {}),
  });
}

// Query to get user by ID
export function useUser(id: string) {
  return useQuery({
    ...convexQuery(api.users.getById, { id }),
    enabled: !!id,
  });
}

// Query to get user by username
export function useUserByUsername(username: string) {
  return useQuery({
    ...convexQuery(api.users.getByUsername, { username }),
    enabled: !!username,
  });
}

// Query to get current user from Convex
export function useCurrentUser() {
  return useQuery({
    ...convexQuery(api.users.current, {}),
    select: (data) => {
      // console.log('data', data);
      return data;
    },
  });
}

// Mutation to create a user
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Mutation to update a user
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Action to update user profile (syncs with both Convex and Clerk)
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.updateProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Query to get items by tag
export function useItemsByTag(tag: string, limit?: number) {
  return useQuery({
    ...convexQuery(api.items.getByTag, { tag, limit }),
    enabled: !!tag,
  });
}

// Query to get all available tags
export function useAllTags() {
  return useQuery({
    ...convexQuery(api.items.getAllTags, {}),
  });
}

// Query to get top-rated items
export function useTopRatedItems(
  limit?: number,
  options?: { enabled?: boolean; cursor?: string }
) {
  return useQuery({
    ...convexQuery(api.items.getTopRated, {
      limit,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false,
  });
}

// Query to get personalized items for a user (based on their interactions)
export function usePersonalizedItems(
  userId?: string,
  options?: { enabled?: boolean; cursor?: string; limit?: number }
) {
  return useQuery({
    // For now, fall back to top-rated items - this will be enhanced with a proper recommendation algorithm
    ...convexQuery(api.items.getTopRated, {
      limit: options?.limit || 20,
      cursor: options?.cursor,
    }),
    enabled: options?.enabled !== false && !!userId,
  });
}

// ONBOARDING QUERIES

// Debug authentication (temporary)
export function useDebugAuth() {
  return useQuery({
    ...convexQuery(api.users.debugAuth, {}),
  });
}

// Query to get user onboarding status
export function useOnboardingStatus() {
  return useQuery({
    ...convexQuery(api.users.getOnboardingStatus, {}),
  });
}

// Action to update onboarding data (syncs with both Convex and Clerk)
export function useUpdateOnboardingDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.updateOnboardingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Action to complete onboarding (syncs with both Convex and Clerk)
export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexAction(api.users.completeOnboarding),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// Mutation to ensure user exists in Convex
export function useEnsureUserExistsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: useConvexMutation(api.users.ensureUserExists),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}








// Legacy stub for unused NewColumn component
export function useCreateColumnMutation() {
  return useMutation({
    mutationFn: async (_args: { boardId: string; name: string }) => {
      throw new Error(
        'useCreateColumnMutation is deprecated and not implemented'
      );
    },
  });
}

