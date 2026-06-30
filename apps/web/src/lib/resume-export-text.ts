import type { ResumeData } from '@/hooks/use-story-canvas';

const SEPARATOR = ' | ';

function cleanUrl(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function buildContactParts(data: ResumeData): string[] {
  const parts: string[] = [];
  if (data.contact.email) parts.push(data.contact.email);
  if (data.contact.phone) parts.push(data.contact.phone);
  if (data.location) parts.push(data.location);
  if (data.contact.website) parts.push(cleanUrl(data.contact.website));
  if (data.contact.github) parts.push(cleanUrl(data.contact.github));
  if (data.contact.linkedin) parts.push(cleanUrl(data.contact.linkedin));
  return parts;
}

function metaLine(...parts: Array<string | undefined>): string {
  return parts.filter((part) => Boolean(part && part.trim())).join(SEPARATOR);
}

export function buildResumeMarkdown(data: ResumeData): string {
  const lines: string[] = [];

  lines.push(`# ${data.name}`);
  if (data.title?.trim()) lines.push(data.title.trim());

  const contactParts = buildContactParts(data);
  if (contactParts.length > 0) {
    lines.push('');
    lines.push(contactParts.join(SEPARATOR));
  }

  if (data.summary?.trim()) {
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(data.summary.trim());
  }

  if (data.experiences.length > 0) {
    lines.push('');
    lines.push('## Experience');
    data.experiences.forEach((exp) => {
      lines.push('');
      lines.push(`### ${exp.role}`);
      const meta = metaLine(exp.company, exp.timeline, exp.location);
      if (meta) lines.push(meta);
      if (exp.description?.trim()) {
        lines.push('');
        lines.push(exp.description.trim());
      }
      if (exp.achievements.length > 0) {
        lines.push('');
        lines.push('**Key Achievements:**');
        exp.achievements.forEach((achievement) => {
          lines.push(`- ${achievement}`);
        });
      }
      if (exp.technologies.length > 0) {
        lines.push('');
        lines.push(`**Technologies:** ${exp.technologies.join(', ')}`);
      }
    });
  }

  if (data.skills.length > 0) {
    lines.push('');
    lines.push('## Skills');
    lines.push('');
    data.skills.forEach((group) => {
      if (group.skills.length === 0) return;
      lines.push(`- **${group.category}:** ${group.skills.join(', ')}`);
    });
  }

  if (data.education && data.education.length > 0) {
    lines.push('');
    lines.push('## Education');
    data.education.forEach((edu) => {
      lines.push('');
      lines.push(`### ${edu.degree}`);
      const meta = metaLine(edu.institution, edu.timeline, edu.location);
      if (meta) lines.push(meta);
    });
  }

  return `${lines.join('\n').trim()}\n`;
}

export function buildResumePlainText(data: ResumeData): string {
  const lines: string[] = [];

  lines.push(data.name);
  if (data.title?.trim()) lines.push(data.title.trim());

  const contactParts = buildContactParts(data);
  if (contactParts.length > 0) {
    lines.push(contactParts.join(SEPARATOR));
  }

  if (data.summary?.trim()) {
    lines.push('');
    lines.push('SUMMARY');
    lines.push(data.summary.trim());
  }

  if (data.experiences.length > 0) {
    lines.push('');
    lines.push('EXPERIENCE');
    data.experiences.forEach((exp) => {
      lines.push('');
      lines.push(exp.role);
      const meta = metaLine(exp.company, exp.timeline, exp.location);
      if (meta) lines.push(meta);
      if (exp.description?.trim()) {
        lines.push(exp.description.trim());
      }
      if (exp.achievements.length > 0) {
        lines.push('Key Achievements:');
        exp.achievements.forEach((achievement) => {
          lines.push(`- ${achievement}`);
        });
      }
      if (exp.technologies.length > 0) {
        lines.push(`Technologies: ${exp.technologies.join(', ')}`);
      }
    });
  }

  if (data.skills.length > 0) {
    lines.push('');
    lines.push('SKILLS');
    data.skills.forEach((group) => {
      if (group.skills.length === 0) return;
      lines.push(`${group.category}: ${group.skills.join(', ')}`);
    });
  }

  if (data.education && data.education.length > 0) {
    lines.push('');
    lines.push('EDUCATION');
    data.education.forEach((edu) => {
      lines.push('');
      lines.push(edu.degree);
      const meta = metaLine(edu.institution, edu.timeline, edu.location);
      if (meta) lines.push(meta);
    });
  }

  return `${lines.join('\n').trim()}\n`;
}
