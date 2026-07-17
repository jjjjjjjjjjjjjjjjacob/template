import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  type ActionCtx,
  action,
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from './_generated/server';
import { AuthUtils } from './lib/auth';
import {
  buildAvailableSlots,
  intervalsOverlap,
  type TimeInterval,
} from './scheduling/availability';

const DEFAULT_TIME_ZONE = 'America/New_York';
const DEFAULT_HOST_EMAIL = 'jacob@jacobstein.me';
const DEFAULT_BOOKING_NOTIFICATION_FROM =
  'Jacob Stein <notifications@jacobstein.me>';
const DEFAULT_EVENT_REMINDERS = [
  { method: 'email' as const, minutes: 24 * 60 },
  { method: 'popup' as const, minutes: 10 },
];
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

const scopeValidator = v.union(
  v.literal('global'),
  v.id('schedulingEventTypes')
);

const availabilityRuleInput = v.object({
  dayOfWeek: v.number(),
  startMinutes: v.number(),
  endMinutes: v.number(),
  timeZone: v.string(),
});

const questionInput = v.object({
  id: v.string(),
  label: v.string(),
  type: v.union(v.literal('text'), v.literal('textarea'), v.literal('select')),
  required: v.boolean(),
  options: v.optional(v.array(v.string())),
});

const questionResponseInput = v.object({
  questionId: v.string(),
  value: v.string(),
});

const reminderInput = v.object({
  method: v.union(v.literal('email'), v.literal('popup')),
  minutes: v.number(),
});

const eventTypeInput = {
  slug: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  durationMinutes: v.number(),
  slotIntervalMinutes: v.number(),
  bufferBeforeMinutes: v.number(),
  bufferAfterMinutes: v.number(),
  minNoticeMinutes: v.number(),
  maxAdvanceDays: v.number(),
  questions: v.optional(v.array(questionInput)),
  reminders: v.optional(v.array(reminderInput)),
  active: v.boolean(),
  sortOrder: v.number(),
};

export const listEventTypes = query({
  args: { includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.includeInactive) {
      await AuthUtils.requireAdmin(ctx);
      return (
        await ctx.db
          .query('schedulingEventTypes')
          .withIndex('by_slug')
          .collect()
      ).sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return await ctx.db
      .query('schedulingEventTypes')
      .withIndex('by_active_order', (q) => q.eq('active', true))
      .collect();
  },
});

export const getEventTypeBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const eventType = await ctx.db
      .query('schedulingEventTypes')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (!eventType?.active) return null;
    return eventType;
  },
});

export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const [connection, eventTypes, availabilityRules, dateOverrides, bookings] =
      await Promise.all([
        getActiveConnection(ctx),
        ctx.db.query('schedulingEventTypes').collect(),
        ctx.db.query('schedulingAvailabilityRules').collect(),
        ctx.db.query('schedulingDateOverrides').collect(),
        ctx.db
          .query('schedulingBookings')
          .withIndex('by_status_time')
          .order('desc')
          .take(50),
      ]);
    const sortedAvailabilityRules = availabilityRules.sort((a, b) => {
      const scopeCompare = String(a.scope).localeCompare(String(b.scope));
      if (scopeCompare !== 0) return scopeCompare;
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startMinutes - b.startMinutes;
    });
    const sortedDateOverrides = dateOverrides.sort((a, b) => {
      const scopeCompare = String(a.scope).localeCompare(String(b.scope));
      if (scopeCompare !== 0) return scopeCompare;
      return a.date.localeCompare(b.date);
    });

    const eventTypesById = new Map(
      eventTypes.map((eventType) => [eventType._id, eventType])
    );

    return {
      connection: connection
        ? {
            accountEmail: connection.accountEmail,
            calendarId: connection.calendarId,
            status: connection.status,
            scopes: connection.scopes,
            updatedAt: connection.updatedAt,
          }
        : null,
      eventTypes: eventTypes.sort((a, b) => a.sortOrder - b.sortOrder),
      availabilityRules: sortedAvailabilityRules,
      globalRules: sortedAvailabilityRules.filter(
        (rule) => rule.scope === 'global'
      ),
      dateOverrides: sortedDateOverrides,
      overrides: sortedDateOverrides.filter(
        (override) => override.scope === 'global'
      ),
      bookings: bookings.map((booking) => ({
        ...booking,
        eventType: eventTypesById.get(booking.eventTypeId) ?? null,
      })),
    };
  },
});

export const seedDefaultConfiguration = mutation({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);

    const now = Date.now();
    const existingEventTypes = await ctx.db
      .query('schedulingEventTypes')
      .collect();

    if (existingEventTypes.length === 0) {
      const defaults = [
        {
          slug: 'intro',
          title: 'Intro Call',
          description:
            'A focused 15 minute call to see what is worth digging into.',
          durationMinutes: 15,
          sortOrder: 0,
        },
        {
          slug: 'working-session',
          title: 'Working Session',
          description:
            'A 30 minute design, product, or engineering conversation.',
          durationMinutes: 30,
          sortOrder: 1,
        },
        {
          slug: 'deep-dive',
          title: 'Deep Dive',
          description:
            'A full hour for architecture, strategy, or detailed review.',
          durationMinutes: 60,
          sortOrder: 2,
        },
      ];

      for (const eventType of defaults) {
        await ctx.db.insert('schedulingEventTypes', {
          ...eventType,
          slotIntervalMinutes: 15,
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: 15,
          minNoticeMinutes: 12 * 60,
          maxAdvanceDays: 45,
          reminders: DEFAULT_EVENT_REMINDERS,
          locationType: 'google_meet',
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const existingRules = await ctx.db
      .query('schedulingAvailabilityRules')
      .withIndex('by_scope', (q) => q.eq('scope', 'global'))
      .collect();

    if (existingRules.length === 0) {
      for (const dayOfWeek of [1, 2, 3, 4, 5]) {
        await ctx.db.insert('schedulingAvailabilityRules', {
          scope: 'global',
          dayOfWeek,
          startMinutes: 9 * 60,
          endMinutes: 17 * 60,
          timeZone: DEFAULT_TIME_ZONE,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await audit(ctx, {
      actorType: 'admin',
      action: 'scheduling.seed_defaults',
      metadata: { eventTypesCreated: existingEventTypes.length === 0 },
    });

    return true;
  },
});

export const upsertEventType = mutation({
  args: {
    id: v.optional(v.id('schedulingEventTypes')),
    ...eventTypeInput,
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);
    validateEventTypeInput(args);

    const now = Date.now();
    const existingSlug = await ctx.db
      .query('schedulingEventTypes')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();

    if (existingSlug && existingSlug._id !== args.id) {
      throw new Error('An event type with that slug already exists.');
    }

    const data = {
      slug: args.slug,
      title: args.title,
      description: args.description,
      durationMinutes: args.durationMinutes,
      slotIntervalMinutes: args.slotIntervalMinutes,
      bufferBeforeMinutes: args.bufferBeforeMinutes,
      bufferAfterMinutes: args.bufferAfterMinutes,
      minNoticeMinutes: args.minNoticeMinutes,
      maxAdvanceDays: args.maxAdvanceDays,
      questions: normalizeQuestions(args.questions ?? []),
      reminders: normalizeReminders(args.reminders ?? DEFAULT_EVENT_REMINDERS),
      locationType: 'google_meet' as const,
      active: args.active,
      sortOrder: args.sortOrder,
      updatedAt: now,
    };

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing) throw new Error('Event type not found.');
      await ctx.db.patch(args.id, data);
      await audit(ctx, {
        actorType: 'admin',
        action: 'scheduling.event_type_updated',
        eventTypeId: args.id,
      });
      return args.id;
    }

    const id = await ctx.db.insert('schedulingEventTypes', {
      ...data,
      createdAt: now,
    });
    await audit(ctx, {
      actorType: 'admin',
      action: 'scheduling.event_type_created',
      eventTypeId: id,
    });
    return id;
  },
});

export const setEventTypeActive = mutation({
  args: { id: v.id('schedulingEventTypes'), active: v.boolean() },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      active: args.active,
      updatedAt: Date.now(),
    });
    await audit(ctx, {
      actorType: 'admin',
      action: args.active
        ? 'scheduling.event_type_enabled'
        : 'scheduling.event_type_disabled',
      eventTypeId: args.id,
    });
    return true;
  },
});

