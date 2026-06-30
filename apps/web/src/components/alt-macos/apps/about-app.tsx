import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

interface Skill {
  category: string;
  skills: string[];
  proficiency: string;
}

interface AboutAppProps {
  name: string;
  title: string;
  skills: Skill[];
}

function mapSkillsToSpecs(skills: Skill[]) {
  const specs: Array<{ label: string; value: string }> = [];

  const findCategory = (search: string) =>
    skills.find((skill) => skill.category.toLowerCase().includes(search));

  const languages = findCategory('language') || findCategory('core');
  if (languages) {
    specs.push({
      label: 'Processor',
      value: languages.skills.slice(0, 4).join(', '),
    });
  }

  const frameworks = findCategory('framework') || findCategory('frontend');
  if (frameworks) {
    specs.push({
      label: 'Memory',
      value: frameworks.skills.slice(0, 4).join(', '),
    });
  }

  const databases = findCategory('database') || findCategory('data');
  if (databases) {
    specs.push({
      label: 'Storage',
      value: databases.skills.slice(0, 4).join(', '),
    });
  }

  const infra =
    findCategory('infrastructure') ||
    findCategory('devops') ||
    findCategory('cloud');
  if (infra) {
    specs.push({
      label: 'Network',
      value: infra.skills.slice(0, 4).join(', '),
    });
  }

  const graphics =
    findCategory('graphic') || findCategory('3d') || findCategory('visual');
  if (graphics) {
    specs.push({
      label: 'Graphics',
      value: graphics.skills.slice(0, 4).join(', '),
    });
  }

  const tools = findCategory('tool') || findCategory('workflow');
  if (tools) {
    specs.push({
      label: 'Peripherals',
      value: tools.skills.slice(0, 4).join(', '),
    });
  }

  if (specs.length === 0) {
    skills.slice(0, 5).forEach((skill) => {
      specs.push({
        label: skill.category,
        value: skill.skills.slice(0, 4).join(', '),
      });
    });
  }

  return specs;
}

function proficiencyScore(proficiency: string) {
  const normalized = proficiency.toLowerCase();
  if (normalized.includes('expert')) return 95;
  if (normalized.includes('advanced')) return 84;
  if (normalized.includes('intermediate')) return 68;
  if (normalized.includes('beginner')) return 46;
  return 72;
}

