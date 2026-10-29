import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Glyphs,
  Group,
  Line,
  RoundedRect,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  lineBetween,
  pointToCell,
  selectionFromDrag,
} from '../engine/selection';
import { Cell, DIR_VECTORS, PlacedWord, wordCells } from '../types';
import { AudioManager } from '../../services/audio/AudioManager';
import { HapticsManager } from '../../services/haptics/HapticsManager';
import type { InputMode } from '../../store/settings';
import {
  FOUND_PATTERNS,
  gridLetterSize,
  HIGH_CONTRAST,
  TextSizeIndex,
} from '../../ui/a11y';
import { MinusIcon, PlusIcon } from '../../ui/GameIcons';
import { IconButton } from '../../ui/IconButton';
import { colors, fonts, fontSizes } from '../../ui/theme';
import { NO_ZOOM, pinchZoom, toContent, Zoom, zoomAroundCenter } from './zoom';
import { useT } from '../../i18n';

const LETTER_FONT = require('../../../assets/fonts/AtkinsonHyperlegible-Bold.ttf');

export type FoundWord = { word: PlacedWord; color: string };
export type HintOverlay = { word: PlacedWord; withDirection: boolean };

type Props = {
  grid: string[];
  cellSize: number;
  found: FoundWord[];
  hint: HintOverlay | null;
  inputMode: InputMode;
  reduceMotion: boolean;
  textSize: TextSizeIndex;
  highContrast: boolean;
  colorBlind: boolean;
  // 1 = the whole grid fits comfortably; above 1 = pinch-zoom and zoom buttons are on
  maxZoom: number;
  onSelect: (cells: Cell[]) => void;
};

const CAPSULE_RATIO = 0.78;

type CapsuleProps = {
  cells: Cell[];
  cellSize: number;
  color: string;
  opacity: number;
  pattern?: number[]; // colour-blind mode: dash pattern drawn along the capsule
  outline?: string; // high contrast: dark edge around the capsule
};

