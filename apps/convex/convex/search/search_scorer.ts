import { fuzzyScore } from './fuzzy_search';
import type {
  ItemSearchResult,
  UserSearchResult,
  TagSearchResult,
} from '@template/types';

/**
 * Advanced relevance scoring system for search results
 */

interface ScoringWeights {
  exactMatch: number;
  fuzzyMatch: number;
  titleMatch: number;
  descriptionMatch: number;
  tagMatch: number;
  usernameMatch: number;
  popularity: number;
  recency: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  exactMatch: 100,
  fuzzyMatch: 50,
  titleMatch: 30,
  descriptionMatch: 20,
  tagMatch: 25,
  usernameMatch: 40,
  popularity: 15,
  recency: 10,
};

/**
 * Calculate relevance score for an item
 */
export function scoreItem(
  item: {
    title: string;
    description: string;
    tags?: string[];
    createdAt: string | number;
    rating?: number;
    ratingCount?: number;
  },
  query: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;

  // Title matching
  const titleScore = fuzzyScore(item.title, normalizedQuery);
  score += (titleScore / 100) * w.titleMatch;

  // Description matching
  const descScore = fuzzyScore(item.description, normalizedQuery);
  score += (descScore / 100) * w.descriptionMatch;

  // Bonus for multiple occurrences of the query term
  // Escape special regex characters
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleOccurrences = (
    item.title.toLowerCase().match(new RegExp(escapedQuery, 'g')) || []
  ).length;
  const descOccurrences = (
    item.description.toLowerCase().match(new RegExp(escapedQuery, 'g')) || []
  ).length;

  // Each additional occurrence adds bonus points
  if (titleOccurrences > 1) {
    score += (titleOccurrences - 1) * 10; // 10 points per extra occurrence in title
  }
  if (descOccurrences > 1) {
    score += (descOccurrences - 1) * 5; // 5 points per extra occurrence in description
  }

  // Tag matching
  if (item.tags && item.tags.length > 0) {
    const tagScores = item.tags.map((tag) => fuzzyScore(tag, normalizedQuery));
    const maxTagScore = Math.max(...tagScores);
    score += (maxTagScore / 100) * w.tagMatch;
  }

  // Rating boost (if available)
  if (item.rating && item.ratingCount) {
    const ratingScore = (item.rating / 5) * Math.min(item.ratingCount / 10, 1);
    score += ratingScore * w.popularity;
  }

  // Recency boost
  const createdAtTime =
    typeof item.createdAt === 'string'
      ? new Date(item.createdAt).getTime()
      : item.createdAt;
  const ageInDays = (Date.now() - createdAtTime) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - ageInDays / 365); // Decay over a year
  score += recencyScore * w.recency;

  return score;
}

/**
 * Calculate relevance score for a user
 */
export function scoreUser(
  user: {
    username?: string;
    fullName?: string;
    bio?: string;
    itemCount?: number;
  },
  query: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;

  // Username matching (highest priority)
  if (user.username) {
    const usernameScore = fuzzyScore(user.username, normalizedQuery);
    score += (usernameScore / 100) * w.usernameMatch;

    // Exact username match bonus
    if (user.username.toLowerCase() === normalizedQuery) {
      score += w.exactMatch;
    }
  }

  // Full name matching
  if (user.fullName) {
    const nameScore = fuzzyScore(user.fullName, normalizedQuery);
    score += (nameScore / 100) * w.titleMatch;
  }

  // Bio matching
  if (user.bio) {
    const bioScore = fuzzyScore(user.bio, normalizedQuery);
    score += (bioScore / 100) * w.descriptionMatch * 0.5; // Lower weight for bio
  }

  // Activity boost
  const totalActivity = user.itemCount || 0;
  if (totalActivity > 0) {
    const activityScore = Math.min(totalActivity / 20, 1); // Normalize to 0-1
    score += activityScore * w.popularity;
  }

  return score;
}

/**
 * Calculate relevance score for a tag
 */
export function scoreTag(
  tag: {
    name: string;
    count: number;
  },
  query: string,
  weights: Partial<ScoringWeights> = {}
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;

  // Tag name matching
  const tagScore = fuzzyScore(tag.name, normalizedQuery);
  score += (tagScore / 100) * w.tagMatch;

  // Exact match bonus
  if (tag.name.toLowerCase() === normalizedQuery) {
    score += w.exactMatch;
  }

  // Popularity boost based on usage count
  const popularityScore = Math.min(tag.count / 100, 1); // Normalize to 0-1
  score += popularityScore * w.popularity;

  return score;
}

/**
 * Re-rank search results based on advanced scoring
 */
export function rerankResults<T extends { score?: number }>(
  results: T[],
  query: string
): T[] {
  const rescoredResults = results.map((result) => {
    let newScore = result.score || 0;

    // Apply type-specific scoring
    if ('type' in result) {
      switch (result.type) {
        case 'item': {
          const itemResult = result as unknown as ItemSearchResult;
          newScore = scoreItem(
            {
              title: itemResult.title,
              description: itemResult.description || '',
              tags: itemResult.tags,
              createdAt: new Date().toISOString(), // Would need actual date
            },
            query
          );
          break;
        }
        case 'user': {
          const userResult = result as unknown as UserSearchResult;
          newScore = scoreUser(
            {
              username: userResult.username,
              fullName: userResult.subtitle,
              itemCount: userResult.itemCount,
            },
            query
          );
          break;
        }
        case 'tag': {
          const tagResult = result as unknown as TagSearchResult;
          newScore = scoreTag(
            {
              name: tagResult.title,
              count: tagResult.count || 0,
            },
            query
          );
          break;
        }
      }
    }

    return { ...result, score: newScore };
  });

  // Sort by score descending
  return rescoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
}