export const replaceWeeklyAvailability = mutation({
  args: {
    scope: scopeValidator,
    rules: v.array(availabilityRuleInput),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);
    for (const rule of args.rules) validateAvailabilityRule(rule);

    const existing = await ctx.db
      .query('schedulingAvailabilityRules')
      .withIndex('by_scope', (q) => q.eq('scope', args.scope))
      .collect();
    for (const rule of existing) {
      await ctx.db.delete(rule._id);
    }

    const now = Date.now();
    for (const rule of args.rules) {
      await ctx.db.insert('schedulingAvailabilityRules', {
        scope: args.scope,
        ...rule,
        createdAt: now,
        updatedAt: now,
      });
    }

    await audit(ctx, {
      actorType: 'admin',
      action: 'scheduling.availability_replaced',
      eventTypeId: args.scope === 'global' ? undefined : args.scope,
      metadata: { ruleCount: args.rules.length },
    });
    return true;
  },
});

export const upsertDateOverride = mutation({
  args: {
    id: v.optional(v.id('schedulingDateOverrides')),
    scope: scopeValidator,
    date: v.string(),
    unavailable: v.boolean(),
    intervals: v.array(
      v.object({
        startMinutes: v.number(),
        endMinutes: v.number(),
      })
    ),
    timeZone: v.string(),
  },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);
    validateDateKey(args.date);
    for (const interval of args.intervals) {
      validateMinuteRange(interval.startMinutes, interval.endMinutes);
    }
    const intervals = [...args.intervals].sort(
      (a, b) => a.startMinutes - b.startMinutes
    );
    for (let index = 1; index < intervals.length; index += 1) {
      if (intervals[index - 1].endMinutes > intervals[index].startMinutes) {
        throw new Error('Date override windows cannot overlap.');
      }
    }

    const now = Date.now();
    const data = {
      scope: args.scope,
      date: args.date,
      unavailable: args.unavailable,
      intervals,
      timeZone: args.timeZone,
      updatedAt: now,
    };

    if (args.id) {
      await ctx.db.patch(args.id, data);
      return args.id;
    }

    const existing = await ctx.db
      .query('schedulingDateOverrides')
      .withIndex('by_scope_date', (q) =>
        q.eq('scope', args.scope).eq('date', args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert('schedulingDateOverrides', {
      ...data,
      createdAt: now,
    });
  },
});

export const removeDateOverride = mutation({
  args: { id: v.id('schedulingDateOverrides') },
  handler: async (ctx, args) => {
    await AuthUtils.requireAdmin(ctx);
    await ctx.db.delete(args.id);
    return true;
  },
});

export const disconnectGoogle = mutation({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);
    const connection = await getActiveConnection(ctx);
    if (!connection) return true;

    await ctx.db.patch(connection._id, {
      status: 'disabled',
      updatedAt: Date.now(),
    });
    await audit(ctx, {
      actorType: 'admin',
      action: 'scheduling.google_disconnected',
    });
    return true;
  },
});

