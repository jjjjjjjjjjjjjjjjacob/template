import { useState, type CSSProperties } from 'react';
import type { ResumeProject } from '@/hooks/use-resume-filter';
import {
  flattenTechnologies,
  startYear,
  topAchievements,
} from './portfolio-helpers';
import type { MenuAim } from './use-menu-aim';

type PreviewKind = 'image' | 'video' | 'iframe';

type CascadeStyle = CSSProperties & {
  '--site-cascade-delay': string;
};

const cascadeStyle = (delayMs: number): CascadeStyle => ({
  '--site-cascade-delay': `${delayMs}ms`,
});

const DETAIL_CASCADE_STEP_MS = 65;

function isPresentUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * `getProfile` encodes a preview's type in a URL fragment: `#image` / `#video`
 * for stored media, and a bare URL for an embeddable page (iframe). We also
 * sniff common file extensions so external media URLs still resolve.
 */
function parsePreview(raw: string): {
  kind: PreviewKind;
  src: string;
  href: string;
} {
  if (raw.endsWith('#image')) {
    const src = raw.slice(0, -'#image'.length);
    return { kind: 'image', src, href: src };
  }
  if (raw.endsWith('#video')) {
    const src = raw.slice(0, -'#video'.length);
    return { kind: 'video', src, href: src };
  }
  let path = raw.toLowerCase();
  try {
    path = new URL(raw).pathname.toLowerCase();
  } catch {
    // not an absolute URL — fall through with the raw string
  }
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(path)) {
    return { kind: 'image', src: raw, href: raw };
  }
  if (/\.(mp4|webm|mov|m4v|ogg)$/.test(path)) {
    return { kind: 'video', src: raw, href: raw };
  }
  return { kind: 'iframe', src: raw, href: raw };
}

/** Host-only label, used for assistive-tech text — never shown visually. */
function srLabel(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
}

/**
 * Per-example description fallbacks, keyed by host — used only when the CMS
 * `caption` for that media is empty. Intentionally per-example (not a single
 * global string); stored media (Convex uploads) should be described via the
 * CMS caption instead.
 */
const HARDCODED_DESCRIPTIONS: Record<string, string> = {
  'mershy.com':
    'MERSHY — retail storefront: product discovery, editorial brand content, and mobile shopping flows.',
  'madelinelearyfilm.com':
    'Madeline Leary — director portfolio: film and music-video work, imagery, and inquiry capture.',
  'heat.tech':
    'HEAT.tech — motion-capture marketplace connecting viral movement with games and 3D tools.',
};

function hardcodedDescription(url: string): string | undefined {
  try {
    return HARDCODED_DESCRIPTIONS[new URL(url).host.replace(/^www\./, '')];
  } catch {
    return undefined;
  }
}

/** One visual "specimen" — the live example itself, shown at its content
 *  height, with a description (CMS caption, else a per-example fallback). */
function PreviewMedia({
  raw,
  index,
  caption,
  enterDelayMs,
}: {
  raw: string;
  index: number;
  caption?: string;
  enterDelayMs: number;
}) {
  const { kind, src, href } = parsePreview(raw);
  const description = caption?.trim() || hardcodedDescription(href);
  const a11y = description ?? srLabel(href);
  // Orientation decides the layout: portrait media sits beside its description
  // (one horizontal block); landscape media stacks with the description below.
  // Measured on load; iframes have no intrinsic size, so they stay landscape.
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(
    'landscape'
  );

  return (
    <figure
      className="site-cascade-item site-media"
      data-orientation={orientation}
      data-has-desc={description ? 'true' : 'false'}
      style={cascadeStyle(enterDelayMs)}
    >
      <div className="site-media-frame" data-kind={kind}>
        {kind === 'image' && (
          <img
            src={src}
            alt={a11y}
            loading="lazy"
            className="site-media-el"
            onLoad={(e) =>
              setOrientation(
                e.currentTarget.naturalHeight > e.currentTarget.naturalWidth
                  ? 'portrait'
                  : 'landscape'
              )
            }
          />
        )}
        {kind === 'video' && (
          <video
            src={src}
            className="site-media-el"
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) =>
              setOrientation(
                e.currentTarget.videoHeight > e.currentTarget.videoWidth
                  ? 'portrait'
                  : 'landscape'
              )
            }
          />
        )}
        {kind === 'iframe' && (
          <iframe
            src={src}
            title={a11y}
            loading="lazy"
            className="site-media-el site-media-iframe"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            tabIndex={-1}
          />
        )}
        {/* The frame itself is the single link (the media is
            pointer-events:none, so this also stops iframes trapping scroll).
            The visually-hidden label names it for assistive tech. */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="site-media-cover"
        >
          <span className="sr-only">open {a11y}</span>
        </a>
      </div>
      {description && (
        <figcaption className="site-media-desc">
          <span className="site-mono site-media-num">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="whitespace-pre-line">{description}</span>
        </figcaption>
      )}
    </figure>
  );
}

