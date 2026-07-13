import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  defaultSchedulerTimeZone,
  formatFullDateTime,
  formatTimeRange,
  formatTimeZoneLabel,
  groupSlotsByDay,
  schedulerError,
  timeZoneOptions,
  userTimeZone,
  type AvailableSlot,
  type ManagedBooking,
} from '@template/scheduler';
import {
  bookingStage,
  useSiteVisuals,
} from '@/components/site/visual-provider';
import { useConvexSchedulerClient } from '../convex-scheduler-client';

export function ManageBookingPage({ mode }: { mode: 'cancel' | 'reschedule' }) {
  const client = useConvexSchedulerClient();
  const { theme, setStage } = useSiteVisuals();
  const [token, setToken] = React.useState('');
  const [booking, setBooking] = React.useState<ManagedBooking | null>(null);
  const [slots, setSlots] = React.useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(
    null
  );
  const [timeZone, setTimeZone] = React.useState(defaultSchedulerTimeZone);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'done'>(
    'loading'
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setStage(bookingStage(theme));
  }, [setStage, theme]);

  React.useEffect(() => {
    setTimeZone(userTimeZone());
    if (typeof window !== 'undefined') {
      setToken(new URLSearchParams(window.location.search).get('token') ?? '');
    }
  }, []);

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
      setSelectedSlot(null);

      try {
        const result = await client.getBookingByToken({
          token,
          purpose: mode,
        });
        if (!result) throw new Error('Booking not found.');
        if (cancelled) return;

        setBooking(result);

        if (mode === 'reschedule' && result.eventType?.slug) {
          const availability = await client.getAvailability({
            eventTypeSlug: result.eventType.slug,
            timeZone,
          });
          if (!cancelled) setSlots(availability.slots);
        }

        if (!cancelled) setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setError(schedulerError(err).message);
          setStatus('ready');
        }
      }
    }

    loadBooking();
    return () => {
      cancelled = true;
    };
  }, [client, mode, timeZone, token]);

  async function submit() {
    if (!booking) return;

    setStatus('loading');
    setError(null);

    try {
      if (mode === 'cancel') {
        await client.cancelBooking({ token });
      } else {
        if (!selectedSlot) throw new Error('Select a new time.');
        await client.rescheduleBooking({
          token,
          startTime: selectedSlot.startTime,
          timeZone,
        });
      }
      setStatus('done');
    } catch (err) {
      setError(schedulerError(err).message);
      setStatus('ready');
    }
  }

  const groupedSlots = React.useMemo(
    () => groupSlotsByDay(slots, timeZone).slice(0, 10),
    [slots, timeZone]
  );
  const zoneOptions = React.useMemo(
    () => timeZoneOptions(timeZone),
    [timeZone]
  );
  const doneTitle =
    mode === 'cancel' ? 'Booking cancelled' : 'Booking rescheduled';
  const readyTitle =
    mode === 'cancel' ? 'Cancel this booking' : 'Choose a new time';

  function changeTimeZone(nextTimeZone: string) {
    setTimeZone(nextTimeZone);
    setSelectedSlot(null);
  }

  return (
    <main className="site-shell site-booking-main mx-auto grid max-w-6xl gap-4 px-6 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16 md:px-10">
      <aside className="site-aside site-booking-aside">
        <header className="site-fade-in">
          <Link to="/book" className="site-link site-booking-back">
            &lt; back
          </Link>
          <p className="site-mono site-booking-kicker">booking — {mode}</p>
          <h1 className="site-grotesk site-booking-title">
            {status === 'done' ? doneTitle : readyTitle}
          </h1>
          <p className="site-booking-copy">
            {mode === 'cancel'
              ? 'Cancel the calendar invite and notify attendees.'
              : 'Pick a replacement slot and Calendar will send the update.'}
          </p>
        </header>
      </aside>

      <section
        className="site-fade-in site-detail-col site-booking-detail"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="site-detail site-booking-sections">
          {status === 'loading' && (
            <section
              className="site-booking-section site-cascade"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <p className="site-mono site-booking-status">loading booking</p>
            </section>
          )}

          {error && (
            <section
              className="site-booking-section site-cascade"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <p className="site-booking-error">{error}</p>
            </section>
          )}

          {status === 'done' && (
            <section
              className="site-booking-section site-cascade"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <div className="site-booking-section-head">
                <div>
                  <h2>{doneTitle}</h2>
                  <p>Google Calendar is sending the update.</p>
                </div>
              </div>
              <Link to="/book" className="site-link">
                book another time
              </Link>
            </section>
          )}

          {status === 'ready' && booking && (
            <>
              <section
                className="site-booking-section site-cascade"
                style={{ '--i': 0 } as React.CSSProperties}
              >
                <div className="site-booking-section-head">
                  <div>
                    <h2>{booking.eventType?.title ?? 'Booking'}</h2>
                    <p>{formatFullDateTime(booking.startTime, timeZone)}</p>
                  </div>
                </div>
                <div className="site-booking-facts">
                  <span>{booking.inviteeName}</span>
                  <span>{booking.inviteeEmail}</span>
                  <span>{booking.googleMeetUrl ? 'Google Meet' : 'Meet'}</span>
                </div>
              </section>

              {mode === 'reschedule' && (
                <section
                  className="site-booking-section site-cascade"
                  style={{ '--i': 1 } as React.CSSProperties}
                >
                  <div className="site-booking-section-head">
                    <div>
                      <h2>New time</h2>
                      <p>
                        {selectedSlot
                          ? formatFullDateTime(selectedSlot.startTime, timeZone)
                          : formatTimeZoneLabel(timeZone)}
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
                  </div>

                  {groupedSlots.length > 0 ? (
                    <div className="site-booking-days">
                      {groupedSlots.map((day) => (
                        <div key={day.dateKey} className="site-booking-day">
                          <h3>{day.label}</h3>
                          <div className="site-booking-slot-grid">
                            {day.slots.map((slot) => (
                              <button
                                key={slot.startTime}
                                type="button"
                                className="site-booking-slot"
                                data-active={
                                  selectedSlot?.startTime === slot.startTime
                                }
                                onClick={() => setSelectedSlot(slot)}
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
                  ) : (
                    <p className="site-booking-empty">
                      No replacement slots are available right now.
                    </p>
                  )}
                </section>
              )}

              <section
                className="site-booking-section site-cascade"
                style={
                  {
                    '--i': mode === 'reschedule' ? 2 : 1,
                  } as React.CSSProperties
                }
              >
                <button
                  type="button"
                  className="site-booking-submit"
                  disabled={mode === 'reschedule' && !selectedSlot}
                  onClick={submit}
                >
                  {mode === 'cancel' ? 'cancel booking' : 'reschedule booking'}
                </button>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
