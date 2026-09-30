import { HSEQuestion, HSECategory, HSE_CATEGORIES } from './types';
import { QUESTIONS_PART_1 } from './questionsPart1';
import { QUESTIONS_PART_2 } from './questionsPart2';

export * from './types';

export const ALL_HSE_QUESTIONS: HSEQuestion[] = [
  ...QUESTIONS_PART_1,
  ...QUESTIONS_PART_2,
];

export const UNIQUE_HSE_QUESTIONS: HSEQuestion[] = ALL_HSE_QUESTIONS.filter(
  (q) => !q.isDuplicateOf
);

export function getCategoryCounts(onlyUnique = false): Record<HSECategory | 'ALL', number> {
  const pool = onlyUnique ? UNIQUE_HSE_QUESTIONS : ALL_HSE_QUESTIONS;
  const counts: Record<string, number> = { ALL: pool.length };
  for (const cat of HSE_CATEGORIES) {
    counts[cat.id] = 0;
  }
  for (const q of pool) {
    counts[q.category] = (counts[q.category] || 0) + 1;
  }
  return counts as Record<HSECategory | 'ALL', number>;
}
