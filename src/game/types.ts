export type Dir = 'E' | 'S' | 'SE' | 'W' | 'N' | 'NW' | 'NE' | 'SW';

// [row, col]
export type Cell = [number, number];

// [dRow, dCol] for each direction
export const DIR_VECTORS: Record<Dir, Cell> = {
  E: [0, 1],
  S: [1, 0],
  SE: [1, 1],
  W: [0, -1],
  N: [-1, 0],
  NW: [-1, -1],
  NE: [-1, 1],
  SW: [1, -1],
};

export const ALL_DIRS: Dir[] = ['E', 'S', 'SE', 'W', 'N', 'NW', 'NE', 'SW'];

export type PlacedWord = { w: string; start: Cell; dir: Dir };

export type LevelDef = {
  id: number;
  world: number;
  theme: string;
  rows: number;
  cols: number;
  grid: string[]; // one string per row
  words: PlacedWord[];
  bonus: string[];
  seed: number;
  difficulty: number;
};

export function wordCells({ w, start, dir }: PlacedWord): Cell[] {
  const [dr, dc] = DIR_VECTORS[dir];
  return Array.from(w, (_, i) => [start[0] + dr * i, start[1] + dc * i] as Cell);
}