function Capsule({
  cells,
  cellSize,
  color,
  opacity,
  pattern,
  outline,
}: CapsuleProps) {
  const center = ([r, c]: Cell) =>
    vec(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
  const width = cellSize * CAPSULE_RATIO;
  const first = cells[0];
  const last = cells[cells.length - 1];

  if (cells.length === 1) {
    const p = center(first);
    return (
      <Circle cx={p.x} cy={p.y} r={width / 2} color={color} opacity={opacity} />
    );
  }
  return (
    <Group>
      {outline && (
        <Line
          p1={center(first)}
          p2={center(last)}
          color={outline}
          style="stroke"
          strokeWidth={width + 3}
          strokeCap="round"
        />
      )}
      <Line
        p1={center(first)}
        p2={center(last)}
        color={color}
        opacity={outline ? 1 : opacity}
        style="stroke"
        strokeWidth={width}
        strokeCap="round"
      />
      {pattern && (
        <Line
          p1={center(first)}
          p2={center(last)}
          color="rgba(0,0,0,0.75)"
          style="stroke"
          strokeWidth={3}
          strokeCap="round"
        >
          {pattern.length > 0 && <DashPathEffect intervals={pattern} />}
        </Line>
      )}
    </Group>
  );
}

export const GridCanvas = memo(function GridCanvasView({
  grid,
  cellSize,
  found,
  hint,
  inputMode,
  reduceMotion,
  textSize,
  highContrast,
  colorBlind,
  maxZoom,
  onSelect,
}: Props) {
  const rows = grid.length;
  const cols = grid[0].length;
  const width = cols * cellSize;
  const height = rows * cellSize;
  const font = useFont(
    LETTER_FONT,
    gridLetterSize(cellSize, textSize, fontSizes.gridLetter),
  );
  const letterColor = highContrast ? HIGH_CONTRAST.letter : colors.ink;
  const t = useT();

  // The live selection lives in shared values: dragging redraws only the Skia capsule
  // on the UI thread and never re-renders React (the main source of drag lag)
  const selStart = useSharedValue<Cell>([0, 0]);
  const selEnd = useSharedValue<Cell>([0, 0]);
  const selLen = useSharedValue(0);
  const tapStartRef = useRef<Cell | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Leaving Tap-Tap mode mid-selection should not leave a stray highlight
  useEffect(() => {
    tapStartRef.current = null;
    selLen.value = 0;
  }, [inputMode, selLen]);

  // Zoom lives inside Skia, so letters stay sharp at any scale
  const zScale = useSharedValue(1);
  const zTx = useSharedValue(0);
  const zTy = useSharedValue(0);
  const pinchStart = useSharedValue<Zoom>(NO_ZOOM);
  const focalStart = useSharedValue({ x: 0, y: 0 });
  const zoomTransform = useDerivedValue(() => [
    { translateX: zTx.value },
    { translateY: zTy.value },
    { scale: zScale.value },
  ]);
  const setZoom = useCallback(
    (z: Zoom, animate: boolean) => {
      const timing = { duration: animate && !reduceMotion ? 250 : 0 };
      zScale.value = withTiming(z.scale, timing);
      zTx.value = withTiming(z.tx, timing);
      zTy.value = withTiming(z.ty, timing);
    },
    [zScale, zTx, zTy, reduceMotion],
  );
  // A new grid (or a phone turned sideways) starts fully zoomed out
  useEffect(() => setZoom(NO_ZOOM, false), [grid, maxZoom, cellSize, setZoom]);
  const currentZoom = (): Zoom => ({
    scale: zScale.value,
    tx: zTx.value,
    ty: zTy.value,
  });

  const gesture = useMemo(() => {
    const show = (cells: Cell[]) => {
      'worklet';
      if (cells.length > 0) {
        selStart.value = cells[0];
        selEnd.value = cells[cells.length - 1];
      }
      selLen.value = cells.length;
    };
    const update = (cells: Cell[]) => show(cells);
    const touched = () => AudioManager.playLetterTouch();
    const grew = (len: number) => {
      HapticsManager.selectionTick();
      AudioManager.playDragTick(len);
    };
    const finish = (start: Cell, end: Cell, len: number) =>
      onSelectRef.current(
        len > 1 ? lineBetween(start, end) ?? [start] : [start],
      );

    if (inputMode === 'tap') {
      return Gesture.Tap()
        .runOnJS(true)
        .onEnd((e, success) => {
          if (!success) return;
          const p = toContent(e.x, e.y, currentZoom());
          const cell = pointToCell(p.x, p.y, cellSize, rows, cols);
          const start = tapStartRef.current;
          if (!start) {
            tapStartRef.current = cell;
            update([cell]);
            return;
          }
          tapStartRef.current = null;
          update([]);
          if (start[0] === cell[0] && start[1] === cell[1]) return; // same cell again: cancel
          // Not on a straight line: still report it so the grid can shake
          onSelectRef.current(lineBetween(start, cell) ?? [start, cell]);
        });
    }

    // Runs on the UI thread; JS is only told when the length changes and when the finger lifts
    return Gesture.Pan()
      .minDistance(0)
      .maxPointers(1) // a second finger means pinch, not a word
      .onBegin(e => {
        const z = { scale: zScale.value, tx: zTx.value, ty: zTy.value };
        const p = toContent(e.x, e.y, z);
        show([pointToCell(p.x, p.y, cellSize, rows, cols)]);
        runOnJS(touched)();
      })
      .onUpdate(e => {
        const start = selStart.value;
        const z = { scale: zScale.value, tx: zTx.value, ty: zTy.value };
        const p = toContent(e.x, e.y, z);
        const dx = p.x - (start[1] * cellSize + cellSize / 2);
        const dy = p.y - (start[0] * cellSize + cellSize / 2);
        const next = selectionFromDrag(start, dx, dy, cellSize, rows, cols);
        const end = next[next.length - 1];
        const prevEnd = selEnd.value;
        if (next.length !== selLen.value) runOnJS(grew)(next.length);
        if (
          next.length !== selLen.value ||
          end[0] !== prevEnd[0] ||
          end[1] !== prevEnd[1]
        ) {
          show(next);
        }
      })
      .onEnd((_e, success) => {
        if (success && selLen.value > 0) {
          runOnJS(finish)(selStart.value, selEnd.value, selLen.value);
        }
      })
      .onFinalize(() => {
        selLen.value = 0;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoom shared values are stable
  }, [cellSize, rows, cols, inputMode]);

  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(e => {
          pinchStart.value = {
            scale: zScale.value,
            tx: zTx.value,
            ty: zTy.value,
          };
          focalStart.value = { x: e.focalX, y: e.focalY };
        })
        .onUpdate(e => {
          const z = pinchZoom(
            pinchStart.value,
            focalStart.value,
            e.scale,
            { x: e.focalX, y: e.focalY },
            width,
            height,
            maxZoom,
          );
          zScale.value = z.scale;
          zTx.value = z.tx;
          zTy.value = z.ty;
        }),
    [pinchStart, focalStart, zScale, zTx, zTy, width, height, maxZoom],
  );
  const allGestures =
    maxZoom > 1 ? Gesture.Simultaneous(pinch, gesture) : gesture;

  // Gentle pulse on the hinted first letter
  const pulse = useSharedValue(0.85);
  useEffect(() => {
    pulse.value = reduceMotion
      ? 0.85
      : withRepeat(withTiming(0.35, { duration: 700 }), -1, true);
  }, [pulse, reduceMotion]);

  const capsuleWidth = cellSize * CAPSULE_RATIO;
  const selP1 = useDerivedValue(() =>
    vec(
      selStart.value[1] * cellSize + cellSize / 2,
      selStart.value[0] * cellSize + cellSize / 2,
    ),
  );
  const selP2 = useDerivedValue(() =>
    vec(
      selEnd.value[1] * cellSize + cellSize / 2,
      selEnd.value[0] * cellSize + cellSize / 2,
    ),
  );
  const selOpacity = highContrast ? HIGH_CONTRAST.capsuleOpacity : 0.6;
  const selAlpha = useDerivedValue(() => (selLen.value > 0 ? selOpacity : 0));

  // All letters go out as one Glyphs node instead of 100+ Text nodes: faster first draw and zoom
  const letterGlyphs = useMemo(() => {
    if (!font) return [];
    const baseline = cellSize / 2 + font.getSize() * 0.36;
    return grid.flatMap((row, r) =>
      Array.from(row, (ch, c) => ({
        id: font.getGlyphIDs(ch)[0],
        pos: vec(
          c * cellSize + (cellSize - font.measureText(ch).width) / 2,
          r * cellSize + baseline,
        ),
      })),
    );
  }, [font, grid, cellSize]);

  const foundNodes = useMemo(
    () =>
      found.map((f, i) => (
        <Capsule
          key={f.word.w}
          cells={wordCells(f.word)}
          cellSize={cellSize}
          color={f.color}
          opacity={0.55}
          pattern={
            colorBlind ? FOUND_PATTERNS[i % FOUND_PATTERNS.length] : undefined
          }
          outline={highContrast ? HIGH_CONTRAST.outline : undefined}
        />
      )),
    [found, cellSize, colorBlind, highContrast],
  );

  const hintGeometry = useMemo(() => {
    if (!hint) return null;
    const [r, c] = hint.word.start;
    const [dr, dc] = DIR_VECTORS[hint.word.dir];
    const cx = c * cellSize + cellSize / 2;
    const cy = r * cellSize + cellSize / 2;
    return {
      cx,
      cy,
      tip: vec(cx + dc * cellSize * 0.95, cy + dr * cellSize * 0.95),
    };
  }, [hint, cellSize]);

  const zoomBy = (factor: number) =>
    setZoom(
      zoomAroundCenter(currentZoom(), factor, width, height, maxZoom),
      true,
    );

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={allGestures}>
        <Canvas
          style={{ width, height }}
          // The level postcard is tilted in 3D; a SurfaceView would ignore that transform
          android={{ surfaceType: 'TextureView' }}
          accessibilityLabel={t(
            inputMode === 'tap' ? 'level.gridA11y.tap' : 'level.gridA11y.drag',
          )}
        >
          <RoundedRect
            x={0}
            y={0}
            width={width}
            height={height}
            r={16}
            color={colors.white}
          />
          <Group transform={zoomTransform}>
            {highContrast && (
              <Group>
                {Array.from({ length: rows - 1 }, (_, i) => (
                  <Line
                    key={`r${i}`}
                    p1={vec(0, (i + 1) * cellSize)}
                    p2={vec(width, (i + 1) * cellSize)}
                    color={HIGH_CONTRAST.gridLine}
                    strokeWidth={1}
                  />
                ))}
                {Array.from({ length: cols - 1 }, (_, i) => (
                  <Line
                    key={`c${i}`}
                    p1={vec((i + 1) * cellSize, 0)}
                    p2={vec((i + 1) * cellSize, height)}
                    color={HIGH_CONTRAST.gridLine}
                    strokeWidth={1}
                  />
                ))}
                <RoundedRect
                  x={1}
                  y={1}
                  width={width - 2}
                  height={height - 2}
                  r={15}
                  color={HIGH_CONTRAST.outline}
                  style="stroke"
                  strokeWidth={2}
                />
              </Group>
            )}
            {foundNodes}
            {hintGeometry && (
              <>
                <Circle
                  cx={hintGeometry.cx}
                  cy={hintGeometry.cy}
                  r={(cellSize * CAPSULE_RATIO) / 2}
                  color={colors.coinGold}
                  opacity={pulse}
                />
                {hint?.withDirection && (
                  <>
                    <Line
                      p1={vec(hintGeometry.cx, hintGeometry.cy)}
                      p2={hintGeometry.tip}
                      color={colors.primaryOcean}
                      style="stroke"
                      strokeWidth={6}
                      strokeCap="round"
                    />
                    <Circle
                      cx={hintGeometry.tip.x}
                      cy={hintGeometry.tip.y}
                      r={8}
                      color={colors.primaryOcean}
                    />
                  </>
                )}
              </>
            )}
            {/* a zero-length round-capped line is a dot, so one cell shows as a circle */}
            <Line
              p1={selP1}
              p2={selP2}
              color={
                highContrast ? HIGH_CONTRAST.selection : colors.accentCoral
              }
              opacity={selAlpha}
              style="stroke"
              strokeWidth={capsuleWidth}
              strokeCap="round"
            />
            {font && (
              <Glyphs font={font} glyphs={letterGlyphs} color={letterColor} />
            )}
          </Group>
        </Canvas>
      </GestureDetector>
      {maxZoom > 1 && (
        <View style={styles.zoomRow}>
          <IconButton
            icon={<MinusIcon />}
            label={t('zoom.out')}
            onPress={() => zoomBy(1 / 1.5)}
          />
          <RNText style={styles.zoomHint}>{t('zoom.hint')}</RNText>
          <IconButton
            icon={<PlusIcon />}
            label={t('zoom.in')}
            onPress={() => zoomBy(1.5)}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  zoomHint: {
    maxWidth: 170,
    marginHorizontal: 10,
    fontSize: 14,
    fontFamily: fonts.ui,
    color: colors.primaryOcean,
    textAlign: 'center',
  },
});
