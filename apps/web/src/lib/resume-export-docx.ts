import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

import type { ResumeData } from '@/hooks/use-story-canvas';

const SEPARATOR = ' | ';
const RESUME_FONT = 'Helvetica';

function cleanUrl(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function compact(parts: Array<string | undefined>): string[] {
  return parts.filter((part): part is string => Boolean(part?.trim()));
}

function metaLine(...parts: Array<string | undefined>): string {
  return compact(parts).join(SEPARATOR);
}

function buildContactLine(data: ResumeData): string {
  return compact([
    data.contact.email,
    data.contact.phone,
    data.location,
    data.contact.website ? cleanUrl(data.contact.website) : undefined,
    data.contact.github ? cleanUrl(data.contact.github) : undefined,
    data.contact.linkedin ? cleanUrl(data.contact.linkedin) : undefined,
  ]).join(SEPARATOR);
}

function paragraph(
  text: string,
  options: {
    bold?: boolean;
    size?: number;
    italics?: boolean;
    spacingAfter?: number;
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  } = {}
) {
  return new Paragraph({
    heading: options.heading,
    alignment: options.alignment,
    spacing: {
      after: options.spacingAfter ?? 120,
    },
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italics,
        size: options.size ?? 22,
        font: RESUME_FONT,
      }),
    ],
  });
}

function sectionHeading(text: string) {
  return paragraph(text, {
    bold: true,
    size: 24,
    heading: HeadingLevel.HEADING_1,
    spacingAfter: 120,
  });
}

export async function buildResumeDocx(data: ResumeData): Promise<ArrayBuffer> {
  const children: Paragraph[] = [
    paragraph(data.name, {
      bold: true,
      size: 32,
      spacingAfter: 80,
      alignment: AlignmentType.CENTER,
    }),
  ];

  if (data.title?.trim()) {
    children.push(
      paragraph(data.title.trim(), {
        size: 24,
        spacingAfter: 80,
        alignment: AlignmentType.CENTER,
      })
    );
  }

  const contactLine = buildContactLine(data);
  if (contactLine) {
    children.push(
      paragraph(contactLine, {
        size: 18,
        spacingAfter: 240,
        alignment: AlignmentType.CENTER,
      })
    );
  }

  if (data.summary?.trim()) {
    children.push(sectionHeading('Summary'));
    children.push(paragraph(data.summary.trim(), { spacingAfter: 220 }));
  }

  if (data.experiences.length > 0) {
    children.push(sectionHeading('Experience'));
    data.experiences.forEach((experience) => {
      children.push(
        paragraph(experience.role, {
          bold: true,
          size: 24,
          heading: HeadingLevel.HEADING_2,
          spacingAfter: 60,
        })
      );

      const meta = metaLine(
        experience.company,
        experience.timeline,
        experience.location
      );
      if (meta) {
        children.push(
          paragraph(meta, {
            italics: true,
            size: 19,
            spacingAfter: 80,
          })
        );
      }

      if (experience.description?.trim()) {
        children.push(
          paragraph(experience.description.trim(), { spacingAfter: 100 })
        );
      }

      experience.achievements.forEach((achievement) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: achievement, size: 21, font: RESUME_FONT }),
            ],
          })
        );
      });

      if (experience.technologies.length > 0) {
        children.push(
          paragraph(`Technologies: ${experience.technologies.join(', ')}`, {
            size: 19,
            spacingAfter: 180,
          })
        );
      }
    });
  }

  if (data.skills.length > 0) {
    children.push(sectionHeading('Skills'));
    data.skills.forEach((group) => {
      if (group.skills.length === 0) return;
      children.push(
        paragraph(`${group.category}: ${group.skills.join(', ')}`, {
          spacingAfter: 80,
        })
      );
    });
  }

  if (data.education && data.education.length > 0) {
    children.push(sectionHeading('Education'));
    data.education.forEach((education) => {
      children.push(
        paragraph(education.degree, {
          bold: true,
          size: 22,
          spacingAfter: 60,
        })
      );

      const meta = metaLine(
        education.institution,
        education.timeline,
        education.location
      );
      if (meta) {
        children.push(paragraph(meta, { size: 20, spacingAfter: 100 }));
      }
    });
  }

  const doc = new Document({
    creator: data.name,
    title: `${data.name} Resume`,
    description: data.summary,
    styles: {
      default: {
        document: {
          run: { font: RESUME_FONT },
        },
      },
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toArrayBuffer(doc);
}
