import { describe, expect, it } from 'vitest';
import { buildAvailableSlots, zonedDateTimeToUtcMs } from './availability';

const eventType = {
  durationMinutes: 30,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  minNoticeMinutes: 0,
  maxAdvanceDays: 30,
};

describe('scheduling availability', () => {
  it('builds slots from weekly rules in the host time zone', () => {
    const start = zonedDateTimeToUtcMs(
      '2026-07-06',
      9 * 60,
      'America/New_York'
    );
    const slots = buildAvailableSlots({
      eventType,
      rules: [
        {
          dayOfWeek: 1,
          startMinutes: 9 * 60,
          endMinutes: 10 * 60,
          timeZone: 'America/New_York',
        },
      ],
      overrides: [],
      busy: [],
      from: start,
      to: start + 24 * 60 * 60 * 1000,
      now: start - 60 * 60 * 1000,
      timeZone: 'America/New_York',
    });

    expect(slots).toEqual([
      { startTime: start, endTime: start + 30 * 60 * 1000 },
      {
        startTime: start + 30 * 60 * 1000,
        endTime: start + 60 * 60 * 1000,
      },
    ]);
  });

  it('builds slots from multiple weekly windows on the same day', () => {
    const morning = zonedDateTimeToUtcMs(
      '2026-07-06',
      9 * 60,
      'America/New_York'
    );
    const afternoon = zonedDateTimeToUtcMs(
      '2026-07-06',
      13 * 60,
      'America/New_York'
    );
    const slots = buildAvailableSlots({
      eventType,
      rules: [
        {
          dayOfWeek: 1,
          startMinutes: 9 * 60,
          endMinutes: 10 * 60,
          timeZone: 'America/New_York',
        },
        {
          dayOfWeek: 1,
          startMinutes: 13 * 60,
          endMinutes: 14 * 60,
          timeZone: 'America/New_York',
        },
      ],
      overrides: [],
      busy: [],
      from: morning,
      to: afternoon + 24 * 60 * 60 * 1000,
      now: morning - 60 * 60 * 1000,
      timeZone: 'America/New_York',
    });

    expect(slots.map((slot) => slot.startTime)).toEqual([
      morning,
      morning + 30 * 60 * 1000,
      afternoon,
      afternoon + 30 * 60 * 1000,
    ]);
  });

  it('filters slots that overlap busy ranges plus buffers', () => {
    const start = zonedDateTimeToUtcMs(
      '2026-07-06',
      9 * 60,
      'America/New_York'
    );
    const slots = buildAvailableSlots({
      eventType,
      rules: [
        {
          dayOfWeek: 1,
          startMinutes: 9 * 60,
          endMinutes: 11 * 60,
          timeZone: 'America/New_York',
        },
      ],
      overrides: [],
      busy: [
        {
          startTime: start + 40 * 60 * 1000,
          endTime: start + 75 * 60 * 1000,
        },
      ],
      from: start,
      to: start + 24 * 60 * 60 * 1000,
      now: start - 60 * 60 * 1000,
      timeZone: 'America/New_York',
    });

    expect(slots.map((slot) => slot.startTime)).toEqual([
      start + 90 * 60 * 1000,
    ]);
  });

  it('uses date overrides instead of weekly rules', () => {
    const start = zonedDateTimeToUtcMs(
      '2026-07-06',
      13 * 60,
      'America/New_York'
    );
    const slots = buildAvailableSlots({
      eventType,
      rules: [
        {
          dayOfWeek: 1,
          startMinutes: 9 * 60,
          endMinutes: 10 * 60,
          timeZone: 'America/New_York',
        },
      ],
      overrides: [
        {
          date: '2026-07-06',
          unavailable: false,
          intervals: [{ startMinutes: 13 * 60, endMinutes: 14 * 60 }],
          timeZone: 'America/New_York',
        },
      ],
      busy: [],
      from: start - 24 * 60 * 60 * 1000,
      to: start + 24 * 60 * 60 * 1000,
      now: start - 60 * 60 * 1000,
      timeZone: 'America/New_York',
    });

    expect(slots[0]?.startTime).toBe(start);
    expect(slots).toHaveLength(2);
  });

  it('honors minimum notice', () => {
    const start = zonedDateTimeToUtcMs(
      '2026-07-06',
      9 * 60,
      'America/New_York'
    );
    const slots = buildAvailableSlots({
      eventType: { ...eventType, minNoticeMinutes: 90 },
      rules: [
        {
          dayOfWeek: 1,
          startMinutes: 9 * 60,
          endMinutes: 11 * 60,
          timeZone: 'America/New_York',
        },
      ],
      overrides: [],
      busy: [],
      from: start,
      to: start + 24 * 60 * 60 * 1000,
      now: start,
      timeZone: 'America/New_York',
    });

    expect(slots.map((slot) => slot.startTime)).toEqual([
      start + 90 * 60 * 1000,
    ]);
  });
});
