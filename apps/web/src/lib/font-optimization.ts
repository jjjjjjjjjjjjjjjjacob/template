/**
 * Font optimization utilities for tiered emoji loading
 * Reduces font size from 25MB+ to ~3-4MB while maintaining full functionality
 */

// Core emojis that should be loaded immediately (most commonly used)
export const CORE_EMOJI_UNICODE_RANGES = [
  // Basic Latin emojis and symbols
  'U+1F600-1F64F', // Emoticons
  'U+1F300-1F5FF', // Misc Symbols and Pictographs
  'U+1F680-1F6FF', // Transport and Map
  'U+1F1E0-1F1FF', // Regional Indicator Symbols (flags)
  'U+2600-26FF', // Misc symbols
  'U+2700-27BF', // Dingbats
  'U+FE00-FE0F', // Variation Selectors
  'U+1F900-1F9FF', // Supplemental Symbols and Pictographs
];

// Extended emojis loaded on-demand
export const EXTENDED_EMOJI_UNICODE_RANGES = [
  'U+1F780-1F7FF', // Geometric Shapes Extended
  'U+1F800-1F8FF', // Supplemental Arrows-C
  'U+1FAA0-1FAFF', // Symbols and Pictographs Extended-A
  'U+1FB00-1FBFF', // Symbols and Pictographs Extended-B
];

// Generate CSS unicode-range for font subsetting
export function generateUnicodeRange(ranges: string[]): string {
  return ranges.join(', ');
}

// Check if browser supports font loading API
export function supportsFontLoading(): boolean {
  return 'fonts' in document;
}

// Connection-aware loading
export function getConnectionSpeed(): 'slow' | 'fast' {
  // Navigator.connection is experimental - use type assertion for compatibility
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (!connection) return 'fast';

  // Consider 2G/slow-2g as slow
  if (
    connection.effectiveType === '2g' ||
    connection.effectiveType === 'slow-2g'
  ) {
    return 'slow';
  }

  return 'fast';
}