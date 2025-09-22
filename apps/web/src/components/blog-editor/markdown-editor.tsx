import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { cn } from '../../utils/tailwind-utils';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { FormattingToolbar } from './formatting-toolbar';
import { EditorTextarea } from './editor-textarea';
import { useIsMobile, useIsTablet } from '../../hooks/use-media-query';

// Dynamic import for markdown preview
const MarkdownPreview = React.lazy(() => import('./markdown-preview'));
import type { Id } from '@template/convex/dataModel';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  postId?: Id<'blogPosts'>;
  onSave?: () => void;
  className?: string;
  images?: Id<'_storage'>[];
}

export function MarkdownEditor({
  value,
  onChange,
  title,
  onTitleChange,
  slug,
  onSlugChange,
  postId,
  onSave,
  className,
  images = [],
}: MarkdownEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Get all image URLs - we'll use a single query for all images
  const allImageUrls = useQuery(
    api.blog.getMultipleImageUrls,
    images.length > 0 ? { storageIds: images } : 'skip'
  );

  const availableImages = useMemo(() => {
    if (!allImageUrls) return [];

    return images
      .map((imageId) => {
        const url = allImageUrls[imageId];
        if (!url) return null;
        return {
          id: imageId,
          url,
          alt: `image ${imageId.slice(-8)}`,
        };
      })
      .filter(Boolean) as Array<{ id: string; url: string; alt: string }>;
  }, [images, allImageUrls]);

  const handleInsertImage = useCallback(
    (syntax: string) => {
      const textarea = document.querySelector(
        '#markdown-editor'
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue =
        value.substring(0, start) + syntax + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + syntax.length,
          start + syntax.length
        );
      }, 0);
    },
    [value, onChange]
  );

  const handleKeyboardShortcut = useCallback(
    (action: string) => {
      const textarea = document.querySelector(
        '#markdown-editor'
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      let replacement = '';
      let newCursorPos = start;

      switch (action) {
        case 'bold':
          replacement = `**${selectedText}**`;
          newCursorPos = start + (selectedText ? 4 : 2);
          break;
        case 'italic':
          replacement = `*${selectedText}*`;
          newCursorPos = start + (selectedText ? 2 : 1);
          break;
        case 'strikethrough':
          replacement = `~~${selectedText}~~`;
          newCursorPos = start + (selectedText ? 4 : 2);
          break;
        case 'code':
          replacement = `\`${selectedText}\``;
          newCursorPos = start + (selectedText ? 2 : 1);
          break;
        case 'link':
          replacement = `[${selectedText || 'link text'}](url)`;
          newCursorPos = start + replacement.length - 4;
          break;
        case 'h1':
          replacement = `# ${selectedText}`;
          newCursorPos = start + 2;
          break;
        case 'h2':
          replacement = `## ${selectedText}`;
          newCursorPos = start + 3;
          break;
        case 'h3':
          replacement = `### ${selectedText}`;
          newCursorPos = start + 4;
          break;
        case 'ul':
          replacement = `- ${selectedText}`;
          newCursorPos = start + 2;
          break;
        case 'ol':
          replacement = `1. ${selectedText}`;
          newCursorPos = start + 3;
          break;
        case 'quote':
          replacement = `> ${selectedText}`;
          newCursorPos = start + 2;
          break;
        case 'codeblock':
          replacement = `\`\`\`\n${selectedText}\n\`\`\``;
          newCursorPos = start + 3;
          break;
      }

      const newValue =
        value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const togglePreview = useCallback(() => {
    if (isMobile) {
      setIsPreviewOpen(!isPreviewOpen);
    } else if (isTablet) {
      setActiveTab(activeTab === 'edit' ? 'preview' : 'edit');
    }
  }, [isMobile, isTablet, isPreviewOpen, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            handleKeyboardShortcut('bold');
            break;
          case 'i':
            e.preventDefault();
            handleKeyboardShortcut('italic');
            break;
          case 'k':
            e.preventDefault();
            handleKeyboardShortcut('link');
            break;
          case 's':
            if (onSave) {
              e.preventDefault();
              onSave();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyboardShortcut, onSave]);

  const generateSlugFromTitle = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      onTitleChange(newTitle);
      if (!postId) {
        onSlugChange(generateSlugFromTitle(newTitle));
      }
    },
    [onTitleChange, onSlugChange, generateSlugFromTitle, postId]
  );

  if (isFullscreen) {
    return (
      <div className="bg-background fixed inset-0 z-50 flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-light">markdown editor</h2>
          <button
            onClick={toggleFullscreen}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            exit fullscreen
          </button>
        </div>
        <ResponsiveMarkdownEditor
          value={value}
          onChange={onChange}
          title={title}
          onTitleChange={handleTitleChange}
          slug={slug}
          onSlugChange={onSlugChange}
          onKeyboardShortcut={handleKeyboardShortcut}
          onTogglePreview={togglePreview}
          isPreviewOpen={isPreviewOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          isTablet={isTablet}
          availableImages={availableImages}
          onInsertImage={handleInsertImage}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <ResponsiveMarkdownEditor
        value={value}
        onChange={onChange}
        title={title}
        onTitleChange={handleTitleChange}
        slug={slug}
        onSlugChange={onSlugChange}
        onKeyboardShortcut={handleKeyboardShortcut}
        onToggleFullscreen={toggleFullscreen}
        onTogglePreview={togglePreview}
        isPreviewOpen={isPreviewOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobile={isMobile}
        isTablet={isTablet}
        availableImages={availableImages}
        onInsertImage={handleInsertImage}
      />
    </Card>
  );
}

interface ResponsiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  onKeyboardShortcut: (action: string) => void;
  onToggleFullscreen?: () => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  isTablet: boolean;
  availableImages: Array<{ id: string; url: string; alt: string }>;
  onInsertImage: (syntax: string) => void;
  className?: string;
}

function ResponsiveMarkdownEditor({
  value,
  onChange,
  title,
  onTitleChange,
  slug,
  onSlugChange,
  onKeyboardShortcut,
  onToggleFullscreen,
  onTogglePreview,
  isPreviewOpen,
  activeTab,
  setActiveTab,
  isMobile,
  isTablet,
  availableImages,
  onInsertImage,
  className,
}: ResponsiveMarkdownEditorProps) {
  const PreviewContent = () => (
    <div className="h-full overflow-x-hidden overflow-y-auto rounded-md border">
      <div className="w-full p-4">
        <div className="prose prose-sm dark:prose-invert markdown-content max-w-none break-words">
          <Suspense
            fallback={
              <div className="text-muted-foreground py-8 text-center">
                loading preview...
              </div>
            }
          >
            <MarkdownPreview content={value || '*nothing to preview*'} />
          </Suspense>
        </div>
      </div>
    </div>
  );

  const EditorContent = React.useMemo(
    () => (
      <>
        <div className="flex-shrink-0 space-y-4 p-4">
          <div>
            <label
              htmlFor="post-title"
              className="text-muted-foreground text-sm font-light"
            >
              title
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="border-input focus:ring-ring mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-lg font-light focus:ring-1 focus:outline-none"
              placeholder="enter post title..."
            />
          </div>

          <div>
            <label
              htmlFor="post-slug"
              className="text-muted-foreground text-sm font-light"
            >
              slug
            </label>
            <input
              id="post-slug"
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              className="border-input focus:ring-ring mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              placeholder="post-slug"
            />
          </div>
        </div>

        <Separator className="flex-shrink-0" />

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <EditorTextarea
            value={value}
            onChange={onChange}
            placeholder="write your post in markdown..."
          />
        </div>
      </>
    ),
    [title, slug, value, onTitleChange, onSlugChange, onChange]
  );

  // Mobile Layout - Sheet for preview
  if (isMobile) {
    return (
      <div className={cn('flex h-[calc(100vh-12rem)] flex-col', className)}>
        <FormattingToolbar
          onAction={onKeyboardShortcut}
          onToggleFullscreen={onToggleFullscreen}
          onTogglePreview={onTogglePreview}
          showPreviewButton={true}
          availableImages={availableImages}
          onInsertImage={onInsertImage}
        />
        <Separator />

        <div className="flex min-h-0 flex-1 flex-col">{EditorContent}</div>

        <Sheet open={isPreviewOpen} onOpenChange={onTogglePreview}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>preview</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex-1">
              <PreviewContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Tablet Layout - Tabs
  if (isTablet) {
    return (
      <div className={cn('flex h-[calc(100vh-12rem)] flex-col', className)}>
        <FormattingToolbar
          onAction={onKeyboardShortcut}
          onToggleFullscreen={onToggleFullscreen}
          availableImages={availableImages}
          onInsertImage={onInsertImage}
        />
        <Separator />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-4 mt-4 grid w-full grid-cols-2">
            <TabsTrigger value="edit">edit</TabsTrigger>
            <TabsTrigger value="preview">preview</TabsTrigger>
          </TabsList>

          <TabsContent
            value="edit"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            {EditorContent}
          </TabsContent>

          <TabsContent value="preview" className="mt-0 min-h-0 flex-1 p-4">
            <div className="text-muted-foreground mb-2 text-sm font-light">
              preview
            </div>
            <PreviewContent />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop Layout - Side by side
  return (
    <div className={cn('flex h-[calc(100vh-12rem)] flex-col', className)}>
      <FormattingToolbar
        onAction={onKeyboardShortcut}
        onToggleFullscreen={onToggleFullscreen}
        availableImages={availableImages}
        onInsertImage={onInsertImage}
      />
      <Separator />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 w-1/2 flex-col">{EditorContent}</div>

        <Separator orientation="vertical" className="flex-shrink-0" />

        <div className="flex min-h-0 w-1/2 flex-col">
          <div className="flex-shrink-0 p-4 pb-2">
            <div className="text-muted-foreground text-sm font-light">
              preview
            </div>
          </div>
          <div className="min-h-0 flex-1 px-4 pb-4">
            <PreviewContent />
          </div>
        </div>
      </div>
    </div>
  );
}
