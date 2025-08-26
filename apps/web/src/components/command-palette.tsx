import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  User,
  Tag,
  Plus,
  Settings,
  History,
  TrendingUp,
  X,
  Sparkles,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
// import { cn } from '@/utils/tailwind-utils';
import { useSearch } from '@/features/search/hooks/use-search';
import { useSearchCache } from '@/features/search/hooks/use-search-cache';
import type {
  ItemSearchResult,
  UserSearchResult,
  TagSearchResult,
  ActionSearchResult,
} from '@template/types';

interface ReviewSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  itemId: string;
  rating?: number;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = React.useState('');
  const { preloadQueries } = useSearchCache();

  const {
    query,
    setQuery,
    results,
    isSearching,
    suggestions,
    history,
    activeCategory,
    toggleCategory,
    clearHistory,
  } = useSearch({
    debounceMs: 200,
    minQueryLength: 1,
    instantSearch: true,
  });

  // Preload common queries on mount
  React.useEffect(() => {
    const commonQueries = ['create', 'profile', 'settings', 'help'];
    preloadQueries(commonQueries, async () => {
      // This would be replaced with actual API call
      return { items: [], users: [], tags: [] };
    });
  }, [preloadQueries]);

  // Update query when input changes
  React.useEffect(() => {
    setQuery(inputValue);
  }, [inputValue, setQuery]);

  // Handle item selection
  const handleSelect = React.useCallback(
    (type: string, id?: string, action?: string) => {
      onOpenChange(false);
      setInputValue('');

      switch (type) {
        case 'item':
          // TODO: Implement search page with query params
          navigate({ to: '/' });
          break;
        case 'user':
          // TODO: Implement user profile pages
          navigate({ to: '/' });
          break;
        case 'tag':
          // TODO: Implement search page with tag filtering
          navigate({ to: '/' });
          break;
        case 'action':
          switch (action) {
            case 'create':
              navigate({ to: '/' });
              break;
            case 'profile':
              // TODO: Implement profile page
              navigate({ to: '/' });
              break;
            case 'settings':
              // TODO: Implement settings page
              navigate({ to: '/' });
              break;
          }
          break;
        case 'review':
          // TODO: Implement search page for reviews
          navigate({ to: '/' });
          break;
      }
    },
    [navigate, onOpenChange]
  );

  // Category filters
  const categories = [
    { value: 'item', label: 'items', icon: Sparkles },
    { value: 'user', label: 'users', icon: User },
    { value: 'tag', label: 'tags', icon: Tag },
    { value: 'review', label: 'reviews', icon: MessageSquare },
  ];

  // Get icon for action
  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'create':
        return Plus;
      case 'profile':
        return User;
      case 'settings':
        return Settings;
      default:
        return FileText;
    }
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="command palette"
      description="search for items, users, tags, and more..."
    >
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="type to search..."
          value={inputValue}
          onValueChange={setInputValue}
          className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        {inputValue && (
          <button
            onClick={() => setInputValue('')}
            className="ml-2 rounded-sm opacity-50 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Badge
              key={category.value}
              variant={
                activeCategory === category.value ? 'default' : 'outline'
              }
              className="cursor-pointer"
              onClick={() => toggleCategory(category.value)}
            >
              <Icon className="mr-1 h-3 w-3" />
              {category.label}
            </Badge>
          );
        })}
      </div>

      <CommandList>
        <CommandEmpty>
          {isSearching ? 'searching...' : 'no results found.'}
        </CommandEmpty>

        {/* Recent searches */}
        {!query && history.length > 0 && (
          <CommandGroup heading="recent searches">
            {history.map((term) => (
              <CommandItem
                key={term}
                value={term}
                onSelect={() => setInputValue(term)}
              >
                <History className="mr-2 h-4 w-4" />
                <span>{term}</span>
              </CommandItem>
            ))}
            <CommandItem onSelect={clearHistory}>
              <X className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">clear history</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Trending searches */}
        {!query && Array.isArray(suggestions) && suggestions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="trending">
              {suggestions.map((term: string) => (
                <CommandItem
                  key={term}
                  value={term}
                  onSelect={() => setInputValue(term)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>{term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search results - Items */}
        {results?.items && results.items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="items">
              {results.items.map((item: ItemSearchResult) => (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect('item', item.id)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <span>{item.title}</span>
                      {item.subtitle && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    {item.score && (
                      <Badge variant="secondary" className="ml-2">
                        ⭐ {item.score.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search results - Users */}
        {results?.users && results.users.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="users">
              {results.users.map((user: UserSearchResult) => (
                <CommandItem
                  key={user.id}
                  value={user.username}
                  onSelect={() => handleSelect('user', user.username)}
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <span>{user.username}</span>
                      {user.subtitle && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {user.subtitle}
                        </span>
                      )}
                    </div>
                    {user.itemCount && user.itemCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {user.itemCount} items
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search results - Tags */}
        {results?.tags && results.tags.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="tags">
              {results.tags.map((tag: TagSearchResult) => (
                <CommandItem
                  key={tag.id}
                  value={tag.title}
                  onSelect={() => handleSelect('tag', tag.id)}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  <div className="flex flex-1 items-center justify-between">
                    <span>{tag.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {tag.count}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search results - Actions */}
        {results?.actions && results.actions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="actions">
              {results.actions.map((action: ActionSearchResult) => {
                const Icon = getActionIcon(action.action);
                return (
                  <CommandItem
                    key={action.id}
                    value={action.title}
                    onSelect={() =>
                      handleSelect('action', undefined, action.action)
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div>
                      <span>{action.title}</span>
                      {action.subtitle && (
                        <span className="text-muted-foreground ml-2 text-xs">
                          {action.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Search results - Reviews */}
        {results?.reviews && results.reviews.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="reviews">
              {results.reviews.map((review: ReviewSearchResult) => (
                <CommandItem
                  key={review.id}
                  value={review.title}
                  onSelect={() => handleSelect('review', review.itemId)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <span className="line-clamp-1">{review.title}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {review.subtitle}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Quick actions when no query */}
        {!query && (
          <>
            <CommandSeparator />
            <CommandGroup heading="quick actions">
              <CommandItem
                onSelect={() => handleSelect('action', undefined, 'create')}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>create new item</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect('action', undefined, 'profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>view profile</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect('action', undefined, 'settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>open settings</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
