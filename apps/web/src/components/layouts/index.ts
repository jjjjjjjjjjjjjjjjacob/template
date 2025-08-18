/**
 * Layout components for consistent page structure and responsive design
 */

// Base layouts
export { BaseLayout } from './base-layout';
export type { BaseLayoutProps } from './base-layout';

// Feed layouts for content streams
export { FeedLayout, FeedItem } from './feed-layout';
export type { FeedLayoutProps, FeedItemProps } from './feed-layout';

// Sidebar layouts
export { SidebarLayout, useSidebar } from './sidebar-layout';
export type { SidebarLayoutProps } from './sidebar-layout';

// Content layouts
export { ContentLayout, ContentSection } from './content-layout';
export type { ContentLayoutProps, ContentSectionProps } from './content-layout';

// Split layouts
export { SplitLayout, HeroSplitLayout } from './split-layout';
export type { SplitLayoutProps, HeroSplitLayoutProps } from './split-layout';
