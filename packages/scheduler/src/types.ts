export type MaybePromise<T> = T | Promise<T>;

export type SchedulerQuestion = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
};

export type SchedulerQuestionResponse = {
  questionId: string;
  value: string;
};

export type SchedulerReminder = {
  method: 'email' | 'popup';
  minutes: number;
};

export type SchedulerEventType = {
  id?: string;
  _id?: string;
  slug: string;
  title: string;
  description?: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  questions?: SchedulerQuestion[];
  reminders?: SchedulerReminder[];
  active: boolean;
  sortOrder: number;
};

export type AvailableSlot = {
  startTime: number;
  endTime: number;
};

export type AvailabilityReason =
  | 'google_not_connected'
  | 'event_type_not_found'
  | 'outside_booking_window'
  | 'no_rules'
  | 'unknown';

export type AvailabilityResult = {
  eventType: SchedulerEventType | null;
  slots: AvailableSlot[];
  reason: AvailabilityReason | string | null;
};

export type BookingFormValues = {
  inviteeName: string;
  inviteeEmail: string;
  notes?: string;
  questionResponses?: SchedulerQuestionResponse[];
};

export type CreateBookingInput = BookingFormValues & {
  eventTypeSlug: string;
  startTime: number;
  timeZone: string;
};

export type BookingResult = {
  status: 'confirmed';
  eventType: SchedulerEventType;
  startTime: number;
  endTime: number;
  googleEventHtmlLink?: string;
  googleMeetUrl?: string;
  questionResponses?: Array<{
    questionId: string;
    label: string;
    value: string;
  }>;
  cancelUrl: string;
  rescheduleUrl: string;
};

export type ManagedBooking = {
  id?: string;
  _id?: string;
  status: string;
  startTime: number;
  endTime: number;
  timeZone: string;
  inviteeName: string;
  inviteeEmail: string;
  questionResponses?: Array<{
    questionId: string;
    label: string;
    value: string;
  }>;
  googleMeetUrl?: string;
  googleEventHtmlLink?: string;
  eventType?: {
    slug: string;
    title: string;
    durationMinutes: number;
  } | null;
};

export type BookingTokenPurpose = 'cancel' | 'reschedule';

export type SchedulerClient = {
  listEventTypes: () => MaybePromise<SchedulerEventType[]>;
  getAvailability: (input: {
    eventTypeSlug: string;
    timeZone: string;
    from?: number;
    to?: number;
  }) => MaybePromise<AvailabilityResult>;
  createBooking: (input: CreateBookingInput) => MaybePromise<BookingResult>;
  getBookingByToken: (input: {
    token: string;
    purpose: BookingTokenPurpose;
  }) => MaybePromise<ManagedBooking | null>;
  cancelBooking: (input: { token: string }) => MaybePromise<unknown>;
  rescheduleBooking: (input: {
    token: string;
    startTime: number;
    timeZone: string;
  }) => MaybePromise<unknown>;
};

export type BookingFlowCallbacks = {
  onEventTypeChange?: (eventType: SchedulerEventType | null) => void;
  onSlotSelect?: (
    slot: AvailableSlot,
    eventType: SchedulerEventType | null
  ) => void;
  onBookingStart?: (input: CreateBookingInput) => void;
  onBookingConfirmed?: (result: BookingResult) => void;
  onError?: (error: Error) => void;
};

export type ManageBookingCallbacks = {
  onLoaded?: (booking: ManagedBooking) => void;
  onCancelled?: (booking: ManagedBooking) => void;
  onRescheduled?: (booking: ManagedBooking, slot: AvailableSlot) => void;
  onError?: (error: Error) => void;
};
