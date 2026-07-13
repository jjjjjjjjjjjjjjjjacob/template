# @template/scheduler

Headless scheduling contracts plus shadcn-compatible React booking components.

The package does not depend on Convex. A host app supplies a `SchedulerClient`
that can call Convex, REST endpoints, server actions, or any other backend.

## Public Surfaces

- `@template/scheduler`
  - Types: `SchedulerClient`, `SchedulerEventType`, `AvailableSlot`,
    `BookingResult`, `ManagedBooking`, `SchedulerQuestion`,
    `SchedulerQuestionResponse`, `SchedulerReminder`
  - Helpers: `createCallbackSchedulerClient`, `groupSlotsByDay`,
    `formatFullDateTime`, `formatTimeRange`
- `@template/scheduler/react`
  - `SchedulerProvider`
  - `BookingFlow`
  - `ManageBookingFlow`
  - shadcn-style primitives: `Button`, `Badge`, `Input`, `Textarea`, `Label`

## Headless Usage

```tsx
import { createCallbackSchedulerClient } from '@template/scheduler';
import { BookingFlow } from '@template/scheduler/react';

const scheduler = createCallbackSchedulerClient({
  listEventTypes: () =>
    fetch('/api/scheduling/event-types').then((r) => r.json()),
  getAvailability: (input) =>
    fetch('/api/scheduling/availability', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.json()),
  createBooking: (input) =>
    fetch('/api/scheduling/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.json()),
  getBookingByToken: (input) =>
    fetch('/api/scheduling/bookings/token', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.json()),
  cancelBooking: (input) =>
    fetch('/api/scheduling/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  rescheduleBooking: (input) =>
    fetch('/api/scheduling/bookings/reschedule', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
});

export function BookingPage() {
  return (
    <BookingFlow
      client={scheduler}
      callbacks={{
        onBookingConfirmed: (booking) => {
          console.log('confirmed', booking);
        },
      }}
    />
  );
}
```

## This Repo's Convex Adapter

The web app implements the package contract in
`apps/web/src/features/scheduling/convex-scheduler-client.ts`, then renders the
package components from the `/book`, `/book/cancel`, and `/book/reschedule`
routes.

## Custom Invitee Questions

Event types can include optional `questions`. The React booking components render
them automatically and pass answers to `createBooking` as `questionResponses`.
Headless clients should submit the same shape:

```ts
await scheduler.createBooking({
  eventTypeSlug: 'intro',
  startTime,
  timeZone: 'America/New_York',
  inviteeName: 'Ada Lovelace',
  inviteeEmail: 'ada@example.com',
  questionResponses: [
    {
      questionId: 'project-context',
      value: 'I want to review an onboarding flow.',
    },
  ],
});
```

The Convex adapter validates answers against the selected event type, stores the
normalized labels and values on the booking, and adds them to the Google Calendar
event description.

## Calendar Reminders

Event types can include optional `reminders` that are passed to Google Calendar
when the booking event is created:

```ts
{
  reminders: [
    { method: 'email', minutes: 24 * 60 },
    { method: 'popup', minutes: 10 },
  ],
}
```

The Convex implementation allows up to five reminders per event type. Omit the
field to use the default 24 hour email and 10 minute popup reminders, or pass an
empty array to create calendar events without event-specific reminders.
