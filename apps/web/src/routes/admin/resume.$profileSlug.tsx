import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/resume/$profileSlug')({
  component: () => null,
});
