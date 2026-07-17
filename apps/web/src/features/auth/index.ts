// Main auth hooks


// Auth components
export { AuthPromptDialog } from './components/auth-prompt-dialog';
export {
  authUtils,
  useAuth,
  useAuthGuard,
  useAuthService,
  useCurrentUser,
} from './hooks/use-auth';
// Auth utilities (re-exported for convenience)
export { getNonBlockingAuth, getOptimizedAuth } from './lib/optimized-auth';
// Auth types
export type {
  AuthCache,
  AuthPromptConfig,
  AuthRoute,
  AuthState,
  AuthUser,
  OptimizedAuthResult,
} from './types';
