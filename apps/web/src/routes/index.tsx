import { createFileRoute } from '@tanstack/react-router';
import { IndexLanding } from '@/components/alt-3b';

export const Route = createFileRoute('/')({
  component: IndexLanding,
});
