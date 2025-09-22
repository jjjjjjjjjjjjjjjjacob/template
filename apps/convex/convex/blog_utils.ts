/**
 * Server-side utility functions for blog content processing
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
      // Remove images
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
 */
export function calculateReadingTime(markdown: string): number {
  const plainText = extractPlainTextFromMarkdown(markdown);
  const words = plainText.split(/\s+/).filter((word) => word.length > 0);
  const wordsPerMinute = 225; // Average reading speed
  const readingTime = Math.ceil(words.length / wordsPerMinute);

  return Math.max(1, readingTime); // Minimum 1 minute
}
