import { createFileRoute } from '@tanstack/react-router';
import { BookingWidget } from '@/features/scheduling';

export const Route = createFileRoute('/book/$eventTypeSlug')({
  component: EventTypeBookPage,
});

function EventTypeBookPage() {
  const { eventTypeSlug } = Route.useParams();
  return <BookingWidget initialEventTypeSlug={eventTypeSlug} />;
}
