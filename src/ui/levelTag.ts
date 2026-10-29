import type { LevelTag } from '../game/levels/levelSpec';
import type { TKey } from '../i18n';

// Warm orange for Hard, deep purple for Super hard; white text reads on both
export const TAG_COLOR: Record<LevelTag, string> = { hard: '#E8590C', 'super-hard': '#7B2CBF' };
export const TAG_LABEL: Record<LevelTag, TKey> = { hard: 'tag.hard', 'super-hard': 'tag.superHard' };
export const TAG_BONUS_LABEL: Record<LevelTag, TKey> = {
  hard: 'result.bonus.hard',
  'super-hard': 'result.bonus.superHard',
};
