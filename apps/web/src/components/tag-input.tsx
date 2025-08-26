import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Hash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@template/convex';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  validateTag?: (tag: string) => string | null; // Returns error message or null if valid
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder,
  maxTags,
  validateTag,
  disabled = false,
  className,
  'aria-label': ariaLabel = 'tag input',
  'aria-describedby': ariaDescribedBy,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  // Search for tags
  const { data: searchResults } = useQuery({
    ...convexQuery(api.tags.search, {
      searchTerm: inputValue,
      limit: 8,
    }),
    enabled: inputValue.length > 0,
  });

  // Get popular tags when no search term
  const { data: popularTags } = useQuery({
    ...convexQuery(api.tags.getPopular, { limit: 8 }),
    enabled: inputValue.length === 0 && showSuggestions,
  });

  const suggestions = inputValue ? searchResults : popularTags;

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();

    // Clear any previous error
    setError(null);

    // Validate tag
    if (!normalizedTag) {
      setError('tag cannot be empty');
      return;
    }

    if (tags.includes(normalizedTag)) {
      setError('tag already exists');
      return;
    }

    if (maxTags && tags.length >= maxTags) {
      setError(`maximum ${maxTags} tags allowed`);
      return;
    }

    // Custom validation
    if (validateTag) {
      const validationError = validateTag(normalizedTag);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onTagsChange([...tags, normalizedTag]);
    setInputValue('');
    setHighlightedIndex(-1);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const suggestionsList = suggestions || [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestionsList[highlightedIndex]) {
          handleAddTag(suggestionsList[highlightedIndex].name);
        } else if (inputValue) {
          handleAddTag(inputValue);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestionsList.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestionsList.length - 1
        );
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        setError(null);
        break;

      case 'Backspace':
        if (!inputValue && tags.length > 0) {
          e.preventDefault();
          handleRemoveTag(tags[tags.length - 1]);
        }
        break;

      case 'Tab':
        if (
          showSuggestions &&
          highlightedIndex >= 0 &&
          suggestionsList[highlightedIndex]
        ) {
          e.preventDefault();
          handleAddTag(suggestionsList[highlightedIndex].name);
        }
        break;
    }
  };

  // Reset highlighted index when suggestions change
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Clear error when input changes
  React.useEffect(() => {
    if (error && inputValue) {
      setError(null);
    }
  }, [inputValue, error]);

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div
        className="flex flex-wrap gap-2"
        role="list"
        aria-label="selected tags"
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="hover:bg-secondary/80 flex items-center gap-1 transition-colors"
            role="listitem"
          >
            <Hash className="h-3 w-3" />
            {tag}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveTag(tag)}
              disabled={disabled}
              className="h-3 w-3 p-0 hover:bg-transparent"
              aria-label={`remove tag ${tag}`}
              tabIndex={-1}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        {maxTags && (
          <span className="text-muted-foreground self-center text-xs">
            {tags.length}/{maxTags}
          </span>
        )}
      </div>
      <Command
        className={`rounded-md border ${error ? 'border-destructive' : ''}`}
      >
        <CommandInput
          placeholder={placeholder || 'search or create tags...'}
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!disabled) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() =>
            setTimeout(() => {
              setShowSuggestions(false);
              setHighlightedIndex(-1);
            }, 200)
          }
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={showSuggestions}
          aria-activedescendant={
            highlightedIndex >= 0 ? `tag-option-${highlightedIndex}` : undefined
          }
        />
        {showSuggestions && (
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <div
                  className="cursor-pointer px-2 py-1.5 text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddTag(inputValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAddTag(inputValue);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <div className="flex items-center">
                    <Hash className="mr-2 h-4 w-4" />
                    create "{inputValue.toLowerCase()}"
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  no tags found
                </div>
              )}
            </CommandEmpty>
            {suggestions && suggestions.length > 0 && (
              <CommandGroup
                heading={inputValue ? 'matching tags' : 'popular tags'}
              >
                {suggestions.map((tag, index) => (
                  <CommandItem
                    key={tag._id}
                    value={tag.name}
                    onSelect={() => handleAddTag(tag.name)}
                    className={`cursor-pointer ${
                      index === highlightedIndex
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                    id={`tag-option-${index}`}
                    aria-selected={index === highlightedIndex}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    <span className="flex-1">{tag.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {tag.count} item{tag.count !== 1 ? 's' : ''}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
      {error && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
      <p className="text-muted-foreground text-xs">
        start typing to search existing tags or create new ones
        {maxTags && ` (${tags.length}/${maxTags})`}
      </p>
    </div>
  );
}
