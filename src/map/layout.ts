import { LEVELS_PER_WORLD } from '../game/levels/levelSpec';
import { WORLD_COUNT } from '../game/levels/worlds';

// The route is split into equal-height segments of 15 levels (one landmark each).
// Equal heights keep FlashList's size estimate exact, so scrolling to a level lands right.
export const SEGMENT_LEVELS = 15;
export const NODE_SPACING = 104;
export const SEGMENT_GAP = 150; // bottom of each segment: world banner or open scenery
export const SEGMENT_HEIGHT = SEGMENT_GAP + SEGMENT_LEVELS * NODE_SPACING;
export const SEGMENTS_PER_WORLD = LEVELS_PER_WORLD / SEGMENT_LEVELS;
export const SEGMENT_COUNT = WORLD_COUNT * SEGMENTS_PER_WORLD;
export const MAP_HEIGHT = SEGMENT_COUNT * SEGMENT_HEIGHT;

export type Segment = {
  key: string;
  index: number; // 0 = bottom of the map
  world: number;
  part: number; // 0..3 inside the world
  firstLevel: number;
  lastLevel: number;
};

// Top-to-bottom order, as the list renders it (the route climbs upward)
export const SEGMENTS: Segment[] = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const index = SEGMENT_COUNT - 1 - i;
  const firstLevel = index * SEGMENT_LEVELS + 1;
  return {
    key: `seg-${index}`,
    index,
    world: Math.floor(index / SEGMENTS_PER_WORLD) + 1,
    part: index % SEGMENTS_PER_WORLD,
    firstLevel,
    lastLevel: firstLevel + SEGMENT_LEVELS - 1,
  };
});

export const segmentIndexOf = (levelId: number) => Math.floor((levelId - 1) / SEGMENT_LEVELS);

// Distance of a level node from the bottom of the whole map
export function levelYFromBottom(levelId: number): number {
  const seg = segmentIndexOf(levelId);
  const k = (levelId - 1) % SEGMENT_LEVELS;
  return seg * SEGMENT_HEIGHT + SEGMENT_GAP + k * NODE_SPACING + NODE_SPACING / 2;
}

// y of a level inside a segment's own box (works for neighbours outside it too)
export function levelYInSegment(levelId: number, segmentIndex: number): number {
  const segmentTop = (segmentIndex + 1) * SEGMENT_HEIGHT;
  return segmentTop - levelYFromBottom(levelId);
}

// Gentle winding road: stays in the middle 56% so the edges are free for scenery
export function levelX(levelId: number, width: number): number {
  return width / 2 + width * 0.28 * Math.sin(levelId * 0.85);
}

// Scroll offset (from the top) that puts a level in the middle of the screen
export function scrollOffsetFor(levelId: number, viewportHeight: number): number {
  const offset = MAP_HEIGHT - levelYFromBottom(levelId) - viewportHeight / 2;
  return Math.max(0, Math.min(MAP_HEIGHT - viewportHeight, offset));
}
