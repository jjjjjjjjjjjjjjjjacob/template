// Lazy load the remark plugins to avoid bundling them in the main chunk
export const loadRemarkPlugins = async () => {
  const [remarkGfm, remarkInlineImages] = await Promise.all([
    import('remark-gfm').then((module) => module.default),
    import('../../lib/remark-inline-images').then(
      (module) => module.remarkInlineImages
    ),
  ]);

  return { remarkGfm, remarkInlineImages };
};

export const loadRehypePlugins = async () => {
  const rehypeRaw = await import('rehype-raw').then((module) => module.default);
  return { rehypeRaw };
};
