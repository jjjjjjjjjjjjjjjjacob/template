import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/blog')({
  component: BlogLayoutPage,
});

function BlogLayoutPage() {
  return <Outlet />;
}
