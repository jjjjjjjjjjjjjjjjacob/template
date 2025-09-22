import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  FileCode,
  Maximize,
  Eye,
  MoreHorizontal,
  Image,
  type LucideIcon,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';
import { createInlineImageSyntax } from '../../lib/remark-inline-images';

interface FormattingToolbarProps {
  onAction: (action: string) => void;
  onToggleFullscreen?: () => void;
  onTogglePreview?: () => void;
  showPreviewButton?: boolean;
  availableImages?: Array<{ id: string; url: string; alt: string }>;
  onInsertImage?: (syntax: string) => void;
}

export function FormattingToolbar({
  onAction,
  onToggleFullscreen,
  onTogglePreview,
  showPreviewButton = false,
  availableImages = [],
  onInsertImage,
}: FormattingToolbarProps) {
  const handleInsertImage = (
    imageId: string,
    alt: string,
    position?: string,
    width?: string
  ) => {
    if (onInsertImage) {
      const syntax = createInlineImageSyntax(imageId, alt, position, width);
      onInsertImage(syntax);
    }
  };

  const primaryButtons = [
    { action: 'bold', icon: Bold, tooltip: 'bold (⌘B)', shortcut: '⌘B' },
    { action: 'italic', icon: Italic, tooltip: 'italic (⌘I)', shortcut: '⌘I' },
    { action: 'link', icon: Link, tooltip: 'link (⌘K)', shortcut: '⌘K' },
  ];

  const secondaryButtons = [
    { action: 'strikethrough', icon: Strikethrough, tooltip: 'strikethrough' },
    { action: 'code', icon: Code, tooltip: 'inline code' },
    { action: 'h1', icon: Heading1, tooltip: 'heading 1' },
    { action: 'h2', icon: Heading2, tooltip: 'heading 2' },
    { action: 'h3', icon: Heading3, tooltip: 'heading 3' },
    { action: 'ul', icon: List, tooltip: 'bullet list' },
    { action: 'ol', icon: ListOrdered, tooltip: 'numbered list' },
    { action: 'quote', icon: Quote, tooltip: 'blockquote' },
    { action: 'codeblock', icon: FileCode, tooltip: 'code block' },
  ];

  const ToolbarButton = ({
    action,
    icon: Icon,
    tooltip,
  }: {
    action: string;
    icon: LucideIcon;
    tooltip: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value={action}
            onClick={() => onAction(action)}
            size="sm"
            className="h-8 w-8"
          >
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="bg-muted/30 flex items-center gap-2 overflow-x-auto border-b p-3">
      {/* Mobile: Show primary buttons + more dropdown */}
      <div className="flex items-center gap-2 sm:hidden">
        <ToggleGroup type="multiple" className="gap-0.5">
          {primaryButtons.map((button) => (
            <ToolbarButton key={button.action} {...button} />
          ))}
        </ToggleGroup>

        {/* More dropdown for secondary buttons on mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {secondaryButtons.map((button) => (
              <DropdownMenuItem
                key={button.action}
                onClick={() => onAction(button.action)}
                className="flex items-center gap-2"
              >
                <button.icon className="h-4 w-4" />
                {button.tooltip}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Show all buttons in groups */}
      <div className="hidden items-center gap-2 sm:flex">
        <ToggleGroup type="multiple" className="gap-0.5">
          {primaryButtons.map((button) => (
            <ToolbarButton key={button.action} {...button} />
          ))}
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        <ToggleGroup type="multiple" className="gap-0.5">
          <ToolbarButton
            action="strikethrough"
            icon={Strikethrough}
            tooltip="strikethrough"
          />
          <ToolbarButton action="code" icon={Code} tooltip="inline code" />
          <ToolbarButton
            action="codeblock"
            icon={FileCode}
            tooltip="code block"
          />
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        <ToggleGroup type="multiple" className="gap-0.5">
          <ToolbarButton action="h1" icon={Heading1} tooltip="heading 1" />
          <ToolbarButton action="h2" icon={Heading2} tooltip="heading 2" />
          <ToolbarButton action="h3" icon={Heading3} tooltip="heading 3" />
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        <ToggleGroup type="multiple" className="gap-0.5">
          <ToolbarButton action="ul" icon={List} tooltip="bullet list" />
          <ToolbarButton
            action="ol"
            icon={ListOrdered}
            tooltip="numbered list"
          />
          <ToolbarButton action="quote" icon={Quote} tooltip="blockquote" />
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        <ToggleGroup type="multiple" className="gap-0.5">
          {availableImages.length > 0 && onInsertImage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ToggleGroupItem value="image" size="sm" className="h-8 w-8">
                  <Image className="h-4 w-4" />
                </ToggleGroupItem>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <div className="p-2">
                  <div className="mb-2 text-sm font-light">insert image</div>
                  {availableImages.slice(0, 5).map((image) => (
                    <DropdownMenuSub key={image.id}>
                      <DropdownMenuSubTrigger className="flex items-center gap-2">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="h-8 w-8 rounded object-cover"
                        />
                        <span className="truncate text-sm">
                          {image.alt || `image ${image.id.slice(-8)}`}
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => handleInsertImage(image.id, image.alt)}
                        >
                          center (default)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleInsertImage(image.id, image.alt, 'left')
                          }
                        >
                          float left
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleInsertImage(image.id, image.alt, 'right')
                          }
                        >
                          float right
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleInsertImage(image.id, image.alt, 'full-width')
                          }
                        >
                          full width
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                  {availableImages.length > 5 && (
                    <div className="text-muted-foreground p-2 text-xs">
                      and {availableImages.length - 5} more...
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="image"
                    size="sm"
                    className="h-8 w-8 opacity-50"
                    disabled
                  >
                    <Image className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>upload images first</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </ToggleGroup>
      </div>

      <div className="flex-1" />

      {/* Preview button for mobile */}
      {showPreviewButton && onTogglePreview && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePreview}
                className="h-8 w-8 p-0 sm:hidden"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>toggle preview</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Fullscreen button */}
      {onToggleFullscreen && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFullscreen}
                className="h-8 w-8 p-0"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>toggle fullscreen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
