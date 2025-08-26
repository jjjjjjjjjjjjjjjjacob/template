import type { FilteredResumeData } from '@/hooks/use-resume-filter';
import { resumeProfile } from '@/data/resume-profile';

// Simple HTML to PDF export functionality
export async function exportToPDF(resumeData: FilteredResumeData) {
  // Create a new window with the resume content
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    throw new Error(
      'Unable to open print window. Please allow popups for this site.'
    );
  }

  const htmlContent = generateResumeHTML(resumeData);

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

// Generate clean HTML for resume
function generateResumeHTML(resumeData: FilteredResumeData): string {
  const { projects, skills, summary } = resumeData;
  const { personal } = resumeProfile;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${personal.name} - Resume</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-size: 14px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
          border-bottom: 2px solid #eee;
          padding-bottom: 1rem;
        }
        
        .header h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: bold;
        }
        
        .header .title {
          margin: 0.5rem 0;
          font-size: 1.2rem;
          color: #666;
        }
        
        .header .contact {
          margin-top: 1rem;
          font-size: 0.9rem;
          color: #666;
        }
        
        .section {
          margin-bottom: 2rem;
        }
        
        .section h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.5rem;
        }
        
        .project {
          margin-bottom: 1.5rem;
          page-break-inside: avoid;
        }
        
        .project-header {
          margin-bottom: 0.5rem;
        }
        
        .project-title {
          font-size: 1.1rem;
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        
        .project-meta {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        
        .project-description {
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        
        .achievements {
          margin-bottom: 0.75rem;
        }
        
        .achievements ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .achievements li {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }
        
        .technologies {
          margin-top: 0.5rem;
        }
        
        .technologies .label {
          font-weight: bold;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
        }
        
        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        
        .tech-tag {
          background: #f0f0f0;
          padding: 0.2rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
          color: #555;
        }
        
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }
        
        .skill-category {
          margin-bottom: 1rem;
        }
        
        .skill-category h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        
        .skill-tag {
          background: #e6f3ff;
          color: #0066cc;
          padding: 0.2rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
        
        @media print {
          body { 
            padding: 1rem;
            font-size: 12px;
          }
          .header h1 { font-size: 2rem; }
          .section h2 { font-size: 1.3rem; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${personal.name}</h1>
        <div class="title">${personal.title}</div>
        ${personal.contact.website ? `<div class="contact">${personal.contact.website}</div>` : ''}
      </div>
      
      <div class="section">
        <h2>Summary</h2>
        <p>${summary}</p>
      </div>
      
      <div class="section">
        <h2>Experience</h2>
        ${projects
          .map(
            (project) => `
          <div class="project">
            <div class="project-header">
              <div class="project-title">${project.title}</div>
              <div class="project-meta">${project.role} • ${project.timeline}</div>
            </div>
            <div class="project-description">${project.description}</div>
            
            <div class="achievements">
              <div class="label">Key Achievements:</div>
              <ul>
                ${project.achievements
                  .slice(0, 6)
                  .map(
                    (achievement) => `
                  <li>${achievement.description}</li>
                `
                  )
                  .join('')}
              </ul>
            </div>
            
            <div class="technologies">
              <div class="label">Technologies:</div>
              <div class="tech-tags">
                ${[
                  ...project.technologies.frontend,
                  ...project.technologies.backend,
                  ...project.technologies.infrastructure,
                ]
                  .slice(0, 10)
                  .map(
                    (tech) => `
                  <span class="tech-tag">${tech}</span>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      
      <div class="section">
        <h2>Skills</h2>
        <div class="skills-grid">
          ${skills
            .map(
              (skillCategory) => `
            <div class="skill-category">
              <h3>${skillCategory.category}</h3>
              <div class="skill-tags">
                ${skillCategory.skills
                  .map(
                    (skill) => `
                  <span class="skill-tag">${skill}</span>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate URL for sharing filtered resume
export function generateShareableURL(
  filters: Record<string, string | string[] | number | boolean>
): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== 'format') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value.toString());
      }
    }
  });

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

// Copy resume content as formatted text
export async function copyResumeText(
  resumeData: FilteredResumeData
): Promise<void> {
  const { projects, skills, summary } = resumeData;
  const { personal } = resumeProfile;

  const textContent = `
${personal.name}
${personal.title}
${personal.contact.website || ''}

SUMMARY
${summary}

EXPERIENCE
${projects
  .map(
    (project) => `
${project.title}
${project.role} • ${project.timeline}
${project.description}

Key Achievements:
${project.achievements
  .slice(0, 6)
  .map((achievement) => `• ${achievement.description}`)
  .join('\n')}

Technologies: ${[
      ...project.technologies.frontend,
      ...project.technologies.backend,
      ...project.technologies.infrastructure,
    ]
      .slice(0, 10)
      .join(', ')}
`
  )
  .join('\n---\n')}

SKILLS
${skills
  .map(
    (skillCategory) => `
${skillCategory.category}
${skillCategory.skills.join(', ')}
`
  )
  .join('\n')}
  `.trim();

  await navigator.clipboard.writeText(textContent);
}
