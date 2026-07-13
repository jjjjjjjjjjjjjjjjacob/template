import * as React from 'react';
import { MetaballStage } from './metaball-stage';
import { META_PALETTE, useSiteVisuals } from './visual-provider';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { theme, stage, isReady } = useSiteVisuals();
  const dark = theme === 'dark';
  const palette = META_PALETTE[theme];

  React.useEffect(() => {
    document.documentElement.classList.add('site-document');
    return () => document.documentElement.classList.remove('site-document');
  }, []);

  return (
    <div className="site-root" data-theme={theme}>
      <div className="site-metaball" aria-hidden="true">
        <div className="site-metaball-veil">
          {isReady && (
            <MetaballStage
              key={theme}
              variant={stage.variant}
              cursorMode="trail"
              intensity={palette.intensity}
              bg={palette.bg}
              ink={palette.ink}
              accent={stage.accent}
              accent2={stage.accent2}
              light={!dark}
            />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
