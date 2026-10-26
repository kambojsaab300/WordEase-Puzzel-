import {
  levelX,
  levelYFromBottom,
  levelYInSegment,
  MAP_HEIGHT,
  scrollOffsetFor,
  SEGMENT_HEIGHT,
  segmentIndexOf,
  SEGMENTS,
} from '../src/map/layout';

describe('route map layout', () => {
  test('80 segments cover levels 1-1200, top segment first', () => {
    expect(SEGMENTS).toHaveLength(80);
    expect(SEGMENTS[0].lastLevel).toBe(1200);
    expect(SEGMENTS[SEGMENTS.length - 1].firstLevel).toBe(1);
  });

  test('the route climbs: every level sits above the previous one', () => {
    for (let id = 2; id <= 1200; id++) {
      expect(levelYFromBottom(id)).toBeGreaterThan(levelYFromBottom(id - 1));
    }
  });

  test('every level node lies inside its own segment', () => {
    for (let id = 1; id <= 1200; id++) {
      const y = levelYInSegment(id, segmentIndexOf(id));
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(SEGMENT_HEIGHT);
    }
  });

  test('nodes stay away from the scenery edges', () => {
    for (let id = 1; id <= 100; id++) {
      const x = levelX(id, 360);
      expect(x).toBeGreaterThanOrEqual(360 * 0.2);
      expect(x).toBeLessThanOrEqual(360 * 0.8);
    }
  });

  test('scroll offsets stay inside the map', () => {
    for (const id of [1, 600, 1200]) {
      const offset = scrollOffsetFor(id, 800);
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(MAP_HEIGHT - 800);
    }
  });
});
