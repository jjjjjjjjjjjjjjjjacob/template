import { useState } from 'react';

export function useSearchResults() {
  const [results] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);

  const onRetry = () => {
    // Retry logic would go here
  };

  return {
    results,
    loading,
    error,
    onRetry,
    queriedEmojis: [] as string[] | undefined,
  };
}
