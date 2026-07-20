import { createFileRoute } from '@tanstack/react-router';
import { BookingWidget } from '@/features/scheduling';
import { meetingTypeToEventTypeSlug } from '@/features/scheduling/utils';

type BookSearch = {
  meetingType?: string;
};

export const Route = createFileRoute('/book')({
  validateSearch: (search: Record<string, unknown>): BookSearch => ({
    meetingType:
      typeof search.meetingType === 'string' && search.meetingType.length > 0
        ? search.meetingType
        : undefined,
  }),
  component: BookPage,
});

function BookPage() {
  const { meetingType } = Route.useSearch();

  return (
    <BookingWidget
      initialEventTypeSlug={
        meetingType ? meetingTypeToEventTypeSlug(meetingType) : undefined
      }
    />
  );
}
