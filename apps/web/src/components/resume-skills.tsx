import { AnimatedSection } from '@/components/animated-section';
import type { ResumeSkill } from '@/hooks/use-resume-filter';

interface ResumeSkillsProps {
  skills: ResumeSkill[];
}

export function ResumeSkills({ skills }: ResumeSkillsProps) {
  return (
    <section>
      <AnimatedSection animationType="header">
        <h2 className="text-foreground mb-8 text-3xl font-light">skills</h2>
      </AnimatedSection>
      <div className="grid gap-8 md:grid-cols-2">
        {skills.map((skillCategory, index) => (
          <AnimatedSection
            key={skillCategory.category}
            animationType="card"
            delay={index % 2 === 0 ? 200 : 400}
          >
            <div className="space-y-3">
              <h3 className="text-foreground font-light">
                {skillCategory.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillCategory.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-primary/10 text-primary rounded-lg px-3 py-2 text-sm font-light"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
