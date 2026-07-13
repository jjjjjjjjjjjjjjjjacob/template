import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type {
  ItemSearchResult,
  UserSearchResult,
  TagSearchResult,
  ActionSearchResult,
} from '@template/types';
import { fuzzyMatch } from './search/fuzzy_search';
import { scoreItem, scoreUser, scoreTag } from './search/search_scorer';
import { parseSearchQuery } from './search/search_utils';

// Main search function
export const searchAll = query({
  args: {
    query: v.string(),
    filters: v.optional(
      v.object({
        tags: v.optional(v.array(v.string())),
        dateRange: v.optional(
          v.object({
            start: v.string(),
            end: v.string(),
          })
        ),
        creators: v.optional(v.array(v.string())),
        sort: v.optional(
          v.union(
            v.literal('relevance'),
            v.literal('recent'),
            v.literal('oldest'),
            v.literal('name'),
            v.literal('creation_date'),
            v.literal('updated_date'),
            v.literal('rating_desc'),
            v.literal('rating_asc'),
            v.literal('top_rated'),
            v.literal('most_rated'),
            v.literal('interaction_time')
          )
        ),
      })
    ),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    cursor: v.optional(v.string()),
    includeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const {
      query: searchQuery,
      filters,
      limit = 20,
      page = 1,
      includeTypes,
    } = args;

    const items: ItemSearchResult[] = [];
    const users: UserSearchResult[] = [];
    const tags: TagSearchResult[] = [];
    const actions: ActionSearchResult[] = [];

    if (!searchQuery.trim() && !filters) {
      return {
        items: [],
        users: [],
        tags: [],
        actions: [],
        totalCount: 0,
      };
    }

    // Parse the query for advanced operators
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchText = parsedQuery.terms
      .concat(parsedQuery.exactPhrases)
      .join(' ')
      .toLowerCase();

    // Merge parsed filters with provided filters
    const mergedFilters = {
      ...filters,
      tags: filters?.tags
        ? filters.tags.concat(parsedQuery.tags)
        : parsedQuery.tags,
      dateRange:
        filters?.dateRange ||
        (parsedQuery.filters.dateAfter || parsedQuery.filters.dateBefore
          ? {
              start: parsedQuery.filters.dateAfter || '1970-01-01',
              end:
                parsedQuery.filters.dateBefore ||
                new Date().toISOString().split('T')[0],
            }
          : undefined),
      creators:
        filters?.creators ||
        (parsedQuery.filters.user
          ? new Array(parsedQuery.filters.user)
          : undefined),
    };

    // Search items
    if (!includeTypes || includeTypes.includes('item')) {
      const allItems = await ctx.db.query('items').collect();

      for (const item of allItems) {
        let titleMatch = false;
        let descriptionMatch = false;
        let tagMatch = false;

        // Check exact phrases first
        if (parsedQuery.exactPhrases.length > 0) {
          let allPhrasesMatch = true;
          for (const phrase of parsedQuery.exactPhrases) {
            const phraseInTitle = item.title
              .toLowerCase()
              .includes(phrase.toLowerCase());
            const phraseInDesc = item.description
              .toLowerCase()
              .includes(phrase.toLowerCase());
            const phraseInTags =
              item.tags?.some((tag) =>
                tag.toLowerCase().includes(phrase.toLowerCase())
              ) || false;

            if (!phraseInTitle && !phraseInDesc && !phraseInTags) {
              allPhrasesMatch = false;
              break;
            }
          }

          if (allPhrasesMatch) {
            titleMatch = true;
            descriptionMatch = true;
            tagMatch = true;
          }
        } else {
          // If no exact phrases, use fuzzy matching
          titleMatch = fuzzyMatch(item.title, searchText);
          descriptionMatch = fuzzyMatch(item.description, searchText);
          tagMatch =
            item.tags?.some((tag) => fuzzyMatch(tag, searchText)) || false;
        }

        // Check for excluded terms
        const hasExcludedTerm = parsedQuery.excludedTerms.some(
          (term) =>
            item.title.toLowerCase().includes(term.toLowerCase()) ||
            item.description.toLowerCase().includes(term.toLowerCase()) ||
            item.tags?.some((tag) =>
              tag.toLowerCase().includes(term.toLowerCase())
            )
        );

        if (hasExcludedTerm) continue;

        if (titleMatch || descriptionMatch || tagMatch || !searchQuery.trim()) {
          let passesFilters = true;

          // Tag filter
          if (mergedFilters.tags && mergedFilters.tags.length > 0) {
            passesFilters =
              passesFilters &&
              (item.tags?.some((tag) => mergedFilters.tags!.includes(tag)) ??
                false);
          }

          // Date range filter
          if (mergedFilters.dateRange) {
            const itemDate = new Date(item.createdAt).getTime();
            const startDate = new Date(mergedFilters.dateRange.start).getTime();
            const endDate = new Date(mergedFilters.dateRange.end).getTime();
            passesFilters =
              passesFilters && itemDate >= startDate && itemDate <= endDate;
          }

          // Creator filter
          if (mergedFilters.creators && mergedFilters.creators.length > 0) {
            passesFilters =
              passesFilters &&
              mergedFilters.creators.includes(item.createdById);
          }

          if (passesFilters) {
            // Get creator info
            const creator = await ctx.db
              .query('users')
              .withIndex('by_external_id', (q) =>
                q.eq('external_id', item.createdById)
              )
              .first();

            // Calculate relevance score
            const score = scoreItem(
              {
                title: item.title,
                description: item.description,
                tags: item.tags,
                createdAt: item.createdAt,
              },
              searchText
            );

            const itemResult: ItemSearchResult = {
              id: item.id,
              type: 'item',
              title: item.title,
              subtitle: creator?.username || 'Unknown creator',
              image: item.image,
              description: item.description,
              tags: item.tags,
              category: item.category,
              status: item.status,
              score,
              createdBy: creator
                ? {
                    id: creator.external_id,
                    name: creator.username || creator.name || 'Unknown',
                    avatar: creator.image_url,
                  }
                : undefined,
            };
            items.push(itemResult);
          }
        }
      }
    }

    // Search users
    if (!includeTypes || includeTypes.includes('user')) {
      const allUsers = await ctx.db.query('users').collect();

      for (const user of allUsers) {
        const username = user.username || '';
        const fullName =
          user.name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const bio = user.bio || '';

        // Check fuzzy matching
        const usernameMatch = fuzzyMatch(username, searchText);
        const nameMatch = fuzzyMatch(fullName, searchText);
        const bioMatch = fuzzyMatch(bio, searchText);

        // Check for excluded terms
        const hasExcludedTerm = parsedQuery.excludedTerms.some(
          (term) =>
            username.toLowerCase().includes(term.toLowerCase()) ||
            fullName.toLowerCase().includes(term.toLowerCase()) ||
            bio.toLowerCase().includes(term.toLowerCase())
        );

        if (hasExcludedTerm) continue;

        if (usernameMatch || nameMatch || bioMatch || !searchQuery.trim()) {
          // Apply creator filter if specified
          if (
            parsedQuery.filters.user &&
            username.toLowerCase() !== parsedQuery.filters.user.toLowerCase()
          ) {
            continue;
          }

          // Get item count
          const userItems = await ctx.db
            .query('items')
            .withIndex('createdBy', (q) =>
              q.eq('createdById', user.external_id)
            )
            .collect();

          // Calculate relevance score
          const score = scoreUser(
            {
              username,
              fullName,
              bio,
              itemCount: userItems.length,
            },
            searchText
          );

          const userResult: UserSearchResult = {
            id: user.external_id,
            type: 'user',
            title: user.username || user.name || 'Unknown user',
            subtitle: fullName || undefined,
            image: user.image_url,
            username: user.username || 'unknown',
            itemCount: userItems.length,
            score,
          };
          users.push(userResult);
        }
      }
    }

    // Search tags
    if (!includeTypes || includeTypes.includes('tag')) {
      // Get all items to aggregate tags
      const itemsWithTags = await ctx.db.query('items').collect();

      const tagCounts = new Map<string, number>();
      itemsWithTags.forEach((item) => {
        item.tags?.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      tagCounts.forEach((count, tag) => {
        // Check fuzzy matching
        const tagMatch = fuzzyMatch(tag, searchText);

        // Check for excluded terms
        const hasExcludedTerm = parsedQuery.excludedTerms.some((term) =>
          tag.toLowerCase().includes(term.toLowerCase())
        );

        if (hasExcludedTerm) return;

        if (tagMatch) {
          // Calculate relevance score
          const score = scoreTag(
            {
              name: tag,
              count,
            },
            searchText
          );

          const tagResult: TagSearchResult = {
            id: tag,
            type: 'tag',
            title: tag,
            subtitle: `${count} item${count !== 1 ? 's' : ''}`,
            count,
            score,
          };
          tags.push(tagResult);
        }
      });
    }

    // Add action suggestions
    if (!includeTypes || includeTypes.includes('action')) {
      const lowerQuery = searchQuery.toLowerCase();

      // Check for "create" related queries
      if (
        lowerQuery.includes('create') ||
        lowerQuery.includes('new') ||
        lowerQuery.includes('add')
      ) {
        actions.push({
          id: 'create-item',
          type: 'action',
          title: 'Create a new item',
          subtitle: 'Add something to the collection',
          action: 'create',
          icon: 'plus',
          score: fuzzyMatch('create', lowerQuery) ? 0.9 : 0.5,
        });
      }

      // Check for "profile" related queries
      if (
        lowerQuery.includes('profile') ||
        lowerQuery.includes('my') ||
        lowerQuery.includes('account')
      ) {
        actions.push({
          id: 'view-profile',
          type: 'action',
          title: 'View your profile',
          subtitle: 'See your items and stats',
          action: 'profile',
          icon: 'user',
          score: fuzzyMatch('profile', lowerQuery) ? 0.9 : 0.5,
        });
      }

      // Check for "settings" related queries
      if (
        lowerQuery.includes('setting') ||
        lowerQuery.includes('preference') ||
        lowerQuery.includes('config')
      ) {
        actions.push({
          id: 'open-settings',
          type: 'action',
          title: 'Open settings',
          subtitle: 'Manage your account preferences',
          action: 'settings',
          icon: 'settings',
          score: fuzzyMatch('settings', lowerQuery) ? 0.9 : 0.5,
        });
      }
    }

    // Apply sorting
    const sortOption = mergedFilters.sort || 'relevance';
    if (sortOption === 'relevance') {
      items.sort((a, b) => (b.score || 0) - (a.score || 0));
      users.sort((a, b) => (b.score || 0) - (a.score || 0));
      tags.sort((a, b) => (b.score || 0) - (a.score || 0));
      actions.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortOption === 'name') {
      items.sort((a, b) => a.title.localeCompare(b.title));
      users.sort((a, b) => a.title.localeCompare(b.title));
      tags.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'recent' || sortOption === 'creation_date') {
      // Keep default order since items are ordered by creation time
    } else if (sortOption === 'oldest') {
      items.reverse();
      users.reverse();
      tags.reverse();
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    let paginatedItems: ItemSearchResult[];
    let paginatedUsers: UserSearchResult[];
    let paginatedTags: TagSearchResult[];
    let paginatedActions: ActionSearchResult[];
    let totalCount: number;

    if (includeTypes && includeTypes.length === 1) {
      // Single type filter - paginate within that type only
      const singleType = includeTypes[0];
      switch (singleType) {
        case 'item':
          totalCount = items.length;
          paginatedItems = items.slice(offset, offset + limit);
          paginatedUsers = [];
          paginatedTags = [];
          paginatedActions = [];
          break;
        case 'user':
          totalCount = users.length;
          paginatedItems = [];
          paginatedUsers = users.slice(offset, offset + limit);
          paginatedTags = [];
          paginatedActions = [];
          break;
        case 'tag':
          totalCount = tags.length;
          paginatedItems = [];
          paginatedUsers = [];
          paginatedTags = tags.slice(offset, offset + limit);
          paginatedActions = [];
          break;
        case 'action':
          totalCount = actions.length;
          paginatedItems = [];
          paginatedUsers = [];
          paginatedTags = [];
          paginatedActions = actions.slice(offset, offset + limit);
          break;
        default: {
          // Fallback to combined pagination
          totalCount =
            items.length + users.length + tags.length + actions.length;
          const allResults = [
            ...items.map((item) => ({ ...item, resultType: 'item' as const })),
            ...users.map((item) => ({ ...item, resultType: 'user' as const })),
            ...tags.map((item) => ({ ...item, resultType: 'tag' as const })),
            ...actions.map((item) => ({
              ...item,
              resultType: 'action' as const,
            })),
          ];
          const paginatedResults = allResults.slice(offset, offset + limit);
          paginatedItems = paginatedResults
            .filter((item) => item.resultType === 'item')

            .map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ resultType: _resultType, ...item }) => item
            ) as ItemSearchResult[];
          paginatedUsers = paginatedResults
            .filter((item) => item.resultType === 'user')

            .map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ resultType: _resultType, ...item }) => item
            ) as UserSearchResult[];
          paginatedTags = paginatedResults
            .filter((item) => item.resultType === 'tag')

            .map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ resultType: _resultType, ...item }) => item
            ) as TagSearchResult[];
          paginatedActions = paginatedResults
            .filter((item) => item.resultType === 'action')

            .map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ resultType: _resultType, ...item }) => item
            ) as ActionSearchResult[];
          break;
        }
      }
    } else {
      // Multiple types or no filter - use combined pagination
      totalCount = items.length + users.length + tags.length + actions.length;
      const allResults = [
        ...items.map((item) => ({ ...item, resultType: 'item' as const })),
        ...users.map((item) => ({ ...item, resultType: 'user' as const })),
        ...tags.map((item) => ({ ...item, resultType: 'tag' as const })),
        ...actions.map((item) => ({ ...item, resultType: 'action' as const })),
      ];
      const paginatedResults = allResults.slice(offset, offset + limit);
      paginatedItems = paginatedResults
        .filter((item) => item.resultType === 'item')

        .map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ resultType: _resultType, ...item }) => item
        ) as ItemSearchResult[];
      paginatedUsers = paginatedResults
        .filter((item) => item.resultType === 'user')

        .map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ resultType: _resultType, ...item }) => item
        ) as UserSearchResult[];
      paginatedTags = paginatedResults
        .filter((item) => item.resultType === 'tag')

        .map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ resultType: _resultType, ...item }) => item
        ) as TagSearchResult[];
      paginatedActions = paginatedResults
        .filter((item) => item.resultType === 'action')

        .map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ resultType: _resultType, ...item }) => item
        ) as ActionSearchResult[];
    }

    return {
      items: paginatedItems,
      users: paginatedUsers,
      tags: paginatedTags,
      actions: paginatedActions,
      reviews: [], // Empty for now, can be implemented later
      totalCount,
    };
  },
});

