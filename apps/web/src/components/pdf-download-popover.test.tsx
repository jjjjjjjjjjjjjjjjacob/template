import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumeData } from '@/hooks/use-story-canvas';
import { PDFDownloadPopover } from './pdf-download-popover';
import { ThemeProvider } from './theme-provider';

describe('PDFDownloadPopover', () => {
  it('uses the first-class site presentation by default', async () => {
    render(
      <ThemeProvider>
        <PDFDownloadPopover resumeData={{} as ResumeData} />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'download' }));

    expect(await screen.findByText('choose a format')).toBeVisible();
    expect(document.querySelector('.resume-export-site-menu')).not.toBeNull();
  });
});