export function ProjectRow({
  project,
  index,
  isActive,
  enterDelayMs,
  rowProps,
}: {
  project: ResumeProject;
  index: number;
  isActive: boolean;
  enterDelayMs: number;
  rowProps: ReturnType<MenuAim['getRowProps']>;
}) {
  return (
    <button
      type="button"
      className="site-cascade-item site-row"
      data-active={isActive ? 'true' : 'false'}
      aria-pressed={isActive}
      style={cascadeStyle(enterDelayMs)}
      {...rowProps}
    >
      <span className="site-row-num site-mono">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="site-row-title site-grotesk">{project.title}</span>
      <span className="site-row-year site-mono">
        {startYear(project.timeline)}
      </span>
    </button>
  );
}

/** Large "specimen" view of the active project, written into the negative space. */
export function ProjectDetail({
  project,
  index,
}: {
  project: ResumeProject;
  index: number;
}) {
  const tech = flattenTechnologies(project, 12);
  const achievements = topAchievements(project, 4);
  const previews = (project.previews ?? []).filter(isPresentUrl);
  const captions = project.previewCaptions ?? [];

  return (
    <div className="site-detail">
      <p
        className="site-cascade-item site-mono mb-6 text-[0.7rem] tracking-[0.2em] text-[var(--ink-faint)] uppercase"
        style={cascadeStyle(0)}
      >
        no. {String(index + 1).padStart(2, '0')} / {project.timeline}
      </p>

      <h2
        className="site-cascade-item site-grotesk text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[0.95] font-[600] tracking-[-0.02em]"
        style={cascadeStyle(DETAIL_CASCADE_STEP_MS)}
      >
        {project.title}
      </h2>

      <p
        className="site-cascade-item mt-7 max-w-xl text-[1.02rem] leading-relaxed text-[var(--ink-soft)]"
        style={cascadeStyle(DETAIL_CASCADE_STEP_MS * 2)}
      >
        {project.description}
      </p>

      <dl className="mt-10 grid max-w-xl grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
        <div
          className="site-cascade-item"
          style={cascadeStyle(DETAIL_CASCADE_STEP_MS * 3)}
        >
          <dt className="site-mono mb-2 text-[0.66rem] tracking-[0.2em] text-[var(--ink-faint)] uppercase">
            role
          </dt>
          <dd className="text-[0.92rem] text-[var(--ink)]">{project.role}</dd>
        </div>
        {project.url && (
          <div
            className="site-cascade-item"
            style={cascadeStyle(DETAIL_CASCADE_STEP_MS * 4)}
          >
            <dt className="site-mono mb-2 text-[0.66rem] tracking-[0.2em] text-[var(--ink-faint)] uppercase">
              live
            </dt>
            <dd>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="site-link site-mono text-[0.85rem]"
              >
                {project.url.replace(/^https?:\/\//, '')} ↗
              </a>
            </dd>
          </div>
        )}
        <div
          className="site-cascade-item sm:col-span-2"
          style={cascadeStyle(DETAIL_CASCADE_STEP_MS * 5)}
        >
          <dt className="site-mono mb-3 text-[0.66rem] tracking-[0.2em] text-[var(--ink-faint)] uppercase">
            stack
          </dt>
          <dd className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.82rem] text-[var(--ink-soft)]">
            {tech.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </dd>
        </div>
        {achievements.length > 0 && (
          <div
            className="site-cascade-item sm:col-span-2"
            style={cascadeStyle(DETAIL_CASCADE_STEP_MS * 6)}
          >
            <dt className="site-mono mb-3 text-[0.66rem] tracking-[0.2em] text-[var(--ink-faint)] uppercase">
              selected
            </dt>
            <dd>
              <ul className="space-y-2">
                {achievements.map((achievement, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[1.6rem_1fr] text-[0.88rem] leading-relaxed text-[var(--ink-soft)]"
                  >
                    <span className="site-mono text-[0.7rem] text-[var(--ink-faint)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      {/* visual examples of the work — scroll down past "selected" to reach */}
      {previews.length > 0 && (
        <section className="site-cited">
          <p
            className="site-cascade-item site-mono mb-5 text-[0.66rem] tracking-[0.2em] text-[var(--ink-faint)] uppercase"
            style={cascadeStyle(DETAIL_CASCADE_STEP_MS * 7)}
          >
            work cited
          </p>
          <div className="site-media-list">
            {previews.map((raw, i) => (
              <PreviewMedia
                key={raw}
                raw={raw}
                index={i}
                caption={captions[i]}
                enterDelayMs={DETAIL_CASCADE_STEP_MS * (8 + i)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
