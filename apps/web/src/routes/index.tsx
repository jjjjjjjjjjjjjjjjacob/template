import { createFileRoute } from '@tanstack/react-router';
import { SiteLanding } from '@/components/site/landing';

export const Route = createFileRoute('/')({
  component: SiteLanding,
});
