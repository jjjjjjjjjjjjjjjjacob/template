import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/admin/resume')({
  component: ResumeLayout,
});

function ResumeLayout() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/resume" />
      </SignedOut>
      <SignedIn>
        <Outlet />
      </SignedIn>
    </>
  );
}