export const createGoogleOAuthUrl = action({
  args: { redirectPath: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(
      internal.scheduling.assertAdminInternal,
      {}
    );
    const config = getGoogleConfig();
    const state = randomToken(32);
    const stateHash = await sha256Hex(state);

    await ctx.runMutation(internal.scheduling.createOAuthStateInternal, {
      stateHash,
      redirectPath: args.redirectPath,
      createdBy: admin.subject,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      login_hint: config.allowedAccountEmail,
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  },
});

export const completeGoogleOAuth = action({
  args: { code: v.string(), state: v.string() },
  handler: async (ctx, args): Promise<any> => {
    await ctx.runQuery(internal.scheduling.assertAdminInternal, {});
    const stateHash = await sha256Hex(args.state);
    const oauthState: any = await ctx.runMutation(
      internal.scheduling.consumeOAuthStateInternal,
      { stateHash }
    );

    if (!oauthState) {
      throw new Error('Google OAuth state expired or was already used.');
    }

    const config = getGoogleConfig();
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: args.code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenJson = await readGoogleJson(tokenResponse);
    if (!tokenResponse.ok) {
      throw new Error(
        `Google OAuth token exchange failed: ${tokenJson.error_description ?? tokenJson.error ?? tokenResponse.statusText}`
      );
    }
    if (!tokenJson.refresh_token) {
      throw new Error(
        'Google did not return a refresh token. Revoke the app in your Google account and connect again.'
      );
    }

    const profile = await getGoogleProfile(tokenJson.access_token);
    if (
      profile.email?.toLowerCase() !== config.allowedAccountEmail.toLowerCase()
    ) {
      throw new Error(
        `Connected Google account must be ${config.allowedAccountEmail}; received ${profile.email ?? 'unknown account'}.`
      );
    }

    const now = Date.now();
    await ctx.runMutation(internal.scheduling.upsertGoogleConnectionInternal, {
      accountEmail: profile.email,
      calendarId: config.calendarId,
      accessTokenEncrypted: await encryptSecret(tokenJson.access_token),
      refreshTokenEncrypted: await encryptSecret(tokenJson.refresh_token),
      tokenExpiresAt: now + Number(tokenJson.expires_in ?? 3600) * 1000,
      scopes: String(tokenJson.scope ?? GOOGLE_SCOPES.join(' ')).split(' '),
    });

    return {
      accountEmail: profile.email,
      redirectPath: oauthState.redirectPath ?? '/admin/scheduling',
    };
  },
});

export const getAvailability = action({
  args: {
    eventTypeSlug: v.string(),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    timeZone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const snapshot: any = await ctx.runQuery(
      internal.scheduling.getSchedulingSnapshotBySlugInternal,
      { slug: args.eventTypeSlug }
    );
    if (!snapshot?.eventType) {
      return {
        eventType: null,
        slots: [],
        reason: 'event_type_not_found',
      };
    }
    if (!snapshot.connection) {
      return {
        eventType: snapshot.eventType,
        slots: [],
        reason: 'google_not_connected',
      };
    }

    const now = Date.now();
    const from = args.from ?? now;
    const to =
      args.to ?? now + snapshot.eventType.maxAdvanceDays * 24 * 60 * 60 * 1000;
    const timeZone = args.timeZone ?? snapshot.hostTimeZone;
    const google = await getAuthorizedGoogleConnection(ctx);
    const googleBusy = await queryGoogleFreeBusy({
      accessToken: google.accessToken,
      calendarId: google.calendarId,
      from,
      to,
      timeZone,
    });

    const slots = buildAvailableSlots({
      eventType: snapshot.eventType,
      rules: snapshot.rules,
      overrides: snapshot.overrides,
      busy: [...snapshot.busy, ...googleBusy],
      from,
      to,
      now,
      timeZone: snapshot.hostTimeZone,
    });

    return {
      eventType: snapshot.eventType,
      slots,
      reason: null,
    };
  },
});

export const createBooking = action({
  args: {
    eventTypeSlug: v.string(),
    startTime: v.number(),
    timeZone: v.string(),
    inviteeName: v.string(),
    inviteeEmail: v.string(),
    notes: v.optional(v.string()),
    questionResponses: v.optional(v.array(questionResponseInput)),
  },
  handler: async (ctx, args): Promise<any> => {
    const inviteeEmail = normalizeEmail(args.inviteeEmail);
    if (!inviteeEmail) throw new Error('A valid email address is required.');
    if (!args.inviteeName.trim()) throw new Error('Your name is required.');

    const snapshot: any = await ctx.runQuery(
      internal.scheduling.getSchedulingSnapshotBySlugInternal,
      { slug: args.eventTypeSlug }
    );
    if (!snapshot?.eventType) throw new Error('Event type not found.');
    if (!snapshot.connection) {
      throw new Error('Google Calendar is not connected yet.');
    }
    const questionResponses = normalizeQuestionResponses({
      questions: snapshot.eventType.questions ?? [],
      responses: args.questionResponses ?? [],
    });

    const startTime = args.startTime;
    const endTime = startTime + snapshot.eventType.durationMinutes * 60 * 1000;
    const google = await getAuthorizedGoogleConnection(ctx);
    await assertSlotAvailable({
      snapshot,
      startTime,
      endTime,
      excludeBookingId: undefined,
      google,
    });

    const cancelToken = randomToken(32);
    const rescheduleToken = randomToken(32);
    const bookingId: Id<'schedulingBookings'> = await ctx.runMutation(
      internal.scheduling.reserveBookingInternal,
      {
        eventTypeId: snapshot.eventType._id,
        startTime,
        endTime,
        timeZone: args.timeZone,
        inviteeName: args.inviteeName.trim(),
        inviteeEmail,
        notes: args.notes?.trim() || undefined,
        questionResponses,
        cancelTokenHash: await sha256Hex(cancelToken),
        rescheduleTokenHash: await sha256Hex(rescheduleToken),
      }
    );

    try {
      const event = await insertGoogleCalendarEvent({
        accessToken: google.accessToken,
        calendarId: google.calendarId,
        eventType: snapshot.eventType,
        bookingId,
        startTime,
        endTime,
        hostTimeZone: snapshot.hostTimeZone,
        inviteeName: args.inviteeName.trim(),
        inviteeEmail,
        notes: args.notes?.trim(),
        questionResponses,
        cancelUrl: bookingUrl('cancel', cancelToken),
        rescheduleUrl: bookingUrl('reschedule', rescheduleToken),
      });

      await ctx.runMutation(internal.scheduling.finalizeBookingInternal, {
        bookingId,
        googleCalendarId: google.calendarId,
        googleEventId: event.id,
        googleEventHtmlLink: event.htmlLink,
        googleMeetUrl: extractMeetUrl(event),
        googleConferenceStatus:
          event.conferenceData?.createRequest?.status?.statusCode,
      });

      await sendBookingNotification(ctx, {
        bookingId,
        eventType: snapshot.eventType,
        startTime,
        endTime,
        timeZone: args.timeZone,
        inviteeName: args.inviteeName.trim(),
        inviteeEmail,
        notes: args.notes?.trim(),
        questionResponses,
        googleEventHtmlLink: event.htmlLink,
        googleMeetUrl: extractMeetUrl(event),
        cancelUrl: bookingUrl('cancel', cancelToken),
        rescheduleUrl: bookingUrl('reschedule', rescheduleToken),
      });

      return {
        bookingId,
        status: 'confirmed' as const,
        eventType: snapshot.eventType,
        startTime,
        endTime,
        googleEventHtmlLink: event.htmlLink,
        googleMeetUrl: extractMeetUrl(event),
        questionResponses,
        cancelUrl: bookingUrl('cancel', cancelToken),
        rescheduleUrl: bookingUrl('reschedule', rescheduleToken),
      };
    } catch (error) {
      await ctx.runMutation(internal.scheduling.failBookingInternal, {
        bookingId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});

export const getBookingByToken = action({
  args: {
    token: v.string(),
    purpose: v.union(v.literal('cancel'), v.literal('reschedule')),
  },
  handler: async (ctx, args): Promise<any> => {
    const tokenHash = await sha256Hex(args.token);
    return await ctx.runQuery(internal.scheduling.getBookingByTokenInternal, {
      tokenHash,
      purpose: args.purpose,
    });
  },
});

export const cancelBooking = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const tokenHash = await sha256Hex(args.token);
    const booking: any = await ctx.runQuery(
      internal.scheduling.getBookingByTokenInternal,
      { tokenHash, purpose: 'cancel' }
    );
    if (!booking) throw new Error('Booking not found.');
    if (booking.status === 'cancelled') return booking;
    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be cancelled.');
    }

    const google = await getAuthorizedGoogleConnection(ctx);
    if (booking.googleEventId) {
      await deleteGoogleCalendarEvent({
        accessToken: google.accessToken,
        calendarId: booking.googleCalendarId ?? google.calendarId,
        eventId: booking.googleEventId,
      });
    }

    await ctx.runMutation(internal.scheduling.cancelBookingInternal, {
      bookingId: booking._id,
      actorType: 'invitee',
    });

    return {
      ...booking,
      status: 'cancelled' as const,
    };
  },
});

export const cancelBookingAsAdmin = action({
  args: { bookingId: v.id('schedulingBookings') },
  handler: async (ctx, args): Promise<any> => {
    await ctx.runQuery(internal.scheduling.assertAdminInternal, {});

    const booking: any = await ctx.runQuery(
      internal.scheduling.getBookingByIdInternal,
      { bookingId: args.bookingId }
    );
    if (!booking) throw new Error('Booking not found.');
    if (booking.status === 'cancelled') return booking;
    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be cancelled.');
    }

    const google = await getAuthorizedGoogleConnection(ctx);
    if (booking.googleEventId) {
      await deleteGoogleCalendarEvent({
        accessToken: google.accessToken,
        calendarId: booking.googleCalendarId ?? google.calendarId,
        eventId: booking.googleEventId,
      });
    }

    await ctx.runMutation(internal.scheduling.cancelBookingInternal, {
      bookingId: args.bookingId,
      actorType: 'admin',
    });

    return {
      ...booking,
      status: 'cancelled' as const,
    };
  },
});

export const rescheduleBooking = action({
  args: {
    token: v.string(),
    startTime: v.number(),
    timeZone: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const tokenHash = await sha256Hex(args.token);
    const booking: any = await ctx.runQuery(
      internal.scheduling.getBookingByTokenInternal,
      { tokenHash, purpose: 'reschedule' }
    );
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be rescheduled.');
    }

    return await rescheduleConfirmedBooking(ctx, {
      booking,
      startTime: args.startTime,
      timeZone: args.timeZone,
      actorType: 'invitee',
    });
  },
});

