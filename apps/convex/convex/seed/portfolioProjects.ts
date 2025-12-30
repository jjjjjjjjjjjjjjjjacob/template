import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

export const seedPortfolioProjects = internalMutation({
  args: {},
  returns: v.null(),
  handler: async () => {
    console.log(
      'Portfolio project seeding disabled - data now managed through admin UI. See resumeData.reference.ts for original seed data structure.'
    );
    return null;
  },
});
