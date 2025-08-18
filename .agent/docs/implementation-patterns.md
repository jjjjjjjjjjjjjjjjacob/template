# Implementation Patterns

This document contains proven patterns from successful implementations in this repository.

## Feature-Based Architecture

### Directory Structure
```
src/features/[feature]/
├── components/     # Feature-specific React components
├── hooks/         # Custom hooks for state management
├── lib/           # Feature utilities and helpers
├── services/      # API calls and business logic
├── types/         # TypeScript interfaces
└── index.ts       # Barrel export for public API
```

### Migration Strategy
1. Create feature directory structure first
2. Move files to appropriate subdirectories
3. Update internal imports within feature
4. Create comprehensive barrel exports
5. Set up backward compatibility re-exports
6. Update consuming code gradually

## Search Infrastructure

### Backend Implementation
The Convex backend includes comprehensive search at `apps/convex/convex/search.ts`:
- Fuzzy search algorithm
- Query parser with operators (quotes, exclusions, filters)
- Relevance scoring
- Multi-type search (items, users, tags, actions, reviews)

### Frontend Integration
- Use React Query with Convex for search queries
- Debounce search queries (300ms optimal)
- Implement client-side caching with TTL
- Command palette with cmdk library (Cmd+K or /)

## Error Handling Strategy

### Error Boundary Hierarchy
- `BaseErrorBoundary` - foundation with customizable fallbacks
- `AuthErrorBoundary` - authentication-specific errors
- `NetworkErrorBoundary` - connection issues
- `DataErrorBoundary` - API/database errors

### Recovery Mechanisms
- Network errors: exponential backoff with max 5 retries
- Auth errors: prompt for re-authentication
- Validation errors: no retry, show form feedback

## Performance Optimization

### Web Vitals Tracking
- LCP (Largest Contentful Paint) - Page loading
- FID (First Input Delay) - Interactivity
- CLS (Cumulative Layout Shift) - Visual stability
- FCP (First Contentful Paint) - Initial render
- TTFB (Time to First Byte) - Server response

### Bundle Optimization
```typescript
// Manual chunks for optimal caching
manualChunks: (id) => {
  if (id.includes('node_modules')) {
    if (id.includes('react')) return 'vendor-react';
    if (id.includes('@tanstack')) return 'vendor-tanstack';
    if (id.includes('@radix-ui')) return 'vendor-ui';
  }
  // Feature-based chunking
  if (id.includes('/features/auth/')) return 'feature-auth';
};
```

### Font Loading Strategy
```css
@font-face {
  font-family: 'GeistSans';
  font-display: fallback; /* Critical UI font */
}

@font-face {
  font-family: 'GeistMono';
  font-display: swap; /* Non-critical */
}
```

## Testing Infrastructure

### Test Utilities
```
test-utils/
├── index.ts              # Barrel exports
├── test-wrapper.tsx      # React component wrappers
├── render-with-providers.tsx  # Convenient render functions
└── mock-api-factory.ts   # MSW API mocking
```

### Testing Patterns
```typescript
// Component tests
import { renderComponent } from '@/test-utils';
renderComponent(<MyComponent />);

// Integration tests with providers
import { renderWithProviders } from '@/test-utils';
renderWithProviders(<MyPageComponent />, {
  wrapperOptions: {
    auth: { isSignedIn: true },
    theme: 'dark'
  }
});
```

## Common Patterns

### Debouncing
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    search(query);
  }, 300),
  [search]
);
```

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['items']);
    const previous = queryClient.getQueryData(['items']);
    queryClient.setQueryData(['items'], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['items'], context.previous);
  },
});
```

### Permission Checks
```typescript
export type Permission = 'users.read' | 'users.write' | 'content.moderate';

export function usePermission() {
  return {
    hasPermission: (permission: Permission) => boolean,
    isAdmin: boolean,
    isModerator: boolean,
  };
}
```