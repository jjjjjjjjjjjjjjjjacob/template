import { createFileRoute } from '@tanstack/react-router';
import { ManageBookingPage } from '@/features/scheduling';

export const Route = createFileRoute('/book/cancel')({
  component: CancelBookingPage,
});

function CancelBookingPage() {
  return <ManageBookingPage mode="cancel" />;
}
