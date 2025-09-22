import { createFileRoute } from '@tanstack/react-router';
import { SignIn } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-light">sign in</h1>
      <div className="bg-card w-full rounded-lg border p-2">
        <SignIn
          signUpUrl="/sign-up"
          appearance={{ variables: { colorPrimary: '#222' } }}
        />
      </div>
    </div>
  );
}
