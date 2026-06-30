import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

function extractClientIp() {
  const request = getWebRequest();
  const headers = request?.headers;

  const forwardedFor = headers?.get('x-forwarded-for');
  if (forwardedFor) {
    const candidate = forwardedFor.split(',')[0]?.trim();
    if (candidate) {
      return candidate;
    }
  }

  const directHeaders = [
    'cf-connecting-ip',
    'x-real-ip',
    'x-client-ip',
    'fly-client-ip',
  ];

  for (const header of directHeaders) {
    const value = headers?.get(header)?.trim();
    if (value) {
      return value;
    }
  }

  return 'local-development';
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export const getWallpaperClientKey = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ip = extractClientIp();
    return {
      ipKey: await sha256Hex(`wallpaper:${ip}`),
    };
  }
);
