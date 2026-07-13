import { createFileRoute } from '@tanstack/react-router';
import { ManageBookingPage } from '@/features/scheduling';

export const Route = createFileRoute('/book/reschedule')({
  component: RescheduleBookingPage,
});

function RescheduleBookingPage() {
  return <ManageBookingPage mode="reschedule" />;
}
