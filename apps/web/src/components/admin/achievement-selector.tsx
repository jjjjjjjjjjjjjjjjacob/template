import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind-utils';

export interface Achievement {
  description: string;
  impact?: string;
  technologies: string[];
  domains: string[];
  type: string;
  priority: number;
  included?: boolean;
}

interface AchievementSelectorProps {
  achievements: Achievement[];
  onAchievementsChange: (achievements: Achievement[]) => void;
  className?: string;
}

export function AchievementSelector({
  achievements,
  onAchievementsChange,
  className,
}: AchievementSelectorProps) {
  const sortedAchievements = [...achievements].sort(
    (a, b) => b.priority - a.priority
  );

  const toggleAchievement = (index: number) => {
    const originalIndex = achievements.findIndex(
      (a) => a === sortedAchievements[index]
    );
    const updated = [...achievements];
    updated[originalIndex] = {
      ...updated[originalIndex],
      included: !updated[originalIndex].included,
    };
    onAchievementsChange(updated);
  };

  const selectAll = () => {
    onAchievementsChange(achievements.map((a) => ({ ...a, included: true })));
  };

  const deselectAll = () => {
    onAchievementsChange(achievements.map((a) => ({ ...a, included: false })));
  };

  const includedCount = achievements.filter((a) => a.included !== false).length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {includedCount} of {achievements.length} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-primary text-xs hover:underline"
          >
            select all
          </button>
          <span className="text-muted-foreground text-xs">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-muted-foreground text-xs hover:underline"
          >
            deselect all
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedAchievements.map((achievement, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              achievement.included !== false
                ? 'border-primary/20 bg-primary/5'
                : 'border-muted bg-muted/30 opacity-60'
            )}
          >
            <Checkbox
              checked={achievement.included !== false}
              onCheckedChange={() => toggleAchievement(index)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm leading-relaxed">
                {achievement.description}
              </p>

              {achievement.impact && (
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium">impact:</span>{' '}
                  {achievement.impact}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {achievement.type}
                </Badge>

                {achievement.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {achievement.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {achievement.technologies.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{achievement.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
