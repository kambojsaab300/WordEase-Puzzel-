import { Cell, Dir, DIR_VECTORS } from '../types';

// Index 0 = east, going clockwise in screen space (y grows downward)
const SECTOR_DIRS: Dir[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

export function pointToCell(x: number, y: number, cellSize: number, rows: number, cols: number): Cell {
  const r = Math.min(rows - 1, Math.max(0, Math.floor(y / cellSize)));
  const c = Math.min(cols - 1, Math.max(0, Math.floor(x / cellSize)));
  return [r, c];
}

// Nearest of the 8 directions; each covers +/- 22.5 degrees
export function snapDirection(dx: number, dy: number): Dir {
  const angle = Math.atan2(dy, dx);
  const sector = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  return SECTOR_DIRS[sector];
}

function lineCells(start: Cell, dir: Dir, length: number, rows: number, cols: number): Cell[] {
  const [dr, dc] = DIR_VECTORS[dir];
  const cells: Cell[] = [start];
  for (let i = 1; i < length; i++) {
    const r = start[0] + dr * i;
    const c = start[1] + dc * i;
    if (r < 0 || r >= rows || c < 0 || c >= cols) break; // stop at the grid edge
    cells.push([r, c]);
  }
  return cells;
}

/**
 * Drag selection: dx/dy are pixels from the centre of the start cell.
 * The line snaps to the nearest of 8 directions and stops at the grid edge.
 */
export function selectionFromDrag(
  start: Cell,
  dx: number,
  dy: number,
  cellSize: number,
  rows: number,
  cols: number,
): Cell[] {
  if (Math.hypot(dx, dy) < cellSize / 2) return [start];
  const dir = snapDirection(dx, dy);
  const [dr, dc] = DIR_VECTORS[dir];
  // Project the finger onto the direction, measured in steps of one cell
  const stepPx = cellSize * Math.hypot(dr, dc);
  const along = (dx * dc + dy * dr) / Math.hypot(dr, dc);
  const steps = Math.max(0, Math.round(along / stepPx));
  return lineCells(start, dir, steps + 1, rows, cols);
}

// Tap-Tap mode: straight line from a to b, or null if they are not on one of the 8 lines
export function lineBetween(a: Cell, b: Cell): Cell[] | null {
  const dr = b[0] - a[0];
  const dc = b[1] - a[1];
  if (dr === 0 && dc === 0) return [a];
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: steps + 1 }, (_, i) => [a[0] + sr * i, a[1] + sc * i] as Cell);
}
