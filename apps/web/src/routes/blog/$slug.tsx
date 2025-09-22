import { createFileRoute, notFound } from '@tanstack/react-router';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@template/convex';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    try {
      // Use HTTP client for SSR to avoid WebSocket issues
      const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
      if (!CONVEX_URL) {
        throw new Error('CONVEX_URL not configured');
      }

      const httpClient = new ConvexHttpClient(CONVEX_URL);
      const post = await httpClient.query(api.blog.getBySlug, {
        slug: params.slug,
      });

      if (!post) {
        throw notFound();
      }

      return { post };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) return {};

    const post = loaderData.post;
    const baseUrl = 'https://jacob.zip'; // Update with your actual domain
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const imageUrl = post.thumbnailId
      ? `${baseUrl}/api/blog/image/${post.thumbnailId}` // Placeholder - would need actual image endpoint
      : `${baseUrl}/og-image-blog.png`; // Default blog OG image

    const description =
      post.excerpt ||
      `A blog post by ${post.authorEmail?.split('@')[0] || 'admin'}`;
    const authorName = post.authorEmail?.split('@')[0] || 'admin';

    return {
      meta: [
        // Basic meta tags
        { name: 'description', content: description },
        { name: 'author', content: authorName },

        // Open Graph meta tags
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: postUrl },
        { property: 'og:image', content: imageUrl },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:site_name', content: 'jacob.zip' },

        // Article specific Open Graph tags
        { property: 'article:author', content: authorName },
        {
          property: 'article:published_time',
          content: new Date(post.createdAt).toISOString(),
        },
        {
          property: 'article:modified_time',
          content: new Date(post.updatedAt).toISOString(),
        },
        ...(post.collection
          ? [{ property: 'article:section', content: post.collection }]
          : []),
        ...(post.projectTags || []).map((tag) => ({
          property: 'article:tag',
          content: tag,
        })),

        // Twitter Card meta tags
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: imageUrl },
        { name: 'twitter:creator', content: '@jacobzip' }, // Update with your actual Twitter handle
        { name: 'twitter:site', content: '@jacobzip' },

        // Additional SEO meta tags
        { name: 'robots', content: 'index, follow' },
        { name: 'googlebot', content: 'index, follow, snippet, archive' },
      ],
      title: `${post.title} | jacob.zip`,
    };
  },
});
