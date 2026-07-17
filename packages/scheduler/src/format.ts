import type { AvailableSlot } from './types';

export const defaultSchedulerTimeZone = 'America/New_York';

export type SlotDay = {
  dateKey: string;
  label: string;
  slots: AvailableSlot[];
};

export type SlotCalendarDay = {
  dateKey: string;
  day: number;
  isInMonth: boolean;
  isToday: boolean;
  hasSlots: boolean;
  slots: AvailableSlot[];
};

export type SchedulerTimeZoneOption = {
  value: string;
  label: string;
};

export const schedulerTimeZones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Zurich',
  'Europe/Stockholm',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

export function userTimeZone(fallback = defaultSchedulerTimeZone) {
  if (typeof Intl === 'undefined') return fallback;
  return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
}

export function formatTimeRange(
  startTime: number,
  endTime: number,
  timeZone: string
) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
  return `${formatter.format(new Date(startTime))} - ${formatter.format(
    new Date(endTime)
  )}`;
}

export function formatDateHeader(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone,
  }).format(new Date(timestamp));
}

export function formatFullDateTime(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(new Date(timestamp));
}

export function formatTimeZoneLabel(timeZone: string, timestamp = Date.now()) {
  return `${timeZoneDisplayName(timeZone)} (${timeZoneOffsetLabel(
    timeZone,
    timestamp
  )})`;
}

export function timeZoneOptions(
  preferredTimeZone = userTimeZone(),
  timestamp = Date.now()
): SchedulerTimeZoneOption[] {
  return Array.from(
    new Set([
      preferredTimeZone,
      defaultSchedulerTimeZone,
      ...schedulerTimeZones,
    ])
  )
    .filter(Boolean)
    .map((timeZone) => ({
      value: timeZone,
      label: formatTimeZoneLabel(timeZone, timestamp),
    }));
}

export function groupSlotsByDay(
  slots: AvailableSlot[],
  timeZone: string
): SlotDay[] {
  const groups = new Map<string, AvailableSlot[]>();

  for (const slot of [...slots].sort((a, b) => a.startTime - b.startTime)) {
    const key = getSlotDateKey(slot.startTime, timeZone);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }

  return Array.from(groups.entries()).map(([dateKey, daySlots]) => ({
    dateKey,
    label: formatDateHeader(daySlots[0].startTime, timeZone),
    slots: daySlots,
  }));
}

export function getSlotDateKey(timestamp: number, timeZone: string) {
  const parts = dateParts(timestamp, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(
    parts.day
  ).padStart(2, '0')}`;
}

export function getMonthKeyFromDateKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

export function monthKeyFromTimestamp(timestamp: number, timeZone: string) {
  return getMonthKeyFromDateKey(getSlotDateKey(timestamp, timeZone));
}

export function addMonthsToMonthKey(monthKey: string, offset: number) {
  const [year, month] = parseMonthKey(monthKey);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    '0'
  )}`;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = parseMonthKey(monthKey);
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

export function slotMonthKeys(slots: AvailableSlot[], timeZone: string) {
  return Array.from(
    new Set(
      groupSlotsByDay(slots, timeZone).map((day) =>
        getMonthKeyFromDateKey(day.dateKey)
      )
    )
  ).sort();
}

export function buildSlotCalendar(
  slots: AvailableSlot[],
  timeZone: string,
  monthKey = slotMonthKeys(slots, timeZone)[0] ??
    monthKeyFromTimestamp(Date.now(), timeZone)
) {
  const [year, month] = parseMonthKey(monthKey);
  const daysByKey = new Map(
    groupSlotsByDay(slots, timeZone).map((day) => [day.dateKey, day])
  );
  const todayKey = getSlotDateKey(Date.now(), timeZone);
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const days: SlotCalendarDay[] = [];

  for (let index = 0; index < cellCount; index++) {
    const day = index - firstWeekday + 1;
    const isInMonth = day >= 1 && day <= daysInMonth;
    const dateKey = isInMonth
      ? `${monthKey}-${String(day).padStart(2, '0')}`
      : '';
    const slotDay = dateKey ? daysByKey.get(dateKey) : undefined;

    days.push({
      dateKey,
      day: isInMonth ? day : 0,
      isInMonth,
      isToday: dateKey === todayKey,
      hasSlots: Boolean(slotDay?.slots.length),
      slots: slotDay?.slots ?? [],
    });
  }

  return {
    monthKey,
    label: formatMonthLabel(monthKey),
    days,
  };
}

export function minutesToTimeInput(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function timeInputToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function dateParts(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  }).formatToParts(new Date(timestamp));
  const value = (type: 'year' | 'month' | 'day') =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
  };
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return [year, month] as const;
}

function timeZoneDisplayName(timeZone: string) {
  const parts = timeZone.split('/');
  const city = parts[parts.length - 1] || timeZone;
  return city.replace(/_/g, ' ');
}

function timeZoneOffsetLabel(timeZone: string, timestamp: number) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date(timestamp));
    return (
      parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone
    );
  } catch {
    return timeZone;
  }
}
