import { Link } from '@tanstack/react-router';
import {
  type AvailabilityResult,
  type AvailableSlot,
  addMonthsToMonthKey,
  type BookingFormValues,
  type BookingResult,
  buildSlotCalendar,
  defaultSchedulerTimeZone,
  formatFullDateTime,
  formatMonthLabel,
  formatTimeRange,
  formatTimeZoneLabel,
  getMonthKeyFromDateKey,
  groupSlotsByDay,
  monthKeyFromTimestamp,
  type SchedulerEventType,
  schedulerError,
  slotMonthKeys,
  timeZoneOptions,
  userTimeZone,
} from '@template/scheduler';
import * as React from 'react';
import { SiteThemeToggle } from '@/components/site/theme-toggle';
import {
  bookingStage,
  useSiteVisuals,
} from '@/components/site/visual-provider';
import { useConvexSchedulerClient } from '../convex-scheduler-client';

type BookingStep = 'date' | 'time' | 'details';

const bookingStepOrder: BookingStep[] = ['date', 'time', 'details'];
type SlotCalendar = ReturnType<typeof buildSlotCalendar>;

export function BookingWidget({
  initialEventTypeSlug,
  className,
}: {
  initialEventTypeSlug?: string;
  className?: string;
}) {
  const client = useConvexSchedulerClient();
  const { theme, setStage } = useSiteVisuals();
  const detailRef = React.useRef<HTMLElement | null>(null);
  const eventListRef = React.useRef<HTMLElement | null>(null);
  const [eventTypes, setEventTypes] = React.useState<SchedulerEventType[]>([]);
  const [selectedSlug, setSelectedSlug] = React.useState(
    initialEventTypeSlug ?? ''
  );
  const [bookingStep, setBookingStep] = React.useState<BookingStep>('date');
  const [timeZone, setTimeZone] = React.useState(defaultSchedulerTimeZone);
  const [availability, setAvailability] =
    React.useState<AvailabilityResult | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(
    null
  );
  const [selectedDateKey, setSelectedDateKey] = React.useState('');
  const [visibleMonthKey, setVisibleMonthKey] = React.useState(
    monthKeyFromTimestamp(Date.now(), defaultSchedulerTimeZone)
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

  const scrollToDetail = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const scroll = () =>
      detailRef.current?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
    requestAnimationFrame(scroll);
    window.setTimeout(scroll, 280);
    window.setTimeout(scroll, 680);
  }, []);

  const scrollToEventTypes = React.useCallback(() => {
    const selectedButton =
      eventListRef.current?.querySelector<HTMLButtonElement>(
        '[data-active="true"]'
      );
    selectedButton?.focus();

    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    requestAnimationFrame(() =>
      eventListRef.current?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      })
    );
  }, []);

  React.useEffect(() => {
    setStage(bookingStage(theme));
  }, [setStage, theme]);

  React.useEffect(() => {
    setTimeZone(userTimeZone());
  }, []);

  React.useEffect(() => {
    if (initialEventTypeSlug) setSelectedSlug(initialEventTypeSlug);
  }, [initialEventTypeSlug]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadEventTypes() {
      setLoadingEventTypes(true);
      setError(null);

      try {
        const result = await client.listEventTypes();
        if (cancelled) return;
        setEventTypes(result);
        setSelectedSlug(
          (current) => current || initialEventTypeSlug || result[0]?.slug || ''
        );
      } catch (err) {
        if (!cancelled) setError(schedulerError(err).message);
      } finally {
        if (!cancelled) setLoadingEventTypes(false);
      }
    }

    loadEventTypes();
    return () => {
      cancelled = true;
    };
  }, [client, initialEventTypeSlug]);

  React.useEffect(() => {
    let cancelled = false;
    if (!selectedSlug) {
      setAvailability(null);
      setSelectedSlot(null);
      return;
    }

    async function loadAvailability() {
      setLoadingSlots(true);
      setError(null);
      setSelectedSlot(null);

      try {
        const result = await client.getAvailability({
          eventTypeSlug: selectedSlug,
          timeZone,
        });
        if (!cancelled) setAvailability(result);
      } catch (err) {
        if (!cancelled) {
          setError(schedulerError(err).message);
          setAvailability(null);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [client, selectedSlug, timeZone]);

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
  const selectedDay = React.useMemo(
    () => availableDays.find((day) => day.dateKey === selectedDateKey) ?? null,
    [availableDays, selectedDateKey]
  );
  const selectedDaySlots = React.useMemo(
    () => selectedDay?.slots ?? [],
    [selectedDay]
  );
  const selectedDayHeading = React.useMemo(
    () =>
      formatSelectedDayHeading(
        selectedDaySlots[0]?.startTime,
        selectedDay?.label,
        timeZone
      ),
    [selectedDay?.label, selectedDaySlots, timeZone]
  );
  const selectedDaySlotGroups = React.useMemo(
    () => groupSlotsByStartHour(selectedDaySlots, timeZone),
    [selectedDaySlots, timeZone]
  );
  const activeStep = getActiveBookingStep({
    bookingStep,
    selectedDateKey,
    selectedSlot: Boolean(selectedSlot),
  });
  const activeStepIndex = bookingStepOrder.indexOf(activeStep);
  const steps = bookingStepOrder.map((step, index) => ({
    id: step,
    label: step,
    value: stepValue(step, {
      selectedDayLabel: selectedDay?.label,
      selectedSlot,
      timeZone,
    }),
    active: step === activeStep,
    complete: index < activeStepIndex,
    disabled: !canVisitStep(step, {
      selectedEventType: Boolean(selectedEventType),
      selectedDateKey,
      selectedSlot: Boolean(selectedSlot),
    }),
  }));

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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventType || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await client.createBooking({
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
      });
      setBookingResult(result);
    } catch (err) {
      setError(schedulerError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  function changeTimeZone(nextTimeZone: string) {
    setTimeZone(nextTimeZone);
    setSelectedSlot(null);
    setSelectedDateKey('');
    setBookingStep('date');
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
          setBookingStep('date');
          setForm({ inviteeName: '', inviteeEmail: '', notes: '' });
          setQuestionAnswers({});
        }}
        className={className}
      />
    );
  }

  return (
    <main
      className={[
        'site-shell site-booking-main mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16 md:px-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <aside className="site-aside site-booking-aside">
        <header className="site-fade-in">
          <div className="site-booking-top">
            <Link to="/" className="site-link site-booking-back">
              &lt; back
            </Link>
            <SiteThemeToggle className="site-booking-theme-toggle" />
          </div>
          <p className="site-mono site-booking-kicker">booking — google meet</p>
          <h1 className="site-grotesk site-booking-title">
            Book time with Jacob
          </h1>
          <p className="site-booking-copy">
            Pick a slot and Google Calendar will send the invite with a Meet
            link.
          </p>
        </header>

        <nav
          ref={eventListRef}
          aria-label="meeting type"
          className="site-fade-in site-booking-event-list md:mt-auto"
          style={{ animationDelay: '0.1s' }}
        >
          {loadingEventTypes && (
            <p className="site-mono site-booking-status">loading event types</p>
          )}
          {!loadingEventTypes && eventTypes.length === 0 && (
            <p className="site-booking-empty">
              No event types are published yet.
            </p>
          )}
          {eventTypes.map((eventType, index) => (
            <button
              key={eventType.id ?? eventType._id ?? eventType.slug}
              type="button"
              className="site-row site-booking-row"
              data-active={selectedSlug === eventType.slug}
              onClick={() => {
                setSelectedSlug(eventType.slug);
                setAvailability(null);
                setSelectedSlot(null);
                setSelectedDateKey('');
                setQuestionAnswers({});
                setBookingStep('date');
                scrollToDetail();
              }}
            >
              <span className="site-mono site-row-num">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="site-row-title">{eventType.title}</span>
                {eventType.description && (
                  <span className="site-booking-row-desc">
                    {eventType.description}
                  </span>
                )}
              </span>
              <span className="site-row-year">
                {eventType.durationMinutes}m
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <section
        ref={detailRef}
        className="site-fade-in site-detail-col site-booking-detail"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="site-detail site-booking-sections">
          <nav className="site-booking-stepper" aria-label="booking progress">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                disabled={step.disabled}
                data-active={step.active}
                data-complete={step.complete}
                aria-current={step.active ? 'step' : undefined}
                onClick={() => setBookingStep(step.id)}
              >
                <span className="site-mono site-booking-step-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="site-booking-step-copy">
                  <span className="site-booking-step-label">{step.label}</span>
                  <span className="site-booking-step-value">{step.value}</span>
                </span>
              </button>
            ))}
          </nav>

          {activeStep === 'date' && (
            <section
              className="site-booking-section site-booking-step-panel site-cascade"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <div className="site-booking-section-head">
                <div>
                  <h2>Choose a date</h2>
                  <p>
                    {selectedEventType
                      ? `${selectedEventType.title} · ${selectedEventType.durationMinutes}m`
                      : 'Select a meeting type first.'}
                  </p>
                </div>
                <label className="site-booking-time-zone">
                  <span>Time zone</span>
                  <select
                    value={timeZone}
                    onChange={(event) => changeTimeZone(event.target.value)}
                  >
                    {zoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {loadingSlots && (
                  <span
                    className="site-mono site-booking-status"
                    aria-live="polite"
                  >
                    checking calendar
                  </span>
                )}
              </div>

              {availableDays.length > 0 ? (
                <div className="site-booking-picker">
                  <BookingCalendar
                    calendar={calendar}
                    visibleMonthKey={visibleMonthKey}
                    firstAvailableMonthKey={firstAvailableMonthKey}
                    lastAvailableMonthKey={lastAvailableMonthKey}
                    selectedDateKey={selectedDateKey}
                    onMonthChange={setVisibleMonthKey}
                    onSelectDate={(dateKey) => {
                      setSelectedDateKey(dateKey);
                      setSelectedSlot(null);
                      setBookingStep('time');
                    }}
                  />
                </div>
              ) : (
                <p className="site-booking-empty">
                  {availabilityEmptyCopy(
                    loadingSlots,
                    loadingEventTypes,
                    availability
                  )}
                </p>
              )}

              {error && (
                <p className="site-booking-error" role="alert">
                  {error}
                </p>
              )}

              <div className="site-booking-step-actions">
                <button
                  type="button"
                  className="site-booking-action-secondary"
                  onClick={scrollToEventTypes}
                >
                  change type
                </button>
                <button
                  type="button"
                  className="site-booking-submit"
                  disabled={!selectedDateKey || availableDays.length === 0}
                  onClick={() => setBookingStep('time')}
                >
                  continue to times
                </button>
              </div>
            </section>
          )}

          {activeStep === 'time' && (
            <section
              className="site-booking-section site-booking-step-panel site-booking-time-step site-cascade"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <div className="site-booking-section-head">
                <div>
                  <h2>Choose a time</h2>
                  <p>{selectedDay?.label ?? 'Select a date first.'}</p>
                </div>
                <span className="site-mono site-booking-status">
                  {formatTimeZoneLabel(timeZone)}
                </span>
              </div>

              <div className="site-booking-mobile-time-head">
                <button
                  type="button"
                  className="site-booking-mobile-time-back"
                  aria-label="Back to date selection"
                  onClick={() => setBookingStep('date')}
                >
                  &lt;
                </button>
                <div className="site-booking-mobile-time-copy">
                  <h3>{selectedDayHeading.weekday}</h3>
                  <p>{selectedDayHeading.date}</p>
                </div>
                <span className="site-booking-mobile-time-zone">
                  {formatTimeZoneLabel(timeZone)}
                </span>
              </div>

              {availableDays.length > 0 ? (
                <div className="site-booking-time-combo">
                  <div className="site-booking-time-calendar">
                    <BookingCalendar
                      calendar={calendar}
                      visibleMonthKey={visibleMonthKey}
                      firstAvailableMonthKey={firstAvailableMonthKey}
                      lastAvailableMonthKey={lastAvailableMonthKey}
                      selectedDateKey={selectedDateKey}
                      onMonthChange={setVisibleMonthKey}
                      onSelectDate={(dateKey) => {
                        setSelectedDateKey(dateKey);
                        setSelectedSlot(null);
                      }}
                    />
                  </div>
                  <div className="site-booking-day site-booking-time-list">
                    <h3>{selectedDay?.label ?? 'Available times'}</h3>
                    {selectedDaySlotGroups.length > 0 ? (
                      <BookingSlotGroups
                        slotGroups={selectedDaySlotGroups}
                        selectedSlot={selectedSlot}
                        timeZone={timeZone}
                        onSelectSlot={(slot) => {
                          setSelectedSlot(slot);
                          setBookingStep('details');
                        }}
                      />
                    ) : (
                      <p className="site-booking-empty">
                        Select a date to see available times.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="site-booking-empty">
                  {availabilityEmptyCopy(
                    loadingSlots,
                    loadingEventTypes,
                    availability
                  )}
                </p>
              )}

              {error && (
                <p className="site-booking-error" role="alert">
                  {error}
                </p>
              )}

              <div className="site-booking-step-actions">
                <button
                  type="button"
                  className="site-booking-action-secondary"
                  onClick={() => setBookingStep('date')}
                >
                  back to dates
                </button>
                <button
                  type="button"
                  className="site-booking-submit"
                  disabled={!selectedSlot}
                  onClick={() => setBookingStep('details')}
                >
                  continue to details
                </button>
              </div>
            </section>
          )}

          {activeStep === 'details' && (
            <form
              className="site-booking-section site-booking-step-panel site-cascade"
              style={{ '--i': 0 } as React.CSSProperties}
              onSubmit={submit}
            >
              <div className="site-booking-section-head">
                <div>
                  <h2>Details</h2>
                  <p>
                    {selectedSlot
                      ? formatFullDateTime(selectedSlot.startTime, timeZone)
                      : 'Select a time to continue.'}
                  </p>
                </div>
              </div>

              {selectedEventType && selectedSlot && (
                <div className="site-booking-summary">
                  <span>Event</span>
                  <strong>{selectedEventType.title}</strong>
                  <span>Time</span>
                  <strong>
                    {formatTimeRange(
                      selectedSlot.startTime,
                      selectedSlot.endTime,
                      timeZone
                    )}
                  </strong>
                </div>
              )}

              <div className="site-booking-fields">
                <label className="site-booking-field">
                  <span>Name</span>
                  <input
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
                </label>
                <label className="site-booking-field">
                  <span>Email</span>
                  <input
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
                </label>
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
                <label className="site-booking-field">
                  <span>Notes</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={5}
                  />
                </label>
              </div>

              {error && (
                <p className="site-booking-error" role="alert">
                  {error}
                </p>
              )}

              <div className="site-booking-step-actions">
                <button
                  type="button"
                  className="site-booking-action-secondary"
                  onClick={() => setBookingStep('time')}
                >
                  back to times
                </button>
                <button
                  type="submit"
                  className="site-booking-submit"
                  disabled={
                    submitting ||
                    !selectedSlot ||
                    !form.inviteeName ||
                    !form.inviteeEmail
                  }
                >
                  {submitting ? 'confirming' : 'confirm booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function BookingCalendar({
  calendar,
  visibleMonthKey,
  firstAvailableMonthKey,
  lastAvailableMonthKey,
  selectedDateKey,
  onMonthChange,
  onSelectDate,
}: {
  calendar: SlotCalendar;
  visibleMonthKey: string;
  firstAvailableMonthKey: string;
  lastAvailableMonthKey: string;
  selectedDateKey: string;
  onMonthChange: React.Dispatch<React.SetStateAction<string>>;
  onSelectDate: (dateKey: string) => void;
}) {
  return (
    <div className="site-booking-calendar">
      <div className="site-booking-calendar-head">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() =>
            onMonthChange((current) => addMonthsToMonthKey(current, -1))
          }
          disabled={visibleMonthKey <= firstAvailableMonthKey}
        >
          &lt;
        </button>
        <h3>{formatMonthLabel(calendar.monthKey)}</h3>
        <button
          type="button"
          aria-label="Next month"
          onClick={() =>
            onMonthChange((current) => addMonthsToMonthKey(current, 1))
          }
          disabled={visibleMonthKey >= lastAvailableMonthKey}
        >
          &gt;
        </button>
      </div>
      <div className="site-booking-weekdays" aria-hidden="true">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="site-booking-calendar-grid">
        {calendar.days.map((day, index) => (
          <button
            key={day.dateKey || `empty-${index}`}
            type="button"
            disabled={!day.isInMonth || !day.hasSlots}
            data-active={selectedDateKey === day.dateKey}
            data-today={day.isToday}
            data-empty={!day.isInMonth}
            data-available={day.hasSlots}
            onClick={() => onSelectDate(day.dateKey)}
          >
            {day.day || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingSlotGroups({
  slotGroups,
  selectedSlot,
  timeZone,
  onSelectSlot,
}: {
  slotGroups: SlotGroup[];
  selectedSlot: AvailableSlot | null;
  timeZone: string;
  onSelectSlot: (slot: AvailableSlot) => void;
}) {
  return (
    <div className="site-booking-slot-groups">
      {slotGroups.map((group) => (
        <section key={group.key} className="site-booking-slot-group">
          <h4 className="site-mono site-booking-slot-group-label">
            {group.label}
          </h4>
          <div className="site-booking-slot-stack">
            {group.slots.map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                className="site-booking-slot"
                data-active={selectedSlot?.startTime === slot.startTime}
                aria-label={formatTimeRange(
                  slot.startTime,
                  slot.endTime,
                  timeZone
                )}
                onClick={() => onSelectSlot(slot)}
              >
                <span className="site-booking-slot-main">
                  {formatSlotStart(slot.startTime, timeZone)}
                </span>
                <span className="site-booking-slot-end">
                  {formatSlotEnd(slot.endTime, timeZone)}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function getActiveBookingStep({
  bookingStep,
  selectedDateKey,
  selectedSlot,
}: {
  bookingStep: BookingStep;
  selectedDateKey: string;
  selectedSlot: boolean;
}): BookingStep {
  if (bookingStep === 'time' && !selectedDateKey) return 'date';
  if (bookingStep === 'details' && !selectedSlot) {
    return selectedDateKey ? 'time' : 'date';
  }
  return bookingStep;
}

function canVisitStep(
  step: BookingStep,
  {
    selectedEventType,
    selectedDateKey,
    selectedSlot,
  }: {
    selectedEventType: boolean;
    selectedDateKey: string;
    selectedSlot: boolean;
  }
) {
  if (step === 'date') return true;
  if (step === 'time') return selectedEventType && Boolean(selectedDateKey);
  return selectedEventType && Boolean(selectedDateKey) && selectedSlot;
}

function stepValue(
  step: BookingStep,
  {
    selectedDayLabel,
    selectedSlot,
    timeZone,
  }: {
    selectedDayLabel?: string;
    selectedSlot: AvailableSlot | null;
    timeZone: string;
  }
) {
  if (step === 'date') return selectedDayLabel ?? 'Pick date';
  if (step === 'time') {
    return selectedSlot
      ? formatSlotStart(selectedSlot.startTime, timeZone)
      : 'Pick time';
  }
  return selectedSlot ? 'Name + email' : 'After time';
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
    <main
      className={[
        'site-shell site-booking-main mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16 md:px-10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <aside className="site-aside site-booking-aside">
        <header className="site-fade-in">
          <div className="site-booking-top">
            <Link to="/" className="site-link site-booking-back">
              &lt; back
            </Link>
            <SiteThemeToggle className="site-booking-theme-toggle" />
          </div>
          <p className="site-mono site-booking-kicker">
            confirmed — google meet
          </p>
          <h1 className="site-grotesk site-booking-title">You are booked</h1>
          <p className="site-booking-copy">
            Google Calendar is sending the invite now.
          </p>
        </header>
      </aside>

      <section
        className="site-fade-in site-detail-col site-booking-detail"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="site-detail site-booking-sections">
          <section
            className="site-booking-section site-cascade"
            style={{ '--i': 0 } as React.CSSProperties}
          >
            <div className="site-booking-section-head">
              <div>
                <h2>{result.eventType.title}</h2>
                <p>{formatFullDateTime(result.startTime, timeZone)}</p>
              </div>
            </div>

            <div className="site-booking-actions">
              {result.googleMeetUrl && (
                <a
                  className="site-link"
                  href={result.googleMeetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  open google meet ↗
                </a>
              )}
              {result.googleEventHtmlLink && (
                <a
                  className="site-link"
                  href={result.googleEventHtmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  open calendar event ↗
                </a>
              )}
              <a className="site-link" href={result.rescheduleUrl}>
                reschedule
              </a>
              <a className="site-link" href={result.cancelUrl}>
                cancel
              </a>
            </div>
          </section>

          <section
            className="site-booking-section site-cascade"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            <button
              type="button"
              className="site-booking-submit"
              onClick={onReset}
            >
              book another time
            </button>
          </section>
        </div>
      </section>
    </main>
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
      <label className="site-booking-field">
        <span>{question.label}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={question.required}
          rows={4}
        />
      </label>
    );
  }

  if (question.type === 'select') {
    return (
      <label className="site-booking-field">
        <span>{question.label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={question.required}
        >
          <option value="">Select one</option>
          {(question.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="site-booking-field">
      <span>{question.label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={question.required}
      />
    </label>
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

function formatSlotStart(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(timestamp));
}

function formatSlotEnd(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(timestamp));
}

function formatSelectedDayHeading(
  timestamp: number | undefined,
  fallbackLabel: string | undefined,
  timeZone: string
) {
  if (!timestamp) {
    return {
      weekday: 'Choose a time',
      date: fallbackLabel ?? 'Select a date',
    };
  }

  const date = new Date(timestamp);
  return {
    weekday: new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      timeZone,
    }).format(date),
    date: new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone,
    }).format(date),
  };
}

type SlotGroup = {
  key: string;
  label: string;
  slots: AvailableSlot[];
};

function groupSlotsByStartHour(
  slots: AvailableSlot[],
  timeZone: string
): SlotGroup[] {
  const keyFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  const labelFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    timeZone,
  });

  return slots.reduce<SlotGroup[]>((groups, slot) => {
    const date = new Date(slot.startTime);
    const key = keyFormatter.format(date);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.key === key) {
      lastGroup.slots.push(slot);
      return groups;
    }

    groups.push({
      key,
      label: labelFormatter.format(date),
      slots: [slot],
    });
    return groups;
  }, []);
}

function availabilityEmptyCopy(
  loadingSlots: boolean,
  loadingEventTypes: boolean,
  availability: AvailabilityResult | null
) {
  if (loadingSlots || loadingEventTypes) return 'Loading available times.';
  if (availability?.reason === 'google_not_connected') {
    return 'Calendar availability is not connected yet.';
  }
  if (availability?.reason === 'no_rules') {
    return 'No availability rules are configured yet.';
  }
  return 'No available slots in the current window.';
}
