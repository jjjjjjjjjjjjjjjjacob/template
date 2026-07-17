import { type ReactNode, useState } from 'react';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';
import type { ResumeProject } from '@/hooks/use-resume-filter';

interface SafariAppProps {
  projects: ResumeProject[];
}

type ToolbarButtonTone = 'metal' | 'blue';
type ToolbarButtonSegment = 'single' | 'start' | 'middle' | 'end';
type PanelTone = 'blue' | 'gold' | 'gray';

const PORTAL_ACCENTS = [
  ['#5d8fd6', '#2f5f9f'],
  ['#78a7df', '#3a659a'],
  ['#8eb784', '#4d8051'],
  ['#d4a25b', '#a86d2a'],
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFallbackHost(project: ResumeProject) {
  const base = slugify(project.company || project.title).replace(/-/g, '');
  return `www.${base || 'portfolio'}.com`;
}

function getProjectAddress(project: ResumeProject) {
  if (!project.url) {
    return `${getFallbackHost(project)}/${slugify(project.title)}`;
  }

  try {
    const normalized = /^https?:\/\//.test(project.url)
      ? project.url
      : `https://${project.url}`;
    const url = new URL(normalized);
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
  } catch {
    return `${getFallbackHost(project)}/${slugify(project.title)}`;
  }
}

function getProjectHost(project: ResumeProject) {
  return getProjectAddress(project).split('/')[0];
}

function getPrimaryTechnology(project: ResumeProject) {
  return (
    Object.values(project.technologies).flat().find(Boolean) ??
    project.focusAreas[0] ??
    'TypeScript'
  );
}

function getTechnologyCount(project: ResumeProject) {
  return Object.values(project.technologies).reduce(
    (total, technologies) => total + technologies.length,
    0
  );
}

function getPanelTheme(tone: PanelTone) {
  switch (tone) {
    case 'gold':
      return {
        header:
          'linear-gradient(180deg, #f6d67d 0%, #e7bc54 55%, #c99627 100%)',
        border: '#d7b053',
        text: '#6e5000',
        background: '#fffdf6',
      };
    case 'gray':
      return {
        header:
          'linear-gradient(180deg, #f4f4f4 0%, #dadada 55%, #bcbcbc 100%)',
        border: '#cfcfcf',
        text: '#4a4a4a',
        background: '#fbfbfb',
      };
    case 'blue':
    default:
      return {
        header:
          'linear-gradient(180deg, #85aee2 0%, #5d89c6 55%, #35639f 100%)',
        border: '#88a8cd',
        text: '#ffffff',
        background: '#ffffff',
      };
  }
}

function ToolbarButton({
  label,
  tone = 'metal',
  segment = 'single',
  children,
}: {
  label: string;
  tone?: ToolbarButtonTone;
  segment?: ToolbarButtonSegment;
  children: ReactNode;
}) {
  const radius =
    segment === 'start'
      ? '5px 0 0 5px'
      : segment === 'middle'
        ? '0'
        : segment === 'end'
          ? '0 5px 5px 0'
          : '5px';

  return (
    <button
      aria-label={label}
      className="flex h-6 w-7 items-center justify-center text-[11px] font-bold"
      style={{
        border: '1px solid',
        borderColor: tone === 'blue' ? '#5b78a2' : '#8c9095',
        borderRadius: radius,
        background:
          tone === 'blue'
            ? 'linear-gradient(180deg, #a9d7ff 0%, #6db0f1 45%, #4384ca 100%)'
            : 'linear-gradient(180deg, #fbfbfb 0%, #e5e5e5 48%, #cfcfcf 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.85) inset, 0 -1px 0 rgba(0,0,0,0.08) inset',
        color: tone === 'blue' ? '#ffffff' : '#4f5962',
        textShadow:
          tone === 'blue'
            ? '0 -1px 0 rgba(0,0,0,0.25)'
            : '0 1px 0 rgba(255,255,255,0.7)',
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function ChromeField({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-[7px] px-2 py-[3px] text-[11px] ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #888f97',
        boxShadow:
          'inset 0 1px 2px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.72)',
        color: '#5b6370',
      }}
    >
      {children}
    </div>
  );
}

function SitePanel({
  title,
  tone = 'blue',
  children,
}: {
  title: string;
  tone?: PanelTone;
  children: ReactNode;
}) {
  const theme = getPanelTheme(tone);

  return (
    <section
      className="overflow-hidden border"
      style={{
        borderColor: theme.border,
        background: theme.background,
      }}
    >
      <div
        className="px-3 py-[5px] text-[11px] font-bold"
        style={{
          background: theme.header,
          color: theme.text,
          textShadow:
            tone === 'blue'
              ? '0 -1px 0 rgba(0,0,0,0.3)'
              : '0 1px 0 rgba(255,255,255,0.55)',
        }}
      >
        {title}
      </div>
      <div
        className="space-y-3 px-3 py-3 text-[12px] leading-[1.45]"
        style={{
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#26384c',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function ToolbarArrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d={
          direction === 'left'
            ? 'M6.9 1.3 3.1 5l3.8 3.7'
            : 'M3.1 1.3 6.9 5 3.1 8.7'
        }
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ToolbarReload() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
      <path
        d="M8.6 4.1A3.6 3.6 0 1 0 9 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path
        d="M7.6 1.8h2.1v2.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ToolbarPlus() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M5 1.6v6.8M1.6 5h6.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function SafariApp({ projects }: SafariAppProps) {
  const [activeProject, setActiveProject] = useState(0);
  const project = projects[activeProject];

  if (!project) {
    return (
      <div
        className="flex h-full items-center justify-center text-[13px]"
        style={{ color: '#8f949b' }}
      >
        No Projects Available
      </div>
    );
  }

  const [accentTop, accentBottom] =
    PORTAL_ACCENTS[activeProject % PORTAL_ACCENTS.length];
  const techGroups = Object.entries(project.technologies).filter(
    ([, technologies]) => technologies.length > 0
  );
  const relatedProjects = projects
    .filter((candidate) => candidate.id !== project.id)
    .slice(0, 4);
  const headlines = project.achievements.slice(0, 5);
  const topStory = headlines[0];
  const host = getProjectHost(project);
  const address = getProjectAddress(project);
  const primaryTechnology = getPrimaryTechnology(project);
  const technologyCount = getTechnologyCount(project);

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: '#d2d5db',
        fontFamily: "'Lucida Grande', 'Geneva', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        className="shrink-0"
        style={{
          background:
            'linear-gradient(180deg, #f1f1f1 0%, #dbdbdb 33%, #c8c8c8 67%, #b5b5b5 100%)',
          borderBottom: '1px solid #919191',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.88) inset, 0 -1px 0 rgba(0,0,0,0.08) inset',
        }}
      >
        <div
          className="flex flex-wrap items-center gap-2 px-3 py-[7px]"
          style={{
            borderBottom: '1px solid rgba(112,112,112,0.35)',
          }}
        >
          <div className="flex items-center">
            <ToolbarButton label="Back" tone="blue" segment="start">
              <ToolbarArrow direction="left" />
            </ToolbarButton>
            <ToolbarButton label="Forward" tone="blue" segment="end">
              <ToolbarArrow direction="right" />
            </ToolbarButton>
          </div>

          <div className="flex items-center gap-1">
            <ToolbarButton label="Reload">
              <ToolbarReload />
            </ToolbarButton>
            <ToolbarButton label="New Tab">
              <ToolbarPlus />
            </ToolbarButton>
          </div>

          <ChromeField className="flex-1">
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold"
              style={{
                background:
                  'linear-gradient(180deg, #fefefe 0%, #dce6f1 48%, #b8c7d7 100%)',
                border: '1px solid #97a4b3',
                color: '#58708a',
              }}
            >
              {project.title.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{address}</span>
          </ChromeField>

          <ChromeField className="w-[180px] max-w-full">
            <span
              className="text-[10px] font-bold uppercase"
              style={{ color: '#8a9098' }}
            >
              Google
            </span>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ color: '#4b5664' }}
            >
              {primaryTechnology}
            </span>
          </ChromeField>
        </div>

        <div
          className="flex items-center gap-3 overflow-x-auto px-3 py-[5px] text-[11px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(231,231,231,0.88) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.55)',
          }}
        >
          <span
            className="font-semibold whitespace-nowrap"
            style={{ color: '#6f7680' }}
          >
            Bookmarks Bar:
          </span>
          {projects.slice(0, 6).map((item, index) => {
            const isActive = index === activeProject;

            return (
              <button
                key={item.id}
                className="border-r pr-3 text-left whitespace-nowrap"
                style={{
                  borderColor: 'rgba(103,116,129,0.24)',
                  color: isActive ? '#1b4f8b' : '#485360',
                  fontWeight: isActive ? 700 : 400,
                  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
                }}
                onClick={() => setActiveProject(index)}
                type="button"
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </div>

      <MacScrollArea
        className="flex-1"
        style={{
          background:
            'linear-gradient(180deg, #bcd0e5 0px, #d9e4ef 74px, #e9edf2 74px, #e9edf2 100%)',
        }}
      >
        <div
          className="mx-auto min-h-full max-w-[980px] border-x bg-white"
          style={{
            borderColor: '#acbbcb',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.7) inset',
          }}
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-[6px] text-[10px]"
            style={{
              background: '#f5f7fa',
              borderColor: '#d4dce5',
              fontFamily: 'Arial, Helvetica, sans-serif',
              color: '#59687a',
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              {['Home', 'Projects', 'Archive', 'Resume', 'Contact'].map(
                (item) => (
                  <span key={item}>{item}</span>
                )
              )}
            </div>
            <span>{host}</span>
          </div>

          <div
            className="grid gap-4 border-b px-4 py-4 lg:grid-cols-[165px_minmax(0,1fr)_210px]"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #edf3f9 100%)',
              borderColor: '#d4dde8',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            <div>
              <div
                className="text-[42px] leading-none font-bold italic"
                style={{
                  color: '#c91223',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  textShadow: '0 1px 0 rgba(255,255,255,0.85)',
                }}
              >
                Jacob!
              </div>
              <p
                className="mt-2 text-[11px] leading-4"
                style={{ color: '#4f6174' }}
              >
                Leopard-era project headlines, links, and launch notes.
              </p>
            </div>

            <div>
              <div
                className="inline-block border px-2 py-[2px] text-[10px] font-bold uppercase"
                style={{
                  background: '#ffef98',
                  borderColor: '#d7bf60',
                  color: '#7a5b00',
                }}
              >
                Top Story
              </div>
              <h1
                className="mt-2 text-[28px] leading-[1.05] font-bold"
                style={{ color: '#103f75' }}
              >
                {project.title}
              </h1>
              <p
                className="mt-2 text-[12px] leading-5"
                style={{ color: '#384b61' }}
              >
                {project.description}
              </p>
              <p className="mt-3 text-[11px]" style={{ color: '#6b7b8c' }}>
                {project.company} | {project.role} | {project.timeline}
              </p>
            </div>

            <div
              className="border px-3 py-3"
              style={{
                background: '#fffdf2',
                borderColor: '#dbc46f',
              }}
            >
              <div
                className="text-[10px] font-bold uppercase"
                style={{ color: '#8a6a14' }}
              >
                Snapshot
              </div>
              <div
                className="mt-2 text-[11px] leading-5"
                style={{ color: '#5d4d2a' }}
              >
                <div>{headlines.length || 1} active headlines</div>
                <div>{technologyCount} linked technologies</div>
                <div>{project.domains.length || 1} coverage areas</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 lg:grid-cols-[175px_minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <SitePanel title="Projects Directory">
                <div className="space-y-2">
                  {projects.map((item, index) => {
                    const isActive = index === activeProject;

                    return (
                      <button
                        key={item.id}
                        className="block w-full border px-2 py-2 text-left"
                        style={{
                          borderColor: isActive ? '#90b0d7' : '#d8e1eb',
                          background: isActive ? '#eef5ff' : '#ffffff',
                          color: isActive ? '#16487d' : '#2f4660',
                          fontWeight: isActive ? 700 : 400,
                        }}
                        onClick={() => setActiveProject(index)}
                        type="button"
                      >
                        <div className="text-[12px]">{item.title}</div>
                        <div
                          className="mt-[2px] text-[10px]"
                          style={{ color: '#70839a' }}
                        >
                          {item.company}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SitePanel>

              <SitePanel title="Coverage Areas" tone="gray">
                <div className="space-y-2 text-[11px]">
                  {(project.focusAreas.length > 0
                    ? project.focusAreas
                    : project.domains.slice(0, 4)
                  ).map((area) => (
                    <div
                      key={area}
                      className="border px-2 py-[5px]"
                      style={{
                        borderColor: '#d9dfe6',
                        background: '#f8fafc',
                        textTransform: 'capitalize',
                      }}
                    >
                      {area.replace(/-/g, ' ')}
                    </div>
                  ))}
                </div>
              </SitePanel>
            </div>

            <div className="space-y-4">
              <SitePanel title="Featured Report">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_190px]">
                  <div>
                    <h2
                      className="text-[24px] leading-[1.1] font-bold"
                      style={{ color: '#143f74' }}
                    >
                      {topStory?.description ?? project.description}
                    </h2>
                    <p
                      className="mt-3 text-[12px] leading-5"
                      style={{ color: '#384c61' }}
                    >
                      {project.description}
                    </p>
                    <div className="mt-4 space-y-2 text-[12px] leading-5">
                      {headlines.slice(1, 5).map((achievement) => (
                        <div key={achievement.description}>
                          <span
                            className="mr-2 inline-block h-[6px] w-[6px]"
                            style={{
                              background: '#c81423',
                              verticalAlign: 'middle',
                            }}
                          />
                          <span style={{ color: '#17437a' }}>
                            {achievement.description}
                          </span>
                          {achievement.impact && (
                            <span style={{ color: '#6d7f92' }}>
                              {' '}
                              ({achievement.impact})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="overflow-hidden border"
                    style={{
                      borderColor: '#cdd8e5',
                      background: '#f6f9fc',
                    }}
                  >
                    <div
                      className="flex items-center gap-[4px] border-b px-2 py-[4px]"
                      style={{
                        borderColor: '#d7e1eb',
                        background:
                          'linear-gradient(180deg, #ffffff 0%, #edf2f7 100%)',
                      }}
                    >
                      {['#ff6d6a', '#f9c54c', '#6bcf68'].map((color) => (
                        <span
                          key={color}
                          className="inline-block h-[7px] w-[7px] rounded-full"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <div className="space-y-2 p-3">
                      <div
                        className="h-12"
                        style={{
                          background: `linear-gradient(135deg, ${accentTop} 0%, ${accentBottom} 100%)`,
                        }}
                      />
                      <div
                        className="h-2"
                        style={{ background: 'rgba(77,108,142,0.16)' }}
                      />
                      <div
                        className="h-2 w-[72%]"
                        style={{ background: 'rgba(77,108,142,0.16)' }}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className="h-14"
                          style={{ background: 'rgba(77,108,142,0.11)' }}
                        />
                        <div
                          className="h-14"
                          style={{ background: 'rgba(77,108,142,0.08)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SitePanel>

              <div className="grid gap-4 md:grid-cols-2">
                <SitePanel title="Technology Index" tone="gray">
                  <div className="space-y-3">
                    {techGroups.map(([group, technologies]) => (
                      <div key={group}>
                        <div
                          className="border-b pb-1 text-[10px] font-bold uppercase"
                          style={{ borderColor: '#dde4eb', color: '#607286' }}
                        >
                          {group}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {technologies.slice(0, 6).map((technology) => (
                            <span
                              key={technology}
                              className="border px-2 py-[2px] text-[11px]"
                              style={{
                                borderColor: '#d7dfeb',
                                background: '#f6f9fc',
                                color: '#275488',
                              }}
                            >
                              {technology}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SitePanel>

                <SitePanel title="Related Links" tone="gold">
                  <div className="space-y-3">
                    {relatedProjects.map((item) => (
                      <button
                        key={item.id}
                        className="block w-full border px-2 py-2 text-left"
                        style={{
                          borderColor: '#ecdca0',
                          background: '#fffef8',
                          color: '#2a4f82',
                        }}
                        onClick={() => {
                          const nextIndex = projects.findIndex(
                            (candidate) => candidate.id === item.id
                          );
                          if (nextIndex >= 0) {
                            setActiveProject(nextIndex);
                          }
                        }}
                        type="button"
                      >
                        <div className="text-[12px] font-bold">
                          {item.title}
                        </div>
                        <div
                          className="mt-[2px] text-[11px]"
                          style={{ color: '#7a8695' }}
                        >
                          {item.company}
                        </div>
                      </button>
                    ))}
                  </div>
                </SitePanel>
              </div>
            </div>

            <div className="space-y-4">
              <SitePanel title="Quick Facts" tone="gold">
                <div className="space-y-2 text-[11px]">
                  {[
                    ['Address', host],
                    ['Primary Stack', primaryTechnology],
                    ['Timeline', project.timeline],
                    ['Role', project.role],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="border px-2 py-[5px]"
                      style={{
                        borderColor: '#eddca4',
                        background: '#fffef8',
                      }}
                    >
                      <div className="font-bold" style={{ color: '#84621c' }}>
                        {label}
                      </div>
                      <div className="mt-[2px]" style={{ color: '#42556c' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </SitePanel>

              <SitePanel title="Popular Headlines">
                <div className="space-y-3">
                  {projects.slice(0, 5).map((item) => (
                    <button
                      key={`${item.id}-headline`}
                      className="block w-full text-left"
                      style={{ color: '#164980' }}
                      onClick={() => {
                        const nextIndex = projects.findIndex(
                          (candidate) => candidate.id === item.id
                        );
                        if (nextIndex >= 0) {
                          setActiveProject(nextIndex);
                        }
                      }}
                      type="button"
                    >
                      <div className="text-[12px] font-bold">{item.title}</div>
                      <div
                        className="mt-[2px] text-[11px]"
                        style={{ color: '#6d8094' }}
                      >
                        {item.description}
                      </div>
                    </button>
                  ))}
                </div>
              </SitePanel>

              <SitePanel title="Newswire" tone="gray">
                <div className="space-y-2 text-[11px]">
                  {headlines.slice(0, 4).map((achievement) => (
                    <div key={achievement.description}>
                      <span style={{ color: '#c91525' }}>Breaking:</span>{' '}
                      <span style={{ color: '#34506d' }}>
                        {achievement.description}
                      </span>
                    </div>
                  ))}
                </div>
              </SitePanel>
            </div>
          </div>
        </div>
      </MacScrollArea>

      <div
        className="flex shrink-0 items-center justify-between px-3 py-[4px] text-[10px]"
        style={{
          background:
            'linear-gradient(180deg, #f1f1f1 0%, #d9d9d9 60%, #c8c8c8 100%)',
          borderTop: '1px solid #9f9f9f',
          color: '#59626d',
          textShadow: '0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        <span>{host}</span>
        <span>Done</span>
      </div>
    </div>
  );
}