// Quick suggestions for command palette
export const getSearchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery } = args;
    const results: {
      items: ItemSearchResult[];
      users: UserSearchResult[];
      tags: TagSearchResult[];
      actions: ActionSearchResult[];
    } = {
      items: [],
      users: [],
      tags: [],
      actions: [],
    };

    if (!searchQuery.trim()) {
      // Return recent searches and trending items when query is empty
      const currentUser = await ctx.auth.getUserIdentity();
      let recentSearches: string[] = [];

      if (currentUser) {
        const recentSearchHistory = await ctx.db
          .query('searchHistory')
          .withIndex('byUser', (q) => q.eq('userId', currentUser.subject))
          .order('desc')
          .take(5);

        recentSearches = recentSearchHistory.map((search) => search.query);
      }

      // Get trending searches
      const trendingSearches = await ctx.db
        .query('trendingSearches')
        .withIndex('byCount')
        .order('desc')
        .take(5);

      // Get popular tags as fallback suggestions
      const allItems = await ctx.db.query('items').collect();
      const tagCounts = new Map<string, number>();
      allItems.forEach((item) => {
        item.tags?.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const popularTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);

      return {
        recentSearches,
        trendingSearches: trendingSearches.map((t) => t.term),
        popularTags,
        items: [],
        users: [],
        tags: [],
        actions: [],
      };
    }

    // Implement quick search for suggestions with fuzzy matching
    const parsedQuery = parseSearchQuery(searchQuery);
    const searchText = parsedQuery.terms
      .concat(parsedQuery.exactPhrases)
      .join(' ')
      .toLowerCase();

    // Search items (limit to 5)
    const items = await ctx.db.query('items').collect();
    for (const item of items) {
      if (results.items.length >= 5) break;

      const matches =
        fuzzyMatch(item.title, searchText) ||
        fuzzyMatch(item.description, searchText) ||
        item.tags?.some((tag) => fuzzyMatch(tag, searchText));

      if (matches) {
        const creator = await ctx.db
          .query('users')
          .withIndex('by_external_id', (q) =>
            q.eq('external_id', item.createdById)
          )
          .first();

        results.items.push({
          id: item.id,
          type: 'item',
          title: item.title,
          subtitle: creator?.username || 'Unknown creator',
          image: item.image,
          description: item.description,
          tags: item.tags,
          category: item.category,
          status: item.status,
          createdBy: creator
            ? {
                id: creator.external_id,
                name: creator.username || creator.name || 'Unknown',
                avatar: creator.image_url,
              }
            : undefined,
        });
      }
    }

    // Search users (limit to 3)
    const users = await ctx.db.query('users').collect();
    for (const user of users) {
      if (results.users.length >= 3) break;

      const username = user.username || '';
      const fullName =
        user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

      if (
        fuzzyMatch(username, searchText) ||
        fuzzyMatch(fullName, searchText)
      ) {
        const userItems = await ctx.db
          .query('items')
          .withIndex('createdBy', (q) => q.eq('createdById', user.external_id))
          .collect();

        results.users.push({
          id: user.external_id,
          type: 'user',
          title: user.username || user.name || 'Unknown user',
          subtitle: fullName || undefined,
          image: user.image_url,
          username: user.username || 'unknown',
          itemCount: userItems.length,
        });
      }
    }

    // Search tags (limit 5)
    const itemsWithTags = await ctx.db.query('items').collect();
    const tagCounts = new Map<string, number>();
    itemsWithTags.forEach((item) => {
      item.tags?.forEach((tag) => {
        if (fuzzyMatch(tag, searchText) && results.tags.length < 5) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      });
    });

    tagCounts.forEach((count, tag) => {
      if (results.tags.length < 5) {
        results.tags.push({
          id: tag,
          type: 'tag',
          title: tag,
          subtitle: `${count} item${count !== 1 ? 's' : ''}`,
          count,
        });
      }
    });

    // Add action suggestions (limit 3)
    const lowerQuery = searchQuery.toLowerCase();

    if (
      results.actions.length < 3 &&
      (lowerQuery.includes('create') ||
        lowerQuery.includes('new') ||
        lowerQuery.includes('add'))
    ) {
      results.actions.push({
        id: 'create-item',
        type: 'action',
        title: 'Create a new item',
        subtitle: 'Add something to the collection',
        action: 'create',
        icon: 'plus',
      });
    }

    if (
      results.actions.length < 3 &&
      (lowerQuery.includes('profile') ||
        lowerQuery.includes('my') ||
        lowerQuery.includes('account'))
    ) {
      results.actions.push({
        id: 'view-profile',
        type: 'action',
        title: 'View your profile',
        subtitle: 'See your items and stats',
        action: 'profile',
        icon: 'user',
      });
    }

    if (
      results.actions.length < 3 &&
      (lowerQuery.includes('setting') ||
        lowerQuery.includes('preference') ||
        lowerQuery.includes('config'))
    ) {
      results.actions.push({
        id: 'open-settings',
        type: 'action',
        title: 'Open settings',
        subtitle: 'Manage your account preferences',
        action: 'settings',
        icon: 'settings',
      });
    }

    return results;
  },
});

