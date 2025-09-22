import { useAuth, useAuthService } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';

export function AuthTest() {
  const { user, isLoaded, isSignedIn, isOnboarded } = useAuth();
  const { ensureUserExists } = useAuthService();

  const handleEnsureUser = () => {
    ensureUserExists.mutate({});
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-100 p-4">
      <h2 className="text-xl font-light">auth test panel</h2>

      <div className="space-y-2">
        <h3 className="font-light">clerk status:</h3>
        <p>loaded: {isLoaded ? 'yes' : 'no'}</p>
        <p>signed in: {isSignedIn ? 'yes' : 'no'}</p>
        <p>user id: {user?.id || 'none'}</p>
        <p>username: {user?.username || 'none'}</p>
        <p>
          onboarded:{' '}
          {isOnboarded ? 'yes' : isOnboarded === false ? 'no' : 'unknown'}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="font-light">ensure user exists mutation:</h3>
        <Button
          onClick={handleEnsureUser}
          disabled={ensureUserExists.isPending}
          className="rounded bg-blue-500 px-3 py-1 text-white disabled:bg-gray-400"
        >
          {ensureUserExists.isPending ? 'creating...' : 'ensure user exists'}
        </Button>
        <p>status: {ensureUserExists.status}</p>
        <p>error: {ensureUserExists.error?.message || 'none'}</p>
        <pre className="overflow-auto rounded bg-white p-2 text-xs">
          {JSON.stringify(ensureUserExists.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
