import ReactTestRenderer from 'react-test-renderer';
import { pointToCell } from '../src/game/engine/selection';
import { getLevel, SHIPPED_LEVELS } from '../src/game/levels/levelRepo';
import { THEMES_BY_WORLD } from '../src/game/levels/themes';
import {
  clampZoom,
  maxZoomFor,
  MIN_CELL,
  needsZoom,
  NO_ZOOM,
  pinchZoom,
  toContent,
  zoomAroundCenter,
} from '../src/game/render/zoom';
import { wordCells } from '../src/game/types';
import { useLevelGame } from '../src/screens/level/useLevelGame';
import { useProgress } from '../src/store/progress';
import { useWallet } from '../src/store/wallet';

const BLOCKLIST = new Set<string>(require('../src/game/generator/blocklist.en.json'));
const VIEW = 300;
const MAX = 2;

describe('zoom for big grids', () => {
  test('zoom only opens when cells are smaller than the flow minimum (40 / 48 / 56 dp)', () => {
    expect(needsZoom(27, MIN_CELL[0])).toBe(true);
    expect(needsZoom(46, MIN_CELL[0])).toBe(false);
    expect(needsZoom(46, MIN_CELL[1])).toBe(true);
    expect(maxZoomFor(46, MIN_CELL[0])).toBe(1); // fits: no zoom (tablets, small grids)
    expect(maxZoomFor(27, MIN_CELL[0])).toBeCloseTo((40 / 27) * 1.25);
  });

  test('on a 360dp phone the 12x12 levels open zoom; small early levels do not', () => {
    const fit = (cols: number) => Math.floor((360 - 32) / cols);
    expect(needsZoom(fit(getLevel(1).cols), MIN_CELL[0])).toBe(false);
    const biggest = Math.max(...Array.from({ length: SHIPPED_LEVELS }, (_, i) => getLevel(i + 1).cols));
    expect(needsZoom(fit(biggest), MIN_CELL[0])).toBe(true);
  });

  test('pinching keeps the point under the fingers in place', () => {
    const focal = { x: 120, y: 80 };
    const z = pinchZoom(NO_ZOOM, focal, 1.6, focal, VIEW, VIEW, MAX);
    expect(z.scale).toBeCloseTo(1.6);
    const before = toContent(focal.x, focal.y, NO_ZOOM);
    const after = toContent(focal.x, focal.y, z);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  test('moving two fingers pans the zoomed grid', () => {
    const start = pinchZoom(NO_ZOOM, { x: 150, y: 150 }, 2, { x: 150, y: 150 }, VIEW, VIEW, MAX);
    const moved = pinchZoom(start, { x: 150, y: 150 }, 1, { x: 100, y: 150 }, VIEW, VIEW, MAX);
    expect(moved.tx).toBeCloseTo(start.tx - 50);
    expect(moved.scale).toBeCloseTo(2);
  });

  test('never zooms out past the whole grid, nor in past the maximum (negative)', () => {
    expect(pinchZoom(NO_ZOOM, { x: 0, y: 0 }, 0.2, { x: 0, y: 0 }, VIEW, VIEW, MAX).scale).toBe(1);
    expect(pinchZoom(NO_ZOOM, { x: 0, y: 0 }, 9, { x: 0, y: 0 }, VIEW, VIEW, MAX).scale).toBe(MAX);
  });

  test('the grid always covers the view: no empty edges when panning too far (negative)', () => {
    const z = clampZoom({ scale: 2, tx: 500, ty: -900 }, VIEW, VIEW, MAX);
    expect(z.tx).toBe(0);
    expect(z.ty).toBe(VIEW - VIEW * 2);
  });

  test('zoom buttons zoom around the middle and back out to the whole grid', () => {
    const inZ = zoomAroundCenter(NO_ZOOM, 1.5, VIEW, VIEW, MAX);
    expect(inZ.scale).toBeCloseTo(1.5);
    expect(toContent(VIEW / 2, VIEW / 2, inZ).x).toBeCloseTo(VIEW / 2);
    expect(zoomAroundCenter(inZ, 1 / 1.5, VIEW, VIEW, MAX)).toEqual({ scale: 1, tx: 0, ty: 0 });
  });

  test('after zooming, a touch still lands on the right letter', () => {
    const cell = 30;
    const z = { scale: 2, tx: 0, ty: 0 };
    const p = toContent(65, 95, z); // on screen: 2x size, so cell (1, 1)
    expect(pointToCell(p.x, p.y, cell, 10, 10)).toEqual([1, 1]);
    const panned = { scale: 2, tx: -60, ty: -60 };
    const q = toContent(5, 5, panned); // top-left of the view now shows cell (1, 1)
    expect(pointToCell(q.x, q.y, cell, 10, 10)).toEqual([1, 1]);
  });
});

describe('pause menu: restart', () => {
  beforeEach(() => {
    useProgress.setState({ currentLevel: 10, stars: {}, inProgress: undefined, lastSeenWorld: 1 });
    useWallet.setState({ coins: 200, adFree: false });
  });

  test('restart clears found words and hints; spent coins stay spent', () => {
    const ref: { current: ReturnType<typeof useLevelGame> | null } = { current: null };
    function Harness() {
      ref.current = useLevelGame(6);
      return null;
    }
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Harness />);
    });
    const game = () => ref.current!;
    ReactTestRenderer.act(() => {
      game().select(wordCells(game().level.words[0]));
    });
    ReactTestRenderer.act(() => {
      game().buyHint('spotlight');
    });
    expect(game().found).toHaveLength(1);
    expect(game().hints).toHaveLength(1);

    ReactTestRenderer.act(() => game().restart());
    expect(game().found).toEqual([]);
    expect(game().hints).toEqual([]);
    expect(useWallet.getState().coins).toBe(175);
    expect(useProgress.getState().inProgress).toMatchObject({ levelId: 6, found: [], hints: [] });

    // the level can still be finished after a restart
    for (const pw of game().level.words) {
      ReactTestRenderer.act(() => {
        game().select(wordCells(pw));
      });
    }
    expect(game().allFound).toBe(true);
  });
});

describe('themes', () => {
  test('every world has 4 themes of 16 different A-Z words, none blocklisted', () => {
    const names = new Set<string>();
    THEMES_BY_WORLD.forEach(world => {
      expect(world).toHaveLength(4);
      for (const theme of world) {
        expect(names.has(theme.name)).toBe(false);
        names.add(theme.name);
        expect(theme.words).toHaveLength(16);
        expect(new Set(theme.words).size).toBe(16);
        for (const w of theme.words) {
          expect(w).toMatch(/^[A-Z]{3,12}$/);
          expect(BLOCKLIST.has(w)).toBe(false);
        }
      }
    });
    expect(names.size).toBe(80);
  });

  test('levels in a world rotate through all four of its themes', () => {
    const themes = new Set(Array.from({ length: 8 }, (_, i) => getLevel(61 + i).theme));
    expect(themes.size).toBe(4);
  });
});
