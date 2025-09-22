import { createLazyFileRoute, useRouter, Link } from '@tanstack/react-router';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/tanstack-react-start';
import { useQuery, useMutation } from 'convex/react';
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
import { Badge } from '../../components/ui/badge';
import { MarkdownEditor } from '../../components/blog-editor/markdown-editor';
import { BlogImageManager } from '../../components/blog-editor/blog-image-manager';
import { ArrowLeft, Save, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@template/convex/dataModel';

export const Route = createLazyFileRoute('/admin/blog/$postId')({
  component: BlogEditorPage,
});

function BlogEditorPage() {
  const { postId } = Route.useParams();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState<Id<'_storage'>[]>([]);
  const [thumbnailId, setThumbnailId] = useState<Id<'_storage'> | undefined>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const post = useQuery(api.blog.getById, {
    id: postId as Id<'blogPosts'>,
  });

  const isLoading = post === undefined;
  const error = null;

  const upsertMutation = useMutation(api.blog.upsert);
  const autosaveMutation = useMutation(api.blog.autosave);
  const removeMutation = useMutation(api.blog.remove);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setMarkdown(post.markdown);
      setPublished(post.published);
      setImages(post.images || []);
      setThumbnailId(post.thumbnailId);
      setHasUnsavedChanges(false);
    }
  }, [post]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('please enter a title');
      return;
    }

    if (!slug.trim()) {
      toast.error('please enter a slug');
      return;
    }

    try {
      await upsertMutation({
        id: postId as Id<'blogPosts'>,
        title: title.trim(),
        slug: slug.trim(),
        markdown,
        published,
        images: images.length > 0 ? images : undefined,
        thumbnailId,
      });

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('post saved successfully');
    } catch {
      toast.error('failed to save post');
    }
  }, [
    postId,
    title,
    slug,
    markdown,
    published,
    images,
    thumbnailId,
    upsertMutation,
  ]);

  const handleAutosave = useCallback(async () => {
    if (!title.trim() && !markdown.trim()) return;

    try {
      await autosaveMutation({
        id: postId as Id<'blogPosts'>,
        title: title.trim() || 'untitled',
        slug: slug.trim() || 'untitled',
        markdown,
        images: images.length > 0 ? images : undefined,
        thumbnailId,
      });
      setLastSaved(new Date());
    } catch {
      // Autosave error
    }
  }, [postId, title, slug, markdown, images, thumbnailId, autosaveMutation]);

  const handleTogglePublish = useCallback(async () => {
    if (!title.trim() || !slug.trim()) {
      toast.error('please enter title and slug before publishing');
      return;
    }

    try {
      const newPublishedState = !published;
      await upsertMutation({
        id: postId as Id<'blogPosts'>,
        title: title.trim(),
        slug: slug.trim(),
        markdown,
        published: newPublishedState,
        images: images.length > 0 ? images : undefined,
        thumbnailId,
      });

      setPublished(newPublishedState);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success(newPublishedState ? 'post published' : 'post unpublished');
    } catch {
      toast.error('failed to update post status');
    }
  }, [
    postId,
    title,
    slug,
    markdown,
    published,
    images,
    thumbnailId,
    upsertMutation,
  ]);

  const handleContentChange = useCallback((field: string, value: string) => {
    setHasUnsavedChanges(true);

    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'slug':
        setSlug(value);
        break;
      case 'markdown':
        setMarkdown(value);
        break;
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (
      !confirm(
        'are you sure you want to delete this post? this action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await removeMutation({ slug });
      toast.success('post deleted successfully');
      router.navigate({ to: '/admin/blog' });
    } catch {
      toast.error('failed to delete post');
    }
  }, [slug, removeMutation, router]);

  // Auto-save with debounced timeout to prevent input unfocusing
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new timeout
    autosaveTimeoutRef.current = setTimeout(handleAutosave, 10000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, handleAutosave]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-8 text-center">
          <p className="text-muted-foreground">loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              failed to load post: {String(error) || 'post not found'}
            </p>
            <Link to="/admin/blog">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                back to blog list
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    return `last saved: ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl={`/admin/blog/${postId}`} />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          {/* Mobile Layout */}
          <div className="mb-6 sm:hidden">
            <div className="mb-4 flex items-center gap-4">
              <Link to="/admin/blog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  back
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-light">edit post</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={published ? 'default' : 'secondary'}>
                    {published ? 'published' : 'draft'}
                  </Badge>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-orange-600">
                      unsaved changes
                    </Badge>
                  )}
                  {lastSaved && !hasUnsavedChanges && (
                    <span className="text-muted-foreground text-xs">
                      {formatLastSaved()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePublish}
                disabled={false}
                className="flex-1"
              >
                {published ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    publish
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                size="sm"
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                save
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={false}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                delete
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="mb-6 hidden items-center justify-between sm:flex">
            <div className="flex items-center gap-4">
              <Link to="/admin/blog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-light">edit post</h1>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={published ? 'default' : 'secondary'}>
                    {published ? 'published' : 'draft'}
                  </Badge>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-orange-600">
                      unsaved changes
                    </Badge>
                  )}
                  {lastSaved && !hasUnsavedChanges && (
                    <span className="text-muted-foreground text-sm">
                      {formatLastSaved()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePublish}
                disabled={false}
              >
                {published ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    unpublish
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    publish
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                size="sm"
              >
                <Save className="mr-2 h-4 w-4" />
                save
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={false}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                delete
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <MarkdownEditor
              value={markdown}
              onChange={(value) => handleContentChange('markdown', value)}
              title={title}
              onTitleChange={(value) => handleContentChange('title', value)}
              slug={slug}
              onSlugChange={(value) => handleContentChange('slug', value)}
              postId={postId as Id<'blogPosts'>}
              onSave={handleSave}
              images={images}
            />

            <Card>
              <CardHeader>
                <CardTitle>images</CardTitle>
                <CardDescription>
                  upload and manage blog post images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlogImageManager
                  postId={postId as Id<'blogPosts'>}
                  images={images}
                  thumbnailId={thumbnailId}
                  onImagesChange={setImages}
                  onThumbnailChange={setThumbnailId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
