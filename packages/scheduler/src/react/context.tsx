import * as React from 'react';
import type { SchedulerClient } from '../types';

const SchedulerClientContext = React.createContext<SchedulerClient | null>(
  null
);

export function SchedulerProvider({
  client,
  children,
}: {
  client: SchedulerClient;
  children: React.ReactNode;
}) {
  return (
    <SchedulerClientContext.Provider value={client}>
      {children}
    </SchedulerClientContext.Provider>
  );
}

export function useSchedulerClient(client?: SchedulerClient) {
  const contextClient = React.useContext(SchedulerClientContext);
  const resolvedClient = client ?? contextClient;
  if (!resolvedClient) {
    throw new Error(
      'Scheduler client missing. Pass `client` or wrap with `SchedulerProvider`.'
    );
  }
  return resolvedClient;
}
