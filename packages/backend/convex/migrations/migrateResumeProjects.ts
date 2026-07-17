import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';

export const analyzeCurrentState = internalQuery({
  args: {},
  handler: async (ctx) => {
    const resumeProjects = await ctx.db.query('resume_projects').collect();
    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .collect();
    const junctionRecords = await ctx.db
      .query('resume_profile_projects')
      .collect();

    const projectsWithAchievements = portfolioProjects.filter(
      (p) => p.achievements && p.achievements.length > 0
    );

    return {
      resumeProjectsCount: resumeProjects.length,
      portfolioProjectsCount: portfolioProjects.length,
      junctionRecordsCount: junctionRecords.length,
      projectsWithAchievementsCount: projectsWithAchievements.length,
      resumeProjects: resumeProjects.map((rp) => ({
        profileSlug: rp.profileSlug,
        projectId: rp.projectId,
        achievementsCount: rp.achievements.length,
        includedCount: rp.achievements.filter((a) => a.included !== false)
          .length,
      })),
    };
  },
});

export const migrateStep1_EnrichPortfolioProjects = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
    details: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const details: string[] = [];
    let migrated = 0;
    let skipped = 0;

    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .collect();
    const resumeProjects = await ctx.db.query('resume_projects').collect();

    const resumeBySlug = new Map<string, Array<(typeof resumeProjects)[0]>>();
    for (const rp of resumeProjects) {
      const existing = resumeBySlug.get(rp.projectId) || [];
      existing.push(rp);
      resumeBySlug.set(rp.projectId, existing);
    }

    for (const portfolio of portfolioProjects) {
      if (portfolio.achievements && portfolio.achievements.length > 0) {
        details.push(
          `SKIPPED ${portfolio.slug}: already has ${portfolio.achievements.length} achievements`
        );
        skipped++;
        continue;
      }

      const resumeVersions = resumeBySlug.get(portfolio.slug);
      if (!resumeVersions || resumeVersions.length === 0) {
        if (
          portfolio.responsibilities &&
          portfolio.responsibilities.length > 0
        ) {
          const achievements = portfolio.responsibilities.map((r, i) => ({
            description: r,
            impact: undefined,
            technologies: [],
            domains: [],
            type: 'development',
            priority: i,
          }));

          if (!dryRun) {
            await ctx.db.patch(portfolio._id, { achievements });
          }
          details.push(
            `CONVERTED ${portfolio.slug}: created ${achievements.length} achievements from responsibilities`
          );
          migrated++;
        } else {
          details.push(
            `SKIPPED ${portfolio.slug}: no resume data or responsibilities`
          );
          skipped++;
        }
        continue;
      }

      const richestResume = resumeVersions.reduce((best, current) =>
        current.achievements.length > best.achievements.length ? current : best
      );

      const achievements = richestResume.achievements.map((a) => ({
        description: a.description,
        impact: a.impact,
        technologies: a.technologies,
        domains: a.domains,
        type: a.type,
        priority: a.priority,
      }));

      if (!dryRun) {
        await ctx.db.patch(portfolio._id, { achievements });
      }

      details.push(
        `MIGRATED ${portfolio.slug}: enriched with ${achievements.length} achievements from resume`
      );
      migrated++;
    }

    return { migrated, skipped, details };
  },
});

export const migrateStep2_CreateJunctionRecords = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
    details: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const details: string[] = [];
    let created = 0;
    let skipped = 0;

    const resumeProjects = await ctx.db.query('resume_projects').collect();
    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .collect();
    const existingJunctions = await ctx.db
      .query('resume_profile_projects')
      .collect();

    const portfolioBySlug = new Map(portfolioProjects.map((p) => [p.slug, p]));

    const existingJunctionKeys = new Set(
      existingJunctions.map((j) => `${j.profileSlug}:${j.projectSlug}`)
    );

    const groupedByProfile = new Map<
      string,
      Array<(typeof resumeProjects)[0]>
    >();
    for (const rp of resumeProjects) {
      const existing = groupedByProfile.get(rp.profileSlug) || [];
      existing.push(rp);
      groupedByProfile.set(rp.profileSlug, existing);
    }

    for (const [profileSlug, projects] of groupedByProfile) {
      const sortedProjects = projects.sort((a, b) => b.priority - a.priority);

      for (let i = 0; i < sortedProjects.length; i++) {
        const resumeProject = sortedProjects[i];
        const junctionKey = `${profileSlug}:${resumeProject.projectId}`;

        if (existingJunctionKeys.has(junctionKey)) {
          details.push(`SKIPPED ${junctionKey}: junction already exists`);
          skipped++;
          continue;
        }

        const portfolio = portfolioBySlug.get(resumeProject.projectId);
        if (!portfolio) {
          details.push(`SKIPPED ${junctionKey}: portfolio project not found`);
          skipped++;
          continue;
        }

        const includedIndices = resumeProject.achievements
          .map((a, idx) => (a.included !== false ? idx : -1))
          .filter((idx) => idx !== -1);

        const allIncluded =
          includedIndices.length === resumeProject.achievements.length;

        if (!dryRun) {
          await ctx.db.insert('resume_profile_projects', {
            profileSlug,
            projectSlug: resumeProject.projectId,
            displayOrder: i + 1,
            achievementFilter: allIncluded ? undefined : includedIndices,
          });
        }

        details.push(
          `CREATED ${junctionKey}: displayOrder=${i + 1}, filter=${allIncluded ? 'all' : includedIndices.length}`
        );
        created++;
      }
    }

    return { created, skipped, details };
  },
});

