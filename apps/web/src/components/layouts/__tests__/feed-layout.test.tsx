/// <reference lib="dom" />
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FeedLayout, FeedItem } from '../feed-layout';

// Mock the responsive hook
vi.mock('@/hooks/use-responsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

afterEach(cleanup);

describe('FeedLayout', () => {
  it('renders children correctly', () => {
    render(
      <FeedLayout>
        <div>feed item 1</div>
        <div>feed item 2</div>
      </FeedLayout>
    );

    expect(screen.getByText('feed item 1')).toBeInTheDocument();
    expect(screen.getByText('feed item 2')).toBeInTheDocument();
  });

  it('renders header when provided', () => {
    render(
      <FeedLayout header={<h1>feed header</h1>}>
        <div>content</div>
      </FeedLayout>
    );

    expect(screen.getByText('feed header')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <FeedLayout footer={<div>feed footer</div>}>
        <div>content</div>
      </FeedLayout>
    );

    expect(screen.getByText('feed footer')).toBeInTheDocument();
  });

  it('renders sidebar when provided', () => {
    render(
      <FeedLayout sidebar={<div>sidebar content</div>}>
        <div>main content</div>
      </FeedLayout>
    );

    expect(screen.getByText('sidebar content')).toBeInTheDocument();
    expect(screen.getByText('main content')).toBeInTheDocument();
  });

  it('applies grid variant by default', () => {
    render(
      <FeedLayout>
        <div>item</div>
      </FeedLayout>
    );

    const feedContainer = screen.getByText('item').parentElement;
    expect(feedContainer).toHaveClass('grid');
  });

  it('applies list variant correctly', () => {
    render(
      <FeedLayout variant="list">
        <div>item</div>
      </FeedLayout>
    );

    const feedContainer = screen.getByText('item').parentElement;
    expect(feedContainer).toHaveClass('flex', 'flex-col');
  });
});

describe('FeedItem', () => {
  it('renders children correctly', () => {
    render(
      <FeedItem>
        <div>item content</div>
      </FeedItem>
    );

    expect(screen.getByText('item content')).toBeInTheDocument();
  });

  it('applies border when bordered is true', () => {
    render(
      <FeedItem bordered>
        <div>content</div>
      </FeedItem>
    );

    const item = screen.getByText('content').parentElement;
    expect(item).toHaveClass('border', 'border-border');
  });

  it('applies background when background is true', () => {
    render(
      <FeedItem background>
        <div>content</div>
      </FeedItem>
    );

    const item = screen.getByText('content').parentElement;
    expect(item).toHaveClass('bg-card');
  });

  it('applies correct padding classes', () => {
    render(
      <FeedItem padding="lg">
        <div>content</div>
      </FeedItem>
    );

    const item = screen.getByText('content').parentElement;
    expect(item).toHaveClass('p-6');
  });

  it('applies custom className', () => {
    render(
      <FeedItem className="custom-item">
        <div>content</div>
      </FeedItem>
    );

    const item = screen.getByText('content').parentElement;
    expect(item).toHaveClass('custom-item');
  });
});
