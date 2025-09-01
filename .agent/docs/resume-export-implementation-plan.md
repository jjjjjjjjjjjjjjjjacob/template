# Resume Export Implementation Plan

## Objective

Fix the resume export functionality to generate a pixel-perfect match of the reference design, including ALL sections from the website's resume display.

## Reference Design Analysis

### Overall Structure

- Clean, minimal design with consistent left margin
- White background (#ffffff)
- Dark text (#1a1a1a for primary, #64748b for muted)
- Gray pill tags throughout (#f4f4f5 background)
- Consistent spacing and typography

### Complete Section Layout

```
jacob stein                                    [download button]
full-stack developer & ui/ux designer

Technical leader and architect with experience founding and scaling software platforms.
Proven track record of building high-performance teams and delivering complex technical products.

experience

● Senior Full-Stack Developer & Technical Lead
  Heat.tech                                    📅 2022-2025  📍 Remote

  Led development of a sophisticated motion capture marketplace platform...

  key achievements
  • Architected monorepo platform...
  • Built advanced 3D viewer...
  • Integrated Stripe marketplace...

  technologies
  [React] [Three.js] [React Three Fiber] [NestJS] [TypeORM] [PostgreSQL] [AWS ECS] [Terraform]
│
│
● Founder & Lead Developer
  vibechecc                                    📅 2025-present  📍 Remote

  Founded and architected innovative social platform...

  key achievements
  • Architected real-time social platform...
  • Designed innovative emoji rating system...

  technologies
  [TanStack Start] [TanStack Router] [TanStack Query] [Convex] [Clerk] [Node.js] [Cloudflare Workers]

skills

Frontend Development                    Backend Development
[React] [TypeScript] [Three.js]        [NestJS] [Node.js] [Convex] [PostgreSQL]
[TanStack Start] [Next.js] [Tailwind]  [TypeORM] [REST APIs] [WebSocket]
[shadcn/ui] [Radix UI]                  [Auth0] [Clerk]

3D Graphics & Animation                 Infrastructure & DevOps
[Three.js] [React Three Fiber] [WebGL]  [AWS] [Terraform] [Docker]
[GLSL] [Motion Capture] [Animation]     [Cloudflare Workers] [GitHub Actions] [CI/CD]
[ONNX] [MediaPipe]                      [ECS] [S3] [CloudFront]

Real-time Systems                       Payment & Marketplace
[WebSocket] [Convex] [TanStack Query]   [Stripe] [Stripe Connect]
[Optimistic Updates] [Event-driven]     [Subscription Management]
                                        [Marketplace Architecture] [Revenue Systems]

UI/UX Design                            Testing & Quality
[Figma] [Design Systems] [User Research] [Jest] [Vitest] [React Testing Library]
[Prototyping] [Accessibility]           [Cypress] [Convex Test] [E2E Testing]
[Mobile-first Design]
```

## Current Issues (Complete List)

1. **Missing sections** - UI/UX Design and Testing & Quality sections not included
2. **Layout is wrong** - elements misaligned and incorrectly positioned
3. **Typography doesn't match** - wrong font weights, sizes, and spacing
4. **Timeline structure missing** - no vertical line with dots
5. **All pill tags wrong color** - should be gray (#f4f4f5), not blue
6. **Download button placement** - should be top-right
7. **Spacing inconsistent** - margins and padding don't match
8. **Skills layout wrong** - should be 2-column with multiple categories

## Implementation Tasks

### Task 1: Fix Canvas Setup and Dimensions

```javascript
const canvas = document.createElement('canvas');
const scale = 2; // For high DPI
canvas.width = 816 * scale; // 8.5 inches
canvas.height = 1056 * scale; // 11 inches (may need to extend for all content)
const ctx = canvas.getContext('2d');
ctx.scale(scale, scale);
```

### Task 2: Implement Complete Header

```javascript
// Positioning
const leftMargin = 50;
const rightMargin = 50;
const contentWidth = 816 - leftMargin - rightMargin;

// Header layout
// Name at top-left
ctx.font = '700 28px Utendo';
ctx.fillText('jacob stein', leftMargin, 50);

// Download button indicator at top-right
ctx.font = '400 12px Utendo';
ctx.fillText('download', 816 - rightMargin - 80, 50);

// Title below name
ctx.font = '400 16px Utendo';
ctx.fillStyle = '#64748b';
ctx.fillText('full-stack developer & ui/ux designer', leftMargin, 75);

// Summary text
ctx.font = '400 14px Utendo';
// Word wrap summary text...
```

### Task 3: Fix Experience Section with Timeline

```javascript
// For each experience:
const timelineDotX = leftMargin;
const contentStartX = leftMargin + 30;

// Draw timeline dot
ctx.fillStyle = '#1a1a1a';
ctx.beginPath();
ctx.arc(timelineDotX, y + 10, 6, 0, Math.PI * 2);
ctx.fill();

// Draw vertical line to next experience (if not last)
if (!isLast) {
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(timelineDotX, y + 20);
  ctx.lineTo(timelineDotX, nextExperienceY);
  ctx.stroke();
}

// Role and company
ctx.font = '600 16px Utendo';
ctx.fillStyle = '#1a1a1a';
ctx.fillText(exp.role, contentStartX, y);

ctx.font = '400 16px Utendo';
ctx.fillStyle = '#3b82f6'; // Primary color for company
ctx.fillText(exp.company, contentStartX, y + 20);

// Date and location with icons
ctx.font = '400 12px Utendo';
ctx.fillStyle = '#64748b';
// Draw calendar icon and date
// Draw location icon and location
```

### Task 4: Implement ALL Skills Categories

Skills sections to implement (8 total categories):

1. **Frontend Development**
2. **Backend Development**
3. **3D Graphics & Animation**
4. **Infrastructure & DevOps**
5. **Real-time Systems**
6. **Payment & Marketplace**
7. **UI/UX Design**
8. **Testing & Quality**

```javascript
const skillsData = {
  'Frontend Development': [
    'React',
    'TypeScript',
    'Three.js',
    'TanStack Start',
    'Next.js',
    'Tailwind CSS',
    'shadcn/ui',
    'Radix UI',
  ],
  'Backend Development': [
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
  '3D Graphics & Animation': [
    'Three.js',
    'React Three Fiber',
    'WebGL',
    'GLSL',
    'Motion Capture',
    'Animation Systems',
    'ONNX',
    'MediaPipe',
  ],
  'Infrastructure & DevOps': [
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
  'Real-time Systems': [
    'WebSocket',
    'Convex',
    'TanStack Query',
    'Optimistic Updates',
    'Event-driven Architecture',
  ],
  'Payment & Marketplace': [
    'Stripe',
    'Stripe Connect',
    'Subscription Management',
    'Marketplace Architecture',
    'Revenue Systems',
  ],
  'UI/UX Design': [
    'Figma',
    'Design Systems',
    'User Research',
    'Prototyping',
    'Accessibility',
    'Mobile-first Design',
  ],
  'Testing & Quality': [
    'Jest',
    'Vitest',
    'React Testing Library',
    'Cypress',
    'Convex Test',
    'E2E Testing',
  ],
};

// Two-column layout
const columnWidth = contentWidth / 2 - 20;
let currentColumn = 0;
let columnY = [y, y]; // Track Y position for each column

Object.entries(skillsData).forEach(([category, skills], index) => {
  const col = index % 2;
  const x = leftMargin + col * (columnWidth + 40);

  // Category header
  ctx.font = '600 14px Utendo';
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText(category, x, columnY[col]);
  columnY[col] += 25;

  // Skill pills
  let pillX = x;
  let pillY = columnY[col];

  skills.forEach((skill) => {
    const metrics = ctx.measureText(skill);
    const pillWidth = metrics.width + 16;

    // Wrap to next line if needed
    if (pillX + pillWidth > x + columnWidth) {
      pillX = x;
      pillY += 28;
    }

    // Draw gray pill background
    ctx.fillStyle = '#f4f4f5';
    drawRoundedRect(ctx, pillX, pillY - 2, pillWidth, 22, 11);
    ctx.fill();

    // Draw skill text
    ctx.font = '400 12px Utendo';
    ctx.fillStyle = '#64748b';
    ctx.fillText(skill, pillX + 8, pillY + 12);

    pillX += pillWidth + 8;
  });

  columnY[col] = pillY + 35;
});
```

### Task 5: Fix Color Scheme (Exact Values)

```javascript
const colors = {
  background: '#ffffff', // Pure white
  text: '#1a1a1a', // Dark text
  muted: '#64748b', // Gray text
  primary: '#3b82f6', // Blue (ONLY for company names)
  pillBackground: '#f4f4f5', // Light gray for ALL pills
  pillText: '#64748b', // Gray text for pills
  border: '#e4e4e7', // Light border for timeline
};
```

### Task 6: Typography System (Complete)

```javascript
const fonts = {
  // Header
  name: '700 28px Utendo',
  title: '400 16px Utendo',

  // Sections
  sectionHeader: '700 20px Utendo',

  // Experience
  roleTitle: '600 16px Utendo',
  company: '400 16px Utendo',
  dateLocation: '400 12px Utendo',
  description: '400 14px Utendo',
  subsectionHeader: '500 14px Utendo', // "key achievements", "technologies"
  bulletPoint: '400 13px Utendo',

  // Skills
  categoryHeader: '600 14px Utendo',
  skillPill: '400 12px Utendo',

  // General
  bodyText: '400 14px Utendo',
  smallText: '400 12px Utendo',
};
```

## File to Modify

`/Users/jacob/Developer/template/apps/web/src/hooks/use-story-canvas.ts`

### Function Structure

```javascript
const generateCanvas = async (resumeData, format) => {
  // 1. Setup canvas with proper dimensions
  // 2. Load fonts
  // 3. Set colors
  // 4. Draw header (name, title, summary)
  // 5. Draw experience section with timeline
  // 6. Draw complete skills section (all 8 categories)
  // 7. Convert to blob
};
```

## Testing Checklist

- [ ] All 8 skill categories display correctly
- [ ] Timeline dots and lines render properly
- [ ] All pills are gray (#f4f4f5), not blue
- [ ] Typography matches exactly (weights, sizes)
- [ ] Spacing is consistent throughout
- [ ] Text wraps properly without overflow
- [ ] Download button indicator in correct position
- [ ] Two-column layout for skills works correctly
- [ ] Experience achievements display as bullet points
- [ ] Technology tags display as inline gray pills
- [ ] Canvas height adjusts for all content
- [ ] High DPI rendering (2x scale) works

## Success Criteria

The exported resume must:

1. Include ALL sections from the website
2. Match the exact layout and spacing
3. Use correct Utendo font weights
4. Display gray pills for all tags (not blue)
5. Show proper timeline structure
6. Maintain professional appearance
7. Be readable when printed

## Important Notes

- Canvas height may need to be dynamic based on content
- Ensure all 8 skill categories are included
- Pills should NEVER be blue - always gray (#f4f4f5)
- Timeline dots should be solid black circles
- Company names are the ONLY blue text elements
- Test with full resume data to ensure nothing is cut off
