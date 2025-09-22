import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '@template/convex';
import React from 'react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { Id } from '@template/convex/dataModel';

export const Route = createFileRoute('/admin/blog/')({
  component: BlogListPage,
});

function BlogListPage() {
  const posts = useQuery(api.blog.listAll, {});
  const removeMutation = useMutation(api.blog.remove);
  const upsertMutation = useMutation(api.blog.upsert);
  const convex = useConvex();

  const isLoading = posts === undefined;
  const error = null; // Convex useQuery doesn't return errors in the same way

  const handleDelete = async (slug: string) => {
    if (!confirm('are you sure you want to delete this post?')) return;

    try {
      await removeMutation({ slug });
      toast.success('post deleted successfully');
    } catch {
      toast.error('failed to delete post');
    }
  };

  const handleTogglePublish = async (post: {
    _id: string;
    title: string;
    slug: string;
    published: boolean;
  }) => {
    try {
      // First get the full post data to preserve markdown content
      const fullPost = await convex.query(api.blog.getById, {
        id: post._id as Id<'blogPosts'>,
      });
      if (!fullPost) {
        toast.error('post not found');
        return;
      }

      await upsertMutation({
        title: fullPost.title,
        slug: fullPost.slug,
        markdown: fullPost.markdown,
        published: !post.published,
      });
      toast.success(post.published ? 'post unpublished' : 'post published');
    } catch {
      toast.error('failed to update post status');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">manage posts</h1>
          <p className="text-muted-foreground mt-2">
            create, edit, and publish your blog posts
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/blog">
            <Button variant="outline">view blog</Button>
          </Link>
          <Link to="/admin/blog/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              new post
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-destructive mb-6">
          <CardContent className="pt-6">
            <p className="text-destructive">
              failed to load posts: {String(error)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>all posts</CardTitle>
          <CardDescription>
            {posts ? `${posts.length} posts total` : 'loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">loading posts...</p>
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">no posts yet</p>
              <Link to="/admin/blog/new">
                <Button>create your first post</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>title</TableHead>
                  <TableHead>slug</TableHead>
                  <TableHead>status</TableHead>
                  <TableHead>created</TableHead>
                  <TableHead>updated</TableHead>
                  <TableHead className="w-[100px]">actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post._id}>
                    <TableCell className="font-light">
                      {post.title || 'untitled'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {post.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'published' : 'draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(post.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to="/admin/blog/$postId"
                              params={{ postId: post._id }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTogglePublish(post)}
                          >
                            {post.published ? (
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
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(post.slug)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
