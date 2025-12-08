import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';

// Type for checking roundRect support
type CanvasWithRoundRect = CanvasRenderingContext2D & {
  roundRect?: (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | number[]
  ) => void;
};

interface UseStoryCanvasOptions {
  filename?: string;
}

export interface ResumeExportFormat {
  value: 'png' | 'pdf';
  label: string;
  description: string;
  mimeType: string;
}

export interface ResumeData {
  name: string;
  title: string;
  summary: string;
  experiences: Array<{
    company: string;
    role: string;
    timeline: string;
    location: string;
    description: string;
    achievements: string[];
    technologies: string[];
  }>;
  skills: Array<{
    category: string;
    skills: string[];
  }>;
  contact: {
    email?: string;
    github?: string;
    website?: string;
  };
}

const FALLBACK_SKILL_GROUPS = [
  {
    category: 'Frontend Development',
    skills: [
      'React',
      'TypeScript',
      'Three.js',
      'TanStack Start',
      'Next.js',
      'Tailwind CSS',
      'shadcn/ui',
      'Radix UI',
    ],
  },
  {
    category: 'Backend Development',
    skills: [
      'NestJS',
      'Node.js',
      'Convex',
      'PostgreSQL',
      'TypeORM',
      'REST APIs',
      'WebSocket',
      'Auth0',
      'Clerk',
    ],
  },
  {
    category: '3D Graphics & Animation',
    skills: [
      'Three.js',
      'React Three Fiber',
      'WebGL',
      'GLSL',
      'Motion Capture',
      'Animation Systems',
      'ONNX',
      'MediaPipe',
    ],
  },
  {
    category: 'Infrastructure & DevOps',
    skills: [
      'AWS',
      'Terraform',
      'Docker',
      'Cloudflare Workers',
      'GitHub Actions',
      'CI/CD',
      'ECS',
      'S3',
      'CloudFront',
    ],
  },
  {
    category: 'Real-time Systems',
    skills: [
      'WebSocket',
      'Convex',
      'TanStack Query',
      'Optimistic Updates',
      'Event-driven Architecture',
    ],
  },
  {
    category: 'Payment & Marketplace',
    skills: [
      'Stripe',
      'Stripe Connect',
      'Subscription Management',
      'Marketplace Architecture',
      'Revenue Systems',
    ],
  },
  {
    category: 'UI/UX Design',
    skills: [
      'Figma',
      'Design Systems',
      'User Research',
      'Prototyping',
      'Accessibility',
      'Mobile-first Design',
    ],
  },
  {
    category: 'Testing & Quality',
    skills: [
      'Jest',
      'Vitest',
      'React Testing Library',
      'Cypress',
      'Convex Test',
      'E2E Testing',
    ],
  },
] satisfies ResumeData['skills'];

// Font loading utility
const ensureFontsLoaded = async () => {
  try {
    await document.fonts.ready;

    // Load specific Utendo fonts we'll use
    const fontPromises = [
      document.fonts.load('200 16px Utendo'),
      document.fonts.load('300 16px Utendo'),
      document.fonts.load('400 16px Utendo'),
    ];

    await Promise.all(fontPromises);

    // Give fonts a moment to be fully available
    await new Promise((resolve) => setTimeout(resolve, 100));
  } catch {
    // Failed to load fonts
  }
};

// Polyfill for roundRect if not available
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath(); // Always start with a fresh path
  const extendedCtx = ctx as CanvasWithRoundRect;
  if (typeof extendedCtx.roundRect === 'function') {
    extendedCtx.roundRect(x, y, width, height, radius);
  } else {
    // Fallback implementation
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
};

// Lucide icon drawing functions
const drawGitHubIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();
  const scale = size / 24;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // GitHub icon paths from Lucide
  // ctx.fillStyle already set from calling context
  ctx.fill(
    new Path2D(
      'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5a11.5 11.5 0 0 0-6 0C8 2 7 2 7 2a5.4 5.4 0 0 0 0 3.5A5.4 5.4 0 0 0 6 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4'
    )
  );
  ctx.fill(new Path2D('m9 19c-4.3 1.4-4.3-2.5-6-3'));
  ctx.restore();
};

const drawXIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();
  const scale = size / 24;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // X (Twitter) icon from custom path
  // ctx.fillStyle already set from calling context
  ctx.fill(
    new Path2D(
      'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
    )
  );
  ctx.restore();
};

const drawEmailIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();
  const scale = size / 24;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Mail icon stroke paths from Lucide
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw envelope rectangle
  ctx.beginPath();
  const path1 = new Path2D(
    'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'
  );
  ctx.stroke(path1);

  // Draw envelope flap
  ctx.beginPath();
  const path2 = new Path2D('m22 6-10 7L2 6');
  ctx.stroke(path2);

  ctx.restore();
};

export function useStoryCanvas(options: UseStoryCanvasOptions = {}) {
  const { filename = 'jacob-stein-resume' } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const generateResumeImage = useCallback(
    async (
      resumeData: ResumeData,
      format: ResumeExportFormat = {
        value: 'png',
        label: 'PNG Image',
        description: 'high quality image',
        mimeType: 'image/png',
      }
    ): Promise<Blob | null> => {
      setIsGenerating(true);

      try {
        if (format.value === 'pdf') {
          return await generatePDF(resumeData);
        } else {
          return await generateCanvas(resumeData, format);
        }
      } catch {
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const generatePDF = async (resumeData: ResumeData): Promise<Blob | null> => {
    // Generate PNG first, then embed it in PDF
    const pngBlob = await generateCanvas(resumeData, {
      mimeType: 'image/png',
      value: 'png',
      label: 'PNG',
      description: 'PNG Image',
    });

    if (!pngBlob) {
      return null;
    }

    // Get the actual canvas dimensions for proper PDF sizing
    const tempImg = new Image();

    return new Promise((resolve) => {
      tempImg.onload = () => {
        // Fixed 8.5" width, dynamic height based on content
        const PAGE_WIDTH_INCHES = 8.5;

        // Calculate height in inches from canvas dimensions (accounting for 2x scale)
        const canvasWidthPx = tempImg.width / 2;
        const canvasHeightPx = tempImg.height / 2;
        const heightInches =
          (canvasHeightPx / canvasWidthPx) * PAGE_WIDTH_INCHES;

        // Create PDF with fixed 8.5" width and dynamic height
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: [PAGE_WIDTH_INCHES, heightInches],
        });

        const reader = new FileReader();
        reader.onload = () => {
          const imgData = reader.result as string;

          // Add the image at full page size
          pdf.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_INCHES, heightInches);

          const pdfBlob = pdf.output('blob');
          setGeneratedBlob(pdfBlob);
          resolve(pdfBlob);
        };
        reader.readAsDataURL(pngBlob);
      };

      // Load image to get dimensions
      const blobUrl = URL.createObjectURL(pngBlob);
      tempImg.src = blobUrl;
    });
  };

  const generateCanvas = async (
    resumeData: ResumeData,
    format: ResumeExportFormat
  ): Promise<Blob | null> => {
    // Ensure fonts are loaded
    await ensureFontsLoaded();

    // Create canvas with fixed 8.5" width, dynamic height for content
    const canvas = document.createElement('canvas');
    const scale = 2; // 2x for crisp rendering
    const DPI = 96;
    const PAGE_WIDTH_INCHES = 8.5;
    canvas.width = PAGE_WIDTH_INCHES * DPI * scale; // 8.5 inches at 96 DPI = 816px, scaled to 1632px
    canvas.height = 3000 * scale; // Large initial height, will crop to actual content
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Scale context for crisp rendering
    ctx.scale(scale, scale);

    // Exact resume colors from implementation plan
    const resumeColors = {
      background: '#ffffff', // Pure white
      text: '#1a1a1a', // Dark text
      muted: '#64748b', // Gray text
      primary: '#1a1a1a', // Dark text (no blue links)
      pillBackground: '#f4f4f5', // Light gray for ALL pills
      pillText: '#64748b', // Gray text for pills
      border: '#e4e4e7', // Light border for timeline
    };

    // White background
    ctx.fillStyle = resumeColors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layout constants from implementation plan
    const leftMargin = 50;
    const rightMargin = 50;
    const contentWidth = 816 - leftMargin - rightMargin;

    let y = 50;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Header layout - balanced name+title vs contact section
    const headerStartY = y;

    // Name at top-left
    ctx.font = '200 28px Utendo, system-ui, sans-serif';
    ctx.fillStyle = resumeColors.text;
    ctx.fillText('jacob stein', leftMargin, y);
    y += 40;

    // Title below name
    ctx.font = '400 16px Utendo, system-ui, sans-serif';
    ctx.fillStyle = resumeColors.muted;
    ctx.fillText('full-stack developer & ui/ux designer', leftMargin, y);

    // Contact information with icons at top-right (with proper margin spacing)
    // Calculate the longest text to determine positioning
    ctx.font = '400 12px Utendo, system-ui, sans-serif';
    const longestText = 'github.com/jjjjjjjjjjjjjjjjacob'; // This is likely the longest
    const longestTextWidth = ctx.measureText(longestText).width;
    const iconSize = 14;
    const iconTextGap = 6;
    const contactRightPadding = 20; // Add some breathing room from the right edge
    const contactStartX =
      816 -
      rightMargin -
      contactRightPadding -
      iconSize -
      iconTextGap -
      longestTextWidth;
    const lineHeight = 18;
    const contactStartY = headerStartY; // Align with name start

    ctx.fillStyle = resumeColors.muted;
    ctx.textBaseline = 'top'; // Use top baseline for consistent alignment

    // Email with icon (properly aligned)
    drawEmailIcon(ctx, contactStartX, contactStartY + 2, iconSize);
    ctx.fillText(
      'jacob@jacobstein.me',
      contactStartX + iconSize + iconTextGap,
      contactStartY + 5
    );

    // GitHub with icon (properly aligned)
    drawGitHubIcon(
      ctx,
      contactStartX,
      contactStartY + lineHeight + 2,
      iconSize
    );
    ctx.fillText(
      'github.com/jjjjjjjjjjjjjjjjacob',
      contactStartX + iconSize + iconTextGap,
      contactStartY + lineHeight + 5
    );

    // X/Twitter with icon (properly aligned)
    drawXIcon(ctx, contactStartX, contactStartY + lineHeight * 2 + 2, iconSize);
    ctx.fillText(
      'x.com/jaequbh',
      contactStartX + iconSize + iconTextGap,
      contactStartY + lineHeight * 2 + 5
    );
    y += 40;

    // Summary text with proper word wrapping
    ctx.font = '400 14px Utendo, system-ui, sans-serif';
    ctx.fillStyle = resumeColors.text;
    const hasSummary = Boolean(resumeData.summary?.trim().length);
    const summaryText = hasSummary
      ? resumeData.summary
      : 'Technical leader and architect with experience founding and scaling software platforms. Proven track record of building high-performance teams and delivering complex technical products.';

    const summaryWords = summaryText.split(' ');
    let line = '';
    const maxLineWidth = contentWidth;

    for (const word of summaryWords) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && line !== '') {
        ctx.fillText(line.trim(), leftMargin, y);
        line = word + ' ';
        y += 20;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), leftMargin, y);
      y += 40;
    }

    // Experience section header
    ctx.font = '200 20px Utendo, system-ui, sans-serif';
    ctx.fillStyle = resumeColors.text;
    ctx.fillText('experience', leftMargin, y);
    y += 30;

    const timelineDotX = leftMargin + 8;
    const contentStartX = leftMargin + 30;

    for (let i = 0; i < resumeData.experiences.length; i++) {
      const exp = resumeData.experiences[i];
      const startY = y;

      // Draw timeline dot
      ctx.fillStyle = resumeColors.text;
      ctx.beginPath();
      ctx.arc(timelineDotX, y + 10, 6, 0, Math.PI * 2);
      ctx.fill();

      // Role and company
      ctx.font = '200 16px Utendo, system-ui, sans-serif';
      ctx.fillStyle = resumeColors.text;
      ctx.fillText(exp.role, contentStartX, y);
      y += 22;

      ctx.font = '400 16px Utendo, system-ui, sans-serif';
      ctx.fillStyle = resumeColors.text; // Standard text color
      ctx.fillText(exp.company, contentStartX, y);
      y += 20;

      // Date and location with icons (inline relative spacing)
      ctx.font = '400 12px Utendo, system-ui, sans-serif';
      ctx.fillStyle = resumeColors.muted;

      // Calendar icon and date
      ctx.fillText('📅', contentStartX, y);
      const timelineText = exp.timeline;
      ctx.fillText(timelineText, contentStartX + 20, y);

      // Measure timeline width for relative location positioning
      const timelineWidth = ctx.measureText(timelineText).width;
      const locationStartX = contentStartX + 20 + timelineWidth + 20;

      // Location icon and location (relative to timeline)
      ctx.fillText('📍', locationStartX, y);
      ctx.fillText(exp.location, locationStartX + 20, y);
      y += 25;

      // Description
      if (exp.description) {
        ctx.font = '400 14px Utendo, system-ui, sans-serif';
        ctx.fillStyle = resumeColors.text;
        const descWords = exp.description.split(' ');
        let line = '';
        const maxDescWidth = contentWidth - 50;

        for (const word of descWords) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxDescWidth && line !== '') {
            ctx.fillText(line.trim(), contentStartX, y);
            line = word + ' ';
            y += 18;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), contentStartX, y);
          y += 25;
        }
      }

      // Key achievements
      if (exp.achievements && exp.achievements.length > 0) {
        ctx.font = '200 14px Utendo, system-ui, sans-serif';
        ctx.fillStyle = resumeColors.text;
        ctx.fillText('key achievements', contentStartX, y);
        y += 20;

        ctx.font = '400 13px Utendo, system-ui, sans-serif';
        ctx.fillStyle = resumeColors.text;

        for (const achievement of exp.achievements.slice(0, 8)) {
          // Small bullet dot
          ctx.fillStyle = resumeColors.text;
          ctx.beginPath();
          ctx.arc(contentStartX + 10, y + 6, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = resumeColors.text;
          const achWords = achievement.split(' ');
          let line = '';
          const startX = contentStartX + 20;
          const maxAchWidth = contentWidth - 70;

          for (const word of achWords) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxAchWidth && line !== '') {
              ctx.fillText(line.trim(), startX, y);
              line = word + ' ';
              y += 16;
            } else {
              line = testLine;
            }
          }
          if (line.trim()) {
            ctx.fillText(line.trim(), startX, y);
            y += 18;
          }
        }
        y += 10;
      }

      // Technologies
      if (exp.technologies && exp.technologies.length > 0) {
        ctx.font = '200 14px Utendo, system-ui, sans-serif';
        ctx.fillStyle = resumeColors.text;
        ctx.fillText('technologies', contentStartX, y);
        y += 25;

        // Technology pills (GRAY as specified)
        let tagX = contentStartX;
        let tagY = y;
        ctx.font = '400 12px Utendo, system-ui, sans-serif';

        for (const tech of exp.technologies.slice(0, 8)) {
          // Set font before measuring
          ctx.font = '400 12px Utendo, system-ui, sans-serif';
          const metrics = ctx.measureText(tech);
          const tagWidth = metrics.width + 16;
          const tagHeight = 22;

          // Check if we need to wrap to next line
          if (tagX + tagWidth > contentStartX + contentWidth - 50) {
            tagX = contentStartX;
            tagY += 28;
          }

          // Draw pill background FIRST
          ctx.fillStyle = resumeColors.pillBackground;
          drawRoundedRect(ctx, tagX, tagY - 2, tagWidth, tagHeight, 11);
          ctx.fill();

          // Draw pill text ON TOP with proper centering
          ctx.fillStyle = resumeColors.pillText;
          ctx.textBaseline = 'middle';
          ctx.fillText(tech, tagX + 8, tagY + 9); // Adjusted for middle baseline
          ctx.textBaseline = 'top'; // Reset baseline

          tagX += tagWidth + 8;
        }

        y = tagY + 35;
      }

      // Draw vertical timeline line for each experience
      const endY = y;
      ctx.strokeStyle = resumeColors.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(timelineDotX, startY + 20);
      ctx.lineTo(timelineDotX, endY - 5);
      ctx.stroke();

      y += 15; // Space between experiences
    }

    // Skills section header
    y += 10;
    ctx.font = '200 20px Utendo, system-ui, sans-serif';
    ctx.fillStyle = resumeColors.text;
    ctx.fillText('skills', leftMargin, y);
    y += 35;

    const skillGroups =
      Array.isArray(resumeData.skills) && resumeData.skills.length > 0
        ? resumeData.skills
        : FALLBACK_SKILL_GROUPS;

    // Two-column layout derived from current resume data
    const columnWidth = contentWidth / 2 - 20;
    const columnY = [y, y]; // Track Y position for each column

    skillGroups.forEach((group, index) => {
      const col = index % 2;
      const x = leftMargin + col * (columnWidth + 40);

      // Category header
      ctx.font = '200 14px Utendo, system-ui, sans-serif';
      ctx.fillStyle = resumeColors.text;
      ctx.fillText(group.category, x, columnY[col]);
      columnY[col] += 25;

      // Skill pills
      let pillX = x;
      let pillY = columnY[col];

      group.skills.forEach((skill) => {
        // Set font before measuring
        ctx.font = '400 12px Utendo, system-ui, sans-serif';
        const metrics = ctx.measureText(skill);
        const pillWidth = metrics.width + 16;
        const pillHeight = 22;

        // Wrap to next line if needed
        if (pillX + pillWidth > x + columnWidth) {
          pillX = x;
          pillY += 28;
        }

        // Draw pill background FIRST
        ctx.fillStyle = resumeColors.pillBackground;
        drawRoundedRect(ctx, pillX, pillY - 2, pillWidth, pillHeight, 11);
        ctx.fill();

        // Draw pill text ON TOP with proper centering
        ctx.fillStyle = resumeColors.pillText;
        ctx.textBaseline = 'middle';
        ctx.fillText(skill, pillX + 8, pillY + 9); // Adjusted for middle baseline
        ctx.textBaseline = 'top'; // Reset baseline

        pillX += pillWidth + 8;
      });

      columnY[col] = pillY + 40;
    });

    // Calculate final content height and crop canvas to fit content exactly
    const finalY = Math.max(columnY[0], columnY[1]) + 50; // Add padding at bottom
    const contentHeight = Math.ceil(finalY);

    // Crop canvas to content height for optimal file size (width stays at 8.5")
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = contentHeight * scale;
    const croppedCtx = croppedCanvas.getContext('2d');

    if (croppedCtx) {
      // Copy only the content area from the original canvas
      croppedCtx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        contentHeight * scale,
        0,
        0,
        croppedCanvas.width,
        croppedCanvas.height
      );

      // Replace the original canvas with the cropped version
      canvas.width = croppedCanvas.width;
      canvas.height = croppedCanvas.height;
      const finalCtx = canvas.getContext('2d');
      if (finalCtx) {
        finalCtx.clearRect(0, 0, canvas.width, canvas.height);
        finalCtx.drawImage(croppedCanvas, 0, 0);
      }
    }

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            setGeneratedBlob(blob);
            resolve(blob);
          } else {
            resolve(null);
          }
        },
        format.mimeType,
        0.9
      );
    });
  };

  const downloadImage = useCallback(
    (blob: Blob, format: ResumeExportFormat) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format.value}`;
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
    generateResumeImage,
    downloadImage,
  };
}
