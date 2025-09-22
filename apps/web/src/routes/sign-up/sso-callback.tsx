import { createFileRoute } from '@tanstack/react-router';
import { AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/sign-up/sso-callback')({
  component: CallbackPage,
});

function CallbackPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
