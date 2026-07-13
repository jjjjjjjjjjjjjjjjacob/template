import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteStatusPage } from './status-page';

describe('SiteStatusPage', () => {
  it('uses the primary page landmark for standalone status screens', () => {
    render(
      <SiteStatusPage
        eyebrow="system / error"
        title="Something went wrong"
        actions={<button type="button">try again</button>}
      >
        <p>The page could not load.</p>
      </SiteStatusPage>
    );

    expect(screen.getByRole('main')).toHaveClass('site-status-page');
    expect(screen.getByRole('button', { name: 'try again' })).toBeVisible();
  });

  it('avoids nesting another main landmark inside the admin shell', () => {
    render(
      <main>
        <SiteStatusPage
          eyebrow="system / error"
          title="Something went wrong"
          actions={<button type="button">try again</button>}
          embedded
        >
          <p>The page could not load.</p>
        </SiteStatusPage>
      </main>
    );

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(
      screen.getByText('Something went wrong').closest('.site-status-page')
    ).toHaveAttribute('data-embedded', 'true');
  });
});
