import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/projects/$projectId')({
  component: () => null,
});
