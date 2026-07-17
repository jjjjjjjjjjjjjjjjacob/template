import { describe, expect, it } from 'vitest';
import { createCallbackSchedulerClient } from '../client';
import {
  addMonthsToMonthKey,
  buildSlotCalendar,
  defaultSchedulerTimeZone,
  formatTimeZoneLabel,
  getMonthKeyFromDateKey,
  getSlotDateKey,
  groupSlotsByDay,
  minutesToTimeInput,
  slotMonthKeys,
  timeInputToMinutes,
  timeZoneOptions,
} from '../format';

describe('scheduler SDK', () => {
  it('wraps callback actions as a scheduler client', async () => {
    const client = createCallbackSchedulerClient({
      listEventTypes: async () => [
        {
          id: 'intro',
          slug: 'intro-call',
          title: 'Intro Call',
          durationMinutes: 15,
          slotIntervalMinutes: 15,
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: 15,
          minNoticeMinutes: 60,
          maxAdvanceDays: 30,
          active: true,
          sortOrder: 0,
        },
      ],
      getAvailability: async () => ({
        eventType: null,
        slots: [],
        reason: null,
      }),
      createBooking: async () => {
        throw new Error('not used');
      },
      getBookingByToken: async () => null,
      cancelBooking: async () => undefined,
      rescheduleBooking: async () => undefined,
    });

    await expect(client.listEventTypes()).resolves.toHaveLength(1);
  });

  it('groups available slots by local day', () => {
    const slots = [
      {
        startTime: Date.UTC(2026, 6, 1, 13, 0),
        endTime: Date.UTC(2026, 6, 1, 13, 30),
      },
      {
        startTime: Date.UTC(2026, 6, 2, 13, 0),
        endTime: Date.UTC(2026, 6, 2, 13, 30),
      },
    ];

    const grouped = groupSlotsByDay(slots, 'America/New_York');

    expect(grouped).toHaveLength(2);
    expect(grouped[0].slots).toHaveLength(1);
  });

  it('builds a timezone-aware month calendar from slots', () => {
    const slots = [
      {
        startTime: Date.UTC(2026, 6, 1, 13, 0),
        endTime: Date.UTC(2026, 6, 1, 13, 30),
      },
      {
        startTime: Date.UTC(2026, 6, 15, 16, 0),
        endTime: Date.UTC(2026, 6, 15, 16, 30),
      },
    ];

    const calendar = buildSlotCalendar(slots, 'America/New_York', '2026-07');
    const availableDays = calendar.days.filter((day) => day.hasSlots);

    expect(calendar.monthKey).toBe('2026-07');
    expect(calendar.days).toHaveLength(35);
    expect(availableDays.map((day) => day.dateKey)).toEqual([
      '2026-07-01',
      '2026-07-15',
    ]);
  });

  it('derives date and month keys for navigation', () => {
    const timestamp = Date.UTC(2026, 0, 1, 2, 0);

    expect(getSlotDateKey(timestamp, 'America/New_York')).toBe('2025-12-31');
    expect(getMonthKeyFromDateKey('2025-12-31')).toBe('2025-12');
    expect(addMonthsToMonthKey('2025-12', 1)).toBe('2026-01');
    expect(
      slotMonthKeys(
        [
          {
            startTime: timestamp,
            endTime: timestamp + 30 * 60 * 1000,
          },
        ],
        'America/New_York'
      )
    ).toEqual(['2025-12']);
  });

  it('builds timezone options with the preferred timezone first', () => {
    const options = timeZoneOptions(
      'Europe/London',
      Date.UTC(2026, 6, 1, 12, 0)
    );

    expect(options[0].value).toBe('Europe/London');
    expect(
      options.some((option) => option.value === defaultSchedulerTimeZone)
    ).toBe(true);
    expect(
      formatTimeZoneLabel('America/New_York', Date.UTC(2026, 6, 1, 12, 0))
    ).toContain('New York');
  });

  it('converts minute counts and time input strings', () => {
    expect(minutesToTimeInput(9 * 60 + 30)).toBe('09:30');
    expect(timeInputToMinutes('17:15')).toBe(17 * 60 + 15);
  });
});
