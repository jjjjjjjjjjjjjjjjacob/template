import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';

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