// Get trending searches
export const getTrendingSearches = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { limit = 10 } = args;

    const trending = await ctx.db
      .query('trendingSearches')
      .withIndex('byCount')
      .order('desc')
      .take(limit);

    return trending.map((item) => ({
      term: item.term,
      count: item.count,
      category: item.category,
    }));
  },
});

// Track search (mutation)
export const trackSearch = mutation({
  args: {
    query: v.string(),
    resultCount: v.number(),
    clickedResults: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { query, resultCount, clickedResults } = args;
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error('User must be authenticated to track searches');
    }

    // Record search history
    await ctx.db.insert('searchHistory', {
      userId: identity.subject,
      query,
      timestamp: Date.now(),
      resultCount,
      clickedResults,
    });

    // Update trending searches
    const normalizedQuery = query.toLowerCase().trim();
    const existing = await ctx.db
      .query('trendingSearches')
      .withIndex('byTerm', (q) => q.eq('term', normalizedQuery))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        count: existing.count + 1,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert('trendingSearches', {
        term: normalizedQuery,
        count: 1,
        lastUpdated: Date.now(),
      });
    }

    // Clean up old trending searches (keep top 100)
    const allTrending = await ctx.db
      .query('trendingSearches')
      .withIndex('byCount')
      .order('desc')
      .collect();

    if (allTrending.length > 100) {
      const toDelete = allTrending.slice(100);
      for (const item of toDelete) {
        await ctx.db.delete(item._id);
      }
    }
  },
});
