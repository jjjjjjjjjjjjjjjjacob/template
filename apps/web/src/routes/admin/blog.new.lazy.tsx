import { createLazyFileRoute, Link, useRouter } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/tanstack-react-start';
import { useMutation } from 'convex/react';
import { api } from '@template/convex';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Save, ArrowLeft } from 'lucide-react';
import { MarkdownEditor } from '../../components/blog-editor/markdown-editor';
import { BlogImageManager } from '../../components/blog-editor/blog-image-manager';
import { toast } from 'sonner';
import { Label } from '../../components/ui/label';
import { Id } from '@template/convex/dataModel';

export const Route = createLazyFileRoute('/admin/blog/new')({
  component: NewBlogPostPage,
});

function NewBlogPostPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState<Id<'_storage'>[]>([]);
  const [thumbnailId, setThumbnailId] = useState<Id<'_storage'> | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<
    Id<'blogPosts'> | undefined
  >();
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const upsertMutation = useMutation(api.blog.upsert);
  const autosaveMutation = useMutation(api.blog.autosave);
  const router = useRouter();

  // Memoized autosave function to prevent unnecessary re-renders
  const performAutosave = useCallback(async () => {
    if (!title && !markdown) return;

    try {
      setIsAutoSaving(true);
      const postId = await autosaveMutation({
        id: createdPostId,
        title: title || 'untitled',
        slug: slug || 'untitled',
        markdown: markdown || '',
        images: images.length > 0 ? images : undefined,
        thumbnailId,
      });

      // Track the created post ID so subsequent saves update the same post
      if (!createdPostId && postId) {
        setCreatedPostId(postId);
      }
    } catch {
      // Autosave failed
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    title,
    slug,
    markdown,
    images,
    thumbnailId,
    autosaveMutation,
    createdPostId,
  ]);

  // Auto-save functionality with debounced timeout
  useEffect(() => {
    if (!title && !markdown) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout
    autosaveTimeoutRef.current = setTimeout(performAutosave, 2000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [title, slug, markdown, images, thumbnailId, performAutosave]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('title and slug are required');
      return;
    }

    try {
      setIsSaving(true);
      const postId = await upsertMutation({
        id: createdPostId,
        title: title.trim(),
        slug: slug.trim(),
        markdown: markdown.trim(),
        published,
        images: images.length > 0 ? images : undefined,
        thumbnailId,
      });

      // Track the created post ID for future saves
      if (!createdPostId && postId) {
        setCreatedPostId(postId);
      }

      toast.success('post saved successfully');
      router.navigate({ to: '/admin/blog' });
    } catch {
      toast.error('failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertImage = (syntax: string) => {
    setMarkdown((prev) => prev + '\n\n' + syntax);
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/admin/blog/new" />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="mb-4 flex items-center">
              <Link to="/admin/blog">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  back to posts
                </Button>
              </Link>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-light sm:text-3xl">
                  new blog post
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  create a new blog post
                  {isAutoSaving && (
                    <span className="ml-2">• autosaving...</span>
                  )}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="sm:size-default"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'saving...' : 'save post'}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Main Editor */}
            <div className="lg:col-span-3">
              <MarkdownEditor
                value={markdown}
                onChange={setMarkdown}
                title={title}
                onTitleChange={setTitle}
                slug={slug}
                onSlugChange={setSlug}
                onSave={handleSave}
                images={images}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>publish settings</CardTitle>
                  <CardDescription>
                    configure post visibility and URL
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={published}
                      onCheckedChange={setPublished}
                    />
                    <Label htmlFor="published">
                      {published ? 'published' : 'draft'}
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>images</CardTitle>
                  <CardDescription>
                    upload and manage blog post images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlogImageManager
                    images={images}
                    thumbnailId={thumbnailId}
                    onImagesChange={setImages}
                    onThumbnailChange={setThumbnailId}
                    onInsertImage={handleInsertImage}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>markdown guide</CardTitle>
                  <CardDescription>
                    quick reference for formatting
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-2 text-sm">
                  <div>
                    <code># Heading 1</code>
                  </div>
                  <div>
                    <code>## Heading 2</code>
                  </div>
                  <div>
                    <code>**bold text**</code>
                  </div>
                  <div>
                    <code>*italic text*</code>
                  </div>
                  <div>
                    <code>`code`</code>
                  </div>
                  <div>
                    <code>[link](url)</code>
                  </div>
                  <div>
                    <code>![image](url)</code>
                  </div>
                  <div>
                    <code>- list item</code>
                  </div>
                  <div>
                    <code>```code block```</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
