/// <reference lib="dom" />
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BaseLayout } from '../base-layout';

afterEach(cleanup);

describe('BaseLayout', () => {
  it('renders children correctly', () => {
    render(
      <BaseLayout>
        <div>test content</div>
      </BaseLayout>
    );

    expect(screen.getByText('test content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(
      <BaseLayout>
        <div>content</div>
      </BaseLayout>
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('min-h-screen');
  });

  it('applies custom maxWidth', () => {
    render(
      <BaseLayout maxWidth="sm">
        <div>content</div>
      </BaseLayout>
    );

    const container = screen.getByText('content').parentElement;
    expect(container).toHaveClass('max-w-screen-sm');
  });

  it('applies custom padding', () => {
    render(
      <BaseLayout padding="lg">
        <div>content</div>
      </BaseLayout>
    );

    const container = screen.getByText('content').parentElement;
    expect(container).toHaveClass('px-8', 'py-6');
  });

  it('applies custom className', () => {
    const { container } = render(
      <BaseLayout className="custom-class">
        <div>content</div>
      </BaseLayout>
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('custom-class');
  });

  it('centers content by default', () => {
    render(
      <BaseLayout>
        <div>content</div>
      </BaseLayout>
    );

    const container = screen.getByText('content').parentElement;
    expect(container).toHaveClass('mx-auto');
  });

  it('can disable centering', () => {
    render(
      <BaseLayout centered={false}>
        <div>content</div>
      </BaseLayout>
    );

    const container = screen.getByText('content').parentElement;
    expect(container).not.toHaveClass('mx-auto');
  });
});
