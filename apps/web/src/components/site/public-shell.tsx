import { type ComponentProps, type ReactNode, useEffect, useMemo } from 'react';
import { PDFDownloadPopover } from '@/components/pdf-download-popover';
import { usePortfolioData } from '@/hooks/use-portfolio-data';
import { buildResumeDataFromSource } from '@/lib/resume-export-data';
import { SitePublicNav } from './public-nav';
import { projectStage, useSiteVisuals } from './visual-provider';

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function SiteResumeAction({
  className,
  label = 'resume',
  source,
  contentSide = 'bottom',
  contentAlign = 'end',
}: {
  className?: string;
  label?: string;
  source: string;
  contentSide?: ComponentProps<typeof PDFDownloadPopover>['contentSide'];
  contentAlign?: ComponentProps<typeof PDFDownloadPopover>['contentAlign'];
}) {
  const { profile, projects, skills, summary, isLoading } = usePortfolioData();
  const resumeExportData = useMemo(
    () =>
      buildResumeDataFromSource({
        profile,
        projects,
        skills,
        summary,
      }),
    [profile, projects, skills, summary]
  );

  if (isLoading) {
    return (
      <button
        type="button"
        className={classes('site-link site-link-button', className)}
        disabled
      >
        {label}
      </button>
    );
  }

  return (
    <PDFDownloadPopover
      resumeData={resumeExportData}
      source={source}
      contentSide={contentSide}
      contentAlign={contentAlign}
      trigger={({ isGenerating }) => (
        <button
          type="button"
          className={classes('site-link site-link-button', className)}
          disabled={isGenerating}
        >
          {isGenerating ? 'generating...' : label}
        </button>
      )}
    />
  );
}

export function SitePublicShell({
  eyebrow,
  title,
  description,
  children,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const { theme, setStage } = useSiteVisuals();

  useEffect(() => {
    setStage(projectStage(0, undefined, theme));
  }, [setStage, theme]);

  return (
    <main className="site-public-page">
      <div
        className={classes(
          'site-public-shell',
          wide && 'site-public-shell-wide'
        )}
      >
        <header className="site-fade-in site-public-head">
          <SitePublicNav
            resumeAction={<SiteResumeAction source="site_public_nav" />}
          />
          {eyebrow && <p className="site-mono site-public-kicker">{eyebrow}</p>}
          <h1 className="site-grotesk site-public-title">{title}</h1>
          {description && <p className="site-public-copy">{description}</p>}
        </header>
        <div
          className="site-fade-in site-public-content"
          style={{ animationDelay: '0.12s' }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
