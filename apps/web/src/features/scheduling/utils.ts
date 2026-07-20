export {
  type AvailableSlot,
  formatDateHeader,
  formatFullDateTime,
  formatTimeRange,
  groupSlotsByDay,
  minutesToTimeInput,
  type SchedulerEventType as SchedulingEventType,
  timeInputToMinutes,
  userTimeZone,
} from '@template/scheduler';

export function meetingTypeToEventTypeSlug(meetingType: string): string {
  return meetingType
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}
