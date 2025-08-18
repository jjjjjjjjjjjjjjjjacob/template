import React from 'react';

interface UserProfileViewProps {
  user: any;
  userItems?: any[];
  itemsLoading?: boolean;
  scopedTheme?: boolean;
}

export function UserProfileView({
  user,
  userItems,
  itemsLoading,
  scopedTheme,
}: UserProfileViewProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>

        {/* TODO: Implement full user profile view */}
        <div className="text-muted-foreground text-center">
          User profile view component placeholder
        </div>
      </div>
    </div>
  );
}
