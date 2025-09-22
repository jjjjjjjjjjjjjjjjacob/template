import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/blog/')({
  head: () => ({
    title: 'Blog | jacob.zip',
    meta: [
      {
        name: 'description',
        content:
          'Thoughts, projects, and technical writing from jacob. Full-stack development, design patterns, and technology insights.',
      },
      { name: 'author', content: 'jacob' },

      // Open Graph meta tags
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'Blog | jacob.zip' },
      {
        property: 'og:description',
        content:
          'Thoughts, projects, and technical writing from jacob. Full-stack development, design patterns, and technology insights.',
      },
      { property: 'og:url', content: 'https://jacob.zip/blog' },
      { property: 'og:image', content: 'https://jacob.zip/og-image-blog.png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: 'jacob.zip' },

      // Twitter Card meta tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Blog | jacob.zip' },
      {
        name: 'twitter:description',
        content: 'Thoughts, projects, and technical writing from jacob.',
      },
      { name: 'twitter:image', content: 'https://jacob.zip/og-image-blog.png' },
      { name: 'twitter:creator', content: '@jacobzip' },
      { name: 'twitter:site', content: '@jacobzip' },

      // Additional SEO meta tags
      { name: 'robots', content: 'index, follow' },
      { name: 'googlebot', content: 'index, follow, snippet, archive' },
    ],
  }),
});
