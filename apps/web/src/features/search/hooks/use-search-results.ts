import { useState } from 'react';

export function useSearchResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onRetry = () => {
    // Retry logic would go here
    console.log('Retrying search...');
  };

  return {
    results,
    loading,
    error,
    onRetry,
    queriedEmojis: [] as string[] | undefined,
  };
}