export const rescheduleBookingAsAdmin = action({
  args: {
    bookingId: v.id('schedulingBookings'),
    startTime: v.number(),
    timeZone: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    await ctx.runQuery(internal.scheduling.assertAdminInternal, {});
    const booking: any = await ctx.runQuery(
      internal.scheduling.getBookingByIdInternal,
      { bookingId: args.bookingId }
    );
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be rescheduled.');
    }

    return await rescheduleConfirmedBooking(ctx, {
      booking,
      startTime: args.startTime,
      timeZone: args.timeZone,
      actorType: 'admin',
    });
  },
});

async function rescheduleConfirmedBooking(
  ctx: ActionCtx,
  args: {
    booking: Doc<'schedulingBookings'>;
    startTime: number;
    timeZone: string;
    actorType: 'admin' | 'invitee';
  }
) {
  const snapshot: any = await ctx.runQuery(
    internal.scheduling.getSchedulingSnapshotByIdInternal,
    { eventTypeId: args.booking.eventTypeId }
  );
  if (!snapshot?.eventType) throw new Error('Event type not found.');

  const endTime: number =
    args.startTime + snapshot.eventType.durationMinutes * 60 * 1000;
  const google = await getAuthorizedGoogleConnection(ctx);
  await assertSlotAvailable({
    snapshot,
    startTime: args.startTime,
    endTime,
    excludeBookingId: args.booking._id,
    google,
  });

  await ctx.runMutation(internal.scheduling.lockBookingForRescheduleInternal, {
    bookingId: args.booking._id,
    startTime: args.startTime,
    endTime,
    timeZone: args.timeZone,
  });

  try {
    if (args.booking.googleEventId) {
      await patchGoogleCalendarEventTime({
        accessToken: google.accessToken,
        calendarId: args.booking.googleCalendarId ?? google.calendarId,
        eventId: args.booking.googleEventId,
        startTime: args.startTime,
        endTime,
        hostTimeZone: snapshot.hostTimeZone,
      });
    }

    await ctx.runMutation(
      internal.scheduling.confirmRescheduledBookingInternal,
      { bookingId: args.booking._id, actorType: args.actorType }
    );

    return {
      ...args.booking,
      status: 'confirmed' as const,
      startTime: args.startTime,
      endTime,
      timeZone: args.timeZone,
    };
  } catch (error) {
    await ctx.runMutation(internal.scheduling.restoreFailedRescheduleInternal, {
      bookingId: args.booking._id,
      startTime: args.booking.startTime,
      endTime: args.booking.endTime,
      timeZone: args.booking.timeZone,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export const assertAdminInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    await AuthUtils.requireAdmin(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Authentication required.');
    return {
      subject: identity.subject,
      email: identity.email,
    };
  },
});

export const getSchedulingSnapshotBySlugInternal = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const eventType = await ctx.db
      .query('schedulingEventTypes')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first();
    if (!eventType?.active) return null;
    return await buildSnapshot(ctx, eventType);
  },
});

export const getSchedulingSnapshotByIdInternal = internalQuery({
  args: { eventTypeId: v.id('schedulingEventTypes') },
  handler: async (ctx, args) => {
    const eventType = await ctx.db.get(args.eventTypeId);
    if (!eventType?.active) return null;
    return await buildSnapshot(ctx, eventType);
  },
});

export const getBookingByTokenInternal = internalQuery({
  args: {
    tokenHash: v.string(),
    purpose: v.union(v.literal('cancel'), v.literal('reschedule')),
  },
  handler: async (ctx, args) => {
    const booking =
      args.purpose === 'cancel'
        ? await ctx.db
            .query('schedulingBookings')
            .withIndex('by_cancel_token_hash', (q) =>
              q.eq('cancelTokenHash', args.tokenHash)
            )
            .first()
        : await ctx.db
            .query('schedulingBookings')
            .withIndex('by_reschedule_token_hash', (q) =>
              q.eq('rescheduleTokenHash', args.tokenHash)
            )
            .first();

    if (!booking) return null;
    const eventType = await ctx.db.get(booking.eventTypeId);
    return {
      ...booking,
      eventType,
    };
  },
});

export const getBookingByIdInternal = internalQuery({
  args: { bookingId: v.id('schedulingBookings') },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;
    const eventType = await ctx.db.get(booking.eventTypeId);
    return {
      ...booking,
      eventType,
    };
  },
});

export const getGoogleConnectionInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await getActiveConnection(ctx);
  },
});

export const createOAuthStateInternal = internalMutation({
  args: {
    stateHash: v.string(),
    redirectPath: v.optional(v.string()),
    createdBy: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('schedulingOAuthStates', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const consumeOAuthStateInternal = internalMutation({
  args: { stateHash: v.string() },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query('schedulingOAuthStates')
      .withIndex('by_state_hash', (q) => q.eq('stateHash', args.stateHash))
      .first();
    if (!state) return null;
    await ctx.db.delete(state._id);
    if (state.expiresAt < Date.now()) return null;
    return state;
  },
});

export const upsertGoogleConnectionInternal = internalMutation({
  args: {
    accountEmail: v.string(),
    calendarId: v.string(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    tokenExpiresAt: v.number(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await getActiveConnection(ctx);
    const now = Date.now();
    const data = {
      provider: 'google' as const,
      accountEmail: args.accountEmail,
      calendarId: args.calendarId,
      accessTokenEncrypted: args.accessTokenEncrypted,
      refreshTokenEncrypted: args.refreshTokenEncrypted,
      tokenExpiresAt: args.tokenExpiresAt,
      scopes: args.scopes,
      status: 'connected' as const,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert('schedulingGoogleConnections', {
      ...data,
      createdAt: now,
    });
  },
});

export const updateGoogleConnectionTokensInternal = internalMutation({
  args: {
    connectionId: v.id('schedulingGoogleConnections'),
    accessTokenEncrypted: v.string(),
    tokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      accessTokenEncrypted: args.accessTokenEncrypted,
      tokenExpiresAt: args.tokenExpiresAt,
      status: 'connected',
      updatedAt: Date.now(),
    });
  },
});

export const markGoogleConnectionNeedsReconnectInternal = internalMutation({
  args: { connectionId: v.id('schedulingGoogleConnections') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      status: 'needs_reconnect',
      updatedAt: Date.now(),
    });
  },
});

export const reserveBookingInternal = internalMutation({
  args: {
    eventTypeId: v.id('schedulingEventTypes'),
    startTime: v.number(),
    endTime: v.number(),
    timeZone: v.string(),
    inviteeName: v.string(),
    inviteeEmail: v.string(),
    notes: v.optional(v.string()),
    questionResponses: v.optional(
      v.array(
        v.object({
          questionId: v.string(),
          label: v.string(),
          value: v.string(),
        })
      )
    ),
    cancelTokenHash: v.string(),
    rescheduleTokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    await assertNoLocalConflict(ctx, {
      eventTypeId: args.eventTypeId,
      startTime: args.startTime,
      endTime: args.endTime,
    });

    const now = Date.now();
    return await ctx.db.insert('schedulingBookings', {
      ...args,
      status: 'pending_google',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const finalizeBookingInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    googleCalendarId: v.string(),
    googleEventId: v.string(),
    googleEventHtmlLink: v.optional(v.string()),
    googleMeetUrl: v.optional(v.string()),
    googleConferenceStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error('Booking not found.');
    await ctx.db.patch(args.bookingId, {
      status: 'confirmed',
      googleCalendarId: args.googleCalendarId,
      googleEventId: args.googleEventId,
      googleEventHtmlLink: args.googleEventHtmlLink,
      googleMeetUrl: args.googleMeetUrl,
      googleConferenceStatus: args.googleConferenceStatus,
      updatedAt: Date.now(),
    });
    await audit(ctx, {
      actorType: 'invitee',
      action: 'scheduling.booking_confirmed',
      bookingId: args.bookingId,
      eventTypeId: booking.eventTypeId,
    });
  },
});

export const recordBookingNotificationInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    eventTypeId: v.id('schedulingEventTypes'),
    status: v.union(
      v.literal('sent'),
      v.literal('skipped'),
      v.literal('failed')
    ),
    providerMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await audit(ctx, {
      actorType: 'system',
      action: `scheduling.booking_notification_${args.status}`,
      bookingId: args.bookingId,
      eventTypeId: args.eventTypeId,
      metadata: {
        provider: 'resend',
        providerMessageId: args.providerMessageId,
        errorMessage: args.errorMessage,
      },
    });
  },
});

export const failBookingInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      status: 'failed',
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const cancelBookingInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    actorType: v.union(v.literal('admin'), v.literal('invitee')),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error('Booking not found.');
    await ctx.db.patch(args.bookingId, {
      status: 'cancelled',
      updatedAt: Date.now(),
    });
    await audit(ctx, {
      actorType: args.actorType,
      action: 'scheduling.booking_cancelled',
      bookingId: args.bookingId,
      eventTypeId: booking.eventTypeId,
    });
  },
});

