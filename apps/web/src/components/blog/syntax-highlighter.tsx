import React from 'react';

// Dynamically import the syntax highlighter only when needed
const SyntaxHighlighter = React.lazy(() =>
  import('react-syntax-highlighter').then((module) => ({
    default: module.Prism as React.ComponentType<any>,
  }))
);

interface CodeBlockProps {
  language: string;
  children: string;
  className?: string;
}

export default function CodeBlock({
  language,
  children,
  className,
}: CodeBlockProps) {
  const [style, setStyle] = React.useState<any>(null);

  React.useEffect(() => {
    // Load the style dynamically
    import('react-syntax-highlighter/dist/esm/styles/prism').then((module) => {
      setStyle(module.oneDark);
    });
  }, []);

  if (!style) {
    return (
      <pre
        className={`${className} overflow-auto rounded-lg bg-gray-900 p-4 text-gray-100`}
      >
        <code>{children}</code>
      </pre>
    );
  }

  return (
    <React.Suspense
      fallback={
        <pre
          className={`${className} overflow-auto rounded-lg bg-gray-900 p-4 text-gray-100`}
        >
          <code>{children}</code>
        </pre>
      }
    >
      <SyntaxHighlighter
        style={style}
        language={language}
        PreTag="div"
        customStyle={{
          background: '#1e1e1e',
          borderRadius: '0.375rem',
          padding: '1rem',
          margin: '1rem 0',
          fontSize: '0.875rem',
          overflow: 'auto',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </React.Suspense>
  );
}
