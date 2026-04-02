import { differenceInDays } from 'date-fns';
import type { Priority, ScoringConfig } from '@/types';
import { DEFAULT_SCORING } from '@/types';

const PRIORITY_WEIGHTS: Record<Priority, keyof Pick<ScoringConfig, 'highWeight' | 'mediumWeight' | 'lowWeight'>> = {
  HIGH: 'highWeight',
  MEDIUM: 'mediumWeight',
  LOW: 'lowWeight',
};

export function calculateScore(
  priority: Priority,
  addedAt: Date,
  config: ScoringConfig = DEFAULT_SCORING
): number {
  const weightKey = PRIORITY_WEIGHTS[priority];
  const priorityWeight = config[weightKey];
  const daysSinceAdded = differenceInDays(new Date(), addedAt);

  const ageBonus =
    daysSinceAdded > config.ageThresholdDays
      ? (daysSinceAdded - config.ageThresholdDays) * config.ageFactor
      : 0;

  return priorityWeight + ageBonus;
}
