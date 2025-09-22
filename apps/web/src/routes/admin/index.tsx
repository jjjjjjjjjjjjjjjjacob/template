import { createFileRoute, redirect } from '@tanstack/react-router';
// Admin route placeholder
import React from 'react';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useClerk,
} from '@clerk/tanstack-react-start';
import { Button } from '../../components/ui/button';
import { LogOut } from 'lucide-react';

declare global {
  interface Window {
    Clerk?: { user?: unknown };
  }
}

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    if (typeof document !== 'undefined') {
      const isSignedIn = !!window.Clerk?.user;
      if (!isSignedIn) throw redirect({ to: '/sign-in' });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const clerk = useClerk();

  const handleSignOut = () => {
    clerk.signOut();
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin" />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-start justify-between">
            <div className="flex-1 text-center">
              <h1 className="mb-4 text-3xl font-[200]">writer portal</h1>
              <p className="text-muted-foreground mb-8">
                create and manage your blog posts
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              sign out
            </Button>
          </div>

          <div className="mx-auto max-w-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="/blog"
                className="hover:bg-muted/50 block rounded-lg border p-6 transition-colors"
              >
                <h2 className="mb-2 text-lg font-[200]">view blog</h2>
                <p className="text-muted-foreground text-sm">
                  see your published posts as readers do
                </p>
              </a>

              <a
                href="/admin/blog"
                className="hover:bg-muted/50 block rounded-lg border p-6 transition-colors"
              >
                <h2 className="mb-2 text-lg font-[200]">manage posts</h2>
                <p className="text-muted-foreground text-sm">
                  create, edit, and publish blog posts
                </p>
              </a>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
