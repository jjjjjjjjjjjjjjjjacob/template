export type TimeInterval = {
  startTime: number;
  endTime: number;
};

export type AvailabilityRule = {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  timeZone: string;
};

export type DateOverride = {
  date: string;
  unavailable: boolean;
  intervals: Array<{
    startMinutes: number;
    endMinutes: number;
  }>;
  timeZone: string;
};

export type EventTypeAvailability = {
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
};

export type AvailableSlot = {
  startTime: number;
  endTime: number;
};

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export function buildAvailableSlots({
  eventType,
  rules,
  overrides,
  busy,
  from,
  to,
  now,
  timeZone,
}: {
  eventType: EventTypeAvailability;
  rules: AvailabilityRule[];
  overrides: DateOverride[];
  busy: TimeInterval[];
  from: number;
  to: number;
  now: number;
  timeZone: string;
}): AvailableSlot[] {
  const minStart = Math.max(from, now + eventType.minNoticeMinutes * MINUTE);
  const maxEnd = Math.min(to, now + eventType.maxAdvanceDays * DAY);

  if (maxEnd <= minStart || eventType.durationMinutes <= 0) {
    return [];
  }

  const rulesByDay = new Map<number, AvailabilityRule[]>();
  for (const rule of rules) {
    const existing = rulesByDay.get(rule.dayOfWeek) ?? [];
    existing.push(rule);
    rulesByDay.set(rule.dayOfWeek, existing);
  }

  const overridesByDate = new Map<string, DateOverride>();
  for (const override of overrides) {
    overridesByDate.set(override.date, override);
  }

  const startDate = getZonedDateKey(new Date(minStart), timeZone);
  const endDate = getZonedDateKey(new Date(maxEnd), timeZone);
  const slots: AvailableSlot[] = [];

  for (const date of eachDateKey(startDate, endDate)) {
    const override = overridesByDate.get(date);
    if (override?.unavailable) continue;

    const intervals = override
      ? override.intervals
      : (rulesByDay.get(dayOfWeekForDateKey(date)) ?? []);

    for (const interval of intervals) {
      const intervalStart = zonedDateTimeToUtcMs(
        date,
        interval.startMinutes,
        override?.timeZone ?? timeZone
      );
      const intervalEnd = zonedDateTimeToUtcMs(
        date,
        interval.endMinutes,
        override?.timeZone ?? timeZone
      );

      if (intervalEnd <= intervalStart) continue;

      for (
        let startTime = intervalStart;
        startTime + eventType.durationMinutes * MINUTE <= intervalEnd;
        startTime += eventType.slotIntervalMinutes * MINUTE
      ) {
        const endTime = startTime + eventType.durationMinutes * MINUTE;

        if (startTime < minStart || endTime > maxEnd) continue;

        const conflictStart =
          startTime - eventType.bufferBeforeMinutes * MINUTE;
        const conflictEnd = endTime + eventType.bufferAfterMinutes * MINUTE;

        if (
          busy.some((range) =>
            intervalsOverlap(conflictStart, conflictEnd, range)
          )
        ) {
          continue;
        }

        slots.push({ startTime, endTime });
      }
    }
  }

  return slots.sort((a, b) => a.startTime - b.startTime);
}

export function intervalsOverlap(
  startTime: number,
  endTime: number,
  range: TimeInterval
) {
  return startTime < range.endTime && endTime > range.startTime;
}

export function getZonedDateKey(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function zonedDateTimeToUtcMs(
  dateKey: string,
  minutes: number,
  timeZone: string
) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const first = asUtc - getTimeZoneOffsetMs(new Date(asUtc), timeZone);
  return asUtc - getTimeZoneOffsetMs(new Date(first), timeZone);
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

function eachDateKey(startDate: string, endDate: string) {
  const dates: string[] = [];
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  let cursor = Date.UTC(startYear, startMonth - 1, startDay, 12);
  const last = Date.UTC(endYear, endMonth - 1, endDay, 12);

  while (cursor <= last) {
    const date = new Date(cursor);
    dates.push(
      `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
        date.getUTCDate()
      )}`
    );
    cursor += DAY;
  }

  return dates;
}

function dayOfWeekForDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}
