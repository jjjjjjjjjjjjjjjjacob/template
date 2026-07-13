import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/resume')({
  component: ResumeLayout,
});

function ResumeLayout() {
  return <Outlet />;
}
