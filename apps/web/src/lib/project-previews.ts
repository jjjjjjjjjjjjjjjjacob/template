type ProjectMedia = {
  type?: string | null;
  url?: string | null;
};

function isPresentUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function markPreviewType(url: string, type: 'image' | 'video'): string {
  const marker = `#${type}`;
  return url.endsWith(marker) ? url : `${url}${marker}`;
}

/**
 * Keep the CMS media type attached to extensionless storage URLs. Without the
 * fragment marker, the slideshow treats a Convex video URL as an iframe; an
 * attachment response then makes the browser download the file.
 */
export function getProjectPreviewUrls(
  media: ProjectMedia[] | null | undefined
): string[] {
  const entries = media ?? [];
  const urlsByType = (types: string[]) =>
    entries
      .filter((item) => item.type && types.includes(item.type))
      .map((item) => item.url)
      .filter(isPresentUrl);

  return urlsByType(['video'])
    .map((url) => markPreviewType(url, 'video'))
    .concat(
      urlsByType(['iframe']),
      urlsByType(['image']).map((url) => markPreviewType(url, 'image'))
    );
}
