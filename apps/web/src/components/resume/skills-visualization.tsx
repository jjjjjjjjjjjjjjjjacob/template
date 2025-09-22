import * as React from 'react';

// Enhanced skills data with categorization and ratings
const skillCategories = {
  'Frontend Development': {
    skills: [
      'React',
      'TypeScript',
      'Next.js',
      'Vue.js',
      'Tailwind CSS',
      'Three.js',
      'Framer Motion',
    ],
    color: 'from-blue-500 to-cyan-500',
    icon: '🎨',
  },
  'Backend Development': {
    skills: [
      'Node.js',
      'Python',
      'PHP',
      'PostgreSQL',
      'Redis',
      'GraphQL',
      'REST APIs',
    ],
    color: 'from-green-500 to-emerald-500',
    icon: '⚙️',
  },
  'UI/UX Design': {
    skills: [
      'Figma',
      'Adobe Creative Suite',
      'Prototyping',
      'User Research',
      'Design Systems',
      'Accessibility',
    ],
    color: 'from-purple-500 to-pink-500',
    icon: '✨',
  },
  'DevOps & Tools': {
    skills: [
      'AWS',
      'Docker',
      'Vercel',
      'Git',
      'CI/CD',
      'Monitoring',
      'Performance Optimization',
    ],
    color: 'from-orange-500 to-red-500',
    icon: '🚀',
  },
};

// Skill proficiency levels (out of 10)
const skillLevels: Record<string, number> = {
  React: 9.5,
  TypeScript: 9.0,
  'Next.js': 8.8,
  'Vue.js': 7.5,
  'Tailwind CSS': 9.2,
  'Three.js': 7.0,
  'Framer Motion': 8.0,
  'Node.js': 8.8,
  Python: 8.5,
  PHP: 7.8,
  PostgreSQL: 8.2,
  Redis: 7.5,
  GraphQL: 8.0,
  'REST APIs': 9.0,
  Figma: 9.0,
  'Adobe Creative Suite': 8.0,
  Prototyping: 8.5,
  'User Research': 8.2,
  'Design Systems': 8.8,
  Accessibility: 8.5,
  AWS: 7.8,
  Docker: 8.0,
  Vercel: 9.0,
  Git: 9.2,
  'CI/CD': 8.2,
  Monitoring: 7.5,
  'Performance Optimization': 8.5,
};

function SkillRadar({
  skills,
  category,
}: {
  skills: string[];
  category: string;
}) {
  const categoryInfo =
    skillCategories[category as keyof typeof skillCategories];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{categoryInfo.icon}</span>
        <h3 className="text-foreground text-lg font-light">{category}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {skills.map((skill, index) => {
          const level = skillLevels[skill] || 7;
          const percentage = (level / 10) * 100;

          return (
            <div
              key={skill}
              className="group border-border/50 bg-card/50 hover:border-primary/30 relative overflow-hidden rounded-lg border p-3 transition-all duration-300 hover:shadow-sm"
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />

              {/* Content */}
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground truncate text-sm font-light">
                    {skill}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {level.toFixed(1)}
                  </span>
                </div>

                {/* Skill level indicator */}
                <div className="bg-muted h-1 overflow-hidden rounded-full">
                  <div
                    className={`h-full bg-gradient-to-r ${categoryInfo.color} transition-all duration-1000 ease-out`}
                    style={{
                      width: `${percentage}%`,
                      transitionDelay: `${index * 100 + 200}ms`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TechStackOverview() {
  const categoryStats = Object.entries(skillCategories).map(
    ([category, data]) => {
      const avgLevel =
        data.skills.reduce((sum, skill) => sum + (skillLevels[skill] || 7), 0) /
        data.skills.length;
      return {
        category,
        ...data,
        avgLevel,
        skillCount: data.skills.length,
      };
    }
  );

  return (
    <div className="space-y-6">
      <h3 className="text-foreground text-xl font-light">
        tech stack overview
      </h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categoryStats.map((category, index) => (
          <div
            key={category.category}
            className="group border-border/50 bg-card/50 hover:border-primary/30 relative overflow-hidden rounded-lg border p-4 transition-all duration-300 hover:shadow-lg"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
            />

            {/* Content */}
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{category.icon}</span>
                <div className="text-right">
                  <div className="text-foreground text-lg font-light">
                    {category.avgLevel.toFixed(1)}
                  </div>
                  <div className="text-muted-foreground text-xs">avg level</div>
                </div>
              </div>

              <div>
                <h4 className="text-foreground text-sm font-light">
                  {category.category}
                </h4>
                <p className="text-muted-foreground text-xs">
                  {category.skillCount} technologies
                </p>
              </div>

              {/* Progress indicator */}
              <div className="bg-muted h-1 overflow-hidden rounded-full">
                <div
                  className={`h-full bg-gradient-to-r ${category.color} transition-all duration-1000 ease-out`}
                  style={{
                    width: `${(category.avgLevel / 10) * 100}%`,
                    transitionDelay: `${index * 200 + 500}ms`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsVisualization() {
  return (
    <div
      className="space-y-12"
      role="region"
      aria-label="Skills visualization and tech stack"
    >
      <TechStackOverview />

      {Object.entries(skillCategories).map(([category, { skills }]) => (
        <SkillRadar key={category} skills={skills} category={category} />
      ))}
    </div>
  );
}

export default React.memo(SkillsVisualization);
