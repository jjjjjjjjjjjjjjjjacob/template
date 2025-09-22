import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/tanstack-react-start';
import React from 'react';

declare global {
  interface Window {
    Clerk?: { user?: unknown };
  }
}

export const Route = createFileRoute('/admin/blog')({
  beforeLoad: () => {
    if (typeof document !== 'undefined') {
      const isSignedIn = !!window.Clerk?.user;
      if (!isSignedIn) throw redirect({ to: '/sign-in' });
    }
  },
  component: BlogLayoutPage,
});

function BlogLayoutPage() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/blog" />
      </SignedOut>
      <SignedIn>
        <Outlet />
      </SignedIn>
    </>
  );
}
