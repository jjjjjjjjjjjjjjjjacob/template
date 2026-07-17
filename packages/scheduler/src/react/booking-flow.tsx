import * as React from 'react';
import { schedulerError } from '../client';
import {
  addMonthsToMonthKey,
  buildSlotCalendar,
  defaultSchedulerTimeZone,
  formatFullDateTime,
  formatMonthLabel,
  formatTimeRange,
  formatTimeZoneLabel,
  getMonthKeyFromDateKey,
  groupSlotsByDay,
  monthKeyFromTimestamp,
  slotMonthKeys,
  timeZoneOptions,
  userTimeZone,
} from '../format';
import type {
  AvailabilityResult,
  AvailableSlot,
  BookingFlowCallbacks,
  BookingFormValues,
  BookingResult,
  SchedulerClient,
  SchedulerEventType,
} from '../types';
import { useSchedulerClient } from './context';
import {
  Badge,
  Button,
  cn,
  Input,
  Label,
  Select,
  Textarea,
} from './primitives';

export type BookingFlowProps = {
  client?: SchedulerClient;
  initialEventTypeSlug?: string;
  initialTimeZone?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  callbacks?: BookingFlowCallbacks;
};

export function BookingFlow({
  client,
  initialEventTypeSlug,
  initialTimeZone,
  className,
  title = 'Book time',
  subtitle = 'Pick a slot and the calendar invite will include meeting details.',
  callbacks,
}: BookingFlowProps) {
  const scheduler = useSchedulerClient(client);
  const [eventTypes, setEventTypes] = React.useState<SchedulerEventType[]>([]);
  const [selectedSlug, setSelectedSlug] = React.useState(
    initialEventTypeSlug ?? ''
  );
  const [timeZone, setTimeZone] = React.useState(
    initialTimeZone ?? defaultSchedulerTimeZone
  );
  const [availability, setAvailability] =
    React.useState<AvailabilityResult | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(
    null
  );
  const [selectedDateKey, setSelectedDateKey] = React.useState('');
  const [visibleMonthKey, setVisibleMonthKey] = React.useState(
    monthKeyFromTimestamp(
      Date.now(),
      initialTimeZone ?? defaultSchedulerTimeZone
    )
  );
  const [bookingResult, setBookingResult] =
    React.useState<BookingResult | null>(null);
  const [loadingEventTypes, setLoadingEventTypes] = React.useState(true);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<BookingFormValues>({
    inviteeName: '',
    inviteeEmail: '',
    notes: '',
  });
  const [questionAnswers, setQuestionAnswers] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    if (!initialTimeZone) setTimeZone(userTimeZone());
  }, [initialTimeZone]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadEventTypes() {
      setLoadingEventTypes(true);
      setError(null);
      try {
        const result = await scheduler.listEventTypes();
        if (cancelled) return;
        setEventTypes(result);
        if (!selectedSlug && result.length > 0) {
          setSelectedSlug(initialEventTypeSlug ?? result[0].slug);
        }
      } catch (err) {
        const normalized = schedulerError(err);
        if (!cancelled) {
          setError(normalized.message);
          callbacks?.onError?.(normalized);
        }
      } finally {
        if (!cancelled) setLoadingEventTypes(false);
      }
    }

    loadEventTypes();
    return () => {
      cancelled = true;
    };
  }, [callbacks, initialEventTypeSlug, scheduler, selectedSlug]);

  React.useEffect(() => {
    let cancelled = false;
    if (!selectedSlug) return;

    async function loadAvailability() {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const result = await scheduler.getAvailability({
          eventTypeSlug: selectedSlug,
          timeZone,
        });
        if (!cancelled) setAvailability(result);
      } catch (err) {
        const normalized = schedulerError(err);
        if (!cancelled) {
          setError(normalized.message);
          setAvailability(null);
          callbacks?.onError?.(normalized);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [callbacks, scheduler, selectedSlug, timeZone]);

  const selectedEventType =
    availability?.eventType ??
    eventTypes.find((eventType) => eventType.slug === selectedSlug) ??
    null;
  const availableDays = React.useMemo(
    () => groupSlotsByDay(availability?.slots ?? [], timeZone),
    [availability?.slots, timeZone]
  );
  const availableDateKeySignature = availableDays
    .map((day) => day.dateKey)
    .join('|');
  const availableMonthKeys = React.useMemo(
    () => slotMonthKeys(availability?.slots ?? [], timeZone),
    [availability?.slots, timeZone]
  );
  const zoneOptions = React.useMemo(
    () => timeZoneOptions(timeZone),
    [timeZone]
  );
  const firstAvailableDateKey = availableDays[0]?.dateKey ?? '';
  const firstAvailableMonthKey =
    availableMonthKeys[0] ?? monthKeyFromTimestamp(Date.now(), timeZone);
  const lastAvailableMonthKey =
    availableMonthKeys[availableMonthKeys.length - 1] ?? firstAvailableMonthKey;
  const calendar = React.useMemo(
    () =>
      buildSlotCalendar(availability?.slots ?? [], timeZone, visibleMonthKey),
    [availability?.slots, timeZone, visibleMonthKey]
  );
  const selectedDaySlots = React.useMemo(
    () =>
      selectedDateKey
        ? (availableDays.find((day) => day.dateKey === selectedDateKey)
            ?.slots ?? [])
        : [],
    [availableDays, selectedDateKey]
  );

  React.useEffect(() => {
    setSelectedDateKey((current) =>
      current && availableDays.some((day) => day.dateKey === current)
        ? current
        : firstAvailableDateKey
    );
    setVisibleMonthKey((current) => {
      if (
        current &&
        availableMonthKeys.some((monthKey) => monthKey === current)
      ) {
        return current;
      }
      return firstAvailableDateKey
        ? getMonthKeyFromDateKey(firstAvailableDateKey)
        : monthKeyFromTimestamp(Date.now(), timeZone);
    });
  }, [
    availableDateKeySignature,
    availableMonthKeys,
    availableDays,
    firstAvailableDateKey,
    timeZone,
  ]);

  function selectEventType(slug: string) {
    setSelectedSlug(slug);
    setQuestionAnswers({});
    callbacks?.onEventTypeChange?.(
      eventTypes.find((eventType) => eventType.slug === slug) ?? null
    );
  }

  function selectSlot(slot: AvailableSlot) {
    setSelectedSlot(slot);
    callbacks?.onSlotSelect?.(slot, selectedEventType);
  }

  function changeTimeZone(nextTimeZone: string) {
    setTimeZone(nextTimeZone);
    setSelectedSlot(null);
    setSelectedDateKey('');
  }

  function showPreviousMonth() {
    setVisibleMonthKey((current) => addMonthsToMonthKey(current, -1));
  }

  function showNextMonth() {
    setVisibleMonthKey((current) => addMonthsToMonthKey(current, 1));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventType || !selectedSlot) return;

    const input = {
      eventTypeSlug: selectedEventType.slug,
      startTime: selectedSlot.startTime,
      timeZone,
      inviteeName: form.inviteeName,
      inviteeEmail: form.inviteeEmail,
      notes: form.notes || undefined,
      questionResponses: buildQuestionResponses(
        selectedEventType,
        questionAnswers
      ),
    };

    setSubmitting(true);
    setError(null);
    callbacks?.onBookingStart?.(input);
    try {
      const result = await scheduler.createBooking(input);
      setBookingResult(result);
      callbacks?.onBookingConfirmed?.(result);
    } catch (err) {
      const normalized = schedulerError(err);
      setError(normalized.message);
      callbacks?.onError?.(normalized);
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingResult) {
    return (
      <BookingConfirmation
        result={bookingResult}
        timeZone={timeZone}
        onReset={() => {
          setBookingResult(null);
          setSelectedSlot(null);
          setSelectedDateKey(firstAvailableDateKey);
          setForm({ inviteeName: '', inviteeEmail: '', notes: '' });
          setQuestionAnswers({});
        }}
        className={className}
      />
    );
  }

  return (
    <section
      className={cn(
        'bg-background relative overflow-hidden border-y',
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,24,39,0.05)_0,transparent_42%),linear-gradient(315deg,rgba(16,185,129,0.10)_0,transparent_34%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[320px_1fr] lg:py-14">
        <aside className="space-y-6">
          <div>
            <Badge variant="outline" className="mb-4 border-emerald-500/40">
              google meet
            </Badge>
            <h1 className="text-4xl leading-tight font-light tracking-normal md:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-4 text-sm leading-6">
              {subtitle}
            </p>
          </div>

          <div className="space-y-3">
            {loadingEventTypes && (
              <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                Loading event types...
              </div>
            )}
            {eventTypes.map((eventType) => (
              <button
                key={eventType.id ?? eventType._id ?? eventType.slug}
                type="button"
                onClick={() => selectEventType(eventType.slug)}
                className={cn(
                  'w-full rounded-lg border p-4 text-left transition',
                  selectedSlug === eventType.slug
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'hover:border-foreground/40'
                )}
              >
                <span className="block text-base font-light">
                  {eventType.title}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {eventType.durationMinutes} min
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="rounded-lg border bg-white/70 p-4 backdrop-blur dark:bg-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-light">
                  {selectedEventType?.title ?? 'Available times'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {formatTimeZoneLabel(timeZone)}
                </p>
              </div>
              <label className="grid min-w-52 gap-1 text-xs">
                <span className="text-muted-foreground">Time zone</span>
                <Select
                  value={timeZone}
                  onChange={(event) => changeTimeZone(event.target.value)}
                  className="h-9 text-xs"
                >
                  {zoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>
              {loadingSlots && (
                <Badge variant="secondary">checking calendar</Badge>
              )}
            </div>

            {error && <ErrorPanel message={error} />}

            {availability?.reason === 'google_not_connected' && (
              <ErrorPanel message="Booking is not connected to Google Calendar yet." />
            )}

            {!loadingSlots && !error && availableDays.length === 0 && (
              <div className="border-border/70 rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No available slots in the current window.
                </p>
              </div>
            )}

            <div className="space-y-5">
              {availableDays.length > 0 && (
                <div className="bg-background/50 rounded-lg border p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={showPreviousMonth}
                      disabled={visibleMonthKey <= firstAvailableMonthKey}
                      className="h-9 px-2 text-xs"
                    >
                      prev
                    </Button>
                    <h3 className="text-sm font-light tabular-nums">
                      {formatMonthLabel(calendar.monthKey)}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={showNextMonth}
                      disabled={visibleMonthKey >= lastAvailableMonthKey}
                      className="h-9 px-2 text-xs"
                    >
                      next
                    </Button>
                  </div>
                  <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-[0.68rem] tracking-[0.14em] uppercase">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-1">
                    {calendar.days.map((day, index) => (
                      <button
                        key={day.dateKey || `empty-${index}`}
                        type="button"
                        disabled={!day.isInMonth || !day.hasSlots}
                        onClick={() => {
                          setSelectedDateKey(day.dateKey);
                          setSelectedSlot(null);
                        }}
                        className={cn(
                          'h-10 rounded-md text-sm tabular-nums transition-[background-color,color,opacity,box-shadow]',
                          !day.isInMonth && 'pointer-events-none opacity-0',
                          day.isInMonth &&
                            !day.hasSlots &&
                            'text-muted-foreground/35',
                          day.hasSlots &&
                            'hover:bg-accent hover:text-accent-foreground',
                          day.isToday &&
                            'shadow-[inset_0_0_0_1px_currentColor]',
                          selectedDateKey === day.dateKey &&
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                        )}
                      >
                        {day.day || ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDaySlots.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-muted-foreground text-sm font-light">
                    {availableDays.find(
                      (day) => day.dateKey === selectedDateKey
                    )?.label ?? 'Available times'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {selectedDaySlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => selectSlot(slot)}
                        className={cn(
                          'h-11 rounded-md border px-3 text-sm tabular-nums transition-[background-color,border-color,color]',
                          selectedSlot?.startTime === slot.startTime
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'bg-background/70 hover:border-foreground/40'
                        )}
                      >
                        {formatTimeRange(
                          slot.startTime,
                          slot.endTime,
                          timeZone
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="h-fit rounded-lg border bg-white/70 p-4 backdrop-blur dark:bg-black/20"
          >
            <div className="mb-4 space-y-2">
              <h2 className="text-xl font-light">Details</h2>
              {selectedSlot ? (
                <p className="text-muted-foreground text-sm">
                  {formatFullDateTime(selectedSlot.startTime, timeZone)}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Select a time to continue.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Field label="Name">
                <Input
                  value={form.inviteeName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      inviteeName: event.target.value,
                    }))
                  }
                  required
                  autoComplete="name"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.inviteeEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      inviteeEmail: event.target.value,
                    }))
                  }
                  required
                  autoComplete="email"
                />
              </Field>
              {selectedEventType?.questions?.map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  value={questionAnswers[question.id] ?? ''}
                  onChange={(value) =>
                    setQuestionAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                />
              ))}
              <Field label="Notes">
                <Textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                />
              </Field>
            </div>

            <Button
              type="submit"
              className="mt-5 h-11 w-full"
              disabled={!selectedSlot || submitting}
            >
              {submitting ? 'confirming...' : 'confirm booking'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function BookingConfirmation({
  result,
  timeZone,
  onReset,
  className,
}: {
  result: BookingResult;
  timeZone: string;
  onReset: () => void;
  className?: string;
}) {
  return (
    <section className={cn('bg-background border-y', className)}>
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-lg border bg-white/80 p-6 backdrop-blur dark:bg-black/20">
          <Badge className="mb-5 bg-emerald-600 text-white">confirmed</Badge>
          <h1 className="text-4xl font-light tracking-normal">
            You are booked
          </h1>
          <p className="text-muted-foreground mt-3">
            Google Calendar is sending the invite and Meet details.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoPill label={formatFullDateTime(result.startTime, timeZone)} />
            <InfoPill
              label={
                result.googleMeetUrl ? 'Google Meet ready' : 'Meet pending'
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {result.googleEventHtmlLink && (
              <a
                href={result.googleEventHtmlLink}
                target="_blank"
                rel="noreferrer"
                className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-light"
              >
                open calendar event
              </a>
            )}
            <Button variant="outline" onClick={onReset}>
              book another time
            </Button>
          </div>
        </div>
      </div>
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
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            id,
          } as React.HTMLAttributes<HTMLElement>)
        : children}
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: NonNullable<SchedulerEventType['questions']>[number];
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.type === 'textarea') {
    return (
      <Field label={question.label}>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={question.required}
          rows={4}
        />
      </Field>
    );
  }

  if (question.type === 'select') {
    return (
      <Field label={question.label}>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={question.required}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <option value="">Select one</option>
          {(question.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  return (
    <Field label={question.label}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={question.required}
      />
    </Field>
  );
}

function buildQuestionResponses(
  eventType: SchedulerEventType,
  answers: Record<string, string>
) {
  return (eventType.questions ?? [])
    .map((question) => ({
      questionId: question.id,
      value: (answers[question.id] ?? '').trim(),
    }))
    .filter((response) => response.value.length > 0);
}

function InfoPill({ label }: { label: string }) {
  return (
    <div className="bg-background/70 flex min-h-12 items-center gap-3 rounded-lg border px-4 text-sm">
      <span>{label}</span>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
      {message}
    </div>
  );
}
