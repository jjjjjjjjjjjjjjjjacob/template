import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useClerk,
  OrganizationSwitcher,
} from '@clerk/tanstack-react-start';
import { useAdminAuth } from '../../features/auth/hooks/use-admin';
import { Button } from '../../components/ui/button';
import { LogOut } from 'lucide-react';

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
  const clerk = useClerk();
  const { isAdmin, isLoading, needsOrgContext, error } = useAdminAuth();

  const handleSignOut = () => {
    clerk.signOut();
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/blog" />
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
          <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="mb-4 text-2xl font-[200]">organization required</h2>
            <p className="text-muted-foreground mb-6">
              select your organization to access blog management
            </p>
            <div className="flex justify-center">
              <OrganizationSwitcher
                afterSelectOrganizationUrl="/admin/blog"
                hidePersonal={true}
                appearance={{
                  elements: {
                    rootBox: 'w-full max-w-xs',
                    organizationSwitcherTrigger: 'w-full justify-center',
                  },
                }}
              />
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="mb-4 text-3xl font-[200]">access denied</h1>
            <p className="text-muted-foreground mb-8">
              {error || 'you need admin privileges to access blog management'}
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              sign out
            </Button>
          </div>
        ) : (
          <Outlet />
        )}
      </SignedIn>
    </>
  );
}
