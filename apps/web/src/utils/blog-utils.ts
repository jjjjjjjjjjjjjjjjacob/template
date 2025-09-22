/**
 * Utility functions for blog content processing
 */

/**
 * Extract plain text from markdown, removing all formatting
 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  return (
    markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove links but keep link text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline images (including custom syntax)
      .replace(/!\[([^\]]*)\]\([^)]+\)(\{[^}]*\})?/g, '')
      // Remove regular images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim()
  );
}

/**
 * Extract excerpt from markdown content
 * If custom excerpt exists, use it. Otherwise extract first ~200 chars
 */
export function extractExcerpt(
  markdown: string,
  customExcerpt?: string,
  maxLength = 200
): string {
  if (customExcerpt && customExcerpt.trim()) {
    return customExcerpt.trim();
  }

  const plainText = extractPlainTextFromMarkdown(markdown);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find a good break point (end of sentence or word)
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');

  // If we found a sentence ending, use that
  if (lastSentence > maxLength * 0.6) {
    return truncated.substring(0, lastSentence + 1);
  }

  // Otherwise, break at the last word
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Calculate estimated reading time in minutes
 * Uses average reading speed of 200-250 words per minute
 */
export function calculateReadingTime(markdown: string): number {
  const plainText = extractPlainTextFromMarkdown(markdown);
  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  const wordsPerMinute = 225; // Average reading speed
  const readingTime = Math.ceil(words.length / wordsPerMinute);

  return Math.max(1, readingTime); // Minimum 1 minute
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return '1 min read';
  }
  return `${minutes} min read`;
}

export function extractInlineImageReferences(markdown: string): string[] {
  const imageRefs: string[] = [];
  const inlineImageRegex = /!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g;

  let match;
  while ((match = inlineImageRegex.exec(markdown)) !== null) {
    const imageId = match[2];
    if (imageId && !imageRefs.includes(imageId)) {
      imageRefs.push(imageId);
    }
  }

  return imageRefs;
}

export function validateInlineImageSyntax(markdown: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const inlineImageRegex = /!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g;

  let match;
  while ((match = inlineImageRegex.exec(markdown)) !== null) {
    const optionsStr = match[3];

    if (optionsStr) {
      const options = optionsStr.slice(1, -1);
      const parts = options.split(/\s+/);

      for (const part of parts) {
        if (part.includes('=')) {
          const [key, value] = part.split('=', 2);

          if (key === 'position') {
            const validPositions = ['left', 'right', 'center', 'full-width'];
            if (!validPositions.includes(value)) {
              errors.push(
                `Invalid position "${value}". Valid options: ${validPositions.join(', ')}`
              );
            }
          } else if (key === 'width') {
            if (!value.match(/^\d+(%|px|em|rem)$/)) {
              errors.push(
                `Invalid width "${value}". Must be a number followed by %, px, em, or rem`
              );
            }
          } else {
            errors.push(`Unknown option "${key}"`);
          }
        } else {
          const validPositions = ['left', 'right', 'center', 'full-width'];
          if (!validPositions.includes(part)) {
            errors.push(
              `Invalid position "${part}". Valid options: ${validPositions.join(', ')}`
            );
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
