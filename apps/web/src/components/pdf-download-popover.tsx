import { Download, FileCode, FileDown, FileText, Loader2 } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { ResumeData } from '@/hooks/use-story-canvas';
import { RESUME_EXPORT_FILENAME_BASE } from '@/lib/resume-export-data';
import { buildResumeMarkdown } from '@/lib/resume-export-text';
import { trackEvents } from '@/lib/track-events';

interface ClientTextFormat {
  value: 'md';
  label: string;
  description: string;
  mimeType: string;
  build: (data: ResumeData) => string;
}

interface ServerExportFormat {
  value: 'txt' | 'docx';
  label: string;
  description: string;
}

const clientExportFormats: ClientTextFormat[] = [
  {
    value: 'md',
    label: 'Markdown',
    description: 'readable text, renders anywhere',
    mimeType: 'text/markdown',
    build: buildResumeMarkdown,
  },
];

const serverExportFormats: ServerExportFormat[] = [
  {
    value: 'txt',
    label: 'Plain Text',
    description: 'maximum ATS compatibility',
  },
  {
    value: 'docx',
    label: 'DOCX',
    description: 'simple Word document',
  },
];

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildServerExportUrl(format: ServerExportFormat['value']) {
  const params = new URLSearchParams(
    typeof window === 'undefined' ? undefined : window.location.search
  );
  params.set('format', format);
  return `/resume/export?${params.toString()}`;
}

export interface PDFDownloadPopoverProps {
  resumeData: ResumeData;
  className?: string;
  source?: string; // Track where the download was initiated from
  trigger?: (state: { isGenerating: boolean }) => ReactElement;
  contentSide?: 'top' | 'right' | 'bottom' | 'left';
  contentAlign?: 'start' | 'center' | 'end';
  visualStyle?: 'legacy' | 'site';
}

export function PDFDownloadPopover({
  resumeData,
  className,
  source = 'unknown',
  trigger,
  contentSide,
  contentAlign = 'center',
  visualStyle = 'site',
}: PDFDownloadPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { resolvedTheme } = useTheme();

  const handleClientExport = (format: ClientTextFormat) => {
    trackEvents.resumeDownloadAttempted(format.value, source, false);

    try {
      setIsGenerating(true);
      const content = format.build(resumeData);
      downloadTextFile(
        content,
        `${RESUME_EXPORT_FILENAME_BASE}.${format.value}`,
        format.mimeType
      );

      trackEvents.resumeDownloaded(
        format.value,
        resolvedTheme || 'light',
        source
      );
      trackEvents.resumeDownloadAttempted(format.value, source, true);

      setOpen(false);
    } catch (error) {
      trackEvents.resumeDownloadAttempted(
        format.value,
        source,
        false,
        error instanceof Error ? error.message : 'unknown_error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleServerExport = (format: ServerExportFormat) => {
    trackEvents.resumeDownloadAttempted(format.value, source, false);

    try {
      const url = buildServerExportUrl(format.value);

      trackEvents.resumeDownloadAttempted(format.value, source, true);
      trackEvents.resumeDownloaded(
        format.value,
        resolvedTheme || 'light',
        source
      );

      setOpen(false);
      window.location.assign(url);
    } catch (error) {
      trackEvents.resumeDownloadAttempted(
        format.value,
        source,
        false,
        error instanceof Error ? error.message : 'unknown_error'
      );
    }
  };

  const handlePopoverOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      trackEvents.popoverOpened('resume_download', source);
    } else {
      trackEvents.popoverClosed('resume_download', source);
    }
    setOpen(newOpen);
  };

  const triggerElement = trigger ? (
    trigger({ isGenerating })
  ) : (
    <Button
      variant="outline"
      size="sm"
      className={`h-8 gap-2 ${className || ''}`}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isGenerating ? 'generating...' : 'download'}
    </Button>
  );

  const side = contentSide ?? (isMobile ? 'top' : 'right');

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>
      <PopoverContent
        className={
          visualStyle === 'site' ? 'resume-export-site-menu' : 'w-64 p-3'
        }
        align={contentAlign}
        side={side}
        sideOffset={visualStyle === 'site' ? 10 : 4}
        avoidCollisions
      >
        {visualStyle === 'site' ? (
          <div className="resume-export-site-content">
            <header className="resume-export-site-head">
              <p className="resume-export-site-kicker">download / resume</p>
              <p className="resume-export-site-title">choose a format</p>
            </header>

            <div className="resume-export-site-options">
              {clientExportFormats.map((format, index) => (
                <button
                  key={format.value}
                  type="button"
                  className="resume-export-site-option"
                  onClick={() => handleClientExport(format)}
                  disabled={isGenerating}
                >
                  <span className="resume-export-site-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="resume-export-site-text">
                    <span className="resume-export-site-label">
                      {format.label}
                    </span>
                    <span className="resume-export-site-description">
                      {format.description}
                    </span>
                  </span>
                  <span className="resume-export-site-extension">
                    .{format.value}
                  </span>
                </button>
              ))}

              {serverExportFormats.map((format, index) => (
                <button
                  key={format.value}
                  type="button"
                  className="resume-export-site-option"
                  onClick={() => handleServerExport(format)}
                  disabled={isGenerating}
                >
                  <span className="resume-export-site-number">
                    {String(clientExportFormats.length + index + 1).padStart(
                      2,
                      '0'
                    )}
                  </span>
                  <span className="resume-export-site-text">
                    <span className="resume-export-site-label">
                      {format.label}
                    </span>
                    <span className="resume-export-site-description">
                      {format.description}
                    </span>
                  </span>
                  <span className="resume-export-site-extension">
                    .{format.value}
                  </span>
                </button>
              ))}
            </div>

            <p className="resume-export-site-foot">
              optimized for ats resume checkers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm leading-none font-light">export resume</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                choose your preferred format
              </p>
            </div>

            <div className="space-y-2">
              {clientExportFormats.map((format) => (
                <Button
                  key={format.value}
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full justify-start gap-3 p-3"
                  onClick={() => handleClientExport(format)}
                  disabled={isGenerating}
                >
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                    <FileCode className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-light">{format.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {format.description}
                    </div>
                  </div>
                </Button>
              ))}

              {serverExportFormats.map((format) => (
                <Button
                  key={format.value}
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full justify-start gap-3 p-3"
                  onClick={() => handleServerExport(format)}
                  disabled={isGenerating}
                >
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                    {format.value === 'docx' ? (
                      <FileDown className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-light">{format.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {format.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="border-t pt-2">
              <p className="text-muted-foreground text-xs">
                plain-text resume, ready for ats resume checkers
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