export const lockBookingForRescheduleInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    startTime: v.number(),
    endTime: v.number(),
    timeZone: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error('Booking not found.');
    await assertNoLocalConflict(ctx, {
      eventTypeId: booking.eventTypeId,
      startTime: args.startTime,
      endTime: args.endTime,
      excludeBookingId: args.bookingId,
    });
    await ctx.db.patch(args.bookingId, {
      status: 'pending_google',
      startTime: args.startTime,
      endTime: args.endTime,
      timeZone: args.timeZone,
      updatedAt: Date.now(),
    });
  },
});

export const confirmRescheduledBookingInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    actorType: v.optional(v.union(v.literal('admin'), v.literal('invitee'))),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error('Booking not found.');
    await ctx.db.patch(args.bookingId, {
      status: 'confirmed',
      updatedAt: Date.now(),
    });
    await audit(ctx, {
      actorType: args.actorType ?? 'invitee',
      action: 'scheduling.booking_rescheduled',
      bookingId: args.bookingId,
      eventTypeId: booking.eventTypeId,
    });
  },
});

export const restoreFailedRescheduleInternal = internalMutation({
  args: {
    bookingId: v.id('schedulingBookings'),
    startTime: v.number(),
    endTime: v.number(),
    timeZone: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.bookingId, {
      status: 'confirmed',
      startTime: args.startTime,
      endTime: args.endTime,
      timeZone: args.timeZone,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

async function buildSnapshot(
  ctx: QueryCtx,
  eventType: Doc<'schedulingEventTypes'>
) {
  const eventRules = await ctx.db
    .query('schedulingAvailabilityRules')
    .withIndex('by_scope', (q) => q.eq('scope', eventType._id))
    .collect();
  const globalRules = await ctx.db
    .query('schedulingAvailabilityRules')
    .withIndex('by_scope', (q) => q.eq('scope', 'global'))
    .collect();
  const rules = eventRules.length ? eventRules : globalRules;
  const eventOverrides = await ctx.db
    .query('schedulingDateOverrides')
    .withIndex('by_scope', (q) => q.eq('scope', eventType._id))
    .collect();
  const globalOverrides = await ctx.db
    .query('schedulingDateOverrides')
    .withIndex('by_scope', (q) => q.eq('scope', 'global'))
    .collect();
  const bookingBusy = (
    await ctx.db
      .query('schedulingBookings')
      .withIndex('by_event_type_time', (q) =>
        q.eq('eventTypeId', eventType._id)
      )
      .collect()
  )
    .filter((booking) =>
      ['pending_google', 'confirmed'].includes(booking.status)
    )
    .map((booking) => ({
      bookingId: booking._id,
      startTime: booking.startTime,
      endTime: booking.endTime,
    }));
  const holdBusy = (
    await ctx.db
      .query('schedulingBookingHolds')
      .withIndex('by_event_type_time', (q) =>
        q.eq('eventTypeId', eventType._id)
      )
      .collect()
  )
    .filter((hold) => hold.expiresAt > Date.now())
    .map((hold) => ({
      startTime: hold.startTime,
      endTime: hold.endTime,
    }));
  const connection = await getActiveConnection(ctx);

  return {
    eventType,
    rules,
    overrides: mergeOverrides(globalOverrides, eventOverrides),
    busy: [...bookingBusy, ...holdBusy],
    connection: connection
      ? {
          accountEmail: connection.accountEmail,
          calendarId: connection.calendarId,
          status: connection.status,
        }
      : null,
    hostTimeZone: rules[0]?.timeZone ?? DEFAULT_TIME_ZONE,
  };
}

async function getActiveConnection(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<'schedulingGoogleConnections'> | null> {
  return await ctx.db
    .query('schedulingGoogleConnections')
    .withIndex('by_provider', (q) => q.eq('provider', 'google'))
    .filter((q) => q.neq(q.field('status'), 'disabled'))
    .first();
}

function mergeOverrides(
  globalOverrides: Doc<'schedulingDateOverrides'>[],
  eventOverrides: Doc<'schedulingDateOverrides'>[]
) {
  const merged = new Map<string, Doc<'schedulingDateOverrides'>>();
  for (const override of globalOverrides) merged.set(override.date, override);
  for (const override of eventOverrides) merged.set(override.date, override);
  return Array.from(merged.values());
}

async function assertSlotAvailable(args: {
  snapshot: Awaited<ReturnType<typeof buildSnapshot>>;
  startTime: number;
  endTime: number;
  excludeBookingId: Id<'schedulingBookings'> | undefined;
  google: AuthorizedGoogleConnection;
}) {
  const from = args.startTime - 24 * 60 * 60 * 1000;
  const to = args.endTime + 24 * 60 * 60 * 1000;
  const googleBusy = await queryGoogleFreeBusy({
    accessToken: args.google.accessToken,
    calendarId: args.google.calendarId,
    from,
    to,
    timeZone: args.snapshot.hostTimeZone,
  });
  const localBusy = args.excludeBookingId
    ? args.snapshot.busy.filter(
        (range: TimeInterval & { bookingId?: Id<'schedulingBookings'> }) =>
          range.bookingId !== args.excludeBookingId
      )
    : args.snapshot.busy;
  const slots = buildAvailableSlots({
    eventType: args.snapshot.eventType,
    rules: args.snapshot.rules,
    overrides: args.snapshot.overrides,
    busy: [...localBusy, ...googleBusy],
    from: args.startTime,
    to: args.endTime,
    now: Date.now(),
    timeZone: args.snapshot.hostTimeZone,
  });

  if (!slots.some((slot) => slot.startTime === args.startTime)) {
    throw new Error('That time is no longer available.');
  }
}

async function assertNoLocalConflict(
  ctx: MutationCtx,
  args: {
    eventTypeId: Id<'schedulingEventTypes'>;
    startTime: number;
    endTime: number;
    excludeBookingId?: Id<'schedulingBookings'>;
  }
) {
  const bookings = await ctx.db
    .query('schedulingBookings')
    .withIndex('by_event_type_time', (q) =>
      q.eq('eventTypeId', args.eventTypeId)
    )
    .collect();

  for (const booking of bookings) {
    if (booking._id === args.excludeBookingId) continue;
    if (!['pending_google', 'confirmed'].includes(booking.status)) continue;
    if (
      intervalsOverlap(args.startTime, args.endTime, {
        startTime: booking.startTime,
        endTime: booking.endTime,
      })
    ) {
      throw new Error('That time is already booked.');
    }
  }

  const holds = await ctx.db
    .query('schedulingBookingHolds')
    .withIndex('by_event_type_time', (q) =>
      q.eq('eventTypeId', args.eventTypeId)
    )
    .collect();
  const now = Date.now();
  for (const hold of holds) {
    if (hold.expiresAt <= now) continue;
    if (
      intervalsOverlap(args.startTime, args.endTime, {
        startTime: hold.startTime,
        endTime: hold.endTime,
      })
    ) {
      throw new Error('That time is being held by another booking attempt.');
    }
  }
}

type AuthorizedGoogleConnection = {
  connectionId: Id<'schedulingGoogleConnections'>;
  calendarId: string;
  accessToken: string;
};

async function getAuthorizedGoogleConnection(
  ctx: ActionCtx
): Promise<AuthorizedGoogleConnection> {
  const connection = await ctx.runQuery(
    internal.scheduling.getGoogleConnectionInternal,
    {}
  );
  if (!connection || connection.status !== 'connected') {
    throw new Error('Google Calendar is not connected.');
  }

  try {
    if (
      connection.accessTokenEncrypted &&
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt > Date.now() + 60 * 1000
    ) {
      return {
        connectionId: connection._id,
        calendarId: connection.calendarId,
        accessToken: await decryptSecret(connection.accessTokenEncrypted),
      };
    }

    const config = getGoogleConfig();
    const refreshToken = await decryptSecret(connection.refreshTokenEncrypted);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const json = await readGoogleJson(response);
    if (!response.ok) {
      await ctx.runMutation(
        internal.scheduling.markGoogleConnectionNeedsReconnectInternal,
        { connectionId: connection._id }
      );
      throw new Error(
        `Google token refresh failed: ${json.error_description ?? json.error ?? response.statusText}`
      );
    }

    await ctx.runMutation(
      internal.scheduling.updateGoogleConnectionTokensInternal,
      {
        connectionId: connection._id,
        accessTokenEncrypted: await encryptSecret(json.access_token),
        tokenExpiresAt: Date.now() + Number(json.expires_in ?? 3600) * 1000,
      }
    );

    return {
      connectionId: connection._id,
      calendarId: connection.calendarId,
      accessToken: json.access_token,
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Unable to authorize Google Calendar.');
  }
}

async function queryGoogleFreeBusy({
  accessToken,
  calendarId,
  from,
  to,
  timeZone,
}: {
  accessToken: string;
  calendarId: string;
  from: number;
  to: number;
  timeZone: string;
}): Promise<TimeInterval[]> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: new Date(from).toISOString(),
        timeMax: new Date(to).toISOString(),
        timeZone,
        items: [{ id: calendarId }],
      }),
    }
  );
  const json = await readGoogleJson(response);
  if (!response.ok) {
    throw new Error(
      `Google FreeBusy failed: ${json.error?.message ?? response.statusText}`
    );
  }

  return (json.calendars?.[calendarId]?.busy ?? []).map(
    (range: { start: string; end: string }) => ({
      startTime: Date.parse(range.start),
      endTime: Date.parse(range.end),
    })
  );
}

async function insertGoogleCalendarEvent({
  accessToken,
  calendarId,
  eventType,
  bookingId,
  startTime,
  endTime,
  hostTimeZone,
  inviteeName,
  inviteeEmail,
  notes,
  questionResponses,
  cancelUrl,
  rescheduleUrl,
}: {
  accessToken: string;
  calendarId: string;
  eventType: Doc<'schedulingEventTypes'>;
  bookingId: Id<'schedulingBookings'>;
  startTime: number;
  endTime: number;
  hostTimeZone: string;
  inviteeName: string;
  inviteeEmail: string;
  notes?: string;
  questionResponses?: Array<{
    questionId: string;
    label: string;
    value: string;
  }>;
  cancelUrl: string;
  rescheduleUrl: string;
}) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?${new URLSearchParams({
      conferenceDataVersion: '1',
      sendUpdates: 'all',
    })}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        summary: `${eventType.title} with ${inviteeName}`,
        description: calendarDescription({
          notes,
          questionResponses,
          cancelUrl,
          rescheduleUrl,
        }),
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: hostTimeZone,
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: hostTimeZone,
        },
        attendees: [{ email: inviteeEmail, displayName: inviteeName }],
        reminders: googleEventReminders(eventType.reminders),
        conferenceData: {
          createRequest: {
            requestId: randomToken(16),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        extendedProperties: {
          private: {
            bookingId,
            source: 'jacobstein-booking',
          },
        },
      }),
    }
  );
  const json = await readGoogleJson(response);
  if (!response.ok) {
    throw new Error(
      `Google Calendar event creation failed: ${json.error?.message ?? response.statusText}`
    );
  }
  return json;
}

