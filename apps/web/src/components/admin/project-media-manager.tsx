import * as React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@template/convex';
import { FileUpload, FileUploadFile } from '@/components/forms/file-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Trash2,
  Star,
  Image as ImageIcon,
  Video,
  Globe,
  GripVertical,
  Plus,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { Id } from '@template/convex/dataModel';
import { cn } from '@/utils/tailwind-utils';

export type MediaType = 'image' | 'video' | 'iframe';

export interface MediaItem {
  type: MediaType;
  storageId?: Id<'_storage'>;
  url?: string;
  caption?: string;
  order: number;
}

interface ProjectMediaManagerProps {
  projectId?: Id<'portfolio_projects'>;
  media: MediaItem[];
  thumbnailIndex?: number;
  onMediaChange: (media: MediaItem[]) => void;
  onThumbnailChange: (index?: number) => void;
}

export function ProjectMediaManager({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  projectId,
  media,
  thumbnailIndex,
  onMediaChange,
  onThumbnailChange,
}: ProjectMediaManagerProps) {
  const [uploadFiles, setUploadFiles] = React.useState<FileUploadFile[]>([]);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [newMediaType, setNewMediaType] = React.useState<MediaType>('image');
  const [newMediaUrl, setNewMediaUrl] = React.useState('');
  const [newMediaCaption, setNewMediaCaption] = React.useState('');
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const generateUploadUrl = useMutation(api.projects.generateUploadUrl);

  const handleFileUpload = async (files: File[]) => {
    try {
      const newMedia: MediaItem[] = [];

      for (const file of files) {
        const uploadUrl = await generateUploadUrl();

        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const response = (await result.json()) as { storageId: Id<'_storage'> };
        const isVideo = file.type.startsWith('video/');

        newMedia.push({
          type: isVideo ? 'video' : 'image',
          storageId: response.storageId,
          order: media.length + newMedia.length,
        });
      }

      onMediaChange([...media, ...newMedia]);

      if (
        media.length === 0 &&
        newMedia.length > 0 &&
        thumbnailIndex === undefined
      ) {
        onThumbnailChange(0);
        toast.success('first media item set as thumbnail');
      }

      toast.success(
        `uploaded ${files.length} file${files.length > 1 ? 's' : ''}`
      );
      setUploadFiles([]);
    } catch {
      toast.error('failed to upload files');
    }
  };

  const handleAddExternalMedia = () => {
    if (!newMediaUrl.trim()) {
      toast.error('please enter a url');
      return;
    }

    const newItem: MediaItem = {
      type: newMediaType,
      url: newMediaUrl.trim(),
      caption: newMediaCaption.trim() || undefined,
      order: media.length,
    };

    onMediaChange([...media, newItem]);
    setShowAddDialog(false);
    setNewMediaUrl('');
    setNewMediaCaption('');
    toast.success('media added');
  };

  const handleUpdateCaption = (index: number, caption: string) => {
    const updated = media.map((m, i) =>
      i === index ? { ...m, caption: caption || undefined } : m
    );
    onMediaChange(updated);
  };

  const handleRemoveMedia = (index: number) => {
    const updated = media
      .filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, order: i }));

    let newThumbnailIndex = thumbnailIndex;
    if (thumbnailIndex !== undefined) {
      if (thumbnailIndex === index) {
        newThumbnailIndex = undefined;
      } else if (thumbnailIndex > index) {
        newThumbnailIndex = thumbnailIndex - 1;
      }
    }

    onMediaChange(updated);
    onThumbnailChange(newThumbnailIndex);
    toast.success('media removed');
  };

  const handleSetThumbnail = (index?: number) => {
    onThumbnailChange(index);
    toast.success(index !== undefined ? 'thumbnail set' : 'thumbnail cleared');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedia = [...media];
    const [draggedItem] = newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);

    const reordered = newMedia.map((m, i) => ({ ...m, order: i }));

    let newThumbnailIndex = thumbnailIndex;
    if (thumbnailIndex !== undefined) {
      if (thumbnailIndex === draggedIndex) {
        newThumbnailIndex = index;
      } else if (draggedIndex < thumbnailIndex && index >= thumbnailIndex) {
        newThumbnailIndex = thumbnailIndex - 1;
      } else if (draggedIndex > thumbnailIndex && index <= thumbnailIndex) {
        newThumbnailIndex = thumbnailIndex + 1;
      }
    }

    onMediaChange(reordered);
    onThumbnailChange(newThumbnailIndex);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-light">media</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          add url/iframe
        </Button>
      </div>

      <FileUpload
        files={uploadFiles}
        onFilesChange={setUploadFiles}
        onUpload={handleFileUpload}
        accept="image/*,video/*"
        multiple={true}
        maxFiles={20}
        maxFileSize={50 * 1024 * 1024}
        className="mb-6"
      />

      {media.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-light">media items ({media.length})</h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item, index) => (
              <MediaCard
                key={`${item.storageId || item.url}-${index}`}
                media={item}
                index={index}
                isThumbnail={thumbnailIndex === index}
                onRemove={() => handleRemoveMedia(index)}
                onSetThumbnail={() => handleSetThumbnail(index)}
                onClearThumbnail={() => handleSetThumbnail(undefined)}
                onEditCaption={() => setEditingIndex(index)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex === index}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>add external media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>type</Label>
              <Select
                value={newMediaType}
                onValueChange={(v) => setNewMediaType(v as MediaType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">image url</SelectItem>
                  <SelectItem value="video">video url</SelectItem>
                  <SelectItem value="iframe">iframe/embed url</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>url</Label>
              <Input
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder={
                  newMediaType === 'iframe'
                    ? 'https://example.com or embed url'
                    : 'https://example.com/media.jpg'
                }
              />
            </div>
            <div className="space-y-2">
              <Label>caption (optional)</Label>
              <Textarea
                value={newMediaCaption}
                onChange={(e) => setNewMediaCaption(e.target.value)}
                placeholder="describe this media..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              cancel
            </Button>
            <Button onClick={handleAddExternalMedia}>add media</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingIndex !== null}
        onOpenChange={(open) => !open && setEditingIndex(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>edit caption</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={
                editingIndex !== null ? media[editingIndex]?.caption || '' : ''
              }
              onChange={(e) => {
                if (editingIndex !== null) {
                  handleUpdateCaption(editingIndex, e.target.value);
                }
              }}
              placeholder="enter caption..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingIndex(null)}>done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MediaCardProps {
  media: MediaItem;
  index: number;
  isThumbnail: boolean;
  onRemove: () => void;
  onSetThumbnail: () => void;
  onClearThumbnail: () => void;
  onEditCaption: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function MediaCard({
  media,
  index,
  isThumbnail,
  onRemove,
  onSetThumbnail,
  onClearThumbnail,
  onEditCaption,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: MediaCardProps) {
  const mediaUrl = useQuery(
    api.projects.getMediaUrl,
    media.storageId ? { storageId: media.storageId } : 'skip'
  );

  const displayUrl = media.url || mediaUrl;

  const MediaTypeIcon =
    media.type === 'video'
      ? Video
      : media.type === 'iframe'
        ? Globe
        : ImageIcon;

  return (
    <Card
      className={cn(
        'group relative cursor-grab transition-opacity',
        isDragging && 'opacity-50'
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <CardContent className="p-3">
        <div className="bg-muted relative mb-3 aspect-video overflow-hidden rounded-lg">
          {media.type === 'iframe' && displayUrl ? (
            <iframe
              src={displayUrl}
              className="h-full w-full border-0"
              title={`Media ${index + 1}`}
              loading="lazy"
            />
          ) : media.type === 'video' && displayUrl ? (
            <video
              src={displayUrl}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt={media.caption || `Media ${index + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <MediaTypeIcon className="text-muted-foreground h-8 w-8" />
            </div>
          )}

          <div className="absolute left-2 top-2 flex gap-1">
            {isThumbnail && (
              <Badge className="bg-primary">
                <Star className="mr-1 h-3 w-3" />
                thumbnail
              </Badge>
            )}
            <Badge variant="secondary">
              <MediaTypeIcon className="mr-1 h-3 w-3" />
              {media.type}
            </Badge>
          </div>

          <div className="absolute right-2 top-2">
            <GripVertical className="text-muted-foreground h-5 w-5" />
          </div>
        </div>

        <div className="space-y-2">
          {media.caption && (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {media.caption}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">#{index + 1}</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onEditCaption}
                className="h-7 w-7 p-0"
                title="edit caption"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {isThumbnail ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearThumbnail}
                  className="text-primary h-7 w-7 p-0"
                  title="clear thumbnail"
                >
                  <Star className="h-3 w-3 fill-current" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSetThumbnail}
                  className="h-7 w-7 p-0"
                  title="set as thumbnail"
                >
                  <Star className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-7 w-7 p-0"
                title="remove"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
