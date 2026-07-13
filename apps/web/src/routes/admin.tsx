import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  OrganizationSwitcher,
  useClerk,
} from '@clerk/tanstack-react-start';
import type React from 'react';
import { LogOut, Shield, User } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/features/auth/hooks/use-admin';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const clerk = useClerk();
  const location = useLocation();
  const { isAdmin, isLoading, needsOrgContext, error } = useAdminAuth();

  const handleSignOut = () => {
    clerk.signOut();
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl={location.href} />
      </SignedOut>
      <SignedIn>
        {isLoading ? (
          <AdminGateState
            icon={<Shield className="h-6 w-6" aria-hidden="true" />}
            title="checking access"
            description="loading your admin session..."
          />
        ) : needsOrgContext ? (
          <AdminOrgState />
        ) : !isAdmin ? (
          <AdminGateState
            icon={<Shield className="h-6 w-6" aria-hidden="true" />}
            title="access denied"
            description={
              error || 'you need admin privileges to access this area'
            }
            action={
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                sign out
              </Button>
            }
          />
        ) : (
          <AdminShell onSignOut={handleSignOut}>
            <Outlet />
          </AdminShell>
        )}
      </SignedIn>
    </>
  );
}

function AdminOrgState() {
  return (
    <AdminGateState
      icon={<User className="h-6 w-6" aria-hidden="true" />}
      title="select organization"
      description="choose your organization to activate admin privileges"
      action={
        <OrganizationSwitcher
          afterSelectOrganizationUrl="/admin"
          hidePersonal={true}
          appearance={{
            elements: {
              rootBox: 'w-full max-w-xs',
              organizationSwitcherTrigger:
                'w-full justify-center border rounded-lg px-4 py-3',
            },
          }}
        />
      }
    />
  );
}

function AdminGateState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-shell min-h-dvh items-center justify-center px-4">
      <Card className="admin-card w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="admin-brand-mark mb-3 h-11 w-11">{icon}</div>
          <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <p className="text-muted-foreground">{description}</p>
          {action && <div className="flex justify-center">{action}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
