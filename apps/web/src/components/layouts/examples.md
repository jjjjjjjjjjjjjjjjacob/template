# Layout Components Usage Examples

This document provides examples of how to use the layout components created for Phase 3.3.

## BaseLayout

The foundation layout with configurable containers:

```tsx
import { BaseLayout } from '@/components/layouts';

// Basic usage
<BaseLayout>
  <div>your content here</div>
</BaseLayout>

// With custom configuration
<BaseLayout
  maxWidth="lg"
  padding="xl"
  className="bg-gray-50"
>
  <div>centered content with large padding</div>
</BaseLayout>
```

## FeedLayout

For content streams with multiple layout options:

```tsx
import { FeedLayout, FeedItem } from '@/components/layouts';

// Grid layout with sidebar
<FeedLayout
  variant="grid"
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  sidebar={<div>sidebar content</div>}
  header={<h1>feed title</h1>}
>
  <FeedItem bordered background>
    <div>feed item 1</div>
  </FeedItem>
  <FeedItem bordered background>
    <div>feed item 2</div>
  </FeedItem>
</FeedLayout>

// Masonry layout
<FeedLayout variant="masonry" gap="lg">
  {items.map(item => (
    <FeedItem key={item.id} bordered>
      <div>{item.content}</div>
    </FeedItem>
  ))}
</FeedLayout>
```

## SidebarLayout

For app-like layouts with collapsible sidebars:

```tsx
import { SidebarLayout, useSidebar } from '@/components/layouts';

function MyApp() {
  const { collapsed, toggle } = useSidebar();

  return (
    <SidebarLayout
      sidebar={
        <nav>
          <button onClick={toggle}>toggle</button>
          <div>navigation items</div>
        </nav>
      }
      collapsed={collapsed}
      onCollapsedChange={toggle}
      sidebarWidth="lg"
    >
      <main>
        <h1>main content</h1>
      </main>
    </SidebarLayout>
  );
}
```

## ContentLayout

For structured content pages:

```tsx
import { ContentLayout, ContentSection } from '@/components/layouts';

<ContentLayout
  header={<h1>page title</h1>}
  footer={<div>page footer</div>}
  maxWidth="4xl"
  centered
>
  <ContentSection title="section 1" description="section description" divider>
    <div>section content</div>
  </ContentSection>

  <ContentSection title="section 2">
    <div>more content</div>
  </ContentSection>
</ContentLayout>;
```

## SplitLayout

For hero sections and dual-content layouts:

```tsx
import { SplitLayout, HeroSplitLayout } from '@/components/layouts';

// Basic split
<SplitLayout
  direction="horizontal"
  splitRatio={60}
  stackOnMobile
>
  {[
    <div>left content (60%)</div>,
    <div>right content (40%)</div>
  ]}
</SplitLayout>

// Hero split layout
<HeroSplitLayout
  variant="gradient"
  leftContent={
    <div>
      <h1>hero title</h1>
      <p>hero description</p>
    </div>
  }
  rightContent={
    <div>hero image or video</div>
  }
/>
```

## Responsive Hooks

For responsive behavior in your components:

```tsx
import { useMobile, useTablet, useResponsive } from '@/hooks/use-mobile';
import { useDesktop } from '@/hooks/use-tablet';

function ResponsiveComponent() {
  const isMobile = useMobile();
  const isTablet = useTablet();
  const isDesktop = useDesktop();

  // Or use comprehensive hook
  const { breakpoint, isMobile: mobile, isTablet: tablet } = useResponsive();

  return (
    <div>
      {isMobile && <MobileComponent />}
      {isTablet && <TabletComponent />}
      {isDesktop && <DesktopComponent />}
      <p>current breakpoint: {breakpoint}</p>
    </div>
  );
}
```

## Combining Layouts

Layouts can be composed together:

```tsx
import { BaseLayout, ContentLayout, FeedLayout } from '@/components/layouts';

function ComplexPage() {
  return (
    <BaseLayout maxWidth="full" className="min-h-screen">
      <ContentLayout
        header={<header>site header</header>}
        footer={<footer>site footer</footer>}
      >
        <FeedLayout
          variant="grid"
          columns={{ mobile: 1, tablet: 2, desktop: 4 }}
          sidebar={<aside>filters</aside>}
        >
          {/* content items */}
        </FeedLayout>
      </ContentLayout>
    </BaseLayout>
  );
}
```
