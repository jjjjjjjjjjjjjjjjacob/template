import { ReactNode } from 'react';
import { useAdminAuth } from '../hooks/use-admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'moderator';
  fallback?: ReactNode;
}

export function AdminGuard({
  children,
  requiredRole = 'moderator',
  fallback,
}: AdminGuardProps) {
  const { isAdmin, isModerator, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">checking permissions...</span>
      </div>
    );
  }

  const hasAccess = requiredRole === 'admin' ? isAdmin : isAdmin || isModerator;

  if (!hasAccess) {
    return (
      fallback || (
        <Alert variant="destructive">
          <AlertDescription>
            you do not have permission to access this area.
          </AlertDescription>
        </Alert>
      )
    );
  }

  return <>{children}</>;
}
