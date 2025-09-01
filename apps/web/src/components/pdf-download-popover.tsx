import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import {
  useStoryCanvas,
  type ResumeExportFormat,
  type ResumeData,
} from '@/hooks/use-story-canvas';
import { useMediaQuery } from '@/hooks/use-media-query';

export interface PDFDownloadPopoverProps {
  resumeData: ResumeData;
  className?: string;
}

const exportFormats: ResumeExportFormat[] = [
  {
    value: 'png',
    label: 'PNG Image',
    description: 'high quality image for sharing',
    mimeType: 'image/png',
  },
  {
    value: 'pdf',
    label: 'PDF Document',
    description: 'optimized for printing',
    mimeType: 'application/pdf',
  },
];

export function PDFDownloadPopover({
  resumeData,
  className,
}: PDFDownloadPopoverProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isGenerating, generateResumeImage, downloadImage } = useStoryCanvas({
    filename: 'jacob-stein-resume',
  });

  const handleExport = async (format: ResumeExportFormat) => {
    try {
      const blob = await generateResumeImage(resumeData, format);
      if (blob) {
        downloadImage(blob, format);
        setOpen(false);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Silent failure - export error handling
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        align="center"
        side={isMobile ? 'top' : 'right'}
        avoidCollisions
      >
        <div className="space-y-3">
          <div>
            <h3 className="text-sm leading-none font-medium">export resume</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              choose your preferred format
            </p>
          </div>

          <div className="space-y-2">
            {exportFormats.map((format) => (
              <Button
                key={format.value}
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start gap-3 p-3"
                onClick={() => handleExport(format)}
                disabled={isGenerating}
              >
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md">
                  {format.value === 'png' ? (
                    <FileImage className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{format.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {format.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="border-t pt-2">
            <p className="text-muted-foreground text-xs">
              resume will match your current theme
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
