import { createFileRoute } from '@tanstack/react-router';
import { BookingWidget } from '@/features/scheduling';

export const Route = createFileRoute('/book')({
  component: BookPage,
});

function BookPage() {
  return <BookingWidget />;
}
