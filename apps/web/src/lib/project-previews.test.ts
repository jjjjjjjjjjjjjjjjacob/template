import { describe, expect, it } from 'vitest';
import { getProjectPreviewUrls } from './project-previews';

describe('getProjectPreviewUrls', () => {
  it('marks extensionless stored media so it is not rendered as an iframe', () => {
    const videoUrl = 'https://storage.example.test/2fe2c37d-5263-4cef';
    const imageUrl = 'https://storage.example.test/fc567d19-a5da-4dd8';

    expect(
      getProjectPreviewUrls([
        { type: 'image', url: imageUrl },
        { type: 'iframe', url: 'https://example.test/demo' },
        { type: 'video', url: videoUrl },
      ])
    ).toEqual([
      `${videoUrl}#video`,
      'https://example.test/demo',
      `${imageUrl}#image`,
    ]);
  });

  it('does not duplicate an existing media marker', () => {
    expect(
      getProjectPreviewUrls([
        { type: 'video', url: 'https://example.test/demo.mov#video' },
      ])
    ).toEqual(['https://example.test/demo.mov#video']);
  });
});
