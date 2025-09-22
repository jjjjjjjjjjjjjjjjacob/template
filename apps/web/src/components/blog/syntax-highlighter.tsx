import React from 'react';

// Essential languages only - will register dynamically
const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'jsx', 'tsx', 'css', 'html', 'json',
  'bash', 'python', 'java', 'go', 'rust', 'sql', 'yaml', 'markdown'
];

// Dynamically import PrismLight for better bundle size
const PrismLight = React.lazy(() =>
  import('react-syntax-highlighter/dist/esm/prism-light').then((module) => ({
    default: module.default,
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
  const [highlighterReady, setHighlighterReady] = React.useState(false);
  const [style, setStyle] = React.useState<any>(null);

  React.useEffect(() => {
    const loadLanguageAndStyle = async () => {
      try {
        // Load style
        const styleModule = await import('react-syntax-highlighter/dist/esm/styles/prism/one-dark');
        setStyle(styleModule.default);

        // Load only if language is supported
        if (SUPPORTED_LANGUAGES.includes(language)) {
          const PrismLightModule = await import('react-syntax-highlighter/dist/esm/prism-light');
          const PrismComponent = PrismLightModule.default;

          // Map language to import path
          const languageMap: Record<string, () => Promise<any>> = {
            javascript: () => import('react-syntax-highlighter/dist/esm/languages/prism/javascript'),
            typescript: () => import('react-syntax-highlighter/dist/esm/languages/prism/typescript'),
            jsx: () => import('react-syntax-highlighter/dist/esm/languages/prism/jsx'),
            tsx: () => import('react-syntax-highlighter/dist/esm/languages/prism/tsx'),
            css: () => import('react-syntax-highlighter/dist/esm/languages/prism/css'),
            html: () => import('react-syntax-highlighter/dist/esm/languages/prism/markup'),
            json: () => import('react-syntax-highlighter/dist/esm/languages/prism/json'),
            bash: () => import('react-syntax-highlighter/dist/esm/languages/prism/bash'),
            python: () => import('react-syntax-highlighter/dist/esm/languages/prism/python'),
            java: () => import('react-syntax-highlighter/dist/esm/languages/prism/java'),
            go: () => import('react-syntax-highlighter/dist/esm/languages/prism/go'),
            rust: () => import('react-syntax-highlighter/dist/esm/languages/prism/rust'),
            sql: () => import('react-syntax-highlighter/dist/esm/languages/prism/sql'),
            yaml: () => import('react-syntax-highlighter/dist/esm/languages/prism/yaml'),
            markdown: () => import('react-syntax-highlighter/dist/esm/languages/prism/markdown'),
          };

          if (languageMap[language]) {
            const langModule = await languageMap[language]();
            PrismComponent.registerLanguage(language, langModule.default);
          }
        }

        setHighlighterReady(true);
      } catch (error) {
        console.warn(`Failed to load syntax highlighting for ${language}:`, error);
        setHighlighterReady(true); // Still set ready to show fallback
      }
    };

    loadLanguageAndStyle();
  }, [language]);

  const fallbackCode = (
    <pre
      className={`${className} overflow-auto rounded-lg bg-gray-900 p-4 text-gray-100`}
    >
      <code>{children}</code>
    </pre>
  );

  if (!highlighterReady || !style) {
    return fallbackCode;
  }

  // If language is not supported, just show plain code
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return fallbackCode;
  }

  return (
    <React.Suspense fallback={fallbackCode}>
      <PrismLight
        style={style}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          background: '#1e293b',
          color: '#f1f5f9',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          padding: '1rem',
        }}
      >
        {children}
      </PrismLight>
    </React.Suspense>
  );
}