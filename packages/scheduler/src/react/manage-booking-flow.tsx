import * as React from 'react';
import { schedulerError } from '../client';
import {
  defaultSchedulerTimeZone,
  formatFullDateTime,
  formatTimeRange,
  formatTimeZoneLabel,
  groupSlotsByDay,
  timeZoneOptions,
  userTimeZone,
} from '../format';
import type {
  AvailableSlot,
  BookingTokenPurpose,
  ManageBookingCallbacks,
  ManagedBooking,
  SchedulerClient,
} from '../types';
import { useSchedulerClient } from './context';
import { Badge, Button, cn, Select } from './primitives';

export type ManageBookingFlowProps = {
  client?: SchedulerClient;
  mode: BookingTokenPurpose;
  token?: string;
  initialTimeZone?: string;
  className?: string;
  callbacks?: ManageBookingCallbacks;
};

export function ManageBookingFlow({
  client,
  mode,
  token: tokenProp,
  initialTimeZone,
  className,
  callbacks,
}: ManageBookingFlowProps) {
  const scheduler = useSchedulerClient(client);
  const [token, setToken] = React.useState(tokenProp ?? '');
  const [booking, setBooking] = React.useState<ManagedBooking | null>(null);
  const [slots, setSlots] = React.useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(
    null
  );
  const [timeZone, setTimeZone] = React.useState(
    initialTimeZone ?? defaultSchedulerTimeZone
  );
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'done'>(
    'loading'
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!initialTimeZone) setTimeZone(userTimeZone());
    if (!tokenProp && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setToken(params.get('token') ?? '');
    }
  }, [initialTimeZone, tokenProp]);

  React.useEffect(() => {
    let cancelled = false;
    if (!token) {
      setStatus('ready');
      setError('Missing booking token.');
      return;
    }

    async function loadBooking() {
      setStatus('loading');
      setError(null);
      try {
        const result = await scheduler.getBookingByToken({
          token,
          purpose: mode,
        });
        if (!result) throw new Error('Booking not found.');
        if (cancelled) return;
        setBooking(result);
        callbacks?.onLoaded?.(result);

        if (mode === 'reschedule' && result.eventType?.slug) {
          const availability = await scheduler.getAvailability({
            eventTypeSlug: result.eventType.slug,
            timeZone,
          });
          if (!cancelled) setSlots(availability.slots);
        }
        if (!cancelled) setStatus('ready');
      } catch (err) {
        const normalized = schedulerError(err);
        if (!cancelled) {
          setError(normalized.message);
          setStatus('ready');
          callbacks?.onError?.(normalized);
        }
      }
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [callbacks, mode, scheduler, timeZone, token]);

  async function submit() {
    if (!booking) return;
    setStatus('loading');
    setError(null);
    try {
      if (mode === 'cancel') {
        await scheduler.cancelBooking({ token });
        callbacks?.onCancelled?.(booking);
      } else {
        if (!selectedSlot) throw new Error('Select a new time.');
        await scheduler.rescheduleBooking({
          token,
          startTime: selectedSlot.startTime,
          timeZone,
        });
        callbacks?.onRescheduled?.(booking, selectedSlot);
      }
      setStatus('done');
    } catch (err) {
      const normalized = schedulerError(err);
      setError(normalized.message);
      callbacks?.onError?.(normalized);
      setStatus('ready');
    }
  }

  const groupedSlots = groupSlotsByDay(slots, timeZone).slice(0, 10);
  const zoneOptions = React.useMemo(
    () => timeZoneOptions(timeZone),
    [timeZone]
  );

  function changeTimeZone(nextTimeZone: string) {
    setTimeZone(nextTimeZone);
    setSelectedSlot(null);
  }

  return (
    <section className={cn('bg-background min-h-screen', className)}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-lg border bg-white/75 p-6 backdrop-blur dark:bg-black/20">
          <Badge variant="outline" className="mb-5">
            {mode}
          </Badge>

          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm">
              loading booking
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          {status === 'done' && (
            <div>
              <h1 className="text-4xl font-light tracking-normal">
                {mode === 'cancel'
                  ? 'Booking cancelled'
                  : 'Booking rescheduled'}
              </h1>
              <p className="text-muted-foreground mt-3">
                Google Calendar is sending the update.
              </p>
            </div>
          )}

          {status === 'ready' && booking && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-light tracking-normal">
                  {mode === 'cancel'
                    ? 'Cancel this booking'
                    : 'Choose a new time'}
                </h1>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Info label={booking.eventType?.title ?? 'Booking'} />
                  <Info
                    label={formatFullDateTime(booking.startTime, timeZone)}
                  />
                  <Info label={booking.inviteeEmail} />
                  <Info
                    label={booking.googleMeetUrl ? 'Google Meet' : 'Meet link'}
                  />
                </div>
              </div>

              {mode === 'reschedule' && (
                <div className="space-y-5">
                  <label className="grid max-w-sm gap-2 text-sm">
                    <span className="text-muted-foreground">Time zone</span>
                    <Select
                      value={timeZone}
                      onChange={(event) => changeTimeZone(event.target.value)}
                    >
                      {zoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <span className="text-muted-foreground text-xs">
                      {formatTimeZoneLabel(timeZone)}
                    </span>
                  </label>

                  {groupedSlots.map((day) => (
                    <div key={day.dateKey} className="space-y-3">
                      <h2 className="text-muted-foreground text-sm">
                        {day.label}
                      </h2>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {day.slots.map((slot) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              'h-11 rounded-md border px-3 text-sm transition',
                              selectedSlot?.startTime === slot.startTime
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'hover:border-foreground/40'
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
                  ))}
                </div>
              )}

              <Button
                onClick={submit}
                disabled={mode === 'reschedule' && !selectedSlot}
                variant={mode === 'cancel' ? 'destructive' : 'default'}
              >
                {mode === 'cancel' ? 'cancel booking' : 'reschedule booking'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Info({ label }: { label: string }) {
  return (
    <div className="bg-background/70 flex min-h-12 items-center gap-3 rounded-lg border px-4 text-sm">
      <span>{label}</span>
    </div>
  );
}
