import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { AdminSchedulingPage } from '@/features/scheduling';

export const Route = createFileRoute('/admin/scheduling')({
  component: SchedulingAdminRoute,
});

function SchedulingAdminRoute() {
  const location = useLocation();
  const isNestedSchedulingRoute = location.pathname !== '/admin/scheduling';

  return isNestedSchedulingRoute ? <Outlet /> : <AdminSchedulingPage />;
}
