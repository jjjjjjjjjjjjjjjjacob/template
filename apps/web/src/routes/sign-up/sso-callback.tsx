import { AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import { SiteAuthShell } from '@/components/site/auth-shell';

export const Route = createFileRoute('/sign-up/sso-callback')({
  component: CallbackPage,
});

function CallbackPage() {
  return (
    <SiteAuthShell
      eyebrow="private route / callback"
      title="Completing sign up"
      description="Your identity provider is returning you to finish account setup."
    >
      <div className="site-auth-callback">
        <p className="site-mono">verifying session...</p>
        <AuthenticateWithRedirectCallback />
      </div>
    </SiteAuthShell>
  );
}