export function AboutApp({ name, title, skills }: AboutAppProps) {
  const specs = mapSkillsToSpecs(skills);
  const featuredSkills = skills.flatMap((skill) => skill.skills).slice(0, 8);
  const preferencePanes = skills.slice(0, 6);

  return (
    <MacScrollArea
      className="h-full"
      viewportClassName="px-6 py-5"
      style={{
        background:
          'linear-gradient(180deg, #eef2f7 0%, #dbe1e8 38%, #f8fafc 100%)',
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div
          className="overflow-hidden rounded-[18px] border"
          style={{
            borderColor: '#adb7c2',
            background: 'rgba(255,255,255,0.92)',
            boxShadow:
              '0 18px 40px rgba(67,86,106,0.16), 0 1px 0 rgba(255,255,255,0.85) inset',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              background:
                'linear-gradient(180deg, #f6f7f9 0%, #d8dde4 48%, #c5ccd5 100%)',
              borderBottom: '1px solid #aeb7c1',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-[74px] w-[74px] items-center justify-center rounded-[16px]"
                style={{
                  background:
                    'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 28%, rgba(201,214,228,0.9) 70%, rgba(167,181,197,0.95) 100%)',
                  border: '1px solid rgba(131,148,166,0.55)',
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 20px rgba(80,97,116,0.16)',
                }}
              >
                <img
                  src="/os-x/settings.png"
                  alt="Mac OS X"
                  width={54}
                  height={54}
                  draggable={false}
                />
              </div>

              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.24em] uppercase"
                  style={{ color: '#76808b' }}
                >
                  System Settings
                </p>
                <h2
                  className="mt-1 text-[28px] font-medium"
                  style={{ color: '#2a2f35' }}
                >
                  Leopard Workstation
                </h2>
                <p className="text-[13px]" style={{ color: '#737d88' }}>
                  Version 10.5.8 for {name}
                </p>
              </div>
            </div>

            <div
              className="rounded-[14px] px-4 py-3 text-right"
              style={{
                background: 'rgba(255,255,255,0.62)',
                border: '1px solid rgba(171,183,197,0.78)',
              }}
            >
              <p
                className="text-[10px] font-bold tracking-wider uppercase"
                style={{ color: '#7c8791' }}
              >
                Profile
              </p>
              <p
                className="mt-1 text-[15px] font-semibold"
                style={{ color: '#36404a' }}
              >
                {title}
              </p>
              <p className="text-[11px]" style={{ color: '#86919b' }}>
                Build tuned for product, design, and shipping.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div
                className="rounded-[16px] border px-4 py-4"
                style={{
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #eff4f8 100%)',
                  borderColor: '#ccd5df',
                }}
              >
                <p
                  className="text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: '#7a8590' }}
                >
                  Overview
                </p>
                <div className="mt-3 space-y-3 text-[12px]">
                  <div>
                    <p style={{ color: '#8a94a0' }}>Computer Name</p>
                    <p className="font-semibold" style={{ color: '#30363d' }}>
                      {name}&apos;s PowerBook
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#8a94a0' }}>Primary Role</p>
                    <p className="font-semibold" style={{ color: '#30363d' }}>
                      {title}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#8a94a0' }}>Current Mood</p>
                    <p className="font-semibold" style={{ color: '#30363d' }}>
                      Shipping with unreasonable optimism
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[16px] border px-4 py-4"
                style={{
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #f4f6f9 100%)',
                  borderColor: '#ccd5df',
                }}
              >
                <p
                  className="text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: '#7a8590' }}
                >
                  Favorite Services
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {featuredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full px-2 py-[3px] text-[10px]"
                      style={{
                        background:
                          'linear-gradient(180deg, #f9fcff 0%, #e4edf7 100%)',
                        border: '1px solid #c4d1de',
                        color: '#47637c',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="overflow-hidden rounded-[16px] border"
                style={{ borderColor: '#ccd5df' }}
              >
                <div
                  className="grid grid-cols-[132px_minmax(0,1fr)] px-4 py-2"
                  style={{
                    background:
                      'linear-gradient(180deg, #f8fafc 0%, #dde5ee 100%)',
                    borderBottom: '1px solid #ccd5df',
                  }}
                >
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase"
                    style={{ color: '#7a8590' }}
                  >
                    Hardware
                  </span>
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase"
                    style={{ color: '#7a8590' }}
                  >
                    Installed
                  </span>
                </div>

                {specs.map((spec, index) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-[132px_minmax(0,1fr)] px-4 py-3 text-[12px]"
                    style={{
                      background: index % 2 === 0 ? '#ffffff' : '#f6f9fc',
                      borderBottom:
                        index === specs.length - 1
                          ? 'none'
                          : '1px solid #e2e8ef',
                    }}
                  >
                    <span style={{ color: '#7e8893' }}>{spec.label}</span>
                    <span style={{ color: '#2f353b' }}>{spec.value}</span>
                  </div>
                ))}
              </div>

              <div
                className="rounded-[16px] border p-4"
                style={{
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #f5f8fb 100%)',
                  borderColor: '#ccd5df',
                }}
              >
                <p
                  className="mb-3 text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: '#7a8590' }}
                >
                  Preference Panes
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {preferencePanes.map((skillGroup) => {
                    const score = proficiencyScore(skillGroup.proficiency);
                    return (
                      <div
                        key={skillGroup.category}
                        className="rounded-[14px] border p-3"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(236,242,248,0.95) 100%)',
                          borderColor: '#d4dde7',
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p
                            className="text-[12px] font-semibold"
                            style={{ color: '#37404a' }}
                          >
                            {skillGroup.category}
                          </p>
                          <span
                            className="text-[10px]"
                            style={{ color: '#8994a0' }}
                          >
                            {skillGroup.proficiency}
                          </span>
                        </div>

                        <div
                          className="mb-2 h-[8px] overflow-hidden rounded-full"
                          style={{ background: '#dbe4ec' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              background:
                                'linear-gradient(180deg, #9fd0ff 0%, #4c8fdb 100%)',
                            }}
                          />
                        </div>

                        <div className="space-y-1">
                          {skillGroup.skills.slice(0, 4).map((skill) => (
                            <div
                              key={skill}
                              className="flex items-center gap-2 text-[11px]"
                              style={{ color: '#536170' }}
                            >
                              <span
                                className="inline-block rounded-full"
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  background: '#7ba3d6',
                                }}
                              />
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MacScrollArea>
  );
}
