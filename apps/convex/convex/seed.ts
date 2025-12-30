import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { internal } from './_generated/api';

export const seed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.seed.resume.seedAllResumes, {});
    await ctx.runMutation(
      internal.seed.portfolioProjects.seedPortfolioProjects,
      {}
    );
    return null;
  },
});
