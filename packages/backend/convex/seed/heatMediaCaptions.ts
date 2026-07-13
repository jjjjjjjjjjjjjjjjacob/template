import { v } from 'convex/values';
import { internalMutation } from '../_generated/server';

// Per-example copy for the HEAT.tech portfolio project, keyed by the media
// item's `order`. Stored with real newlines so the site "work cited" media
// list renders each numbered point on its own line (whitespace-pre-line).
const captionsByOrder: Record<number, string> = {
  0: `The 3D model & animation viewport required overcoming several challenges in a pre-Opus-4.5/GPT-5.3 world:
1) A custom Three.js loader that handles both FBX & GLTF formats
2) A dynamic loader that uses suspense in @react-three/fiber to smoothly block both animation & model switching, communicating progress to the user
3) An adjustable camera that zooms and resizes the visible area based on model size
4) A follow-cam locked to the hips
5) Scrubbable timeline that loops
6) Selecting animation & model data on the fly and swapping it out seamlessly`,
  1: `The auto-rig was HEAT's crown jewel. The founders believed the proprietary Inverse Kinematics system we developed could disrupt Autodesk's industry standard. This feature allowed users to rig any model and apply it to our animation system. Notable UI challenges:
1) Juggling between isometric & perspective cameras & bootstrapping a togglable @react-three/fiber OrbitControls similar to Blender's that works in both views
2) Realtime skeleton visualization & joint adjustment via multi-axis drag & click, as well as slider adjustment
3) Popups, tooltips, and helpful graphics to bring simplicity to a multi-click, semi-complicated process
4) Chunked file upload allowed model files up to 500mb`,
  2: `The meat & potatoes of HEAT, a power-user's most important workflow.
1) Multi-threaded retargeting that handles FBXs, GLTFs
2) Global & thread-specific processing & progress indication
3) Real-time editing of animations (repositioning, rotation, limb adjustments)
4) Multi-threaded & chunked upload allows concurrent processing of animation files up to 5 minutes each, for up to 1000 files at a time via Web Workers
5) Local & cloud drafting
6) Video upload via Move AI`,
  3: `This tied it all together.
1) Vector search, count-aware filtering, full-feature sort
2) Purchase & subscription-aware product cards with purchase or subscription CTAs
3) Multi-size layout (small & large cards, list view)`,
};

export const seedHeatMediaCaptions = internalMutation({
  args: {},
  returns: v.object({
    status: v.string(),
    totalMedia: v.number(),
    matched: v.number(),
    mapping: v.array(
      v.object({
        order: v.number(),
        type: v.string(),
        url: v.optional(v.string()),
        captionPreview: v.string(),
      })
    ),
  }),
  handler: async (ctx) => {
    const project = await ctx.db
      .query('portfolio_projects')
      .withIndex('by_slug', (q) => q.eq('slug', 'heat-tech'))
      .unique();

    if (!project) {
      return {
        status: 'heat-tech project not found',
        totalMedia: 0,
        matched: 0,
        mapping: [],
      };
    }

    let matched = 0;
    const media = project.media.map((m) => {
      const caption = captionsByOrder[m.order];
      if (caption !== undefined) {
        matched++;
        return { ...m, caption };
      }
      return m;
    });

    await ctx.db.patch(project._id, { media, updatedAt: Date.now() });

    const mapping = [...media]
      .sort((a, b) => a.order - b.order)
      .map((m) => ({
        order: m.order,
        type: m.type,
        url: m.url,
        captionPreview: (m.caption ?? '').slice(0, 60),
      }));

    return {
      status: 'ok',
      totalMedia: project.media.length,
      matched,
      mapping,
    };
  },
});