function googleEventReminders(reminders: SchedulerReminder[] | undefined) {
  return {
    useDefault: false,
    overrides: normalizeReminders(reminders ?? DEFAULT_EVENT_REMINDERS),
  };
}

async function patchGoogleCalendarEventTime({
  accessToken,
  calendarId,
  eventId,
  startTime,
  endTime,
  hostTimeZone,
}: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  startTime: number;
  endTime: number;
  hostTimeZone: string;
}) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}?${new URLSearchParams({
      sendUpdates: 'all',
      conferenceDataVersion: '1',
    })}`,
    {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: hostTimeZone,
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: hostTimeZone,
        },
      }),
    }
  );
  const json = await readGoogleJson(response);
  if (!response.ok) {
    throw new Error(
      `Google Calendar event update failed: ${json.error?.message ?? response.statusText}`
    );
  }
  return json;
}

async function deleteGoogleCalendarEvent({
  accessToken,
  calendarId,
  eventId,
}: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: 'DELETE',
      headers: { authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok && response.status !== 410 && response.status !== 404) {
    const json = await readGoogleJson(response);
    throw new Error(
      `Google Calendar event cancellation failed: ${json.error?.message ?? response.statusText}`
    );
  }
}

function extractMeetUrl(event: any): string | undefined {
  return (
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find(
      (entryPoint: { entryPointType?: string }) =>
        entryPoint.entryPointType === 'video'
    )?.uri
  );
}

async function getGoogleProfile(
  accessToken: string
): Promise<{ email?: string }> {
  const response = await fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    {
      headers: { authorization: `Bearer ${accessToken}` },
    }
  );
  const json = await readGoogleJson(response);
  if (!response.ok) {
    throw new Error(
      `Google account verification failed: ${json.error_description ?? json.error ?? response.statusText}`
    );
  }
  return json;
}

function calendarDescription({
  notes,
  questionResponses,
  cancelUrl,
  rescheduleUrl,
}: {
  notes?: string;
  questionResponses?: Array<{
    questionId: string;
    label: string;
    value: string;
  }>;
  cancelUrl: string;
  rescheduleUrl: string;
}) {
  const answers =
    questionResponses && questionResponses.length > 0
      ? `Invitee answers:\n${questionResponses
          .map((response) => `${response.label}: ${response.value}`)
          .join('\n')}`
      : null;

  return [
    notes ? `Invitee notes:\n${notes}` : null,
    answers,
    `Manage this booking:\nReschedule: ${rescheduleUrl}\nCancel: ${cancelUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function sendBookingNotification(
  ctx: ActionCtx,
  args: {
    bookingId: Id<'schedulingBookings'>;
    eventType: Doc<'schedulingEventTypes'>;
    startTime: number;
    endTime: number;
    timeZone: string;
    inviteeName: string;
    inviteeEmail: string;
    notes?: string;
    questionResponses?: Array<{
      questionId: string;
      label: string;
      value: string;
    }>;
    googleEventHtmlLink?: string;
    googleMeetUrl?: string;
    cancelUrl: string;
    rescheduleUrl: string;
  }
) {
  const config = getBookingNotificationConfig();
  if (!config) {
    await ctx.runMutation(
      internal.scheduling.recordBookingNotificationInternal,
      {
        bookingId: args.bookingId,
        eventTypeId: args.eventType._id,
        status: 'skipped',
        errorMessage:
          'Booking notification email is not configured. Set RESEND_API_KEY and BOOKING_NOTIFICATION_FROM.',
      }
    );
    return;
  }

  try {
    const notification = buildBookingNotificationEmail({
      ...args,
      to: config.to,
      from: config.from,
    });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
    const json = await readJson(response);

    if (!response.ok) {
      throw new Error(json.message ?? json.error ?? response.statusText);
    }

    await ctx.runMutation(
      internal.scheduling.recordBookingNotificationInternal,
      {
        bookingId: args.bookingId,
        eventTypeId: args.eventType._id,
        status: 'sent',
        providerMessageId: json.id,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Booking notification email failed', {
      bookingId: args.bookingId,
      errorMessage,
    });
    await ctx.runMutation(
      internal.scheduling.recordBookingNotificationInternal,
      {
        bookingId: args.bookingId,
        eventTypeId: args.eventType._id,
        status: 'failed',
        errorMessage,
      }
    );
  }
}

function buildBookingNotificationEmail(args: {
  to: string;
  from: string;
  eventType: Doc<'schedulingEventTypes'>;
  startTime: number;
  endTime: number;
  timeZone: string;
  inviteeName: string;
  inviteeEmail: string;
  notes?: string;
  questionResponses?: Array<{
    questionId: string;
    label: string;
    value: string;
  }>;
  googleEventHtmlLink?: string;
  googleMeetUrl?: string;
  cancelUrl: string;
  rescheduleUrl: string;
}) {
  const scheduledDate = formatBookingDate(args.startTime, args.timeZone);
  const scheduledTime = formatBookingTime(args.startTime, args.timeZone);
  const scheduledRange = `${scheduledTime} - ${formatBookingTime(
    args.endTime,
    args.timeZone
  )}`;
  const subject = `${args.inviteeName} scheduled ${args.eventType.title} on ${scheduledDate} at ${scheduledTime}`;
  const answers = args.questionResponses?.filter((response) =>
    response.value.trim()
  );

  const textLines = [
    `${args.inviteeName} scheduled ${args.eventType.title}.`,
    '',
    `When: ${scheduledDate} at ${scheduledRange}`,
    `Time zone: ${args.timeZone}`,
    `Invitee: ${args.inviteeName} <${args.inviteeEmail}>`,
    args.googleMeetUrl ? `Google Meet: ${args.googleMeetUrl}` : null,
    args.googleEventHtmlLink
      ? `Calendar event: ${args.googleEventHtmlLink}`
      : null,
    '',
    args.notes ? `Message:\n${args.notes}` : 'Message: none',
    answers && answers.length > 0
      ? `Answers:\n${answers
          .map((response) => `${response.label}: ${response.value}`)
          .join('\n')}`
      : null,
    '',
    `Reschedule: ${args.rescheduleUrl}`,
    `Cancel: ${args.cancelUrl}`,
  ].filter(Boolean);

  const rows = [
    ['Event', args.eventType.title],
    ['When', `${scheduledDate} at ${scheduledRange}`],
    ['Time zone', args.timeZone],
    ['Invitee', `${args.inviteeName} <${args.inviteeEmail}>`],
    args.googleMeetUrl ? ['Google Meet', args.googleMeetUrl] : null,
    args.googleEventHtmlLink
      ? ['Calendar event', args.googleEventHtmlLink]
      : null,
  ].filter(Boolean) as Array<[string, string]>;

  return {
    from: args.from,
    to: [args.to],
    reply_to: args.inviteeEmail,
    subject,
    text: textLines.join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1a1a18; line-height: 1.5;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(args.inviteeName)} scheduled ${escapeHtml(args.eventType.title)}</h1>
        <table style="border-collapse: collapse; margin-bottom: 20px; width: 100%;">
          <tbody>
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="border-top: 1px solid #d3d1c8; color: #5c5b55; padding: 8px 12px 8px 0; vertical-align: top; width: 130px;">${escapeHtml(label)}</td>
                    <td style="border-top: 1px solid #d3d1c8; padding: 8px 0; vertical-align: top;">${linkifyHtml(value)}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
        <h2 style="font-size: 14px; margin: 0 0 8px;">Message</h2>
        <p style="white-space: pre-wrap; margin: 0 0 20px;">${escapeHtml(args.notes || 'None')}</p>
        ${
          answers && answers.length > 0
            ? `
              <h2 style="font-size: 14px; margin: 0 0 8px;">Answers</h2>
              <ul style="padding-left: 20px; margin: 0 0 20px;">
                ${answers
                  .map(
                    (answer) =>
                      `<li><strong>${escapeHtml(answer.label)}:</strong> ${escapeHtml(answer.value)}</li>`
                  )
                  .join('')}
              </ul>
            `
            : ''
        }
        <p style="margin: 0;">
          <a href="${escapeHtml(args.rescheduleUrl)}">Reschedule</a>
          &nbsp;|&nbsp;
          <a href="${escapeHtml(args.cancelUrl)}">Cancel</a>
        </p>
      </div>
    `,
  };
}

function getBookingNotificationConfig(): {
  apiKey: string;
  from: string;
  to: string;
} | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.BOOKING_NOTIFICATION_FROM ?? DEFAULT_BOOKING_NOTIFICATION_FROM;
  const to =
    process.env.BOOKING_NOTIFICATION_TO ??
    process.env.GOOGLE_ALLOWED_ACCOUNT_EMAIL ??
    DEFAULT_HOST_EMAIL;

  if (!apiKey || !from || !to) return null;
  return { apiKey, from, to };
}

function bookingUrl(kind: 'cancel' | 'reschedule', token: string) {
  const baseUrl =
    process.env.BOOKING_PUBLIC_BASE_URL ?? 'http://localhost:3030/';
  return `${baseUrl.replace(/\/$/, '')}/book/${kind}?token=${encodeURIComponent(
    token
  )}`;
}

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function readGoogleJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth environment variables are not configured.');
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    allowedAccountEmail:
      process.env.GOOGLE_ALLOWED_ACCOUNT_EMAIL ?? DEFAULT_HOST_EMAIL,
  };
}

function formatBookingDate(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(timestamp);
}

function formatBookingTime(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(timestamp);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkifyHtml(value: string) {
  if (/^https?:\/\//.test(value)) {
    const escaped = escapeHtml(value);
    return `<a href="${escaped}">${escaped}</a>`;
  }
  return escapeHtml(value);
}

async function encryptSecret(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getEncryptionKey();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value)
  );
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

async function decryptSecret(value: string) {
  const [ivEncoded, dataEncoded] = value.split('.');
  if (!ivEncoded || !dataEncoded) throw new Error('Invalid encrypted secret.');
  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64UrlDecode(ivEncoded) },
    key,
    base64UrlDecode(dataEncoded)
  );
  return new TextDecoder().decode(decrypted);
}

async function getEncryptionKey() {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!secret)
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is not configured.');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(secret)
  );
  return await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(bytes: number) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return base64UrlEncode(data);
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

type SchedulerQuestion = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
};

type SchedulerReminder = {
  method: 'email' | 'popup';
  minutes: number;
};

type SchedulerQuestionResponse = {
  questionId: string;
  value: string;
};

function normalizeQuestions(questions: SchedulerQuestion[]) {
  const seen = new Set<string>();
  return questions.map((question) => {
    const id = question.id.trim();
    const label = question.label.trim();
    const options =
      question.type === 'select'
        ? (question.options ?? [])
            .map((option) => option.trim())
            .filter(Boolean)
        : undefined;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(
        'Question IDs must use lowercase letters, numbers, and hyphens.'
      );
    }
    if (seen.has(id)) throw new Error('Question IDs must be unique.');
    if (!label) throw new Error('Question labels are required.');
    if (label.length > 120) {
      throw new Error('Question labels must be 120 characters or less.');
    }
    if (question.type === 'select' && (!options || options.length === 0)) {
      throw new Error('Select questions must include at least one option.');
    }

    seen.add(id);
    const normalized = {
      id,
      label,
      type: question.type,
      required: question.required,
    };
    return question.type === 'select'
      ? {
          ...normalized,
          options,
        }
      : normalized;
  });
}

function normalizeReminders(reminders: SchedulerReminder[]) {
  if (reminders.length > 5) {
    throw new Error('Event types can have at most five reminders.');
  }

  return reminders
    .map((reminder) => ({
      method: reminder.method,
      minutes: Math.round(Number(reminder.minutes)),
    }))
    .filter((reminder) => {
      if (!['email', 'popup'].includes(reminder.method)) {
        throw new Error('Reminder method must be email or popup.');
      }
      if (!Number.isFinite(reminder.minutes)) {
        throw new Error('Reminder timing is required.');
      }
      if (reminder.minutes < 0 || reminder.minutes > 60 * 24 * 30) {
        throw new Error('Reminders must be between 0 minutes and 30 days.');
      }
      return true;
    })
    .sort((a, b) => b.minutes - a.minutes);
}

function normalizeQuestionResponses({
  questions,
  responses,
}: {
  questions: SchedulerQuestion[];
  responses: SchedulerQuestionResponse[];
}) {
  const responsesByQuestion = new Map(
    responses.map((response) => [
      response.questionId,
      String(response.value ?? '').trim(),
    ])
  );
  const normalized: Array<{
    questionId: string;
    label: string;
    value: string;
  }> = [];

  for (const question of questions) {
    const value = responsesByQuestion.get(question.id) ?? '';
    if (question.required && !value) {
      throw new Error(`Answer required: ${question.label}`);
    }
    if (!value) continue;
    if (question.type === 'select' && !question.options?.includes(value)) {
      throw new Error(`Choose a valid answer for ${question.label}.`);
    }

    normalized.push({
      questionId: question.id,
      label: question.label,
      value,
    });
  }

  return normalized;
}

function validateEventTypeInput(args: {
  slug: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  questions?: SchedulerQuestion[];
  reminders?: SchedulerReminder[];
}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) {
    throw new Error('Slug must use lowercase letters, numbers, and hyphens.');
  }
  if (args.durationMinutes < 5 || args.durationMinutes > 240) {
    throw new Error('Duration must be between 5 and 240 minutes.');
  }
  if (args.slotIntervalMinutes < 5 || args.slotIntervalMinutes > 120) {
    throw new Error('Slot interval must be between 5 and 120 minutes.');
  }
  if (args.bufferBeforeMinutes < 0 || args.bufferAfterMinutes < 0) {
    throw new Error('Buffers cannot be negative.');
  }
  if (args.minNoticeMinutes < 0 || args.maxAdvanceDays < 1) {
    throw new Error('Notice and advance windows must be positive.');
  }
  normalizeQuestions(args.questions ?? []);
  normalizeReminders(args.reminders ?? DEFAULT_EVENT_REMINDERS);
}

function validateAvailabilityRule(rule: {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}) {
  if (rule.dayOfWeek < 0 || rule.dayOfWeek > 6) {
    throw new Error('Day of week must be between 0 and 6.');
  }
  validateMinuteRange(rule.startMinutes, rule.endMinutes);
}

function validateMinuteRange(startMinutes: number, endMinutes: number) {
  if (startMinutes < 0 || endMinutes > 24 * 60 || startMinutes >= endMinutes) {
    throw new Error('Availability ranges must be within a single day.');
  }
}

function validateDateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Date must use YYYY-MM-DD format.');
  }
}

async function audit(
  ctx: MutationCtx,
  args: {
    actorType: 'admin' | 'invitee' | 'system';
    action: string;
    bookingId?: Id<'schedulingBookings'>;
    eventTypeId?: Id<'schedulingEventTypes'>;
    metadata?: unknown;
  }
) {
  const identity = await ctx.auth.getUserIdentity();
  await ctx.db.insert('schedulingAuditEvents', {
    actorType: args.actorType,
    actorId: identity?.subject,
    action: args.action,
    bookingId: args.bookingId,
    eventTypeId: args.eventTypeId,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
}
