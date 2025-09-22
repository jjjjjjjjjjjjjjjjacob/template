import { createFileRoute } from '@tanstack/react-router';
import { SignUp } from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-light">create account</h1>
      <div className="bg-card rounded-lg border p-2">
        <SignUp
          signInUrl="/sign-in"
          appearance={{ variables: { colorPrimary: '#222' } }}
        />
      </div>
    </div>
  );
}
