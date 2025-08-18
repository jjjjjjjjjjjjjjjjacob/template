export interface AuthUser {
  id: string;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
}

export interface OptimizedAuthResult {
  userId: string | null;
  token: string | null;
  fromCache?: boolean;
  computeTime?: number;
}

export interface AuthCache {
  userId: string | null;
  token: string | null;
  expires: number;
}

export interface AuthState {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isOnboarded?: boolean;
}

export interface AuthPromptConfig {
  title?: string;
  description?: string;
  actionText?: string;
}

export type AuthRoute = '/sign-in' | '/sign-up' | '/onboarding';
