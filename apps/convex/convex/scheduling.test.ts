import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { modules } from '../vitest.setup';
import schema from './schema';
import { api, internal } from './_generated/api';

const adminIdentity = {
  subject: 'admin_user',
  tokenIdentifier: 'admin_token',
  email: 'admin@example.com',
  role: 'admin',
};

describe('Scheduling Functions', () => {
  it('seeds default event types and weekday availability for admins', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});

    const eventTypes = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });
    const dashboard = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getAdminDashboard, {});

    expect(eventTypes.map((eventType) => eventType.slug)).toEqual([
      'intro',
      'working-session',
      'deep-dive',
    ]);
    expect(eventTypes[0].reminders).toEqual([
      { method: 'email', minutes: 24 * 60 },
      { method: 'popup', minutes: 10 },
    ]);
    expect(dashboard.globalRules).toHaveLength(5);
  });

  it('stores configurable event reminders for admins', async () => {
    const t = convexTest(schema, modules);

    const id = await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.upsertEventType, {
        slug: 'advisory',
        title: 'Advisory Call',
        description: 'A focused advisory call.',
        durationMinutes: 30,
        slotIntervalMinutes: 15,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 15,
        minNoticeMinutes: 60,
        maxAdvanceDays: 30,
        questions: [],
        reminders: [
          { method: 'popup', minutes: 5 },
          { method: 'email', minutes: 60 },
        ],
        active: true,
        sortOrder: 0,
      });

    const eventTypes = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    expect(eventTypes.find((eventType) => eventType._id === id)).toMatchObject({
      reminders: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 5 },
      ],
    });
  });

  it('rejects event types with too many reminders', async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.withIdentity(adminIdentity).mutation(api.scheduling.upsertEventType, {
        slug: 'too-many-reminders',
        title: 'Too Many Reminders',
        durationMinutes: 30,
        slotIntervalMinutes: 15,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 15,
        minNoticeMinutes: 60,
        maxAdvanceDays: 30,
        questions: [],
        reminders: Array.from({ length: 6 }, () => ({
          method: 'email' as const,
          minutes: 60,
        })),
        active: true,
        sortOrder: 0,
      })
    ).rejects.toThrow('Event types can have at most five reminders.');
  });

  it('prevents overlapping pending and confirmed bookings', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});
    const [eventType] = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    const startTime = Date.UTC(2026, 6, 6, 14, 0);
    const endTime = startTime + eventType.durationMinutes * 60 * 1000;

    await t.mutation(internal.scheduling.reserveBookingInternal, {
      eventTypeId: eventType._id,
      startTime,
      endTime,
      timeZone: 'America/New_York',
      inviteeName: 'First Invitee',
      inviteeEmail: 'first@example.com',
      cancelTokenHash: 'cancel-one',
      rescheduleTokenHash: 'reschedule-one',
    });

    await expect(
      t.mutation(internal.scheduling.reserveBookingInternal, {
        eventTypeId: eventType._id,
        startTime,
        endTime,
        timeZone: 'America/New_York',
        inviteeName: 'Second Invitee',
        inviteeEmail: 'second@example.com',
        cancelTokenHash: 'cancel-two',
        rescheduleTokenHash: 'reschedule-two',
      })
    ).rejects.toThrow('That time is already booked.');
  });

  it('admin cancellation removes a booking from local conflict checks', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});
    const [eventType] = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    const startTime = Date.UTC(2026, 6, 6, 14, 0);
    const endTime = startTime + eventType.durationMinutes * 60 * 1000;
    const bookingId = await t.mutation(
      internal.scheduling.reserveBookingInternal,
      {
        eventTypeId: eventType._id,
        startTime,
        endTime,
        timeZone: 'America/New_York',
        inviteeName: 'First Invitee',
        inviteeEmail: 'first@example.com',
        cancelTokenHash: 'cancel-one',
        rescheduleTokenHash: 'reschedule-one',
      }
    );

    await t.mutation(internal.scheduling.finalizeBookingInternal, {
      bookingId,
      googleCalendarId: 'primary',
      googleEventId: 'event-one',
      googleEventHtmlLink: 'https://calendar.google.com/event-one',
    });

    await t
      .withIdentity(adminIdentity)
      .mutation(internal.scheduling.cancelBookingInternal, {
        bookingId,
        actorType: 'admin',
      });

    const cancelled = await t.query(
      internal.scheduling.getBookingByIdInternal,
      { bookingId }
    );

    expect(cancelled?.status).toBe('cancelled');
    await expect(
      t.mutation(internal.scheduling.reserveBookingInternal, {
        eventTypeId: eventType._id,
        startTime,
        endTime,
        timeZone: 'America/New_York',
        inviteeName: 'Second Invitee',
        inviteeEmail: 'second@example.com',
        cancelTokenHash: 'cancel-two',
        rescheduleTokenHash: 'reschedule-two',
      })
    ).resolves.toBeDefined();
  });

  it('includes booking event types in the admin dashboard', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});
    const [eventType] = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    const startTime = Date.UTC(2026, 6, 6, 14, 0);
    const endTime = startTime + eventType.durationMinutes * 60 * 1000;
    const bookingId = await t.mutation(
      internal.scheduling.reserveBookingInternal,
      {
        eventTypeId: eventType._id,
        startTime,
        endTime,
        timeZone: 'America/New_York',
        inviteeName: 'First Invitee',
        inviteeEmail: 'first@example.com',
        cancelTokenHash: 'cancel-one',
        rescheduleTokenHash: 'reschedule-one',
      }
    );

    await t.mutation(internal.scheduling.finalizeBookingInternal, {
      bookingId,
      googleCalendarId: 'primary',
      googleEventId: 'event-one',
      googleEventHtmlLink: 'https://calendar.google.com/event-one',
    });

    const dashboard = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getAdminDashboard, {});

    expect(dashboard.bookings[0]).toMatchObject({
      _id: bookingId,
      eventType: {
        slug: eventType.slug,
        title: eventType.title,
      },
    });
  });

  it('admin reschedule state frees the old slot and blocks the new slot', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});
    const [eventType] = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    const startTime = Date.UTC(2026, 6, 6, 14, 0);
    const endTime = startTime + eventType.durationMinutes * 60 * 1000;
    const newStartTime = Date.UTC(2026, 6, 6, 15, 0);
    const newEndTime = newStartTime + eventType.durationMinutes * 60 * 1000;
    const bookingId = await t.mutation(
      internal.scheduling.reserveBookingInternal,
      {
        eventTypeId: eventType._id,
        startTime,
        endTime,
        timeZone: 'America/New_York',
        inviteeName: 'First Invitee',
        inviteeEmail: 'first@example.com',
        cancelTokenHash: 'cancel-one',
        rescheduleTokenHash: 'reschedule-one',
      }
    );

    await t.mutation(internal.scheduling.finalizeBookingInternal, {
      bookingId,
      googleCalendarId: 'primary',
      googleEventId: 'event-one',
      googleEventHtmlLink: 'https://calendar.google.com/event-one',
    });
    await t.mutation(internal.scheduling.lockBookingForRescheduleInternal, {
      bookingId,
      startTime: newStartTime,
      endTime: newEndTime,
      timeZone: 'America/New_York',
    });
    await t.mutation(internal.scheduling.confirmRescheduledBookingInternal, {
      bookingId,
      actorType: 'admin',
    });

    const rescheduled = await t.query(
      internal.scheduling.getBookingByIdInternal,
      { bookingId }
    );

    expect(rescheduled).toMatchObject({
      status: 'confirmed',
      startTime: newStartTime,
      endTime: newEndTime,
    });
    await expect(
      t.mutation(internal.scheduling.reserveBookingInternal, {
        eventTypeId: eventType._id,
        startTime,
        endTime,
        timeZone: 'America/New_York',
        inviteeName: 'Second Invitee',
        inviteeEmail: 'second@example.com',
        cancelTokenHash: 'cancel-two',
        rescheduleTokenHash: 'reschedule-two',
      })
    ).resolves.toBeDefined();
    await expect(
      t.mutation(internal.scheduling.reserveBookingInternal, {
        eventTypeId: eventType._id,
        startTime: newStartTime,
        endTime: newEndTime,
        timeZone: 'America/New_York',
        inviteeName: 'Third Invitee',
        inviteeEmail: 'third@example.com',
        cancelTokenHash: 'cancel-three',
        rescheduleTokenHash: 'reschedule-three',
      })
    ).rejects.toThrow('That time is already booked.');
  });

  it('stores and removes global date overrides for admins', async () => {
    const t = convexTest(schema, modules);

    const id = await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.upsertDateOverride, {
        scope: 'global',
        date: '2026-07-10',
        unavailable: true,
        intervals: [],
        timeZone: 'America/New_York',
      });

    let dashboard = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getAdminDashboard, {});

    expect(dashboard.overrides).toMatchObject([
      {
        _id: id,
        scope: 'global',
        date: '2026-07-10',
        unavailable: true,
      },
    ]);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.removeDateOverride, { id });

    dashboard = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getAdminDashboard, {});

    expect(dashboard.overrides).toHaveLength(0);
  });

  it('stores sorted multi-window date overrides for admins', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.upsertDateOverride, {
        scope: 'global',
        date: '2026-07-10',
        unavailable: false,
        intervals: [
          {
            startMinutes: 13 * 60,
            endMinutes: 15 * 60,
          },
          {
            startMinutes: 9 * 60,
            endMinutes: 11 * 60,
          },
        ],
        timeZone: 'America/New_York',
      });

    const dashboard = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getAdminDashboard, {});

    expect(dashboard.overrides[0].intervals).toEqual([
      {
        startMinutes: 9 * 60,
        endMinutes: 11 * 60,
      },
      {
        startMinutes: 13 * 60,
        endMinutes: 15 * 60,
      },
    ]);
  });

  it('rejects overlapping date override windows', async () => {
    const t = convexTest(schema, modules);

    await expect(
      t
        .withIdentity(adminIdentity)
        .mutation(api.scheduling.upsertDateOverride, {
          scope: 'global',
          date: '2026-07-10',
          unavailable: false,
          intervals: [
            {
              startMinutes: 9 * 60,
              endMinutes: 12 * 60,
            },
            {
              startMinutes: 11 * 60,
              endMinutes: 13 * 60,
            },
          ],
          timeZone: 'America/New_York',
        })
    ).rejects.toThrow('Date override windows cannot overlap.');
  });

  it('uses event-specific availability rules and overrides before global defaults', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});

    const [intro, workingSession] = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.replaceWeeklyAvailability, {
        scope: intro._id,
        rules: [
          {
            dayOfWeek: 2,
            startMinutes: 13 * 60,
            endMinutes: 15 * 60,
            timeZone: 'America/New_York',
          },
        ],
      });

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.upsertDateOverride, {
        scope: 'global',
        date: '2026-07-14',
        unavailable: true,
        intervals: [],
        timeZone: 'America/New_York',
      });

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.upsertDateOverride, {
        scope: intro._id,
        date: '2026-07-14',
        unavailable: false,
        intervals: [
          {
            startMinutes: 14 * 60,
            endMinutes: 16 * 60,
          },
        ],
        timeZone: 'America/New_York',
      });

    const introSnapshot = await t.query(
      internal.scheduling.getSchedulingSnapshotBySlugInternal,
      { slug: intro.slug }
    );
    const workingSnapshot = await t.query(
      internal.scheduling.getSchedulingSnapshotBySlugInternal,
      { slug: workingSession.slug }
    );
    const dashboard = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getAdminDashboard, {});

    expect(introSnapshot?.rules).toMatchObject([
      {
        scope: intro._id,
        dayOfWeek: 2,
        startMinutes: 13 * 60,
        endMinutes: 15 * 60,
      },
    ]);
    expect(
      workingSnapshot?.rules.every((rule) => rule.scope === 'global')
    ).toBe(true);
    expect(
      introSnapshot?.overrides.find(
        (override) => override.date === '2026-07-14'
      )
    ).toMatchObject({
      scope: intro._id,
      unavailable: false,
      intervals: [
        {
          startMinutes: 14 * 60,
          endMinutes: 16 * 60,
        },
      ],
    });
    expect(
      workingSnapshot?.overrides.find(
        (override) => override.date === '2026-07-14'
      )
    ).toMatchObject({
      scope: 'global',
      unavailable: true,
    });
    expect(
      dashboard.availabilityRules.some((rule) => rule.scope === intro._id)
    ).toBe(true);
    expect(
      dashboard.dateOverrides.some((override) => override.scope === intro._id)
    ).toBe(true);
  });

  it('stores custom invitee questions on event types', async () => {
    const t = convexTest(schema, modules);

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.seedDefaultConfiguration, {});

    const [intro] = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.listEventTypes, { includeInactive: true });

    await t
      .withIdentity(adminIdentity)
      .mutation(api.scheduling.upsertEventType, {
        id: intro._id,
        slug: intro.slug,
        title: intro.title,
        description: intro.description,
        durationMinutes: intro.durationMinutes,
        slotIntervalMinutes: intro.slotIntervalMinutes,
        bufferBeforeMinutes: intro.bufferBeforeMinutes,
        bufferAfterMinutes: intro.bufferAfterMinutes,
        minNoticeMinutes: intro.minNoticeMinutes,
        maxAdvanceDays: intro.maxAdvanceDays,
        questions: [
          {
            id: 'project-context',
            label: 'What should we cover?',
            type: 'textarea',
            required: true,
          },
          {
            id: 'call-type',
            label: 'Call type',
            type: 'select',
            required: false,
            options: ['Discovery', 'Advisory'],
          },
        ],
        active: intro.active,
        sortOrder: intro.sortOrder,
      });

    const updated = await t
      .withIdentity(adminIdentity)
      .query(api.scheduling.getEventTypeBySlug, { slug: intro.slug });

    expect(updated?.questions?.[0]).toMatchObject({
      id: 'project-context',
      label: 'What should we cover?',
      type: 'textarea',
      required: true,
    });
    expect(updated?.questions?.[0].options).toBeUndefined();
    expect(updated?.questions?.[1]).toMatchObject({
      id: 'call-type',
      label: 'Call type',
      type: 'select',
      required: false,
      options: ['Discovery', 'Advisory'],
    });
  });
});
