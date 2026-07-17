/**
 * Layout components for consistent page structure and responsive design
 */

export type { BaseLayoutProps } from './base-layout';
// Base layouts
export { BaseLayout } from './base-layout';
export type { ContentLayoutProps, ContentSectionProps } from './content-layout';
// Content layouts
export { ContentLayout, ContentSection } from './content-layout';
export type { FeedItemProps, FeedLayoutProps } from './feed-layout';
// Feed layouts for content streams
export { FeedItem, FeedLayout } from './feed-layout';
export type { SidebarLayoutProps } from './sidebar-layout';
// Sidebar layouts
export { SidebarLayout, useSidebar } from './sidebar-layout';
export type { HeroSplitLayoutProps, SplitLayoutProps } from './split-layout';
// Split layouts
export { HeroSplitLayout, SplitLayout } from './split-layout';
