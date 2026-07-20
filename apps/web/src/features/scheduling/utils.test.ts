import { describe, expect, it } from 'vitest';
import { meetingTypeToEventTypeSlug } from './utils';

describe('meetingTypeToEventTypeSlug', () => {
  it('maps camelCase meeting types to event type slugs', () => {
    expect(meetingTypeToEventTypeSlug('workingSession')).toBe(
      'working-session'
    );
    expect(meetingTypeToEventTypeSlug('deepDive')).toBe('deep-dive');
    expect(meetingTypeToEventTypeSlug('intro')).toBe('intro');
  });

  it('accepts kebab-case slugs unchanged', () => {
    expect(meetingTypeToEventTypeSlug('working-session')).toBe(
      'working-session'
    );
  });

  it('normalizes spaces and underscores', () => {
    expect(meetingTypeToEventTypeSlug('working session')).toBe(
      'working-session'
    );
    expect(meetingTypeToEventTypeSlug('working_session')).toBe(
      'working-session'
    );
  });
});
