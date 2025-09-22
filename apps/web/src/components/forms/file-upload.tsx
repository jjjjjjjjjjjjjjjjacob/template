import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  X,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';

export interface FileUploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface FileUploadProps {
  files?: FileUploadFile[];
  onFilesChange?: (files: FileUploadFile[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function FileUpload({
  files = [],
  onFilesChange,
  onUpload,
  accept,
  multiple = true,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  className,
  'aria-label': ariaLabel = 'file upload',
  'aria-describedby': ariaDescribedBy,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return FileImage;
      case 'video':
        return FileVideo;
      case 'audio':
        return FileAudio;
      case 'text':
        return FileText;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'kb', 'mb', 'gb'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = React.useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `file size exceeds ${formatFileSize(maxFileSize)} limit`;
      }
      return null;
    },
    [maxFileSize]
  );

  const addFiles = React.useCallback(
    async (newFiles: File[]) => {
      const validFiles: FileUploadFile[] = [];
      const errors: string[] = [];

      for (const file of newFiles) {
        if (files.length + validFiles.length >= maxFiles) {
          errors.push(`maximum ${maxFiles} files allowed`);
          break;
        }

        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
          continue;
        }

        validFiles.push({
          id: generateFileId(),
          file,
          progress: 0,
          status: onUpload ? 'uploading' : 'pending', // Start as uploading if auto-upload is enabled
        });
      }

      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        onFilesChange?.(updatedFiles);

        // Auto-upload immediately if onUpload is provided
        if (onUpload) {
          // Use immediate execution instead of setTimeout to prevent race conditions
          (async () => {
            try {
              await onUpload(validFiles.map((f) => f.file));
            } catch {
              // Update failed files to error status
              const errorFiles = [...files, ...validFiles].map((f) =>
                validFiles.some((vf) => vf.id === f.id)
                  ? { ...f, status: 'error' as const, error: 'upload failed' }
                  : f
              );
              onFilesChange?.(errorFiles);
            }
          })();
        }
      }

      if (errors.length > 0) {
        // // console.warn('file upload errors:', errors);
      }
    },
    [files, maxFiles, onFilesChange, validateFile, onUpload]
  );

  const removeFile = React.useCallback(
    (fileId: string) => {
      const updatedFiles = files.filter((f) => f.id !== fileId);
      onFilesChange?.(updatedFiles);
    },
    [files, onFilesChange]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleUpload = async () => {
    if (!onUpload) return;

    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Update status to uploading
    const updatedFiles = files.map((f) =>
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    );
    onFilesChange?.(updatedFiles);

    try {
      await onUpload(pendingFiles.map((f) => f.file));

      // Mark as completed
      const completedFiles = files.map((f) =>
        f.status === 'uploading'
          ? { ...f, status: 'completed' as const, progress: 100 }
          : f
      );
      onFilesChange?.(completedFiles);
    } catch (error) {
      // Mark as error
      const errorFiles = files.map((f) =>
        f.status === 'uploading'
          ? {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'upload failed',
            }
          : f
      );
      onFilesChange?.(errorFiles);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const hasFiles = files.length > 0;
  const pendingFiles = files.filter((f) => f.status === 'pending');
  const canUpload = pendingFiles.length > 0 && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 transition-colors',
          'hover:border-primary/50 focus-within:border-primary focus-within:ring-primary focus-within:ring-1',
          isDragOver && 'border-primary bg-primary/5',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer'
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
        />

        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="text-muted-foreground h-8 w-8" />
          <div className="space-y-1">
            <p className="text-sm font-light">
              {isDragOver
                ? 'drop files here'
                : 'click to upload or drag and drop'}
            </p>
            <p className="text-muted-foreground text-xs">
              {accept ? `accepted: ${accept}` : 'all file types accepted'}
              {' • '}
              max {formatFileSize(maxFileSize)}
              {multiple && ` • up to ${maxFiles} files`}
            </p>
          </div>
        </div>
      </div>

      {hasFiles && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-light">
              files ({files.length}/{maxFiles})
            </h4>
            {canUpload && (
              <Button size="sm" onClick={handleUpload}>
                upload {pendingFiles.length} file
                {pendingFiles.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((fileData) => {
              const Icon = getFileIcon(fileData.file);

              return (
                <Card key={fileData.id} className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <Icon className="text-muted-foreground h-8 w-8 flex-shrink-0" />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-light">
                            {fileData.file.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                fileData.status === 'completed'
                                  ? 'default'
                                  : fileData.status === 'error'
                                    ? 'destructive'
                                    : fileData.status === 'uploading'
                                      ? 'secondary'
                                      : 'outline'
                              }
                              className="text-xs"
                            >
                              {fileData.status}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(fileData.id);
                              }}
                              aria-label={`remove ${fileData.file.name}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <span>{formatFileSize(fileData.file.size)}</span>
                          {fileData.status === 'completed' && (
                            <>
                              <span>•</span>
                              <Check className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">uploaded</span>
                            </>
                          )}
                          {fileData.status === 'error' && fileData.error && (
                            <>
                              <span>•</span>
                              <AlertCircle className="text-destructive h-3 w-3" />
                              <span className="text-destructive">
                                {fileData.error}
                              </span>
                            </>
                          )}
                        </div>

                        {(fileData.status === 'uploading' ||
                          fileData.progress > 0) && (
                          <Progress
                            value={fileData.progress}
                            className="h-1"
                            aria-label={`upload progress for ${fileData.file.name}: ${fileData.progress}%`}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function useFileUpload() {
  const [files, setFiles] = React.useState<FileUploadFile[]>([]);

  const updateFileProgress = React.useCallback(
    (fileId: string, progress: number) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress: Math.min(100, Math.max(0, progress)) }
            : f
        )
      );
    },
    []
  );

  const updateFileStatus = React.useCallback(
    (fileId: string, status: FileUploadFile['status'], error?: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status, error } : f))
      );
    },
    []
  );

  const removeFile = React.useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const clearFiles = React.useCallback(() => {
    setFiles([]);
  }, []);

  const uploadFiles = React.useCallback(
    async (
      uploadFn: (
        file: File,
        onProgress: (progress: number) => void
      ) => Promise<string>
    ) => {
      const pendingFiles = files.filter((f) => f.status === 'pending');

      const uploadPromises = pendingFiles.map(async (fileData) => {
        updateFileStatus(fileData.id, 'uploading');

        try {
          const url = await uploadFn(fileData.file, (progress) => {
            updateFileProgress(fileData.id, progress);
          });

          updateFileStatus(fileData.id, 'completed');
          setFiles((prev) =>
            prev.map((f) => (f.id === fileData.id ? { ...f, url } : f))
          );

          return { success: true, fileId: fileData.id, url };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'upload failed';
          updateFileStatus(fileData.id, 'error', errorMessage);
          return { success: false, fileId: fileData.id, error: errorMessage };
        }
      });

      return Promise.all(uploadPromises);
    },
    [files, updateFileStatus, updateFileProgress]
  );

  return {
    files,
    setFiles,
    updateFileProgress,
    updateFileStatus,
    removeFile,
    clearFiles,
    uploadFiles,
  };
}
