import * as React from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@template/backend';
import {
  CalendarClock,
  CheckCircle2,
  CalendarX2,
  ExternalLink,
  Loader2,
  Plug,
  Trash2,
  Save,
  Settings2,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatTimeRange,
  formatFullDateTime,
  groupSlotsByDay,
  minutesToTimeInput,
  timeInputToMinutes,
  userTimeZone,
  type AvailableSlot,
} from '../utils';

type EventTypeForm = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  questions: EventTypeQuestion[];
  reminders: EventTypeReminder[];
  active: boolean;
  sortOrder: number;
};

type EventTypeReminder = {
  method: 'email' | 'popup';
  minutes: number;
};

type EventTypeQuestion = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
};

type AvailabilityRule = {
  _id: string;
  scope: 'global' | string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  timeZone: string;
};

type DateOverride = {
  _id: string;
  scope: 'global' | string;
  date: string;
  unavailable: boolean;
  intervals: Array<{
    startMinutes: number;
    endMinutes: number;
  }>;
  timeZone: string;
};

type AvailabilityDraftRule = {
  key: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type OverrideDraftInterval = {
  key: string;
  startTime: string;
  endTime: string;
};

type AdminEventType = Omit<EventTypeForm, 'id' | 'reminders'> & {
  _id: string;
  description?: string;
  reminders?: EventTypeReminder[];
};

type AdminBooking = {
  _id: string;
  status: string;
  startTime: number;
  endTime: number;
  timeZone: string;
  inviteeName: string;
  inviteeEmail: string;
  googleEventHtmlLink?: string;
  eventType?: {
    slug: string;
    title: string;
    durationMinutes: number;
  } | null;
};

type RescheduleDialogState = {
  booking: AdminBooking;
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  timeZone: string;
  status: 'loading' | 'ready';
  error: string | null;
};

type AdminDashboard = {
  connection: {
    accountEmail: string;
    calendarId: string;
    status: string;
    scopes: string[];
    updatedAt: number;
  } | null;
  eventTypes: AdminEventType[];
  availabilityRules: AvailabilityRule[];
  globalRules: AvailabilityRule[];
  dateOverrides: DateOverride[];
  overrides: DateOverride[];
  bookings: AdminBooking[];
};

const emptyEventType: EventTypeForm = {
  slug: '',
  title: '',
  description: '',
  durationMinutes: 30,
  slotIntervalMinutes: 15,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  minNoticeMinutes: 12 * 60,
  maxAdvanceDays: 45,
  questions: [],
  reminders: defaultEventReminders(),
  active: true,
  sortOrder: 0,
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AdminSchedulingPage() {
  const dashboard = useQuery(api.scheduling.getAdminDashboard);
  const seedDefaults = useMutation(api.scheduling.seedDefaultConfiguration);
  const upsertEventType = useMutation(api.scheduling.upsertEventType);
  const setEventTypeActive = useMutation(api.scheduling.setEventTypeActive);
  const replaceAvailability = useMutation(
    api.scheduling.replaceWeeklyAvailability
  );
  const upsertDateOverride = useMutation(api.scheduling.upsertDateOverride);
  const removeDateOverride = useMutation(api.scheduling.removeDateOverride);
  const disconnectGoogle = useMutation(api.scheduling.disconnectGoogle);
  const createGoogleOAuthUrl = useAction(api.scheduling.createGoogleOAuthUrl);
  const getAvailability = useAction(api.scheduling.getAvailability);
  const cancelBookingAsAdmin = useAction(api.scheduling.cancelBookingAsAdmin);
  const rescheduleBookingAsAdmin = useAction(
    api.scheduling.rescheduleBookingAsAdmin
  );
  const [eventForm, setEventForm] =
    React.useState<EventTypeForm>(emptyEventType);
  const [availabilityScope, setAvailabilityScope] = React.useState('global');
  const [availabilityDraft, setAvailabilityDraft] = React.useState<
    AvailabilityDraftRule[]
  >([]);
  const [overrideScope, setOverrideScope] = React.useState('global');
  const [overrideId, setOverrideId] = React.useState<string | undefined>();
  const [overrideDate, setOverrideDate] = React.useState(todayInputValue);
  const [overrideUnavailable, setOverrideUnavailable] = React.useState(true);
  const [overrideIntervals, setOverrideIntervals] = React.useState<
    OverrideDraftInterval[]
  >([newOverrideInterval()]);
  const [rescheduleDialog, setRescheduleDialog] =
    React.useState<RescheduleDialogState | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const view = dashboard as AdminDashboard | undefined;
  const availabilityRules = view?.availabilityRules ?? view?.globalRules ?? [];
  const dateOverrides = view?.dateOverrides ?? view?.overrides ?? [];
  const selectedAvailabilityRules = availabilityRules.filter(
    (rule) => rule.scope === availabilityScope
  );
  const availabilityScopeLabel = formatScopeLabel(
    availabilityScope,
    view?.eventTypes ?? []
  );
  const availabilityHasCustomRules =
    selectedAvailabilityRules.length > 0 || availabilityDraft.length > 0;
  const availabilityUsesGlobal =
    availabilityScope !== 'global' && !availabilityHasCustomRules;
  const rescheduleSlotGroups = React.useMemo(
    () =>
      rescheduleDialog
        ? groupSlotsByDay(
            rescheduleDialog.slots,
            rescheduleDialog.timeZone
          ).slice(0, 10)
        : [],
    [rescheduleDialog]
  );

  React.useEffect(() => {
    if (!view) return;
    const rules = availabilityRules.filter(
      (rule) => rule.scope === availabilityScope
    );
    setAvailabilityDraft(
      rules.map((rule) => ({
        key: rule._id,
        dayOfWeek: rule.dayOfWeek,
        startTime: minutesToTimeInput(rule.startMinutes),
        endTime: minutesToTimeInput(rule.endMinutes),
      }))
    );
  }, [availabilityScope, view]);

  async function run(label: string, task: () => Promise<unknown>) {
    setSaving(label);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(null);
    }
  }

  async function connectGoogle() {
    await run('google', async () => {
      const result = await createGoogleOAuthUrl({
        redirectPath: '/admin/scheduling',
      });
      window.location.href = result.url;
    });
  }

  async function saveEventType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run('event-type', async () => {
      await upsertEventType({
        id: eventForm.id as any,
        slug: eventForm.slug,
        title: eventForm.title,
        description: eventForm.description || undefined,
        durationMinutes: eventForm.durationMinutes,
        slotIntervalMinutes: eventForm.slotIntervalMinutes,
        bufferBeforeMinutes: eventForm.bufferBeforeMinutes,
        bufferAfterMinutes: eventForm.bufferAfterMinutes,
        minNoticeMinutes: eventForm.minNoticeMinutes,
        maxAdvanceDays: eventForm.maxAdvanceDays,
        questions: eventForm.questions.map((question) => ({
          id: question.id,
          label: question.label,
          type: question.type,
          required: question.required,
          options:
            question.type === 'select'
              ? (question.options ?? []).filter(Boolean)
              : undefined,
        })),
        reminders: eventForm.reminders.map((reminder) => ({
          method: reminder.method,
          minutes: reminder.minutes,
        })),
        active: eventForm.active,
        sortOrder: eventForm.sortOrder,
      });
      setEventForm(emptyEventType);
    });
  }

  async function saveAvailability() {
    await run('availability', async () => {
      await replaceAvailability({
        scope: availabilityScope as any,
        rules: availabilityDraft
          .map((rule) => ({
            dayOfWeek: rule.dayOfWeek,
            startMinutes: timeInputToMinutes(rule.startTime),
            endMinutes: timeInputToMinutes(rule.endTime),
            timeZone: 'America/New_York',
          }))
          .sort((a, b) => {
            if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
            return a.startMinutes - b.startMinutes;
          }),
      });
    });
  }

  async function resetAvailabilityToGlobal() {
    if (availabilityScope === 'global') return;
    await run('availability-reset', async () => {
      await replaceAvailability({
        scope: availabilityScope as any,
        rules: [],
      });
      setAvailabilityDraft([]);
    });
  }

  async function saveDateOverride(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run('override', async () => {
      await upsertDateOverride({
        id: overrideId as any,
        scope: overrideScope as any,
        date: overrideDate,
        unavailable: overrideUnavailable,
        intervals: overrideUnavailable
          ? []
          : overrideIntervals
              .map((interval) => ({
                startMinutes: timeInputToMinutes(interval.startTime),
                endMinutes: timeInputToMinutes(interval.endTime),
              }))
              .sort((a, b) => a.startMinutes - b.startMinutes),
        timeZone: 'America/New_York',
      });
      resetOverrideForm();
    });
  }

  async function deleteDateOverride(id: string) {
    await run(`remove-override-${id}`, async () => {
      await removeDateOverride({ id: id as any });
      if (overrideId === id) resetOverrideForm();
    });
  }

  async function cancelBooking(id: string) {
    await run(`cancel-booking-${id}`, async () => {
      await cancelBookingAsAdmin({ bookingId: id as any });
    });
  }

  async function openRescheduleBooking(booking: AdminBooking) {
    const timeZone = booking.timeZone || userTimeZone();
    setRescheduleDialog({
      booking,
      slots: [],
      selectedSlot: null,
      timeZone,
      status: 'loading',
      error: null,
    });

    try {
      if (!booking.eventType?.slug) {
        throw new Error('This booking is missing its event type.');
      }
      const availability = await getAvailability({
        eventTypeSlug: booking.eventType.slug,
        timeZone,
      });
      setRescheduleDialog((current) =>
        current?.booking._id === booking._id
          ? {
              ...current,
              slots: availability.slots ?? [],
              status: 'ready',
            }
          : current
      );
    } catch (err) {
      setRescheduleDialog((current) =>
        current?.booking._id === booking._id
          ? {
              ...current,
              status: 'ready',
              error: err instanceof Error ? err.message : String(err),
            }
          : current
      );
    }
  }

  async function rescheduleBooking() {
    if (!rescheduleDialog?.selectedSlot) return;
    const { booking, selectedSlot, timeZone } = rescheduleDialog;
    const label = `reschedule-booking-${booking._id}`;

    setSaving(label);
    setError(null);
    setRescheduleDialog((current) =>
      current
        ? {
            ...current,
            error: null,
          }
        : current
    );

    try {
      await rescheduleBookingAsAdmin({
        bookingId: booking._id as any,
        startTime: selectedSlot.startTime,
        timeZone,
      });
      setRescheduleDialog(null);
    } catch (err) {
      setRescheduleDialog((current) =>
        current?.booking._id === booking._id
          ? {
              ...current,
              error: err instanceof Error ? err.message : String(err),
            }
          : current
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="admin-page admin-page-wide space-y-6">
      <header className="admin-page-header">
        <div>
          <p className="admin-page-kicker">operations</p>
          <h1 className="admin-page-title">booking control room</h1>
          <p className="admin-page-description">
            manage booking links, calendar sync, availability, and recent
            bookings.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => run('defaults', () => seedDefaults({}))}
          disabled={saving !== null}
        >
          {saving === 'defaults' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Settings2 className="h-4 w-4" />
          )}
          create default setup
        </Button>
      </header>

      <main className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Panel title="google calendar" icon={<Plug className="h-4 w-4" />}>
            <div className="space-y-4">
              <ConnectionStatus connection={view?.connection} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={connectGoogle} disabled={saving !== null}>
                  {saving === 'google' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plug className="h-4 w-4" />
                  )}
                  connect google
                </Button>
                {view?.connection && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      run('disconnect', () => disconnectGoogle({}))
                    }
                    disabled={saving !== null}
                  >
                    disconnect
                  </Button>
                )}
              </div>
            </div>
          </Panel>

          <Panel
            title="Weekly Availability"
            icon={<CalendarClock className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <Field label="Scope">
                <ScopeSelect
                  value={availabilityScope}
                  eventTypes={view?.eventTypes ?? []}
                  onChange={setAvailabilityScope}
                />
              </Field>

              {availabilityScope !== 'global' && (
                <div className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <div>
                    <span className="block font-medium">
                      {availabilityScopeLabel}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {availabilityUsesGlobal
                        ? 'Using global weekly hours'
                        : 'Using custom weekly hours'}
                    </span>
                  </div>
                  <Badge
                    variant={availabilityUsesGlobal ? 'outline' : 'default'}
                  >
                    {availabilityUsesGlobal ? 'inherited' : 'custom'}
                  </Badge>
                </div>
              )}

              <div className="space-y-3">
                {availabilityDraft.length === 0 ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                    {availabilityScope === 'global'
                      ? 'No weekly hours are configured.'
                      : 'This event inherits the global schedule until you add custom hours.'}
                  </p>
                ) : (
                  availabilityDraft.map((rule) => (
                    <div
                      key={rule.key}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-lg border p-3"
                    >
                      <Field label="Day">
                        <select
                          value={rule.dayOfWeek}
                          onChange={(event) =>
                            updateAvailabilityRule(rule.key, {
                              dayOfWeek: Number(event.target.value),
                            })
                          }
                          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          {dayNames.map((day, index) => (
                            <option key={day} value={index}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Start">
                        <Input
                          type="time"
                          value={rule.startTime}
                          onChange={(event) =>
                            updateAvailabilityRule(rule.key, {
                              startTime: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field label="End">
                        <Input
                          type="time"
                          value={rule.endTime}
                          onChange={(event) =>
                            updateAvailabilityRule(rule.key, {
                              endTime: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-10 p-0"
                        onClick={() => removeAvailabilityRule(rule.key)}
                        aria-label={`Remove ${dayNames[rule.dayOfWeek]} availability`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addAvailabilityRule}
                  className="w-full"
                >
                  add window
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={saveAvailability}
                  disabled={saving !== null}
                  className="flex-1"
                >
                  {saving === 'availability' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {availabilityScope === 'global'
                    ? 'save global'
                    : 'save custom'}
                </Button>
                {availabilityScope !== 'global' && !availabilityUsesGlobal && (
                  <Button
                    variant="ghost"
                    onClick={resetAvailabilityToGlobal}
                    disabled={saving !== null}
                  >
                    use global
                  </Button>
                )}
              </div>
            </div>
          </Panel>

          <Panel
            title="Date Overrides"
            icon={<CalendarX2 className="h-4 w-4" />}
          >
            <form onSubmit={saveDateOverride} className="space-y-4">
              <Field label="Scope">
                <ScopeSelect
                  value={overrideScope}
                  eventTypes={view?.eventTypes ?? []}
                  onChange={setOverrideScope}
                />
              </Field>

              <Field label="Date">
                <Input
                  type="date"
                  value={overrideDate}
                  onChange={(event) => setOverrideDate(event.target.value)}
                  required
                />
              </Field>

              <label className="flex items-center justify-between rounded-md border p-3 text-sm">
                Mark unavailable
                <Switch
                  checked={overrideUnavailable}
                  onCheckedChange={setOverrideUnavailable}
                />
              </label>

              {!overrideUnavailable && (
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Available windows</h4>
                      <p className="text-muted-foreground text-xs">
                        These replace the normal hours for this date.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOverrideInterval}
                    >
                      add
                    </Button>
                  </div>

                  {overrideIntervals.map((interval, index) => (
                    <div
                      key={interval.key}
                      className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
                    >
                      <Field label={index === 0 ? 'Start' : ' '}>
                        <Input
                          type="time"
                          value={interval.startTime}
                          onChange={(event) =>
                            updateOverrideInterval(interval.key, {
                              startTime: event.target.value,
                            })
                          }
                          required
                        />
                      </Field>
                      <Field label={index === 0 ? 'End' : ' '}>
                        <Input
                          type="time"
                          value={interval.endTime}
                          onChange={(event) =>
                            updateOverrideInterval(interval.key, {
                              endTime: event.target.value,
                            })
                          }
                          required
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-10 p-0"
                        onClick={() => removeOverrideInterval(interval.key)}
                        disabled={overrideIntervals.length === 1}
                        aria-label={`Remove override window ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={saving !== null}
                  className="flex-1"
                >
                  {saving === 'override' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {overrideId ? 'update override' : 'add override'}
                </Button>
                {overrideId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetOverrideForm}
                  >
                    clear
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-5 space-y-2">
              {dateOverrides.length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  No custom dates yet.
                </p>
              ) : (
                dateOverrides.map((override) => (
                  <div
                    key={override._id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => editOverride(override)}
                    >
                      <span className="block text-sm font-medium">
                        {formatOverrideDate(override.date)}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {formatScopeLabel(
                          override.scope,
                          view?.eventTypes ?? []
                        )}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {override.unavailable
                          ? 'Unavailable all day'
                          : formatOverrideIntervals(override.intervals)}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 p-0"
                      onClick={() => deleteDateOverride(override._id)}
                      disabled={saving !== null}
                      aria-label={`Remove override for ${override.date}`}
                    >
                      {saving === `remove-override-${override._id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <Panel title="event types" icon={<Video className="h-4 w-4" />}>
            <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                {(view?.eventTypes ?? []).map((eventType) => (
                  <div
                    key={eventType._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <button
                      type="button"
                      className="text-left"
                      onClick={() =>
                        setEventForm({
                          id: eventType._id,
                          slug: eventType.slug,
                          title: eventType.title,
                          description: eventType.description ?? '',
                          durationMinutes: eventType.durationMinutes,
                          slotIntervalMinutes: eventType.slotIntervalMinutes,
                          bufferBeforeMinutes: eventType.bufferBeforeMinutes,
                          bufferAfterMinutes: eventType.bufferAfterMinutes,
                          minNoticeMinutes: eventType.minNoticeMinutes,
                          maxAdvanceDays: eventType.maxAdvanceDays,
                          questions: eventType.questions ?? [],
                          reminders:
                            eventType.reminders ?? defaultEventReminders(),
                          active: eventType.active,
                          sortOrder: eventType.sortOrder,
                        })
                      }
                    >
                      <span className="block text-base font-light">
                        {eventType.title}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        /book/{eventType.slug} · {eventType.durationMinutes} min
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant={eventType.active ? 'default' : 'outline'}>
                        {eventType.active ? 'active' : 'hidden'}
                      </Badge>
                      <Switch
                        checked={eventType.active}
                        onCheckedChange={(active) =>
                          run(`active-${eventType._id}`, () =>
                            setEventTypeActive({
                              id: eventType._id as any,
                              active,
                            })
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={saveEventType}
                className="space-y-4 rounded-lg border p-4"
              >
                <h3 className="text-lg font-light">
                  {eventForm.id ? 'Edit event type' : 'New event type'}
                </h3>
                <Field label="Title">
                  <Input
                    value={eventForm.title}
                    onChange={(event) =>
                      updateEventForm('title', event.target.value)
                    }
                    required
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    value={eventForm.slug}
                    onChange={(event) =>
                      updateEventForm('slug', event.target.value)
                    }
                    required
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={eventForm.description}
                    onChange={(event) =>
                      updateEventForm('description', event.target.value)
                    }
                    rows={3}
                  />
                </Field>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Invitee questions</h4>
                      <p className="text-muted-foreground text-xs">
                        Answers are stored with the booking and added to the
                        calendar event.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addQuestion}
                    >
                      add
                    </Button>
                  </div>

                  {eventForm.questions.length === 0 ? (
                    <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                      Name, email, and notes are always collected.
                    </p>
                  ) : (
                    eventForm.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="space-y-3 rounded-md border p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline">question {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => removeQuestion(question.id)}
                            aria-label={`Remove ${question.label || 'question'}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Field label="Question">
                          <Input
                            value={question.label}
                            onChange={(event) =>
                              updateQuestion(question.id, {
                                label: event.target.value,
                              })
                            }
                            required
                          />
                        </Field>

                        <div className="grid grid-cols-[1fr_auto] gap-3">
                          <Field label="Type">
                            <select
                              value={question.type}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  type: event.target
                                    .value as EventTypeQuestion['type'],
                                })
                              }
                              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                              <option value="text">Short answer</option>
                              <option value="textarea">Long answer</option>
                              <option value="select">Dropdown</option>
                            </select>
                          </Field>
                          <label className="mt-7 flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                            <Switch
                              checked={question.required}
                              onCheckedChange={(required) =>
                                updateQuestion(question.id, { required })
                              }
                            />
                            Required
                          </label>
                        </div>

                        {question.type === 'select' && (
                          <Field label="Options">
                            <Input
                              value={(question.options ?? []).join(', ')}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  options: event.target.value
                                    .split(',')
                                    .map((option) => option.trim()),
                                })
                              }
                              placeholder="Discovery, advisory, hiring"
                              required
                            />
                          </Field>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">
                        Calendar reminders
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        Added to the Google Calendar invite.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addReminder}
                      disabled={eventForm.reminders.length >= 5}
                    >
                      add
                    </Button>
                  </div>

                  {eventForm.reminders.length === 0 ? (
                    <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                      No invite reminders are configured.
                    </p>
                  ) : (
                    eventForm.reminders.map((reminder, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_112px_auto] items-end gap-2"
                      >
                        <Field label="Method">
                          <select
                            value={reminder.method}
                            onChange={(event) =>
                              updateReminder(index, {
                                method: event.target
                                  .value as EventTypeReminder['method'],
                              })
                            }
                            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <option value="email">Email</option>
                            <option value="popup">Popup</option>
                          </select>
                        </Field>
                        <Field label="Minutes">
                          <Input
                            type="number"
                            min={0}
                            max={60 * 24 * 30}
                            value={reminder.minutes}
                            onChange={(event) =>
                              updateReminder(index, {
                                minutes: Number(event.target.value),
                              })
                            }
                            className="tabular-nums"
                          />
                        </Field>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-10 w-10 p-0"
                          onClick={() => removeReminder(index)}
                          aria-label={`Remove reminder ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Duration" name="durationMinutes" />
                  <NumberField label="Interval" name="slotIntervalMinutes" />
                  <NumberField label="Buffer after" name="bufferAfterMinutes" />
                  <NumberField label="Min notice" name="minNoticeMinutes" />
                  <NumberField label="Advance days" name="maxAdvanceDays" />
                  <NumberField label="Sort" name="sortOrder" />
                </div>
                <label className="flex items-center justify-between rounded-md border p-3 text-sm">
                  Active
                  <Switch
                    checked={eventForm.active}
                    onCheckedChange={(active) =>
                      updateEventForm('active', active)
                    }
                  />
                </label>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving !== null}>
                    {saving === 'event-type' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEventForm(emptyEventType)}
                  >
                    clear
                  </Button>
                </div>
              </form>
            </div>
          </Panel>

          <Panel
            title="Recent Bookings"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-muted-foreground border-b text-left">
                  <tr>
                    <th className="py-3 pr-4 font-light">Invitee</th>
                    <th className="py-3 pr-4 font-light">When</th>
                    <th className="py-3 pr-4 font-light">Status</th>
                    <th className="py-3 pr-4 font-light">Calendar</th>
                    <th className="py-3 pr-4 font-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(view?.bookings ?? []).map((booking) => (
                    <tr key={booking._id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <span className="block">{booking.inviteeName}</span>
                        <span className="text-muted-foreground text-xs">
                          {booking.inviteeEmail}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {formatFullDateTime(
                          booking.startTime,
                          booking.timeZone
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{booking.status}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {booking.googleEventHtmlLink ? (
                          <a
                            href={booking.googleEventHtmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 underline"
                          >
                            open
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">none</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={
                              saving !== null ||
                              booking.status !== 'confirmed' ||
                              !booking.eventType?.slug
                            }
                            onClick={() => openRescheduleBooking(booking)}
                          >
                            reschedule
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:bg-red-500/10 hover:text-red-800 dark:text-red-300"
                            disabled={
                              saving !== null || booking.status !== 'confirmed'
                            }
                            onClick={() => cancelBooking(booking._id)}
                          >
                            {saving === `cancel-booking-${booking._id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'cancel'
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </main>

      <Dialog
        open={!!rescheduleDialog}
        onOpenChange={(open) => {
          if (!open) setRescheduleDialog(null);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>
              Choose a replacement time. Google Calendar will update the
              existing invite.
            </DialogDescription>
          </DialogHeader>

          {rescheduleDialog && (
            <div className="space-y-5">
              <div className="rounded-md border p-4">
                <p className="text-sm font-light">
                  {rescheduleDialog.booking.eventType?.title ?? 'Booking'}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {rescheduleDialog.booking.inviteeName} -{' '}
                  {rescheduleDialog.booking.inviteeEmail}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Current:{' '}
                  {formatFullDateTime(
                    rescheduleDialog.booking.startTime,
                    rescheduleDialog.timeZone
                  )}
                </p>
              </div>

              {rescheduleDialog.status === 'loading' && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  loading replacement times
                </div>
              )}

              {rescheduleDialog.error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                  {rescheduleDialog.error}
                </div>
              )}

              {rescheduleDialog.status === 'ready' &&
                !rescheduleDialog.error &&
                rescheduleSlotGroups.length === 0 && (
                  <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                    No replacement slots are available right now.
                  </div>
                )}

              {rescheduleSlotGroups.length > 0 && (
                <div className="space-y-4">
                  {rescheduleSlotGroups.map((day) => (
                    <div key={day.dateKey} className="space-y-2">
                      <h3 className="text-muted-foreground text-sm font-light">
                        {day.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {day.slots.map((slot) => {
                          const selected =
                            rescheduleDialog.selectedSlot?.startTime ===
                            slot.startTime;
                          return (
                            <Button
                              key={slot.startTime}
                              type="button"
                              variant={selected ? 'default' : 'outline'}
                              className="tabular-nums"
                              aria-pressed={selected}
                              onClick={() =>
                                setRescheduleDialog((current) =>
                                  current
                                    ? { ...current, selectedSlot: slot }
                                    : current
                                )
                              }
                            >
                              {formatTimeRange(
                                slot.startTime,
                                slot.endTime,
                                rescheduleDialog.timeZone
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleDialog(null)}
            >
              close
            </Button>
            <Button
              type="button"
              disabled={
                !rescheduleDialog?.selectedSlot ||
                saving === `reschedule-booking-${rescheduleDialog.booking._id}`
              }
              onClick={rescheduleBooking}
            >
              {rescheduleDialog &&
              saving ===
                `reschedule-booking-${rescheduleDialog.booking._id}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              reschedule booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function updateEventForm<K extends keyof EventTypeForm>(
    key: K,
    value: EventTypeForm[K]
  ) {
    setEventForm((current) => ({ ...current, [key]: value }));
  }

  function addAvailabilityRule() {
    setAvailabilityDraft((current) => {
      const previousDay = current[current.length - 1]?.dayOfWeek ?? 1;
      return [
        ...current,
        {
          key: newAvailabilityRuleKey(),
          dayOfWeek: previousDay,
          startTime: '09:00',
          endTime: '17:00',
        },
      ];
    });
  }

  function updateAvailabilityRule(
    key: string,
    patch: Partial<Omit<AvailabilityDraftRule, 'key'>>
  ) {
    setAvailabilityDraft((current) =>
      current.map((rule) => (rule.key === key ? { ...rule, ...patch } : rule))
    );
  }

  function removeAvailabilityRule(key: string) {
    setAvailabilityDraft((current) =>
      current.filter((rule) => rule.key !== key)
    );
  }

  function addOverrideInterval() {
    setOverrideIntervals((current) => {
      const startTime = current[current.length - 1]?.endTime ?? '09:00';
      return [
        ...current,
        newOverrideInterval(startTime, nextOverrideEndTime(startTime)),
      ];
    });
  }

  function updateOverrideInterval(
    key: string,
    patch: Partial<Omit<OverrideDraftInterval, 'key'>>
  ) {
    setOverrideIntervals((current) =>
      current.map((interval) =>
        interval.key === key ? { ...interval, ...patch } : interval
      )
    );
  }

  function removeOverrideInterval(key: string) {
    setOverrideIntervals((current) => {
      if (current.length === 1) return current;
      return current.filter((interval) => interval.key !== key);
    });
  }

  function addQuestion() {
    setEventForm((current) => ({
      ...current,
      questions: [
        ...current.questions,
        {
          id: newQuestionId(),
          label: '',
          type: 'text',
          required: false,
          options: [],
        },
      ],
    }));
  }

  function updateQuestion(id: string, patch: Partial<EventTypeQuestion>) {
    setEventForm((current) => ({
      ...current,
      questions: current.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      ),
    }));
  }

  function removeQuestion(id: string) {
    setEventForm((current) => ({
      ...current,
      questions: current.questions.filter((question) => question.id !== id),
    }));
  }

  function addReminder() {
    setEventForm((current) => ({
      ...current,
      reminders:
        current.reminders.length >= 5
          ? current.reminders
          : [...current.reminders, { method: 'email', minutes: 60 }],
    }));
  }

  function updateReminder(index: number, patch: Partial<EventTypeReminder>) {
    setEventForm((current) => ({
      ...current,
      reminders: current.reminders.map((reminder, reminderIndex) =>
        reminderIndex === index ? { ...reminder, ...patch } : reminder
      ),
    }));
  }

  function removeReminder(index: number) {
    setEventForm((current) => ({
      ...current,
      reminders: current.reminders.filter(
        (_, reminderIndex) => reminderIndex !== index
      ),
    }));
  }

  function NumberField({
    label,
    name,
  }: {
    label: string;
    name: keyof EventTypeForm;
  }) {
    return (
      <Field label={label}>
        <Input
          type="number"
          value={Number(eventForm[name] ?? 0)}
          onChange={(event) =>
            updateEventForm(name, Number(event.target.value) as any)
          }
        />
      </Field>
    );
  }

  function editOverride(override: AdminDashboard['overrides'][number]) {
    setOverrideId(override._id);
    setOverrideScope(override.scope);
    setOverrideDate(override.date);
    setOverrideUnavailable(override.unavailable);
    setOverrideIntervals(
      override.intervals.length > 0
        ? override.intervals.map((interval) => ({
            key: newOverrideIntervalKey(),
            startTime: minutesToTimeInput(interval.startMinutes),
            endTime: minutesToTimeInput(interval.endMinutes),
          }))
        : [newOverrideInterval()]
    );
  }

  function resetOverrideForm() {
    setOverrideId(undefined);
    setOverrideScope('global');
    setOverrideDate(todayInputValue());
    setOverrideUnavailable(true);
    setOverrideIntervals([newOverrideInterval()]);
  }
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function defaultEventReminders(): EventTypeReminder[] {
  return [
    { method: 'email', minutes: 24 * 60 },
    { method: 'popup', minutes: 10 },
  ];
}

function newQuestionId() {
  return `question-${Math.random().toString(36).slice(2, 8)}`;
}

function newAvailabilityRuleKey() {
  return `availability-${Math.random().toString(36).slice(2, 8)}`;
}

function newOverrideInterval(
  startTime = '09:00',
  endTime = '17:00'
): OverrideDraftInterval {
  return {
    key: newOverrideIntervalKey(),
    startTime,
    endTime,
  };
}

function newOverrideIntervalKey() {
  return `override-${Math.random().toString(36).slice(2, 8)}`;
}

function nextOverrideEndTime(startTime: string) {
  const next = Math.min(timeInputToMinutes(startTime) + 60, 23 * 60 + 59);
  return minutesToTimeInput(next);
}

function formatOverrideDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatOverrideIntervals(
  intervals: Array<{ startMinutes: number; endMinutes: number }>
) {
  if (intervals.length === 0) return 'No available hours';
  return intervals
    .map(
      (interval) =>
        `${minutesToTimeInput(interval.startMinutes)}-${minutesToTimeInput(
          interval.endMinutes
        )}`
    )
    .join(', ');
}

function formatScopeLabel(
  scope: string,
  eventTypes: AdminDashboard['eventTypes']
) {
  if (scope === 'global') return 'Global default';
  return (
    eventTypes.find((eventType) => eventType._id === scope)?.title ??
    'Event-specific'
  );
}

function ScopeSelect({
  value,
  eventTypes,
  onChange,
}: {
  value: string;
  eventTypes: AdminDashboard['eventTypes'];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <option value="global">Global default</option>
      {eventTypes.map((eventType) => (
        <option key={eventType._id} value={eventType._id}>
          {eventType.title}
        </option>
      ))}
    </select>
  );
}

function ConnectionStatus({
  connection,
}: {
  connection:
    | {
        accountEmail: string;
        calendarId: string;
        status: string;
        updatedAt: number;
      }
    | null
    | undefined;
}) {
  if (connection === undefined) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        loading connection
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm">
        Google Calendar is not connected.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4" />
        {connection.status}
      </div>
      <p className="mt-2">{connection.accountEmail}</p>
      <p className="text-muted-foreground text-xs">
        calendar: {connection.calendarId}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card rounded-lg p-5">
      <div className="mb-5 flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title.toLowerCase()}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label.toLowerCase()}</Label>
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id,
          } as React.HTMLAttributes<HTMLElement>)
        : children}
    </div>
  );
}
