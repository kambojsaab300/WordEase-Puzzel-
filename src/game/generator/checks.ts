import { ALL_DIRS, Dir, DIR_VECTORS, isReversed, LevelDef, wordCells } from '../types';
import { reversedQuota } from './placeWords';

// Counts distinct placements of a word in any of the 8 directions.
// A palindrome read both ways over the same cells counts once.
export function countOccurrences(grid: string[], word: string): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const seen = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== word[0]) continue;
      for (const dir of ALL_DIRS) {
        const [dr, dc] = DIR_VECTORS[dir];
        const cells: string[] = [];
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols || grid[rr][cc] !== word[i]) {
            ok = false;
            break;
          }
          cells.push(`${rr},${cc}`);
        }
        if (ok) seen.add(cells.sort().join('|'));
      }
    }
  }
  return seen.size;
}

export function eachWordExactlyOnce(grid: string[], words: string[]): boolean {
  return words.every(w => countOccurrences(grid, w) === 1);
}

/** Every dictionary word (minLen..maxLen) readable in any of the 8 directions. */
export function wordsInGrid(
  grid: string[],
  dictionary: ReadonlySet<string>,
  minLen: number,
  maxLen: number,
): Set<string> {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out = new Set<string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (const dir of ALL_DIRS) {
        const [dr, dc] = DIR_VECTORS[dir];
        let text = '';
        for (let i = 0; i < maxLen; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;
          text += grid[rr][cc];
          if (text.length >= minLen && dictionary.has(text)) out.add(text);
        }
      }
    }
  }
  return out;
}

/**
 * Blocklisted words readable in the grid, ignoring hits that lie entirely inside
 * a theme word (an innocent word like COMPASS should not fail the level).
 */
export function blocklistHits(level: LevelDef, blocklist: ReadonlySet<string>): string[] {
  const { grid, rows, cols } = level;
  const maxLen = Math.max(rows, cols);
  const themeCells = level.words.map(pw => new Set(wordCells(pw).map(([r, c]) => `${r},${c}`)));
  const hits: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (const dir of ALL_DIRS) {
        const [dr, dc] = DIR_VECTORS[dir];
        let text = '';
        const cells: string[] = [];
        for (let i = 0; i < maxLen; i++) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;
          text += grid[rr][cc];
          cells.push(`${rr},${cc}`);
          if (text.length < 3 || !blocklist.has(text)) continue;
          const insideThemeWord = themeCells.some(set => cells.every(k => set.has(k)));
          if (!insideThemeWord) hits.push(text);
        }
      }
    }
  }
  return hits;
}

const DIAGONALS = new Set(['SE', 'NW', 'NE', 'SW']);
export const MIN_DIAGONAL_SHARE = 0.2;

export function diagonalShare(level: LevelDef): number {
  if (level.words.length === 0) return 0;
  return level.words.filter(w => DIAGONALS.has(w.dir)).length / level.words.length;
}

export type CheckContext = {
  allowedDirs: Dir[];
  blocklist: ReadonlySet<string>;
  meanings: Record<string, string>;
  minReversedShare?: number;
  featuredDirs?: Dir[];
};

/** All automatic checks from the flow. Returns a list of problems (empty = OK). */
export function checkLevel(level: LevelDef, ctx: CheckContext): string[] {
  const problems: string[] = [];
  const { grid, rows, cols } = level;

  if (grid.length !== rows || grid.some(row => !new RegExp(`^[A-Z]{${cols}}$`).test(row))) {
    problems.push('grid is not fully filled with A-Z');
  }
  for (const pw of level.words) {
    const letters = wordCells(pw)
      .map(([r, c]) => grid[r]?.[c] ?? '?')
      .join('');
    if (letters !== pw.w) problems.push(`${pw.w} is not at its recorded place`);
    if (countOccurrences(grid, pw.w) !== 1) problems.push(`${pw.w} appears more than once`);
    if (!ctx.allowedDirs.includes(pw.dir)) problems.push(`${pw.w} uses direction ${pw.dir}`);
    if (!ctx.meanings[pw.w]) problems.push(`${pw.w} has no meaning`);
  }
  const allowsDiagonal = ctx.allowedDirs.some(d => DIAGONALS.has(d));
  if (allowsDiagonal && diagonalShare(level) < MIN_DIAGONAL_SHARE) {
    problems.push('too few diagonal words');
  }
  const reversed = level.words.filter(w => isReversed(w.dir)).length;
  if (reversed < reversedQuota(level.words.length, ctx.minReversedShare)) {
    problems.push(`too few backwards words (${reversed})`);
  }
  const featured = ctx.featuredDirs ?? [];
  if (featured.length > 0 && !level.words.some(w => featured.includes(w.dir))) {
    problems.push(`no word uses the new direction ${featured.join('/')}`);
  }
  const bad = blocklistHits(level, ctx.blocklist);
  if (bad.length > 0) problems.push(`blocklisted word in grid (${bad.length})`);
  return problems;
}
