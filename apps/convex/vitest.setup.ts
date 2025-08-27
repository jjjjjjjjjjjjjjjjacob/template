// Export modules for convex-test
export const modules = {
  'convex/users.ts': () => import('./convex/users'),
  'convex/items.ts': () => import('./convex/items'),
  'convex/seed.ts': () => import('./convex/seed'),
  'convex/search.ts': () => import('./convex/search'),
  'convex/_generated/api.js': () => import('./convex/_generated/api'),
  'convex/_generated/server.js': () => import('./convex/_generated/server'),
};
