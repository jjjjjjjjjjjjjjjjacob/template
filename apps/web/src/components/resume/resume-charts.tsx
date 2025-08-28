import * as React from 'react';

// Mock chart data (in a real app, this would come from your data source)
const chartData = {
  skillsProgress: [
    { skill: 'React/TypeScript', level: 95, color: 'bg-blue-500' },
    { skill: 'Node.js/Python', level: 90, color: 'bg-green-500' },
    { skill: 'UI/UX Design', level: 85, color: 'bg-purple-500' },
    { skill: 'DevOps/Cloud', level: 80, color: 'bg-orange-500' },
    { skill: 'Team Leadership', level: 88, color: 'bg-pink-500' },
  ],
  experienceYears: [
    { year: '2019', projects: 8, clients: 12 },
    { year: '2020', projects: 15, clients: 18 },
    { year: '2021', projects: 22, clients: 25 },
    { year: '2022', projects: 18, clients: 20 },
    { year: '2023', projects: 25, clients: 28 },
    { year: '2024', projects: 20, clients: 22 },
  ],
};

function SkillsChart() {
  return (
    <div className="space-y-4">
      <h3 className="text-foreground text-lg font-semibold">
        skills proficiency
      </h3>
      <div className="space-y-4">
        {chartData.skillsProgress.map((skill, index) => (
          <div key={skill.skill} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">{skill.skill}</span>
              <span className="text-muted-foreground">{skill.level}%</span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className={`h-full transition-all duration-1000 ease-out ${skill.color}`}
                style={{
                  width: `${skill.level}%`,
                  transitionDelay: `${index * 100}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceChart() {
  const maxProjects = Math.max(
    ...chartData.experienceYears.map((d) => d.projects)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-foreground text-lg font-semibold">
        project timeline
      </h3>
      <div className="space-y-6">
        <div className="flex h-48 items-end justify-between gap-2">
          {chartData.experienceYears.map((year, index) => (
            <div
              key={year.year}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full flex-col items-center gap-1">
                {/* Projects Bar */}
                <div className="bg-muted relative w-full overflow-hidden rounded-t-sm">
                  <div
                    className="bg-primary transition-all duration-1000 ease-out"
                    style={{
                      height: `${(year.projects / maxProjects) * 160}px`,
                      transitionDelay: `${index * 150}ms`,
                    }}
                  />
                </div>

                {/* Values */}
                <div className="space-y-1 text-center">
                  <div className="text-muted-foreground text-xs">
                    {year.projects} projects
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {year.clients} clients
                  </div>
                </div>
              </div>

              {/* Year Label */}
              <div className="text-foreground text-sm font-medium">
                {year.year}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="text-muted-foreground flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="bg-primary h-2 w-4 rounded" />
            <span>Projects Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted h-2 w-4 rounded" />
            <span>Client Base</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeCharts() {
  return (
    <div
      className="space-y-12"
      role="region"
      aria-label="Resume analytics and charts"
    >
      <SkillsChart />
      <ExperienceChart />
    </div>
  );
}

export default React.memo(ResumeCharts);
