import { Calendar, MapPin } from 'lucide-react';
import { AnimatedSection } from '@/components/animated-section';

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  timeline: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

interface ResumeExperienceProps {
  experiences: ExperienceItem[];
}

export function ResumeExperience({ experiences }: ResumeExperienceProps) {
  return (
    <section>
      <AnimatedSection animationType="header">
        <h2 className="text-foreground mb-8 text-3xl font-light">experience</h2>
      </AnimatedSection>
      <div className="space-y-12">
        {experiences.map((experience, index) => (
          <AnimatedSection key={index} animationType="card" delay={index * 150}>
            <div className="border-primary/20 relative border-l-2 pl-8">
              <div className="bg-primary absolute top-0 -left-2 h-4 w-4 rounded-full"></div>

              <div className="mb-6 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-foreground text-xl font-light">
                      {experience.role}
                    </h3>
                    <p className="text-primary text-lg font-light">
                      {experience.company}
                    </p>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="leading-none">
                        {experience.timeline}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {experience.location}
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground">
                  {experience.description}
                </p>

                <div>
                  <h4 className="text-foreground mb-2 font-light">
                    key achievements
                  </h4>
                  <ul className="space-y-1">
                    {experience.achievements.map(
                      (achievement, achievementIndex) => (
                        <li
                          key={achievementIndex}
                          className="text-muted-foreground flex items-start gap-2 text-sm"
                        >
                          <span className="bg-primary mt-2 h-1 w-1 flex-shrink-0 rounded-full" />
                          {achievement}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="text-foreground mb-2 font-light">
                    technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {experience.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-light"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
