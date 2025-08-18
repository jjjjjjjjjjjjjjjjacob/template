// Re-export shared types from @template/types
export type { User, Item, Rating } from '@template/types';

// Local types
export interface EmojiReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface EmojiRating {
  emoji: string;
  value: number;
  count: number;
  tags?: string[];
}
