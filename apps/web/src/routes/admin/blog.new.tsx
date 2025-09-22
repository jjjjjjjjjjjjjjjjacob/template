import { createFileRoute, redirect } from '@tanstack/react-router';

declare global {
  interface Window {
    Clerk?: { user?: unknown };
  }
}

export const Route = createFileRoute('/admin/blog/new')({
  beforeLoad: () => {
    if (typeof document !== 'undefined') {
      const isSignedIn = !!window.Clerk?.user;
      if (!isSignedIn) throw redirect({ to: '/sign-in' });
    }
  },
});
