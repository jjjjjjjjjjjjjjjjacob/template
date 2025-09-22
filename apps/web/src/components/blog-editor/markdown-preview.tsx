import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MarkdownImage } from '../blog/blog-inline-image';
import { loadRemarkPlugins, loadRehypePlugins } from '../blog/remark-plugins';

// Lazy load the syntax highlighter component
const CodeBlock = React.lazy(() => import('../blog/syntax-highlighter'));

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({
  content,
  className,
}: MarkdownPreviewProps) {
  const [plugins, setPlugins] = React.useState<{
    remarkPlugins: any[];
    rehypePlugins: any[];
  }>({
    remarkPlugins: [],
    rehypePlugins: [],
  });

  React.useEffect(() => {
    const loadPlugins = async () => {
      const [remarkPlugins, rehypePlugins] = await Promise.all([
        loadRemarkPlugins(),
        loadRehypePlugins(),
      ]);

      setPlugins({
        remarkPlugins: [
          remarkPlugins.remarkGfm,
          remarkPlugins.remarkInlineImages,
        ],
        rehypePlugins: [rehypePlugins.rehypeRaw],
      });
    };

    loadPlugins();
  }, []);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={plugins.remarkPlugins}
        rehypePlugins={plugins.rehypePlugins}
        components={{
          code({ children, className, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <React.Suspense
                fallback={
                  <pre className="overflow-auto rounded-lg bg-gray-900 p-4 text-gray-100">
                    <code>{String(children).replace(/\n$/, '')}</code>
                  </pre>
                }
              >
                <CodeBlock language={match[1]} className={className}>
                  {String(children).replace(/\n$/, '')}
                </CodeBlock>
              </React.Suspense>
            ) : (
              <code
                className={`${className} rounded bg-gray-200 px-1 py-0.5 text-sm dark:bg-gray-800`}
                {...props}
              >
                {children}
              </code>
            );
          },
          img: ({ src, alt, ...props }) => (
            <MarkdownImage src={src || ''} alt={alt} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
