import * as React from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@template/backend';
import type {
  AvailabilityResult,
  BookingResult,
  ManagedBooking,
  SchedulerClient,
  SchedulerEventType,
} from '@template/scheduler';

export function useConvexSchedulerClient(): SchedulerClient {
  const eventTypes = useQuery(api.scheduling.listEventTypes, {});
  const getAvailability = useAction(api.scheduling.getAvailability);
  const createBooking = useAction(api.scheduling.createBooking);
  const getBookingByToken = useAction(api.scheduling.getBookingByToken);
  const cancelBooking = useAction(api.scheduling.cancelBooking);
  const rescheduleBooking = useAction(api.scheduling.rescheduleBooking);

  return React.useMemo(
    () => ({
      listEventTypes: async () => (eventTypes ?? []) as SchedulerEventType[],
      getAvailability: async (input) =>
        (await getAvailability(input)) as AvailabilityResult,
      createBooking: async (input) =>
        (await createBooking(input)) as BookingResult,
      getBookingByToken: async (input) =>
        (await getBookingByToken(input)) as ManagedBooking | null,
      cancelBooking: async (input) => await cancelBooking(input),
      rescheduleBooking: async (input) => await rescheduleBooking(input),
    }),
    [
      cancelBooking,
      createBooking,
      eventTypes,
      getAvailability,
      getBookingByToken,
      rescheduleBooking,
    ]
  );
}