export const migrateStep3_Verify = internalQuery({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query('resume_profiles').collect();
    const junctions = await ctx.db.query('resume_profile_projects').collect();
    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .collect();

    const verification = [];

    for (const profile of profiles) {
      const profileJunctions = junctions.filter(
        (j) => j.profileSlug === profile.slug
      );
      const linkedProjects = profileJunctions
        .map((j) => {
          const portfolio = portfolioProjects.find(
            (p) => p.slug === j.projectSlug
          );
          return {
            projectSlug: j.projectSlug,
            displayOrder: j.displayOrder,
            achievementFilter: j.achievementFilter,
            hasPortfolio: !!portfolio,
            achievementsCount: portfolio?.achievements?.length || 0,
          };
        })
        .sort((a, b) => a.displayOrder - b.displayOrder);

      verification.push({
        profileSlug: profile.slug,
        profileName: profile.name,
        linkedProjectsCount: profileJunctions.length,
        linkedProjects,
      });
    }

    const portfolioWithAchievements = portfolioProjects.filter(
      (p) => p.achievements && p.achievements.length > 0
    );

    return {
      profilesCount: profiles.length,
      junctionsCount: junctions.length,
      portfolioWithAchievementsCount: portfolioWithAchievements.length,
      profiles: verification,
    };
  },
});

export const runFullMigration = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    step1: v.object({
      migrated: v.number(),
      skipped: v.number(),
    }),
    step2: v.object({
      created: v.number(),
      skipped: v.number(),
    }),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;

    console.log(`Running migration (dryRun=${dryRun})...`);

    const portfolioProjects = await ctx.db
      .query('portfolio_projects')
      .collect();
    const resumeProjects = await ctx.db.query('resume_projects').collect();

    const resumeBySlug = new Map<string, Array<(typeof resumeProjects)[0]>>();
    for (const rp of resumeProjects) {
      const existing = resumeBySlug.get(rp.projectId) || [];
      existing.push(rp);
      resumeBySlug.set(rp.projectId, existing);
    }

    let step1Migrated = 0;
    let step1Skipped = 0;

    for (const portfolio of portfolioProjects) {
      if (portfolio.achievements && portfolio.achievements.length > 0) {
        step1Skipped++;
        continue;
      }

      const resumeVersions = resumeBySlug.get(portfolio.slug);
      if (!resumeVersions || resumeVersions.length === 0) {
        if (
          portfolio.responsibilities &&
          portfolio.responsibilities.length > 0
        ) {
          const achievements = portfolio.responsibilities.map((r, i) => ({
            description: r,
            impact: undefined,
            technologies: [],
            domains: [],
            type: 'development',
            priority: i,
          }));

          if (!dryRun) {
            await ctx.db.patch(portfolio._id, { achievements });
          }
          step1Migrated++;
        } else {
          step1Skipped++;
        }
        continue;
      }

      const richestResume = resumeVersions.reduce((best, current) =>
        current.achievements.length > best.achievements.length ? current : best
      );

      const achievements = richestResume.achievements.map((a) => ({
        description: a.description,
        impact: a.impact,
        technologies: a.technologies,
        domains: a.domains,
        type: a.type,
        priority: a.priority,
      }));

      if (!dryRun) {
        await ctx.db.patch(portfolio._id, { achievements });
      }
      step1Migrated++;
    }

    const existingJunctions = await ctx.db
      .query('resume_profile_projects')
      .collect();
    const portfolioBySlug = new Map(portfolioProjects.map((p) => [p.slug, p]));
    const existingJunctionKeys = new Set(
      existingJunctions.map((j) => `${j.profileSlug}:${j.projectSlug}`)
    );

    const groupedByProfile = new Map<
      string,
      Array<(typeof resumeProjects)[0]>
    >();
    for (const rp of resumeProjects) {
      const existing = groupedByProfile.get(rp.profileSlug) || [];
      existing.push(rp);
      groupedByProfile.set(rp.profileSlug, existing);
    }

    let step2Created = 0;
    let step2Skipped = 0;

    for (const [profileSlug, projects] of groupedByProfile) {
      const sortedProjects = projects.sort((a, b) => b.priority - a.priority);

      for (let i = 0; i < sortedProjects.length; i++) {
        const resumeProject = sortedProjects[i];
        const junctionKey = `${profileSlug}:${resumeProject.projectId}`;

        if (existingJunctionKeys.has(junctionKey)) {
          step2Skipped++;
          continue;
        }

        const portfolio = portfolioBySlug.get(resumeProject.projectId);
        if (!portfolio) {
          step2Skipped++;
          continue;
        }

        const includedIndices = resumeProject.achievements
          .map((a, idx) => (a.included !== false ? idx : -1))
          .filter((idx) => idx !== -1);

        const allIncluded =
          includedIndices.length === resumeProject.achievements.length;

        if (!dryRun) {
          await ctx.db.insert('resume_profile_projects', {
            profileSlug,
            projectSlug: resumeProject.projectId,
            displayOrder: i + 1,
            achievementFilter: allIncluded ? undefined : includedIndices,
          });
        }

        step2Created++;
      }
    }

    console.log(`Migration complete:
      Step 1 (enrich portfolio): ${step1Migrated} migrated, ${step1Skipped} skipped
      Step 2 (create junctions): ${step2Created} created, ${step2Skipped} skipped`);

    return {
      step1: { migrated: step1Migrated, skipped: step1Skipped },
      step2: { created: step2Created, skipped: step2Skipped },
      success: true,
    };
  },
});
