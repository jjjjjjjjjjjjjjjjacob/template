import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Image } from 'mdast';

interface NodeData {
  hProperties?: Record<
    string,
    string | number | boolean | (string | number)[] | null | undefined
  >;
  [key: string]: unknown;
}

interface ImageNodeWithData extends Image {
  data?: NodeData;
}

type PositionType = 'left' | 'right' | 'center' | 'full-width';

interface InlineImageOptions {
  position?: 'left' | 'right' | 'center' | 'full-width';
  width?: string;
  caption?: string;
}

const POSITION_REGEX = /\{([^}]+)\}/;

export const remarkInlineImages: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'image', (node: Image) => {
      const { alt } = node;

      // Parse caption and options from alt text
      const { cleanAlt, options } = parseAltText(alt || '');

      // Update the alt text to remove caption and options
      node.alt = cleanAlt;

      const nodeWithData = node as ImageNodeWithData;

      if (!nodeWithData.data) {
        nodeWithData.data = {};
      }
      if (!nodeWithData.data.hProperties) {
        nodeWithData.data.hProperties = {};
      }

      nodeWithData.data.hProperties['data-inline-image'] = true;

      if (options.position) {
        nodeWithData.data.hProperties['data-position'] = options.position;
      }

      if (options.width) {
        nodeWithData.data.hProperties['data-width'] = options.width;
      }

      if (options.caption) {
        nodeWithData.data.hProperties['data-caption'] = options.caption;
      }
    });
  };
};

function parseAltText(altText: string): {
  cleanAlt: string;
  caption?: string;
  options: InlineImageOptions;
} {
  // Parse format: "alt text | caption {position=left width=200px}"
  const parts = altText.split('|');
  const cleanAlt = parts[0]?.trim() || '';

  let caption: string | undefined;
  let optionsStr = '';

  if (parts.length > 1) {
    const captionAndOptions = parts[1].trim();
    const optionsMatch = captionAndOptions.match(POSITION_REGEX);

    if (optionsMatch) {
      // Extract options and caption
      caption = captionAndOptions.replace(POSITION_REGEX, '').trim();
      optionsStr = optionsMatch[1];
    } else {
      // No options, entire part is caption
      caption = captionAndOptions;
    }
  } else {
    // Check if original alt text has options without caption
    const optionsMatch = altText.match(POSITION_REGEX);
    if (optionsMatch) {
      optionsStr = optionsMatch[1];
    }
  }

  const options = parseImageOptions(optionsStr);
  if (caption) {
    options.caption = caption;
  }

  return { cleanAlt, caption, options };
}

function parseImageOptions(optionsStr: string): InlineImageOptions {
  const options: InlineImageOptions = {};

  const parts = optionsStr.split(/\s+/);

  for (const part of parts) {
    if (part.includes('=')) {
      const [key, value] = part.split('=', 2);
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedKey === 'position') {
        const validPositions = ['left', 'right', 'center', 'full-width'];
        if (validPositions.includes(trimmedValue)) {
          options.position = trimmedValue as PositionType;
        }
      } else if (trimmedKey === 'width') {
        if (trimmedValue.match(/^\d+(%|px|em|rem)$/)) {
          options.width = trimmedValue;
        }
      }
    } else {
      const validPositions = ['left', 'right', 'center', 'full-width'];
      if (validPositions.includes(part.trim())) {
        options.position = part.trim() as PositionType;
      }
    }
  }

  return options;
}

export function createInlineImageSyntax(
  imageId: string,
  alt: string,
  position?: string,
  width?: string,
  caption?: string
): string {
  const options: string[] = [];
  if (position) options.push(`position=${position}`);
  if (width) options.push(`width=${width}`);

  let finalAlt = alt;

  // Add caption if provided
  if (caption) {
    finalAlt = `${alt} | ${caption}`;
  }

  // Add options if any
  if (options.length > 0) {
    finalAlt = `${finalAlt} {${options.join(' ')}}`;
  }

  return `![${finalAlt}](${imageId})`;
}
