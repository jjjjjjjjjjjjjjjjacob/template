import { createFileRoute, Outlet } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/tanstack-react-start';

export const Route = createFileRoute('/admin/projects')({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/projects" />
      </SignedOut>
      <SignedIn>
        <Outlet />
      </SignedIn>
    </>
  );
}
