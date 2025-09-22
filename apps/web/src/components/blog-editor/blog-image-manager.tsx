import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { FileUpload, FileUploadFile } from '@/components/forms/file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Star, Image as ImageIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createInlineImageSyntax } from '@/lib/remark-inline-images';
import { Id } from '@template/convex/dataModel';

interface BlogImageManagerProps {
  postId?: Id<'blogPosts'>;
  images?: Id<'_storage'>[];
  thumbnailId?: Id<'_storage'>;
  onImagesChange?: (images: Id<'_storage'>[]) => void;
  onThumbnailChange?: (thumbnailId?: Id<'_storage'>) => void;
  onInsertImage?: (syntax: string) => void;
}

export function BlogImageManager({
  postId,
  images = [],
  thumbnailId,
  onImagesChange,
  onThumbnailChange,
  onInsertImage,
}: BlogImageManagerProps) {
  const [uploadFiles, setUploadFiles] = React.useState<FileUploadFile[]>([]);

  const generateUploadUrl = useMutation(api.blog.generateUploadUrl);
  const addImageToPost = useMutation(api.blog.addImageToPost);
  const removeImageFromPost = useMutation(api.blog.removeImageFromPost);
  const setPostThumbnail = useMutation(api.blog.setPostThumbnail);

  const handleFileUpload = async (files: File[]) => {
    try {
      const uploadedStorageIds: Id<'_storage'>[] = [];

      for (const file of files) {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const response = (await result.json()) as { storageId: Id<'_storage'> };
        const storageId = response.storageId;
        uploadedStorageIds.push(storageId);

        // Add to post if we have a postId, otherwise update local state
        if (postId) {
          await addImageToPost({ postId, storageId });
        } else {
          const newImages = [...images, storageId];
          onImagesChange?.(newImages);
        }
      }

      // Auto-select first uploaded image as thumbnail if no thumbnail is set
      if (uploadedStorageIds.length > 0 && !thumbnailId) {
        const firstImageId = uploadedStorageIds[0];
        if (postId) {
          await setPostThumbnail({ postId, thumbnailId: firstImageId });
        } else {
          onThumbnailChange?.(firstImageId);
        }
        toast.success('first image automatically set as thumbnail');
      }

      toast.success(
        `uploaded ${files.length} image${files.length > 1 ? 's' : ''}`
      );
      setUploadFiles([]); // Clear upload state
    } catch {
      toast.error('failed to upload images');
    }
  };

  const handleRemoveImage = async (storageId: Id<'_storage'>) => {
    try {
      if (postId) {
        await removeImageFromPost({ postId, storageId });
      } else {
        const newImages = images.filter((id) => id !== storageId);
        onImagesChange?.(newImages);

        // Clear thumbnail if it was the removed image
        if (thumbnailId === storageId) {
          onThumbnailChange?.(undefined);
        }
      }

      toast.success('image removed');
    } catch {
      toast.error('failed to remove image');
    }
  };

  const handleSetThumbnail = async (storageId?: Id<'_storage'>) => {
    try {
      if (postId) {
        await setPostThumbnail({ postId, thumbnailId: storageId });
      } else {
        onThumbnailChange?.(storageId);
      }

      toast.success(storageId ? 'thumbnail set' : 'thumbnail cleared');
    } catch {
      toast.error('failed to set thumbnail');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-light">images</h3>

        <FileUpload
          files={uploadFiles}
          onFilesChange={setUploadFiles}
          onUpload={handleFileUpload}
          accept="image/*"
          multiple={true}
          maxFiles={20}
          maxFileSize={10 * 1024 * 1024} // 10MB
          className="mb-6"
        />
      </div>

      {images.length > 0 && (
        <div>
          <h4 className="text-md mb-4 font-light">
            uploaded images ({images.length})
          </h4>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((storageId) => (
              <ImageCard
                key={storageId}
                storageId={storageId}
                isThumbnail={thumbnailId === storageId}
                onRemove={() => handleRemoveImage(storageId)}
                onInsertImage={onInsertImage}
              />
            ))}
          </div>

          <div className="space-y-4">
            <h5 className="text-sm font-light">thumbnail selection</h5>
            <RadioGroup
              value={thumbnailId || ''}
              onValueChange={(value) =>
                handleSetThumbnail(
                  value ? (value as Id<'_storage'>) : undefined
                )
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="no-thumbnail" />
                <Label htmlFor="no-thumbnail" className="text-sm">
                  no thumbnail
                </Label>
              </div>
              {images.map((storageId) => (
                <div key={storageId} className="flex items-center space-x-2">
                  <RadioGroupItem value={storageId} id={`thumb-${storageId}`} />
                  <Label htmlFor={`thumb-${storageId}`} className="text-sm">
                    image {images.indexOf(storageId) + 1}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImageCardProps {
  storageId: Id<'_storage'>;
  isThumbnail: boolean;
  onRemove: () => void;
  onInsertImage?: (syntax: string) => void;
}

function ImageCard({
  storageId,
  isThumbnail,
  onRemove,
  onInsertImage,
}: ImageCardProps) {
  const imageUrl = useQuery(api.blog.getImageUrl, { storageId });
  const [caption, setCaption] = React.useState('');
  const [showCaptionInput, setShowCaptionInput] = React.useState(false);

  const handleInsertImage = (position?: string) => {
    if (onInsertImage) {
      const alt = `image ${storageId.slice(-8)}`;
      const syntax = createInlineImageSyntax(
        storageId,
        alt,
        position,
        undefined,
        caption || undefined
      );
      onInsertImage(syntax);
      toast.success('image syntax copied to editor');
      setShowCaptionInput(false);
      setCaption('');
    }
  };

  return (
    <Card className="group relative">
      <CardContent className="p-3">
        <div className="bg-muted relative mb-3 aspect-video overflow-hidden rounded-lg">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="text-muted-foreground h-8 w-8" />
            </div>
          )}

          {isThumbnail && (
            <Badge className="bg-primary absolute top-2 left-2">
              <Star className="mr-1 h-3 w-3" />
              thumbnail
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground truncate text-xs">
              image {storageId.slice(-8)}
            </span>
            <div className="flex items-center gap-1">
              {onInsertImage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleInsertImage()}>
                      insert center
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInsertImage('left')}>
                      insert left
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleInsertImage('right')}
                    >
                      insert right
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleInsertImage('full-width')}
                    >
                      insert full width
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {onInsertImage && (
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCaptionInput(!showCaptionInput)}
                className="w-full text-xs"
              >
                {showCaptionInput ? 'hide caption' : 'add caption'}
              </Button>

              {showCaptionInput && (
                <div className="space-y-2">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="enter caption (markdown supported)"
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded border px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    rows={2}
                  />
                  <p className="text-muted-foreground text-xs">
                    markdown formatting supported: **bold**, *italic*, `code`
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
