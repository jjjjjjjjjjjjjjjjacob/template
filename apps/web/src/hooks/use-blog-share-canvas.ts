import { useState, useCallback } from 'react';
import { extractThemeColors, hexToRgba } from '@/utils/theme-color-extractor';

interface UseBlogShareCanvasOptions {
  filename?: string;
}

export interface BlogLayoutOption {
  value: 'square' | 'minimal' | 'featured';
  label: string;
  description: string;
  includeImage: boolean;
  includeExcerpt: boolean;
  includeAuthor: boolean;
  includeDate: boolean;
  aspectRatio: '1:1';
}

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  authorEmail?: string;
  createdAt: number;
  thumbnailId?: string;
  collection?: string;
  projectName?: string;
}

export function useBlogShareCanvas(options: UseBlogShareCanvasOptions = {}) {
  const { filename = 'blog-post-share.png' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Polyfill for roundRect if not available
  const ensureRoundRectSupport = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!ctx.roundRect) {
        ctx.roundRect = function (
          x: number,
          y: number,
          width: number,
          height: number,
          radii: number | number[]
        ) {
          const radius = Array.isArray(radii) ? radii[0] : radii;
          this.beginPath();
          this.moveTo(x + radius, y);
          this.lineTo(x + width - radius, y);
          this.quadraticCurveTo(x + width, y, x + width, y + radius);
          this.lineTo(x + width, y + height - radius);
          this.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height
          );
          this.lineTo(x + radius, y + height);
          this.quadraticCurveTo(x, y + height, x, y + height - radius);
          this.lineTo(x, y + radius);
          this.quadraticCurveTo(x, y, x + radius, y);
          this.closePath();
        };
      }
    },
    []
  );

  const generateCanvasImage = useCallback(
    async (
      post: BlogPost,
      shareUrl: string,
      thumbnailUrl?: string | null,
      layoutOption?: BlogLayoutOption
    ): Promise<Blob | null> => {
      setIsGenerating(true);

      try {
        // Get current theme colors
        const colors = extractThemeColors();

        // Check for explicit theme classes first
        const htmlElement = document.documentElement;
        const hasLightClass = htmlElement.classList.contains('light');
        const hasDarkClass = htmlElement.classList.contains('dark');

        let isDarkMode = false;

        if (hasLightClass) {
          isDarkMode = false;
        } else if (hasDarkClass) {
          isDarkMode = true;
        } else {
          // Fallback: detect based on background color brightness
          const isColorDark = (hexColor: string): boolean => {
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
          };

          isDarkMode = isColorDark(colors.background);
        }

        // Create square canvas for social media
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Ensure roundRect support
        ensureRoundRectSupport(ctx);

        // Adapt colors based on theme mode
        const blogColors = isDarkMode
          ? {
              // Dark mode colors
              background: colors.background || '#0a0a0a',
              foreground: colors.foreground || '#fafafa',
              primary: colors.primary || '#3b82f6',
              secondary: colors.secondary || '#8b5cf6',
              muted: colors.muted || '#1a1a1a',
              mutedForeground: colors.mutedForeground || '#a1a1aa',
              card: colors.card || '#141414',
              cardForeground: colors.cardForeground || '#fafafa',
              border: colors.border || '#27272a',
              accent: colors.accent || '#3b82f6',
            }
          : {
              // Light mode colors
              background: colors.background || '#fafafa',
              foreground: colors.foreground || '#0a0a0a',
              primary: colors.primary || '#3b82f6',
              secondary: colors.secondary || '#8b5cf6',
              muted: colors.muted || '#f4f4f5',
              mutedForeground: colors.mutedForeground || '#71717a',
              card: colors.card || '#ffffff',
              cardForeground: colors.cardForeground || '#0a0a0a',
              border: colors.border || '#e4e4e7',
              accent: colors.accent || '#3b82f6',
            };

        // Solid background color
        ctx.fillStyle = blogColors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Default layout options if not provided
        const layout = layoutOption || {
          value: 'square',
          label: 'square',
          description: 'social media format',
          includeImage: true,
          includeExcerpt: true,
          includeAuthor: true,
          includeDate: true,
          aspectRatio: '1:1' as const,
        };

        // Draw main card with shadow and rounded corners
        const cardMargin = 80;
        const cardX = cardMargin;
        const cardY = cardMargin;
        const cardWidth = canvas.width - 2 * cardMargin;
        const cardHeight = canvas.height - 2 * cardMargin;
        const borderRadius = 32;

        // Card shadow
        ctx.shadowColor = isDarkMode
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 60;
        ctx.shadowOffsetY = 20;

        // Card background
        ctx.fillStyle = blogColors.card;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, borderRadius);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Subtle border
        ctx.strokeStyle = hexToRgba(blogColors.primary, 0.2);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner content with better spacing
        const contentX = cardX + 60;
        const contentY = cardY + 60;
        const contentWidth = cardWidth - 120;
        let currentY = contentY;

        // Site branding header
        ctx.textBaseline = 'top';
        ctx.font = '200 36px system-ui, -apple-system, sans-serif';

        // Create gradient for site name
        const headerGradient = ctx.createLinearGradient(
          contentX,
          currentY,
          contentX + 300,
          currentY
        );
        headerGradient.addColorStop(0, blogColors.primary);
        headerGradient.addColorStop(1, blogColors.secondary);
        ctx.fillStyle = headerGradient;
        ctx.fillText('jacob.zip', contentX, currentY);

        // Site tagline
        ctx.font = '24px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = blogColors.mutedForeground;
        ctx.fillText('thoughts & projects', contentX + 180, currentY + 8);

        currentY += 80;

        // Collection badge (if applicable)
        if (post.collection && post.collection !== 'general') {
          const badgeText =
            post.collection === 'project' ? 'project' : post.collection;
          ctx.font = '20px system-ui, -apple-system, sans-serif';

          // Measure badge text
          const badgeMetrics = ctx.measureText(badgeText);
          const badgeWidth = badgeMetrics.width + 24;
          const badgeHeight = 32;

          // Badge background
          ctx.fillStyle = hexToRgba(blogColors.accent, 0.15);
          ctx.beginPath();
          ctx.roundRect(contentX, currentY, badgeWidth, badgeHeight, 16);
          ctx.fill();

          // Badge text
          ctx.fillStyle = blogColors.accent;
          ctx.fillText(badgeText, contentX + 12, currentY + 6);

          currentY += badgeHeight + 24;
        }

        // Blog post title with word wrapping
        ctx.font = '200 48px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = blogColors.cardForeground;

        const titleWords = post.title.split(' ');
        let titleLine = '';
        const maxTitleWidth = contentWidth;
        const maxTitleLines = 3;
        let titleLineCount = 0;

        for (const word of titleWords) {
          if (titleLineCount >= maxTitleLines) break;
          const testLine = titleLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTitleWidth && titleLine !== '') {
            ctx.fillText(titleLine.trim(), contentX, currentY);
            titleLine = word + ' ';
            currentY += 60;
            titleLineCount++;
          } else {
            titleLine = testLine;
          }
        }
        if (titleLineCount < maxTitleLines && titleLine.trim()) {
          ctx.fillText(titleLine.trim(), contentX, currentY);
          currentY += 60;
        }

        currentY += 20;

        // Blog post excerpt (if included and available)
        if (layout.includeExcerpt && post.excerpt) {
          ctx.font = '28px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = hexToRgba(blogColors.cardForeground, 0.8);

          const excerptWords = post.excerpt.split(' ');
          let excerptLine = '';
          const maxExcerptWidth = contentWidth;
          const maxExcerptLines = 4;
          let excerptLineCount = 0;

          for (const word of excerptWords) {
            if (excerptLineCount >= maxExcerptLines) break;
            const testLine = excerptLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxExcerptWidth && excerptLine !== '') {
              ctx.fillText(excerptLine.trim(), contentX, currentY);
              excerptLine = word + ' ';
              currentY += 38;
              excerptLineCount++;
            } else {
              excerptLine = testLine;
            }
          }
          if (excerptLineCount < maxExcerptLines && excerptLine.trim()) {
            ctx.fillText(excerptLine.trim(), contentX, currentY);
            currentY += 38;
          }

          currentY += 30;
        }

        // Featured image (if included and available)
        if (layout.includeImage && thumbnailUrl) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            const loadPromise = new Promise<HTMLImageElement>(
              (resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Image load timeout'));
                }, 5000);

                img.onload = () => {
                  clearTimeout(timeout);
                  resolve(img);
                };

                img.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('Image load failed'));
                };

                img.src = thumbnailUrl;
              }
            );

            const loadedImg = await loadPromise;

            // Calculate image dimensions to fit nicely in remaining space
            const availableHeight = cardY + cardHeight - currentY - 150; // Leave space for footer
            const imageMaxHeight = Math.min(300, availableHeight);
            const imageMaxWidth = contentWidth;

            const imgAspectRatio = loadedImg.width / loadedImg.height;
            let imageWidth = imageMaxWidth;
            let imageHeight = imageWidth / imgAspectRatio;

            if (imageHeight > imageMaxHeight) {
              imageHeight = imageMaxHeight;
              imageWidth = imageHeight * imgAspectRatio;
            }

            // Center the image horizontally
            const imageX = contentX + (contentWidth - imageWidth) / 2;

            // Draw image with rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(imageX, currentY, imageWidth, imageHeight, 16);
            ctx.clip();

            ctx.drawImage(loadedImg, imageX, currentY, imageWidth, imageHeight);
            ctx.restore();

            // Add subtle border
            ctx.strokeStyle = hexToRgba(blogColors.border, 0.3);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(imageX, currentY, imageWidth, imageHeight, 16);
            ctx.stroke();

            currentY += imageHeight + 40;
          } catch {
            // If image fails to load, show placeholder
            const placeholderHeight = 200;
            const placeholderX = contentX;
            const placeholderWidth = contentWidth;

            // Generate color based on title hash
            let colorIndex = 0;
            if (post.title) {
              let hash = 0;
              for (let i = 0; i < post.title.length; i++) {
                hash = post.title.charCodeAt(i) + ((hash << 5) - hash);
              }
              colorIndex = Math.abs(hash % 6);
            }

            const gradientColors = isDarkMode
              ? [
                  ['#3b82f6', '#1d4ed8'], // blue
                  ['#8b5cf6', '#7c3aed'], // violet
                  ['#10b981', '#059669'], // emerald
                  ['#f59e0b', '#d97706'], // amber
                  ['#ef4444', '#dc2626'], // red
                  ['#ec4899', '#db2777'], // pink
                ]
              : [
                  ['#93c5fd', '#60a5fa'], // light blue
                  ['#c4b5fd', '#a78bfa'], // light violet
                  ['#86efac', '#6ee7b7'], // light emerald
                  ['#fbbf24', '#f59e0b'], // light amber
                  ['#fca5a5', '#f87171'], // light red
                  ['#f9a8d4', '#f472b6'], // light pink
                ];

            const [fromColor, toColor] = gradientColors[colorIndex];

            const placeholderGradient = ctx.createLinearGradient(
              placeholderX,
              currentY,
              placeholderX + placeholderWidth,
              currentY + placeholderHeight
            );
            placeholderGradient.addColorStop(0, fromColor);
            placeholderGradient.addColorStop(1, toColor);

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
              placeholderX,
              currentY,
              placeholderWidth,
              placeholderHeight,
              16
            );
            ctx.clip();
            ctx.fillStyle = placeholderGradient;
            ctx.fillRect(
              placeholderX,
              currentY,
              placeholderWidth,
              placeholderHeight
            );
            ctx.restore();

            // Add subtle border
            ctx.strokeStyle = hexToRgba(blogColors.border, 0.3);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(
              placeholderX,
              currentY,
              placeholderWidth,
              placeholderHeight,
              16
            );
            ctx.stroke();

            currentY += placeholderHeight + 40;
          }
        }

        // Footer section with author and date
        const footerY = cardY + cardHeight - 100;

        if (layout.includeAuthor || layout.includeDate) {
          // Author info
          if (layout.includeAuthor && post.authorEmail) {
            const authorName = post.authorEmail.split('@')[0] || 'author';

            // Author avatar placeholder (initials)
            const avatarSize = 48;
            const avatarX = contentX;
            const avatarY = footerY;

            // Avatar background
            ctx.fillStyle = hexToRgba(blogColors.primary, 0.15);
            ctx.beginPath();
            ctx.arc(
              avatarX + avatarSize / 2,
              avatarY + avatarSize / 2,
              avatarSize / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Author initials
            const initials = authorName.slice(0, 2).toUpperCase();
            ctx.font = '200 20px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = blogColors.primary;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              initials,
              avatarX + avatarSize / 2,
              avatarY + avatarSize / 2
            );

            // Author name
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.font = '300 24px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = blogColors.cardForeground;
            ctx.fillText(
              `by ${authorName}`,
              avatarX + avatarSize + 16,
              avatarY + 4
            );

            // Date
            if (layout.includeDate) {
              const dateText = new Date(post.createdAt).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }
              );

              ctx.font = '20px system-ui, -apple-system, sans-serif';
              ctx.fillStyle = blogColors.mutedForeground;
              ctx.fillText(dateText, avatarX + avatarSize + 16, avatarY + 32);
            }
          } else if (layout.includeDate) {
            // Just date if no author
            const dateText = new Date(post.createdAt).toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }
            );

            ctx.font = '24px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = blogColors.mutedForeground;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(dateText, contentX, footerY + 12);
          }

          // Domain branding on the right
          ctx.font = '200 20px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = blogColors.mutedForeground;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('jacob.zip/blog', contentX + contentWidth, footerY + 16);
        }

        // Convert to blob
        return new Promise((resolve, reject) => {
          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  setGeneratedBlob(blob);
                  resolve(blob);
                } else {
                  resolve(null);
                }
              },
              'image/png',
              0.95
            );
          } catch (error) {
            reject(error);
          }
        });
      } catch {
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [ensureRoundRectSupport]
  );

  const downloadImage = useCallback(
    (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [filename]
  );

  return {
    isGenerating,
    generatedBlob,
    generateCanvasImage,
    downloadImage,
  };
}
