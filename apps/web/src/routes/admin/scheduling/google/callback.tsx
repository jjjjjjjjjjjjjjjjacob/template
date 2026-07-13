import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAction } from 'convex/react';
import { api } from '@template/convex';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/admin/scheduling/google/callback')({
  component: GoogleSchedulingCallback,
});

function GoogleSchedulingCallback() {
  const navigate = useNavigate();
  const completeGoogleOAuth = useAction(api.scheduling.completeGoogleOAuth);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function complete() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error');
      if (oauthError) {
        const description = params.get('error_description');
        setError(description ? `${oauthError}: ${description}` : oauthError);
        return;
      }

      const code = params.get('code');
      const state = params.get('state');
      if (!code || !state) {
        setError('missing google oauth response values.');
        return;
      }

      try {
        const result = await completeGoogleOAuth({ code, state });
        if (!cancelled) {
          navigate({ to: result.redirectPath || '/admin/scheduling' });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [completeGoogleOAuth, navigate]);

  return (
    <div className="admin-page">
      <Card className="admin-card mx-auto w-full max-w-md">
        <CardContent className="space-y-5 p-6 text-center">
          {error ? (
            <>
              <div>
                <p className="admin-page-kicker">scheduling</p>
                <h1 className="text-2xl font-semibold">
                  google connection failed
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/admin/scheduling' })}
              >
                <ArrowLeft className="h-4 w-4" />
                back to scheduling
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>connecting google calendar...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
