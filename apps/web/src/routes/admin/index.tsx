import { createFileRoute, redirect } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useClerk,
  OrganizationSwitcher,
} from '@clerk/tanstack-react-start';
import { Button } from '../../components/ui/button';
import { LogOut } from 'lucide-react';
import { useAdminAuth } from '../../features/auth/hooks/use-admin';

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
  const { isAdmin, isLoading, needsOrgContext, error } = useAdminAuth();

  const handleSignOut = () => {
    clerk.signOut();
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin" />
      </SignedOut>
      <SignedIn>
        {isLoading ? (
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="flex items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <span className="ml-2">checking permissions...</span>
            </div>
          </div>
        ) : needsOrgContext ? (
          <div className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="mb-4 text-3xl font-[200]">select organization</h1>
              <p className="text-muted-foreground mb-8">
                you have admin access. please select your organization to
                continue.
              </p>
              <div className="flex justify-center">
                <OrganizationSwitcher
                  afterSelectOrganizationUrl="/admin"
                  hidePersonal={true}
                  appearance={{
                    elements: {
                      rootBox: 'w-full max-w-xs',
                      organizationSwitcherTrigger: 'w-full justify-center',
                    },
                  }}
                />
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                selecting an organization will activate your admin privileges
              </p>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="mb-4 text-3xl font-[200]">access denied</h1>
            <p className="text-muted-foreground mb-8">
              {error || 'you need admin privileges to access this area'}
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              sign out
            </Button>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex-1">
                <h1 className="mb-4 text-3xl font-[200]">writer portal</h1>
                <p className="text-muted-foreground">
                  create and manage your blog posts
                </p>
              </div>
              <div className="flex items-center gap-4">
                <OrganizationSwitcher
                  afterSelectOrganizationUrl="/admin"
                  appearance={{
                    elements: {
                      rootBox: 'w-auto',
                    },
                  }}
                />
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  sign out
                </Button>
              </div>
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
        )}
      </SignedIn>
    </>
  );
}
