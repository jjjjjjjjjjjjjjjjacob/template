import type { SchedulerClient } from './types';

export function createSchedulerClient(
  client: SchedulerClient
): SchedulerClient {
  return client;
}

export function createCallbackSchedulerClient(
  actions: SchedulerClient
): SchedulerClient {
  return createSchedulerClient(actions);
}

export function schedulerError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}
