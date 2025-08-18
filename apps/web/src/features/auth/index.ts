// Main auth hooks
export {
  useAuth,
  useAuthGuard,
  useCurrentUser,
  useAuthService,
  authUtils,
} from './hooks/use-auth';

// Auth components
export { AuthTest } from './components/auth-test';
export { AuthPromptDialog } from './components/auth-prompt-dialog';

// Auth types
export type {
  AuthUser,
  AuthState,
  AuthPromptConfig,
  AuthRoute,
  OptimizedAuthResult,
  AuthCache,
} from './types';

// Auth utilities (re-exported for convenience)
export { getOptimizedAuth, getNonBlockingAuth } from './lib/optimized-auth';
