import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { replaceProfilesData } from '../resume';
import { resumeProfiles, resumeProjects, resumeSkills } from '../resumeData';

export const seedAllResumes = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await replaceProfilesData(ctx, {
      profiles: resumeProfiles.map((profile) => ({
        ...profile,
        contact: {
          email: undefined,
          ...profile.contact,
        },
      })),
      projects: resumeProjects,
      skills: resumeSkills,
    });

    return null;
  },
});
